/**
 * Judges.
 *
 * Two implementations:
 *   mock   — offline, deterministic, no API key. The default, so `npm run eval`
 *            works the moment you clone this. Use it to develop the pipeline.
 *   openai — the real thing. Reads JUDGE_MODEL / JUDGE_API_KEY.
 *
 * The cross-family rule is ENFORCED HERE, not just documented: if the generator
 * is Claude (it is — you are driving Claude Code) then a Claude judge would
 * systematically favour its own family's output. assertCrossFamily() throws
 * rather than letting that happen quietly.
 */

import type { Criterion, CriterionResult, Judge, JudgeOutput, Rubric } from "./types.ts";

/**
 * The one rule that must never be waived. Kept as code because a rule in a
 * markdown file is a rule you can forget at 11pm.
 */
export function assertCrossFamily(modelId: string): void {
  if (/claude|anthropic/i.test(modelId)) {
    throw new Error(
      [
        `拒絕使用「${modelId}」當 judge。`,
        "",
        "你用 Claude Code 生成東西，judge 就不能也是 Claude —— 它會系統性地",
        "偏好自己家族的產出（self-preference bias），你的通過率會很漂亮而且是假的。",
        "",
        "改用 OpenAI 或 Gemini 家族的模型。這是這整套系統裡最便宜、效果最大的一條規則。",
      ].join("\n"),
    );
  }
}

/* ────────────────────────────── mock ────────────────────────────── */

/**
 * A deliberately dumb judge: a criterion fails if the input matches its
 * `mock.fail_if_matches` regex, and the matched text becomes the evidence.
 *
 * It is dumb on purpose. Its job is to prove the pipeline end to end — that
 * conjunctive acceptance, evidence capture, storage and kappa all work — before
 * you spend a cent. Do not read anything into the scores it produces.
 */
export class MockJudge implements Judge {
  readonly id = "mock:regex-v1";

  async judge(input: string, rubric: Rubric): Promise<JudgeOutput> {
    const results = rubric.criteria.map((c) => this.one(input, c));
    return {
      results,
      tokens_in: Math.ceil(input.length / 4),
      tokens_out: results.length * 24,
    };
  }

  private one(input: string, c: Criterion): CriterionResult {
    const pass = (evidence: string): CriterionResult => ({
      criterion_id: c.id,
      verdict: "pass",
      evidence,
    });
    const fail = (evidence: string): CriterionResult => ({
      criterion_id: c.id,
      verdict: "fail",
      evidence,
    });

    if (c.mock?.fail_if_matches) {
      const m = input.match(new RegExp(c.mock.fail_if_matches));
      if (m) return fail(m[0]);
    }
    if (c.mock?.fail_if_missing) {
      const m = input.match(new RegExp(c.mock.fail_if_missing));
      if (!m) return fail(`（整段輸入裡找不到符合的內容）`);
      return pass(m[0]);
    }
    return pass(input.slice(0, 60));
  }
}

/* ───────────────────────────── openai ───────────────────────────── */

export class OpenAIJudge implements Judge {
  readonly id: string;
  #key: string;
  #prompt: string;

  constructor(model: string, apiKey: string, systemPrompt: string) {
    assertCrossFamily(model);
    this.id = model;
    this.#key = apiKey;
    this.#prompt = systemPrompt;
  }

  async judge(input: string, rubric: Rubric): Promise<JudgeOutput> {
    const user = [
      "RUBRIC (evaluate each criterion independently):",
      ...rubric.criteria.map((c) => `- ${c.id}: ${c.text}`),
      "",
      "INPUT TO JUDGE:",
      input,
    ].join("\n");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.#key}`,
      },
      body: JSON.stringify({
        model: this.id,
        temperature: 0, // same input must give the same verdict, or every number is noise
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: this.#prompt },
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`judge HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }

    const body = (await res.json()) as any;
    const raw = body.choices?.[0]?.message?.content ?? "";

    let parsed: { results?: CriterionResult[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Retry once, then fail loudly. Never guess a verdict.
      throw new Error(`judge returned malformed JSON: ${raw.slice(0, 300)}`);
    }

    const results = parsed.results ?? [];
    for (const r of results) {
      if (!r.evidence || !r.evidence.trim()) {
        throw new Error(
          `criterion ${r.criterion_id} came back with no evidence. ` +
            "A verdict without evidence is a guess, not a result.",
        );
      }
    }

    return {
      results,
      tokens_in: body.usage?.prompt_tokens ?? 0,
      tokens_out: body.usage?.completion_tokens ?? 0,
    };
  }
}

/* ──────────────────────────── selection ─────────────────────────── */

export function pickJudge(systemPrompt: string): Judge {
  const model = process.env.JUDGE_MODEL;
  const key = process.env.JUDGE_API_KEY;
  if (!model || !key) return new MockJudge();
  return new OpenAIJudge(model, key, systemPrompt);
}
