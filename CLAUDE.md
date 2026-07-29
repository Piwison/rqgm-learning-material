# CLAUDE.md

Project memory for Claude Code. Read this before doing anything in this repo.

---

## Who I am

Product/spec owner at PerfectCorp (Taipei). I write specs, run reviews, and drive
Claude Code — **I do not hand-write code.** I read and review it.

What this means for you:
- Explain what you're about to do in plain language **before** writing code.
- Prefer one readable file over a clever abstraction spread across five.
- No frameworks or dependencies unless I asked for them or they're already here.
- When you finish a step, **show me the result** (run it, print output) — don't just
  say "done."
- If I'm about to make a mistake, say so directly. Don't be agreeable.

I read English and Traditional Chinese. Code and comments in English; explanations
to me can be either.

---

## What this repo is

A 4-week self-directed course on **AI agent evaluation**, plus the artifacts I build
while doing it. The framing comes from the Red Queen Gödel Machine paper
(arXiv 2606.26294 — Cambridge MLSys + NVIDIA, June 2026).

The one-sentence thesis I'm learning to act on:

> A scoring standard that never changes will eventually be gamed by whatever it
> scores. So the standard must evolve too — but with discipline, or you lose your
> basis for comparison.

**This repo is currently learning material. It is about to become a product.**
See `PROGRESS.md` for exactly where I am.

---

## The end goal

A web app called **WorkTracker** that tracks what I'm working on **and** doubles as
the dashboard for my evaluation loop. Same tables serve both purposes: tasks I sync
from Notion, and eval runs with rubric scores, judge verdicts, epoch transitions,
and cost.

Target stack (all already in my accounts):
- **Next.js 15** App Router + TypeScript
- **Supabase** (Postgres) — schema drafted in `supabase/schema.sql`
- **Vercel** — deploy
- **Notion API** — sync from my `[PF] Tasks Database`
  (properties: Task, Status, Priority, Due Date, Label, Done)

---

## Vocabulary (use these words consistently)

| Term | Meaning here |
|---|---|
| **Rubric** | A versioned checklist of binary criteria. Same thing as spec acceptance criteria. |
| **Judge** | The LLM that scores outputs against the rubric. |
| **Anchor** | A small set of cases I personally verified. Append-only. Never optimized against. |
| **Epoch** | A stretch where the rubric is frozen so scores stay comparable. |
| **Epoch transition** | Promoting rubric v(n) → v(n+1), gated on anchor agreement. |
| **Selective erasure** | After a promotion, flag old non-anchor scores `stale=true`. Keep the rows and raw outputs. |
| **κ (Cohen's kappa)** | Agreement between judge and my anchor labels, chance-corrected. |

---

## Non-negotiable rules for this project

These exist because the whole point is an evaluation loop that doesn't lie to me.

1. **Cross-family judging.** The judge model must be a different family from the
   generator. Never Claude-generates → Claude-judges. This is the cheapest, highest-
   impact defense against self-preference bias.
2. **Binary criteria only.** Every rubric line is a yes/no question. If it needs a
   score out of 10, it's underspecified — decompose it.
3. **Conjunctive acceptance.** All criteria must pass to accept. No weighted averages
   (they let a serious error be offset by minor virtues).
4. **Evidence-bounded verdicts.** The judge must quote the specific text that drove
   each verdict. No verdict without evidence.
5. **Anchors are append-only.** Changing an anchor label requires a logged note in
   the commit message. Silently relabeling anchors to make a new rubric look good is
   the single worst thing I could do to this project.
6. **Never optimize against anchors.** They are held-out ground truth.
7. **Order randomization.** Any pairwise comparison runs in both orderings; average.
   Log disagreement rate — >10% means the judge is guessing, not judging.

---

## Working conventions

**State your verification plan first.** Before implementing anything, restate in ONE
line how you will verify it works. Then implement. Then actually run it and show me.
This is the habit the whole course is about — apply it to your own work here.

**Spec before code.** If a change touches behavior, update the relevant doc or spec
first, then implement. Don't do both in one pass without telling me.

**Small commits, plain messages.** One logical change per commit. Write what changed
and why, not what files moved.

**Ask before adding dependencies.** Especially eval frameworks — I deliberately chose
to build a thin harness rather than adopt Braintrust/Langfuse/DeepEval. Revisit that
only if I say so.

**Don't build what I decided to skip.** See "Deliberately out of scope" below. If you
think one of those is now warranted, say why and wait for me.

---

## Deliberately out of scope

I read the paper and chose a *Minimum Viable RQGM*. These are **skipped on purpose** —
do not build them, do not suggest them unprompted:

- Tree search over agent variants / an archive of agents
- Thompson sampling on Clade Metaproductivity (CMP)
- The UCB-Air expansion gate (`N_t^α ≥ |T_t|`)
- ε-best-belief inverse-Beta ranking in code (I understand the idea; pass rate + κ
  is enough at 20–30 cases)
- Exponentially-spaced amortized re-evaluation checkpoints
- A self-modifying Meta-Agent

Reason: they only pay off with a large auto-generated lineage and long unattended
runs. I have one person and ~40 hours.

---

## Repo layout

```
docs/      Learning material and the verified research report
web/       Standalone HTML/JSX study tools (no build step — open directly)
supabase/  Database schema for the eval-aware tracker
.claude/   Skills. eval-loop/SKILL.md is the Week 4 target artifact.
```

`web/` files are self-contained and intentionally not part of a build. Don't
"modernize" them into a bundler setup.

---

## Fact-check notes (don't repeat these errors)

My original Chinese summary of the paper contained two fabrications. If you see them
anywhere, they're wrong:

- **"13.0× cost reduction"** — does not exist in the paper. Real maximum is ~3×.
- **"Nemotron 3 Ultra"** — the paper uses Nemotron 3 Super 120B, only in appendix
  ablations, and states the delegation "was never observed being used."

The paper is a *preliminary preprint*: single-run, short search horizons. Concepts are
sound; treat every number as provisional. Don't cite its figures as settled results.
