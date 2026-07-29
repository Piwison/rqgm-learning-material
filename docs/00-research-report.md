# RQGM → a 4-week plan I can actually execute

Verified research notes + the reduction of the paper to something one person can build
in ~40 hours.

**Source:** *The Red Queen Gödel Machine: Co-Evolving Agents and Their Evaluators*,
arXiv 2606.26294v1, 24 June 2026. University of Cambridge Machine Learning Systems Lab
+ NVIDIA. Lead authors Alex Iacob, Andrej Jovanović, William F. Shen; senior author
Nicholas D. Lane. The authors describe it as *"a preliminary empirical investigation."*

**Lineage:** Darwin-Gödel Machine (DGM, arXiv 2505.22954, Sakana AI + UBC) → Huxley-Gödel
Machine (HGM, arXiv 2510.21614, KAUST, ICLR 2026) → RQGM. Ultimately from Schmidhuber's
Gödel Machine (2003) and Van Valen's Red Queen Hypothesis (1973).

---

## 1. Fact-check: what's real, what isn't

### Verified true in the primary PDF

- **Non-stationary utilities** — the evaluator co-evolves with the task agent. Core thesis.
- **Controlled Utility Evolution** — search is divided into epochs; the evaluator is frozen
  within an epoch and swapped only at boundaries, when a challenger beats the incumbent on
  a held-out ground-truth anchor via ε-best-belief.
- **CMP** — `CMP(a) = nC_success / (nC_success + nC_failure)`, inherited from HGM.
- **ε-best-belief** — `BB_ε(a) = I⁻¹_ε(1 + S_a, 1 + F_a)`, the ε-quantile of a Beta
  posterior. **ε = 0.05** in the paper.
- **UCB-Air expansion gate** — `N_t^α ≥ |T_t|`, archive grows `O(N^α)`, **α = 0.6**.
- **Selective erasure** — justified by a Spearman ρ study. The no-erasure control stays
  "pinned" at **ρ ≥ 0.90** (Figure 3 caption).
- **Amortized transitions** — exponentially-spaced checkpoints (**ρ = 2**) reduce cost from
  **O(B²) to O(B)**; re-score cached outputs instead of re-running the task agent.
- **Four ground-truth anchors** — **Polyglot** (executable tests, coding), **APReS**
  (paper accept/reject), **IMO-GradingBench** (proof grading), **CRAVE** (real PR-review labels).
- **Adversarial alignment** at epoch boundaries, to fix reviewer over-acceptance of AI work.
- **Headline numbers:** Polyglot pass rate **69.9% → 71.7%**; **1.35×–1.72×** fewer tokens;
  co-evolved writers **1.78×–1.86×** higher acceptance (21.8% → 40.5%); co-evolved grader
  **+9%** ground-truth accuracy at ~3× lower search cost; strongest baseline reviewer
  over-accepts AI papers at up to **1.91×** the human rate.

### False or garbled in my original Chinese summary

- **"13.0× cost reduction" — fabricated.** No 13× figure appears anywhere in the paper.
  Real maximum is ~3× (grader search cost). Do not cite this.
- **"Nemotron 3 Ultra" — wrong name.** The paper uses **Nemotron 3 Super 120B**, only in
  appendix ablations. Critically, the paper states the GPT-5.5 → Nemotron delegation
  *"was never observed being used."* The routing story is aspirational, not demonstrated.
- **"GPT-5.5 (low)" for the meta-agent — true.** That is the actual model for main runs.
- **"Three-tier sampling" — mislabeled.** The paper calls it a *Three-Level Sampling
  Hierarchy* (node → role → task). The **Least-Measured Cell** operator (Algorithm 1,
  line 18) selects role *and* task together, not role alone.

### Epistemic status

A preliminary preprint: single-run, short search horizons. The **ideas** are excellent
scaffolding. The **numbers** are provisional. Build on the concepts; never treat this as a
proven production recipe.

---

## 2. The concept ladder

The eight ideas worth actually understanding.

**2.1 Outcome vs process evaluation.** Grade *what* was produced, or *how* it got there.
Outcome-only grading systematically overestimates capability — an agent can reach a correct
answer by luck or by skipping required steps, and you won't see it until an edge case.

**2.2 LLM-as-a-Judge and its four biases.** Zheng et al. 2023 (arXiv 2306.05685, NeurIPS)
found strong judges reach >80% agreement with humans — about the human–human rate
(GPT-4↔human ~85% vs human–human 81%). But: **position bias** (prefers the first option),
**verbosity bias** (prefers longer), **self-preference bias** (favors its own family), and
**poor calibration**. Mitigations: swap order and average, use binary criteria, use a
cross-family judge, demand quoted evidence.

