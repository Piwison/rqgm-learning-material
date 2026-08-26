/**
 * The harness.  node src/run.ts   (or: npm run eval)
 *
 * Reads a rubric and cases, judges every case, applies CONJUNCTIVE acceptance,
 * stores one row per case, and reports pass rate plus kappa on anchors only.
 *
 * Invariants this file exists to protect:
 *   1. It NEVER writes to cases/. That file is your ground truth.
 *   2. Acceptance is conjunctive. All criteria pass, or the verdict is reject.
 *   3. Kappa is computed on anchors only — non-anchor cases have been shaped by
 *      the rubric you are testing, so scoring against them flatters it.
 *   4. Unknown price is null, never 0.
 */

import { readFile } from "node:fs/promises";
import { cohenKappa, formatKappa } from "./kappa.ts";
import { pickJudge } from "./judge.ts";
import { store } from "./store.ts";
import type { EvalCase, Rubric, RunRow, Verdict } from "./types.ts";

const GATE = 0.6;

async function json<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function main() {
  const rubricPath = process.env.RUBRIC ?? "rubrics/example-v1.json";
  const casesPath = process.env.CASES ?? "cases/example.json";

  const rubric = await json<Rubric>(rubricPath);
  const cases = await json<EvalCase[]>(casesPath);
  const systemPrompt = await readFile("prompts/judge.md", "utf8");
  const judge = pickJudge(systemPrompt);

  if (rubric.acceptance !== "conjunctive") {
    throw new Error(
      `rubric acceptance is "${rubric.acceptance}". Only "conjunctive" is supported — ` +
        "weighted averages let one serious failure be offset by minor virtues.",
    );
  }

  console.log(`rubric  ${rubric.name} v${rubric.version} · ${rubric.criteria.length} 條`);
  console.log(`cases   ${cases.length} 條（錨點 ${cases.filter((c) => c.is_anchor).length} 條）`);
  console.log(`judge   ${judge.id}${judge.id.startsWith("mock") ? "  ← 離線假 judge，分數不代表任何意義" : ""}`);
  console.log("");

  const rows: RunRow[] = [];
  for (const c of cases) {
    const { results, tokens_in, tokens_out } = await judge.judge(c.input, rubric);
    const verdict: Verdict = results.every((r) => r.verdict === "pass") ? "accept" : "reject";

    rows.push({
      case_ref: c.case_ref,
      rubric_name: rubric.name,
      rubric_version: rubric.version,
      model_used: judge.id,
      verdict,
      per_criterion: results,
      tokens_in,
      tokens_out,
      cost_usd: null, // fill in from a dated price table; never guess
      stale: false,
      created_at: new Date().toISOString(),
    });
  }

  const path = await store.append(rows);

  /* ── report ── */
  const agree = rows.filter(
    (r, i) => r.verdict === cases[i].expected_verdict,
  ).length;
  const accepted = rows.filter((r) => r.verdict === "accept").length;

  console.log(`通過率  ${accepted}/${rows.length}（${((accepted / rows.length) * 100).toFixed(0)}%）`);
  console.log(`與我一致 ${agree}/${rows.length} —— 但一致率會騙人，看下面的 κ`);
  console.log("");

  const anchorPairs = cases
    .map((c, i) => [c, rows[i]] as const)
    .filter(([c]) => c.is_anchor)
    .map(([c, r]) => [c.expected_verdict, r.verdict] as [Verdict, Verdict]);

  console.log(`錨點 ${anchorPairs.length} 條`);
  console.log(formatKappa(cohenKappa(anchorPairs), GATE));
  console.log("");

  const disagreements = cases
    .map((c, i) => [c, rows[i]] as const)
    .filter(([c, r]) => c.expected_verdict !== r.verdict);

  if (disagreements.length) {
    console.log("判定不一致的案例 —— 逐條問：是 judge 錯了，還是我的條目沒寫清楚？");
    for (const [c, r] of disagreements) {
      const failed = r.per_criterion.filter((x) => x.verdict === "fail");
      console.log(`  ${c.case_ref}  我判 ${c.expected_verdict} / judge 判 ${r.verdict}${c.is_anchor ? "  [錨點]" : ""}`);
      for (const f of failed) {
        console.log(`      ${f.criterion_id} fail ← 「${f.evidence}」`);
      }
    }
    console.log("");
  }

  console.log(`已寫入 ${path}`);
  console.log("");
  console.log("提醒：κ 不夠時要改的是 rubric 的用字，永遠不是你的標註。");
}

main().catch((e) => {
  console.error("\n" + (e instanceof Error ? e.message : String(e)) + "\n");
  process.exit(1);
});
