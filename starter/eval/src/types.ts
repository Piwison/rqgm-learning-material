/**
 * Shared types for the eval harness.
 *
 * Deliberately small. If you find yourself adding a type here that only one
 * file uses, put it in that file instead.
 */

export type Verdict = "accept" | "reject";

export interface Criterion {
  id: string;
  /** A yes/no question. If it needs a score out of 10, it is underspecified. */
  text: string;
  /**
   * Read ONLY by the offline mock judge. The real judge ignores it entirely.
   *   fail_if_matches — input matches this regex  -> fail, matched text is the evidence
   *   fail_if_missing — input does NOT match this -> fail
   */
  mock?: { fail_if_matches?: string; fail_if_missing?: string };
}

export interface Rubric {
  name: string;
  version: number;
  /** Conjunctive only. Weighted averages let one serious error be offset by minor virtues. */
  acceptance: "conjunctive";
  criteria: Criterion[];
}

export interface EvalCase {
  case_ref: string;
  input: string;
  /** Your label. Ground truth. The harness never writes this. */
  expected_verdict: Verdict;
  /** Anchors are append-only and never optimised against. */
  is_anchor: boolean;
  is_adversarial?: boolean;
  /** Required if an anchor label is ever revised. */
  note?: string;
}

export interface CriterionResult {
  criterion_id: string;
  verdict: "pass" | "fail";
  /** An exact quote from the input. A verdict without evidence is an error. */
  evidence: string;
}

export interface RunRow {
  case_ref: string;
  rubric_name: string;
  rubric_version: number;
  model_used: string;
  verdict: Verdict;
  per_criterion: CriterionResult[];
  tokens_in: number;
  tokens_out: number;
  /** null means "price unknown" — never coerce to 0, it makes savings look better than they are. */
  cost_usd: number | null;
  /** Selective erasure flag. Set true on old non-anchor rows after a rubric promotion. */
  stale: boolean;
  created_at: string;
}

export interface JudgeOutput {
  results: CriterionResult[];
  tokens_in: number;
  tokens_out: number;
}

export interface Judge {
  /** Goes into RunRow.model_used. Record what actually judged, not what you configured. */
  readonly id: string;
  judge(input: string, rubric: Rubric): Promise<JudgeOutput>;
}
