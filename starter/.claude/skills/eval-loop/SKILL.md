---
name: eval-loop
description: Score AI outputs against a versioned binary rubric with a cross-family judge, calibrate the judge against human-verified anchors with Cohen's kappa, and run anchor-gated rubric upgrades (epoch transitions) with selective erasure. Use when the user wants to evaluate an agent, score outputs, run the eval, check the judge, check kappa, add eval cases, write or upgrade a rubric, or promote a rubric version. Triggers on "evaluate", "score these", "run the eval", "check kappa", "is the judge any good", "upgrade the rubric", "epoch transition".
---

# Eval Loop

Rubric-based evaluation with bias controls and a versioned upgrade path.
The harness lives in `eval/`. It has no dependencies — Node 22 runs the
TypeScript directly.

## Five rules that are never waived

These are loaded every time on purpose. Each one, if broken, produces numbers
that look fine and are false.

1. **Cross-family judge.** The judge must not be the same model family as
   whatever generated the output. You drive Claude Code, so the judge is never
   Claude. `eval/src/judge.ts` throws rather than allow it.
2. **Binary criteria.** Every rubric line is a yes/no question. If it needs a
   score out of 10, it is underspecified — decompose it.
3. **Conjunctive acceptance.** All criteria pass, or the verdict is reject.
   Never a weighted average: that lets one serious failure be offset by minor
   virtues.
4. **Evidence per criterion.** Every verdict carries an exact quote from the
   input. A verdict with empty evidence is an error, not a result.
5. **Never modify an anchor label to make a score look better.** Anchors are
   append-only ground truth. Changing one requires a logged note in the commit
   message and in the case's `note` field. This is the single most damaging
   thing that can be done to this project, and it is easy to do by accident
   while "tidying up" data.

## Commands

```
cd eval
npm run eval     # score every case, print pass rate + anchor kappa
npm test         # kappa maths, including the numbers the docs quote
```

Runs when `JUDGE_MODEL` / `JUDGE_API_KEY` are unset use an offline mock judge so
the pipeline is exercisable with no key and no spend. **Mock scores mean
nothing** — never report them as results.

## Reading kappa

The gate is **κ ≥ 0.6** on anchors only. Non-anchor cases have been shaped by
the rubric under test, so scoring against them flatters it.

- **κ not computable** — every rating fell in one class. Real outcome at small
  n, not a bug. Report it as "not computable", never as 0.
- **κ below the gate** — find the disagreeing cases and **change the criterion
  wording**. Never the labels.
- **Same input, different verdict across runs** — the criterion is
  underspecified. Split it. Until then every number is noise.

## Upgrading a rubric (epoch transition)

Score both the incumbent and the challenger **on anchors only**. Promote only if
`κ(challenger) ≥ κ(incumbent)`.

A blocked promotion is a **successful run**, not an error. Do not retry with
different cases, do not adjust the threshold, do not drop the anchors the
challenger failed. Report both numbers and stop.

On promotion, mark old non-anchor rows `stale: true` — never delete rows or raw
outputs, and never mark anchors stale. Without that flag, old scores outnumber
new ones and pin the old ranking in place, so the new rubric cannot re-rank
anything: changing the ruler changes nothing.

Add adversarial anchors — things the old rubric accepted that you later rejected
— **before** the challenger is scored. Adding them afterwards is choosing the
exam to suit the candidate.

See `reference/` for the rubric JSON shape, the judge prompt, and the full
transition procedure.

## Before reporting any result

```
□ Judge was cross-family (and not the mock, if these are real numbers)
□ Kappa is over anchors only
□ No anchor label changed during this work
□ Unknown costs are null, not 0
```
