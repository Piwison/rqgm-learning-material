/**
 * Cohen's kappa — agreement between two raters, corrected for chance.
 *
 * Why not raw agreement: if both raters mostly say "accept", a large share of
 * their agreement is luck. Kappa subtracts that share.
 *
 * Worked reference (asserted in kappa.test.ts):
 *   15/20 agree -> 75% raw -> kappa 0.50   (below the 0.6 gate)
 *   17/20 agree -> 85% raw -> kappa 0.70   (above it)
 * Two more agreements move kappa by 0.20. That is the size of the job when
 * kappa is short: find the two or three cases judged wrong, not a rewrite.
 */

import type { Verdict } from "./types.ts";

export interface KappaResult {
  n: number;
  /** both accept */ a: number;
  /** human accept, judge reject */ b: number;
  /** human reject, judge accept */ c: number;
  /** both reject */ d: number;
  observed: number;
  expected: number;
  kappa: number;
  band: string;
}

/** Landis & Koch (1977), Biometrics 33:159-174. A convention, not a law of nature. */
export function band(k: number): string {
  if (k < 0) return "Poor（比隨機還差）";
  if (k <= 0.2) return "Slight";
  if (k <= 0.4) return "Fair";
  if (k <= 0.6) return "Moderate（最危險的區間 — 看起來能用，其實不能靠）";
  if (k <= 0.8) return "Substantial（目標區間）";
  return "Almost Perfect（也要懷疑案例是不是太簡單）";
}

/**
 * @param pairs [humanLabel, judgeLabel][]
 * @returns null when kappa is undefined — every rating fell in one class, so
 *   there is no chance-corrected signal to compute. That is a real outcome at
 *   small n, not a bug. Show it as "not computable", never as 0.
 */
export function cohenKappa(pairs: Array<[Verdict, Verdict]>): KappaResult | null {
  const n = pairs.length;
  if (n === 0) return null;

  let a = 0, b = 0, c = 0, d = 0;
  for (const [human, judge] of pairs) {
    if (human === "accept" && judge === "accept") a++;
    else if (human === "accept" && judge === "reject") b++;
    else if (human === "reject" && judge === "accept") c++;
    else d++;
  }

  const observed = (a + d) / n;
  const expected =
    ((a + b) / n) * ((a + c) / n) + ((c + d) / n) * ((b + d) / n);

  if (expected === 1) return null; // every rating in one class

  const kappa = (observed - expected) / (1 - expected);
  return { n, a, b, c, d, observed, expected, kappa, band: band(kappa) };
}

export function formatKappa(k: KappaResult | null, gate = 0.6): string {
  if (!k) {
    return [
      "κ：算不出來",
      "  你的判定全部落在同一邊（例如全部 accept）。κ 需要兩邊都有東西。",
      "  這不代表 judge 壞掉，代表樣本太偏。補幾條另一邊的案例。",
    ].join("\n");
  }
  const pass = k.kappa >= gate ? "✓ 過關" : "✗ 未過關";
  return [
    `κ = ${k.kappa.toFixed(3)}   ${pass}（門檻 ${gate}）`,
    `  ${k.band}`,
    `  一致 ${k.a + k.d}/${k.n}（${(k.observed * 100).toFixed(0)}%）· 碰巧一致的期望值 ${(k.expected * 100).toFixed(0)}%`,
    `  你 accept/judge accept ${k.a} · 你 accept/judge reject ${k.b} · 你 reject/judge accept ${k.c} · 都 reject ${k.d}`,
  ].join("\n");
}
