# PROGRESS

Where I am. **Update this at the end of every session** — it's the first thing Claude
Code should read after `CLAUDE.md`.

---

## Current state

**Week:** 1 — not yet started
**Epoch (rubric version):** none — no rubric written yet
**Anchor set:** 0 cases
**Judge κ:** not measured
**Deployed:** nothing yet

---

## The gate I have to clear

**Week 2, hard gate: Cohen's κ ≥ 0.60 between judge and my anchor labels.**

Below that, the judge doesn't agree with me, and every downstream thing — the
dashboard, cost routing, epoch transitions — is built on sand. If κ < 0.6, the fix is
to **rewrite the rubric wording**, never to change my anchor labels.

---

## Week 1 checklist (11.5 hrs)

Teaching material: `docs/10-week1-course.md` · interactive version: `web/week1-course.html`

- [ ] **L0** (0.5h) Write down 3 real accept/reject decisions with two layers of "why"
- [ ] **L1** (2h) Outcome vs process evaluation
- [ ] **L2** (2h) The four LLM-judge biases
- [ ] **L3** (1.5h) Rewrite 5 TBD resolutions into binary verifiable criteria
- [ ] **L4** (1.5h) Three-pass read of the paper + symbol table
- [ ] **L5** (4h) Environment setup + build `spec-judge`

**Week 1 deliverables:**
- [ ] `spec-judge.ts` runs and produces `spec-judge-report.md`
- [ ] Next.js + Supabase skeleton deployed to Vercel (Tasks + Runs pages, empty states)
- [ ] `supabase/schema.sql` applied as-is — 5 tables + the `v_current_runs` view live
- [ ] ≥ 8 cases logged with my verdict and the judge's verdict

---

## Weeks 2–4 (not started)

**Week 2** — Rubric v1 (5–7 binary criteria, JSON), 20–30 eval cases with ~10 anchors,
`npm run eval` end to end, κ printed. *Gate: κ ≥ 0.6.*

**Week 3** — Judge calibration, cost/token logging, cheap→strong routing,
`/dashboard` with pass rate over time + epoch markers, `cost_report` measured on my
own data.

**Week 4** — One real epoch transition (v1 → v2) gated on anchor κ, selective erasure
via `stale=true`, adversarial relabeling, package as `.claude/skills/eval-loop/`.

---

## Next action

Read `docs/10-week1-course.md` from the top. Do Lesson 0 — it's 30 minutes and
everything else depends on it.

Then Lesson 5's first prompt builds `spec-judge`. That's the first thing in this repo
that will actually run.

---

## Open questions / parked

- Which model family for the judge? Must not be the one generating. Decide in Week 2.
- Notion sync direction: read-only first, write-back in Week 4.
- Whether `web/rqgm-console.jsx` becomes part of WorkTracker or stays a standalone
  study tool. Leaning: its data model (`cases` / `epochs` / `ledger`) is already the
  prototype for the Supabase schema, so port the *schema*, rebuild the *UI*.

---

## Session log

| Date | What happened | Next |
|---|---|---|
| — | Repo initialized with learning material | Start Lesson 0 |
