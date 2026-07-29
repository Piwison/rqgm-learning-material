# rqgm-learning-material

A 4-week self-directed course on **AI agent evaluation** — and the working artifacts
built while taking it.

The framing comes from the Red Queen Gödel Machine paper
([arXiv 2606.26294](https://arxiv.org/abs/2606.26294), Cambridge MLSys + NVIDIA, June 2026),
reduced to something one non-engineer can actually build in ~40 hours.

> A scoring standard that never changes will eventually be gamed by whatever it scores.
> So the standard must evolve too — but with discipline, or you lose your basis for
> comparison.

---

## Start here

| If you want to… | Open |
|---|---|
| Know where the project stands | [`PROGRESS.md`](PROGRESS.md) |
| Take Week 1 (interactive) | [`web/week1-course.html`](web/week1-course.html) — open in a browser |
| Take Week 1 (plain text) | [`docs/10-week1-course.md`](docs/10-week1-course.md) |
| Understand the whole plan | [`docs/00-research-report.md`](docs/00-research-report.md) |
| Track progress + run the calculators | [`web/rqgm-console.jsx`](web/rqgm-console.jsx) |

Working in Claude Code? It reads [`CLAUDE.md`](CLAUDE.md) automatically. Everything it
needs to behave correctly on this project is in there.

---

## What gets built

**WorkTracker** — a web app that tracks what I'm working on *and* serves as the dashboard
for the evaluation loop. The same tables do both jobs: tasks synced from Notion, plus eval
runs with rubric scores, judge verdicts, epoch transitions, and cost.

Stack: Next.js 15 (App Router, TypeScript) · Supabase · Vercel · Notion API.

Schema is already drafted in [`supabase/schema.sql`](supabase/schema.sql) — five tables,
with a `stale` flag for selective erasure and a `v_current_runs` view for trusted results.

---

## The seven rules

These are why the loop is trustworthy. Full detail in [`CLAUDE.md`](CLAUDE.md).

1. **Cross-family judging** — the judge is never the same model family as the generator
2. **Binary criteria only** — if it needs a score out of 10, decompose it
3. **Conjunctive acceptance** — all criteria pass, or reject
4. **Evidence-bounded verdicts** — every verdict quotes the text that drove it
5. **Anchors are append-only** — relabeling requires a logged note
6. **Never optimize against anchors** — they are held-out ground truth
7. **Order randomization** — both orderings, averaged; >10% flips means the judge is guessing

---

## Layout

```
CLAUDE.md          Project memory — read first if you're an agent
PROGRESS.md        Current state. Updated at the end of every session.
docs/              Research report and course material
web/               Standalone study tools — no build step, open directly
supabase/          Database schema
.claude/skills/    eval-loop/ — the Week 4 target artifact (currently a stub)
```

---

## Setup

Nothing to install yet — Week 1 starts with reading and one standalone script.

Copy `.env.example` to `.env` and fill it in when you reach Lesson 5.

```bash
cp .env.example .env
```

`.env` is gitignored. Keep it that way.

---

## A note on the source material

The paper is a **preliminary preprint** — single-run, short search horizons. The concepts
are sound; the numbers are provisional.

Two claims that circulate in secondary summaries are **wrong** and are not repeated here:
a "13.0× cost reduction" (doesn't exist in the paper; real maximum is ~3×) and a model
called "Nemotron 3 Ultra" (it's Nemotron 3 Super 120B, appendix-only, and the paper says
that routing "was never observed being used").

That discrepancy is itself part of the curriculum. Evidence-bounded review applies to your
own reading first.