**2.3 Rubrics ≡ acceptance criteria.** A spec criterion and a rubric line are the same
object. Good ones are binary, evidence-bounded, and conjunctive.

**2.4 Ground-truth anchors.** A small, fixed, human-verified set. The guardrail that keeps a
co-evolving evaluator honest. Without it, an evaluator can "improve" itself into nonsense.

**2.5 Benchmark saturation and reward hacking.** Goodhart's Law: when a measure becomes a
target, it stops being a good measure. This is the entire motivation for non-stationary
utilities.

**2.6 CMP — worked example.** Agent A passes 3/5 alone (0.60), children 8/10 and 9/10.
Clade: successes 3+8+9 = 20, failures 2+2+1 = 5 → **CMP = 0.80**. Agent B passes 4/5 alone
(0.80), children 1/10 and 2/10. Clade: successes 7, failures 18 → **CMP = 0.28**. B looks
better alone; A is the far better bet. That gap is the *Metaproductivity–Performance
Mismatch*.

**2.7 ε-best-belief — worked example.** X: 1 success, 0 failures → raw 100%. Y: 18 successes,
2 failures → raw 90%. Using `Beta(1+S, 1+F)` at the 5th percentile: X is `Beta(2,1)` →
**≈ 0.22**; Y is `Beta(19,3)` → **≈ 0.74**. The conservative estimate correctly ranks Y far
above X. Takeaway isn't the formula — it's the habit: *never rank on raw pass rates from
tiny samples.*

**2.8 Epochs, selective erasure, adversarial relabeling.** An epoch freezes the rubric so you
have a stable target. Selective erasure discards only scores that depended on the old rubric,
keeping raw outputs and anchor data — without it, old rankings stay pinned (ρ ≥ 0.90) and the
new rubric can't re-rank anything. Adversarial relabeling adds previously over-accepted AI
outputs as "should be rejected" cases.

---

## 3. Week-by-week (~40–50 hrs)

### Week 1 — Foundations + first eval agent + skeleton (~15 hrs)

Lessons: RQGM abstract + intro and the DGM blog (2h) · LLM-judge biases and rubric design
(2h) · spec-driven development ↔ rubrics (1.5h) · environment setup (1h) · skeleton build
and deploy (3.5h).

The deploy was originally left out of the budget while still being listed as a deliverable;
it is Lesson 5 Part C and it is why Week 1 is ~15 hrs, not 11–12.

Exercise: build **spec-judge** (see `10-week1-course.md` for the full prompt) and the
Next.js + Supabase skeleton.

**Gate:** deployed URL with empty states; `schema.sql` read and understood; ≥ 8 real TBD
resolutions scored; you agree with at least one "fail."

### Week 2 — Rubrics, harness, anchor set (11–12 hrs)

Lessons: golden-dataset construction — **20–30 cases (~15 core / ~10 edge)** is the right
starting size (2h) · Cohen's κ and Spearman ρ (2h) · rubric versioning, conjunctive
acceptance, evidence-bounded review (1.5h) · Notion sync design (1h).

Exercise: **Eval Harness v1** — `npm run eval` reads cases, calls a cross-family judge,
writes `agent_runs`, prints pass rate and anchor κ.

Anchor set: export 20–30 real past accept/reject decisions; mark the ~10 you're most certain
about as anchors.

**Gate: κ ≥ 0.6.** Per Landis & Koch (1977, *Biometrics* 33:159–174): 0.61–0.80 =
"Substantial", 0.81–1.00 = "Almost Perfect", 0.41–0.60 = "Moderate". If below, fix criteria
wording — never the labels.

### Week 3 — Calibration, cost, routing, dashboard (11–12 hrs)

Lessons: bias mitigation in practice (2h) · cost/token tracking and routing (1.5h) ·
trajectory evaluation (1.5h) · dashboard build (2h).

On routing savings: RouteLLM (Ong et al., arXiv 2406.18665, UC Berkeley/Anyscale, ICLR 2025)
reports **up to 3.66×** cost savings on MT Bench at 95% GPT-4 quality, routing only ~14% of
queries to the strong model. FrugalGPT (Chen et al., Stanford, 2023) showed up to 98%
reduction via cascades. These are upper bounds on *their* distributions — measure your own.

**Gate:** live `/dashboard` with pass-rate-over-time, cost, epoch markers; `cost_report`
showing measured savings on your own data; you can explain each routing decision.

### Week 4 — Minimum Viable RQGM (11–12 hrs)

Lessons: lightweight epoch transitions (2h) · Claude Agent Skills — `SKILL.md` format,
progressive disclosure, skills vs subagents (1.5h) · Notion write-back (1.5h) · anti-pattern
audit (2h).

