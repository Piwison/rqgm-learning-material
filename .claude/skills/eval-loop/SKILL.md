---
name: eval-loop
description: Run a rubric-based, bias-controlled evaluation of an AI agent's outputs against a versioned rubric and a human-verified anchor set. Use when the user wants to score agent outputs, calibrate an LLM judge, check Cohen's kappa, track eval cost and tokens, or run an epoch transition (rubric version upgrade). Triggers on "evaluate the agent", "score these outputs", "run the eval", "check the judge", "upgrade the rubric", "epoch transition".
---

# Eval Loop

A lightweight, RQGM-inspired evaluation workflow. Grades agent outputs against a
versioned rubric, calibrates the judge against human-verified anchors, tracks cost,
and supports disciplined rubric upgrades.

> **Status: stub.** This becomes real in Week 4. Until then it documents the target,
> so the shape of the thing is visible while the pieces are being built.

## When to use

- Scoring a batch of agent outputs (YCO skincare reports, YCM spec resolutions).
- Checking whether the judge is trustworthy (κ against anchors).
- Upgrading a rubric safely (anchor-gated promotion + selective erasure).

## Core principles — do not skip any of these

1. **Cross-family judge.** The judge must be a different model family from the
   generator. This is the primary defense against self-preference bias.
2. **Conjunctive rubric.** All binary criteria must pass to accept. No weighted
   averages.
3. **Evidence per criterion.** Strict JSON output, each verdict carrying the quoted
   text that drove it.
4. **Order randomization.** Any comparison runs both orderings and averages. Log the
   disagreement rate.
5. **Anchors are held out.** Never optimize against them. Append-only.

## Workflow

1. Load the active rubric (`rubrics` where `active`) and the eval cases.
2. For each case: call the judge, evaluate criteria independently, write one
   `agent_runs` row — verdict, per-criterion results, evidence, model used, tokens,
   cost.
3. **Route:** cheap model grades the bulk; escalate low-confidence or near-threshold
   cases to a strong model. Log which model handled each.
4. **Report:** pass rate, pass rate by rubric version, Cohen's κ on anchors only,
   total cost, cheap-vs-strong split.
5. For a version upgrade, follow `reference/epoch-transition.md`.

## Epoch transition (summary)

Score **both** the incumbent and the challenger rubric on **anchors only**. Promote
the challenger only if its anchor κ ≥ the incumbent's. On promotion:

- Mark all non-anchor `agent_runs` scored under the old version `stale = true`.
  Keep the rows and the raw outputs — re-score cached outputs rather than re-running
  the agent.
- Add adversarial cases: anything the old rubric accepted that I later rejected
  becomes an anchor `reject` case before the challenger is scored.
- Write one `epoch_transitions` row recording both κ values and the decision.

## Files

- `reference/rubric-schema.md` — rubric JSON structure and criteria-writing rules
- `reference/judge-prompt.md` — the judge system prompt (edit there, not inline)
- `reference/epoch-transition.md` — promotion gate, erasure, adversarial relabeling

## Every-run sanity checks

- Held-out anchor κ diverging from the κ you optimize against → reward hacking.
- Judge accepting a planted known-bad output → over-acceptance.
- Verdicts flipping on order swap more than ~10% of the time → position bias.
- Eval set not growing from real production failures → overfitting to a tiny set.

## Verification

Before running, state in one line how this run will be verified. After running,
confirm: κ ≥ 0.6 on anchors, cost logged, no errors, no anchor labels mutated.
