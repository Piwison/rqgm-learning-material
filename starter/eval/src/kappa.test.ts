/**
 * Run with:  node --test src/kappa.test.ts
 *
 * These numbers are the ones the docs quote. If this file goes red, the docs
 * are lying — fix whichever is wrong before shipping anything.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { cohenKappa, band } from "./kappa.ts";
import type { Verdict } from "./types.ts";

/** Build the pair list for a 2x2 table: a=both accept, b, c, d=both reject. */
function table(a: number, b: number, c: number, d: number): Array<[Verdict, Verdict]> {
  const out: Array<[Verdict, Verdict]> = [];
  for (let i = 0; i < a; i++) out.push(["accept", "accept"]);
  for (let i = 0; i < b; i++) out.push(["accept", "reject"]);
  for (let i = 0; i < c; i++) out.push(["reject", "accept"]);
  for (let i = 0; i < d; i++) out.push(["reject", "reject"]);
  return out;
}

test("75% raw agreement gives kappa 0.50 — below the gate", () => {
  const k = cohenKappa(table(8, 3, 2, 7))!;
  assert.equal(k.n, 20);
  assert.equal(k.a + k.d, 15);
  assert.equal(k.observed, 0.75);
  assert.equal(Number(k.kappa.toFixed(3)), 0.5);
  assert.ok(k.kappa < 0.6, "0.50 must not pass the 0.6 gate");
});

test("85% raw agreement gives kappa 0.70 — above the gate", () => {
  const k = cohenKappa(table(9, 2, 1, 8))!;
  assert.equal(k.observed, 0.85);
  assert.equal(Number(k.kappa.toFixed(3)), 0.7);
  assert.ok(k.kappa >= 0.6);
});

test("two more agreements move kappa by 0.20", () => {
  const before = cohenKappa(table(8, 3, 2, 7))!;
  const after = cohenKappa(table(9, 2, 1, 8))!;
  assert.equal(Number((after.kappa - before.kappa).toFixed(3)), 0.2);
});

test("all ratings in one class is not computable, and must not read as 0", () => {
  assert.equal(cohenKappa(table(10, 0, 0, 0)), null);
  assert.equal(cohenKappa([]), null);
});

test("perfect agreement is 1, and chance-level agreement is 0", () => {
  assert.equal(cohenKappa(table(10, 0, 0, 10))!.kappa, 1);
  // 50/50 both ways: half agree, and half is exactly what chance predicts.
  assert.equal(cohenKappa(table(5, 5, 5, 5))!.kappa, 0);
});

test("a judge that is worse than guessing goes negative", () => {
  assert.ok(cohenKappa(table(1, 9, 9, 1))!.kappa < 0);
});

test("bands match Landis & Koch boundaries", () => {
  assert.match(band(0.55), /Moderate/);
  assert.match(band(0.61), /Substantial/);
  assert.match(band(0.9), /Almost Perfect/);
  assert.match(band(-0.1), /Poor/);
});