Exercise: run **one real epoch transition** (v1 → v2), anchor-gated, with selective erasure
and adversarial relabeling. Package as `.claude/skills/eval-loop/`.

**Gate:** one logged transition with both κ values and a promote/reject decision; `stale=true`
correctly set; working `SKILL.md`; summary written back to a Notion task.

---

## 4. Minimum Viable RQGM

### Build (the 20% that gives 80% of the value)

1. A versioned rubric
2. 20–30 eval cases, ~10 human-verified anchors
3. Cross-family judge with bias controls
4. Cohen's κ calibration against anchors
5. Cost/token logging + cheap→strong routing
6. One anchor-gated epoch transition with selective erasure + adversarial relabeling
7. A dashboard showing all of it, and a reusable skill

### Skip deliberately

| Skipped | Why |
|---|---|
| Tree search over agent variants / archive | Enormous engineering, no payoff at this scale. Swap rubric versions manually. |
| Thompson sampling on CMP | Needs a large auto-generated lineage. You'll have 1–2 variants, not a clade. |
| UCB-Air expansion gate | Only matters when a machine decides spawn-vs-evaluate. |
| ε-best-belief inverse-Beta in code | With 20–30 cases, pass rate + κ suffices. Keep the habit, skip the machinery. |
| Exponentially-spaced checkpoints | Efficiency trick for long automated runs. Yours are short and manual. |
| Self-modifying Meta-Agent | Keep a generator and a judge as two prompts. |
| Full TrainEval/ValEval isolation | Simplify, don't skip: keep anchors separate from cases you iterate on. |

---

## 5. Anti-patterns — how the eval loop lies to you

| Failure | Detector |
|---|---|
| **Reward hacking / Goodhart** — scores climb, quality doesn't | Hold out anchors you never optimize against; watch for divergence between held-out and training κ |
| **Judge over-acceptance** — same-family judge rubber-stamps | Periodically plant a known-bad output; if accepted, the judge is too lenient |
| **Anchor drift** — quietly relabeling anchors | Anchors are append-only and timestamped; changing a label requires a logged note |
| **Overfitting a tiny eval set** | Every production failure becomes a new case; if the set never grows, you're not learning |
| **Uncontrolled position/verbosity bias** | Run both orderings; >10% verdict flips means bias, not discernment |
| **Vague criteria** | Same input twice giving different per-criterion results means the criterion is underspecified |

---

## 6. Concept → implementation map

| RQGM concept | My simplified version | Week |
|---|---|---|
| Non-stationary utilities / co-evolution | Versioned rubrics I upgrade deliberately | 2, 4 |
| Controlled Utility Evolution (epochs) | One `active` rubric at a time; log version changes | 2–4 |
| Ground-truth anchors | ~10 of my own past accept/reject decisions | 2 |
| ε-best-belief promotion gate | Promote v2 only if anchor κ ≥ v1 | 4 |
| CMP + Thompson sampling | *Skip mechanism*; keep "don't over-trust one variant" | — |
| UCB-Air expansion gate | *Skip* — manual version swaps | — |
| Selective erasure (ρ ≥ 0.90 pinning) | `stale=true` on old non-anchor runs | 4 |
| Amortized re-eval (O(B²)→O(B)) | Re-score stored outputs, don't re-run the agent | 4 |
| Multi-agent workspace | Two prompts: generator + cross-family judge | 2–3 |
| Adversarial relabeling | Add wrongly-accepted cases as anchor rejects | 4 |
| Agent-as-a-Judge | Cross-family LLM judge + cost routing | 2–3 |
| LLM-judge bias controls | Order swap, binary criteria, cross-family, κ | 2–3 |
| TrainEval vs ValEval isolation | Anchors separate from cases I iterate on | 2 |

---

## 7. Tooling decision

**Build a thin Supabase-backed TypeScript harness.** Full control, TS-native, self-hosted,
free — and for someone driving Claude Code rather than writing Python, it beats adopting a
framework.

- **Inspect AI** (UK AISI) and **DeepEval** — Python-first. Read their *concepts*, implement
  in TS.
- **Braintrust** — consider only if PR-gating and a hosted dashboard become worth it. Free
  Starter tier exists; `braintrustdata/eval-action` posts score summaries as PR comments.
- **Langfuse** — MIT, self-hostable, the fallback for off-the-shelf observability. Adds infra
  a solo build doesn't need.
- **LangSmith** — skip; optimized for LangChain, which isn't in this stack.
- **Anthropic Console eval tool** — useful for quick prompt A/Bs.

Revisit only if maintaining 5+ agent variants makes manual comparison genuinely unworkable.
