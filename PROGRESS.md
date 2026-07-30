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

## Week 1 checklist (~15 hrs)

Teaching material: `docs/10-week1-course.md` · interactive version: `web/week1-course.html`

- [ ] **L0** (0.5h) Write down 3 real accept/reject decisions with two layers of "why"
- [ ] **L1** (1h) Outcome vs process evaluation
- [ ] **L2** (1.5h) The four LLM-judge biases
- [ ] **L3** (1.5h) Rewrite 3 TBD resolutions into binary verifiable criteria (+2 optional)
- [ ] **L4** (1.5h) Three-pass read of the paper + symbol table
- [ ] **L5** (9h) Environment setup + `spec-judge` + deploy the skeleton
  - Part A (1h) Supabase, Vercel, and the judge API key — Notion moved to Week 2
  - Part B (3h) Build `spec-judge`
  - Part C (5h) Next.js skeleton in `worktracker/`, applied schema, deployed
- [ ] **Weekend** (40min) Three open-ended questions

Lessons 0–4 are reading and writing only — 6h with no setup required. Lesson 5 is 60%
of the week on its own; that split is real, so plan against it rather than assuming
lessons are evenly sized.

**Week 1 deliverables:**
- [ ] `spec-judge.ts` runs and produces `spec-judge-report.md`
- [ ] Next.js + Supabase skeleton deployed to Vercel (Tasks + Runs pages, empty states)
- [ ] `supabase/schema.sql` applied as-is — 5 tables + the `v_current_runs` view live
- [ ] ≥ 8 cases logged with my verdict and the judge's verdict

---

## Weeks 2–4 (written, not started)

Material: `docs/20-week2-course.md` · `docs/30-week3-course.md` · `docs/40-week4-course.md`

**Week 2 — ~13 hrs.** 20–30 eval cases (~15 core / ~10 edge) with ~10 anchors, rubric v1
as JSON (5–7 binary criteria), `npm run eval` end to end printing anchor κ, then the work
of getting κ over the line. *Gate: κ ≥ 0.6.* Notion sync is the one optional lesson.

**Week 3 — ~11.5 hrs.** A canary case that fails loudly when the judge goes soft,
cost/token reconciliation against the provider's own usage page, cheap→strong routing
triggered by "exactly one criterion failed", `cost_report` measured on my own data, and
`/dashboard` with pass rate over time and epoch markers. Trajectory flags are optional.

**Week 4 — ~13 hrs.** Rubric v2, adversarial anchors added *before* v2 is scored, one real
epoch transition gated on anchor κ with selective erasure via `stale=true`, the eval-loop
skill made real, Notion write-back (comment-only), and a six-point anti-pattern audit.

**Honest total: ~54 hrs, not the ~40 originally planned.** Week 1 alone went from 11.5 to
15 once the deploy was counted. Every week marks lessons **必做 / 選做** so the gates are
reachable in roughly 40 hrs by dropping the optional ones (Week 2 Notion sync, Week 3
trajectory flags).

---

## Next action

Read `docs/10-week1-course.md` from the top. Do Lesson 0 — it's 30 minutes and
everything else depends on it.

Then Lesson 5's first prompt builds `spec-judge`. That's the first thing in this repo
that will actually run.

---

## Open questions / parked

- ~~Which model family for the judge?~~ **Decided: OpenAI GPT family.** Needed in
  Lesson 5, not Week 2 — `spec-judge` cannot run without a non-Claude key. Chosen for
  strict JSON-schema output (rule 4 depends on the evidence field not drifting mid-batch);
  its cheap and strong models are both non-Claude, so Week 3 cost routing stays inside
  one family. Gemini is an acceptable substitute. **Pin no model ID in the material** —
  record the actual one per run in `agent_runs.model_used`.
- Notion sync direction: read-only first, write-back in Week 4.
- Whether `web/rqgm-console.html` becomes part of WorkTracker or stays a standalone
  study tool. Leaning: its data model (`cases` / `epochs` / `ledger`) is already the
  prototype for the Supabase schema, so port the *schema*, rebuild the *UI*.

---

## Session log

| Date | What happened | Next |
|---|---|---|
| — | Repo initialized with learning material | Start Lesson 0 |
