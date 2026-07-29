import { useState, useEffect, useMemo, useRef } from "react";

/* ─────────────────────────  math instruments  ───────────────────────── */

function logGamma(z) {
  const C = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = C[0];
  for (let i = 1; i < 9; i++) x += C[i] / (z + i);
  const t = z + 7 + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function betacf(x, a, b) {
  const MAXIT = 300, EPS = 3e-14, FPMIN = 1e-300;
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c; h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

function ibeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(x, a, b)) / a;
  return 1 - (bt * betacf(1 - x, b, a)) / b;
}

function betaQuantile(p, a, b) {
  let lo = 0, hi = 1;
  for (let i = 0; i < 120; i++) {
    const mid = (lo + hi) / 2;
    if (ibeta(mid, a, b) < p) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

function betaPdf(x, a, b) {
  if (x <= 0 || x >= 1) return 0;
  return Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + (a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x));
}

function cohenKappa(a, b, c, d) {
  const n = a + b + c + d;
  if (n === 0) return null;
  const po = (a + d) / n;
  const pe = ((a + b) / n) * ((a + c) / n) + ((c + d) / n) * ((b + d) / n);
  if (1 - pe === 0) return po === 1 ? 1 : 0;
  return (po - pe) / (1 - pe);
}

function kappaBand(k) {
  if (k === null || Number.isNaN(k)) return { label: "尚無資料", tone: "mute" };
  if (k < 0.01) return { label: "Poor 幾乎無共識", tone: "bad" };
  if (k < 0.21) return { label: "Slight 微弱", tone: "bad" };
  if (k < 0.41) return { label: "Fair 尚可", tone: "bad" };
  if (k < 0.61) return { label: "Moderate 中等", tone: "warn" };
  if (k < 0.81) return { label: "Substantial 可信", tone: "good" };
  return { label: "Almost Perfect 極高", tone: "good" };
}

/* ─────────────────────────  content  ───────────────────────── */

const EPOCHS = [
  {
    n: "01", week: "Week 1", hours: "11–12 hrs",
    title: "地基 · 第一隻評估 Agent",
    objective: "分清 outcome 與 process 評估、認識 LLM judge 的四種偏誤；部署 Next.js + Supabase 骨架；做出一隻會產出真實產物的小 Agent。",
    build: "部署的 Next.js + Supabase 骨架（4 張表）",
    judge: "Spec-Resolution Judge（第一份非正式 rubric）",
    lessons: [
      { id: "w1l1", t: "RQGM 論文 abstract + §1：內化「評估器是迴圈的一部分」", h: 2 },
      { id: "w1l2", t: "LLM-as-a-Judge 四大偏誤 + rubric 設計（Eugene Yan）", h: 2 },
      { id: "w1l3", t: "Spec-driven ↔ rubric：你的 TBD 驗收條件就是 rubric 條目", h: 1.5 },
      { id: "w1l4", t: "環境：復原一個 Supabase 專案、開 Vercel 專案、拿 Notion token", h: 1 },
    ],
    gates: [
      { id: "w1g1", t: "Vercel 上有可開啟的網址，Tasks / Runs 兩頁顯示空狀態（不是錯誤）" },
      { id: "w1g2", t: "schema.sql 四張表，你逐行讀過並看得懂" },
      { id: "w1g3", t: "≥ 8 條真實 TBD 決議被評分，每條有 pass/fail + 一句理由" },
      { id: "w1g4", t: "關鍵檢核：你能指著其中一個「fail」，並同意它真的是 fail" },
    ],
    reading: [
      { t: "RQGM 論文（abstract + §1）", u: "https://arxiv.org/abs/2606.26294", m: 30, p: "P1" },
      { t: "Sakana AI — Darwin Gödel Machine 發表文", u: "https://sakana.ai/dgm", m: 20, p: "P1" },
      { t: "Eugene Yan — Evaluating LLM-Evaluators", u: "https://eugeneyan.com/writing/llm-evaluators/", m: 45, p: "P1" },
      { t: "Anthropic — Create strong empirical evaluations", u: "https://docs.claude.com/en/docs/test-and-evaluate", m: 30, p: "P1" },
      { t: "Agent-as-a-Judge（abstract + intro）", u: "https://arxiv.org/abs/2410.10934", m: 30, p: "P2" },
    ],
  },
  {
    n: "02", week: "Week 2", hours: "11–12 hrs",
    title: "Rubric · Harness · 專家錨點",
    objective: "把臨時評分變成「有版本的 rubric + 可重跑的 harness」；建立 20–30 條評估案例，其中 ~10 條是你親手驗證的錨點。",
    build: "Eval Harness v1（npm run eval）",
    judge: "Rubric v1（JSON、結合式）+ 錨點集",
    lessons: [
      { id: "w2l1", t: "Golden dataset 建構：20–30 條（~15 核心 / ~10 邊界）起步", h: 2 },
      { id: "w2l2", t: "人類對齊指標：Cohen's κ 與 Spearman ρ", h: 2 },
      { id: "w2l3", t: "Rubric 版本化 + 結合式接受標準 + 證據約束審查", h: 1.5 },
      { id: "w2l4", t: "Notion 同步設計（[PF] Tasks Database → tasks 表）", h: 1 },
    ],
    gates: [
      { id: "w2g1", t: "npm run eval 端到端跑通，agent_runs 有資料" },
      { id: "w2g2", t: "rubric JSON 是你自己動手改過的，不是 Claude 生成後照單全收" },
      { id: "w2g3", t: "★ 硬性關卡：錨點集上的 Cohen's κ ≥ 0.6" },
      { id: "w2g4", t: "若 κ < 0.6 → 修 rubric 用字，不要改你的標註" },
    ],
    reading: [
      { t: "Eugene Yan — Product Evals in Three Simple Steps", u: "https://eugeneyan.com/writing/product-evals/", m: 45, p: "P1" },
      { t: "Golden Dataset for LLM Evaluation 指南", u: "https://qaskills.sh/blog/golden-dataset-llm-evaluation-guide", m: 30, p: "P1" },
      { t: "Anthropic eval tool 文件", u: "https://docs.claude.com/en/docs/test-and-evaluate/eval-tool", m: 30, p: "P1" },
      { t: "HGM 論文（abstract + CMP 章節）", u: "https://arxiv.org/abs/2510.21614", m: 40, p: "P2" },
    ],
  },
  {
    n: "03", week: "Week 3", hours: "11–12 hrs",
    title: "校準 · 成本路由 · 儀表板",
    objective: "讓 judge 值得信任、讓評估便宜；把 pass rate、成本、epoch 標記全部攤在儀表板上。",
    build: "/dashboard + cost_report",
    judge: "跨模型家族 judge + 便宜→強模型路由",
    lessons: [
      { id: "w3l1", t: "偏誤緩解實作：跨家族、順序交換、長度正規化、panel judge", h: 2 },
      { id: "w3l2", t: "成本／Token 追蹤與模型路由（RouteLLM、FrugalGPT 的真實數字）", h: 1.5 },
      { id: "w3l3", t: "Trajectory 評估：記錄工具呼叫步驟，不只看最終輸出", h: 1.5 },
      { id: "w3l4", t: "儀表板實作", h: 2 },
    ],
    gates: [
      { id: "w3g1", t: "/dashboard 上線：pass rate 時間軸、成本、epoch 分界標記" },
      { id: "w3g2", t: "cost_report 顯示「你自己資料上」的實測節省（不是行銷數字）" },
      { id: "w3g3", t: "你能解釋每一筆為何走便宜模型或強模型" },
      { id: "w3g4", t: "警訊：便宜 vs 強模型在錨點上分歧 > 10% → 全面升級 judge" },
    ],
    reading: [
      { t: "W&B — Exploring LLM-as-a-Judge（偏誤緩解）", u: "https://wandb.ai/site/articles/exploring-llm-as-a-judge/", m: 40, p: "P1" },
      { t: "RouteLLM（arXiv 2406.18665）", u: "https://arxiv.org/abs/2406.18665", m: 40, p: "P2" },
      { t: "Inspect AI 概念（Tasks / Solvers / Scorers）", u: "https://inspect.aisi.org.uk", m: 45, p: "P2" },
      { t: "Braintrust — AI eval 工具比較", u: "https://braintrust.dev/articles", m: 30, p: "P2" },
    ],
  },
  {
    n: "04", week: "Week 4", hours: "11–12 hrs",
    title: "最小可行 RQGM · 一次紀元轉換",
    objective: "真的跑一次 rubric v1 → v2 的錨點閘門升級與選擇性擦除；把整套包成可重用的 Claude Skill。",
    build: "eval-loop Skill + Notion 回寫",
    judge: "Rubric v2 通過錨點閘門 + 對抗樣本",
    lessons: [
      { id: "w4l1", t: "輕量紀元轉換：錨點閘門、選擇性擦除、對抗性重標", h: 2 },
      { id: "w4l2", t: "Claude Agent Skills：SKILL.md 格式、漸進揭露、Skill vs Subagent", h: 1.5 },
      { id: "w4l3", t: "回寫 Notion [PF] Tasks Database", h: 1.5 },
      { id: "w4l4", t: "反模式稽核：我的評估迴圈在騙我嗎？", h: 2 },
    ],
    gates: [
      { id: "w4g1", t: "一筆完整紀錄的紀元轉換（含 v1／v2 的錨點 κ 與升級決策）" },
      { id: "w4g2", t: "舊的非錨點 runs 正確標上 stale = true" },
      { id: "w4g3", t: "可運作的 .claude/skills/eval-loop/SKILL.md" },
      { id: "w4g4", t: "評估摘要成功回寫到一則 Notion task" },
    ],
    reading: [
      { t: "Anthropic — Agent Skills overview + best practices", u: "https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview", m: 50, p: "P1" },
      { t: "Claude Agent SDK overview", u: "https://platform.claude.com/docs/en/agent-sdk/overview", m: 30, p: "P2" },
      { t: "Claude Code — subagents / hooks / CLAUDE.md", u: "https://code.claude.com/docs", m: 40, p: "P2" },
      { t: "Notion API — Working with databases", u: "https://developers.notion.com/docs/working-with-databases", m: 30, p: "P2" },
      { t: "RQGM §5 對抗性除偏 + Figure 6（深水區）", u: "https://arxiv.org/abs/2606.26294", m: 40, p: "P3" },
    ],
  },
];

const PROMPTS = [
  {
    id: "p0", epoch: "01", name: "YCM Spec-Resolution Judge（今天就開始）",
    note: "3–4 小時。用你真實的 YCM TBD 決議，產出一份可讀的評分報告。這是整個計畫的入口。",
    body: `GOAL: Build a small evaluation agent called "spec-judge" that grades whether my resolved YCM spec items actually meet a verifiable acceptance criterion. I drive Claude Code and review code — keep it a single readable TypeScript script, no framework.

INPUT: I will paste 8-12 of my real resolved TBD-items. Each has: an ID (e.g. TBD-MV-01), the resolution text, and (if present) an acceptance/verification line.

WHAT TO BUILD:
1. A script \`spec-judge.ts\` that takes a JSON array of items and, for each, asks an LLM judge to decide PASS/FAIL on this single question: "Does this resolution contain a criterion that a reviewer could verify in under 10 seconds by looking at the product or code?"
2. The judge must output strict JSON: { id, verdict: "PASS"|"FAIL", reason: "<one sentence>", suggested_criterion: "<if FAIL, a rewrite that WOULD be verifiable, in EARS or Given/When/Then form>" }.
3. Use a model from a DIFFERENT family than whatever wrote the specs, to reduce self-preference bias. State which model you're using and why.
4. Print a summary table: PASS count, FAIL count, and the list of suggested_criteria for the fails.
5. Save the output to \`spec-judge-report.md\`.

CONSTRAINTS:
- Do NOT touch any other files. This is a standalone artifact.
- Before writing code, restate in ONE line how you will VERIFY the script works, then write a 2-line sample input and show me the expected output shape.

ACCEPTANCE CRITERIA (my rubric for YOUR work):
- The script runs on my pasted items without errors.
- Every FAIL comes with a concretely better, verifiable criterion.
- The report is a markdown file I can skim in 60 seconds.`,
  },
  {
    id: "p1", epoch: "01", name: "WorkTracker 骨架",
    note: "只做讀取，不做業務邏輯。重點是四張表的 schema 你要看得懂。",
    body: `Create a new Next.js 15 App Router + TypeScript project called "worktracker".
Use the Supabase JS client. I will paste my SUPABASE_URL and SUPABASE_ANON_KEY into .env.local.

Requirements (verify each before moving on):
1. A \`/\` page that lists rows from a Supabase table \`tasks\` (columns: id, title, status, priority, source, updated_at). If empty, show an empty state, not an error.
2. A \`/runs\` page listing rows from \`agent_runs\` (id, agent_name, input_ref, verdict, score, tokens_in, tokens_out, cost_usd, created_at).
3. A \`supabase/schema.sql\` with CREATE TABLE for both, plus a \`rubrics\` table (id, name, version, criteria_json, created_at) and an \`eval_cases\` table (id, case_ref, input, expected_verdict, is_anchor boolean, created_at).
4. Deploy to Vercel. Do NOT write application logic beyond CRUD reads yet.

Before you start: restate in ONE line how you will VERIFY each of the 4 items. Then implement. After each item, run it and show me the result.`,
  },
  {
    id: "p2", epoch: "02", name: "Eval Harness v1",
    note: "跨模型家族的 judge、嚴格 JSON 輸出、順序交換去偏、自動算 κ。",
    body: `In the worktracker repo, add an eval harness I can run from the command line.
Context: I drive Claude Code and review code; keep it simple, readable TypeScript, no clever abstractions.

Requirements (state your one-line verification plan per item first):
1. A \`rubrics/skincare-report-v1.json\`: 5-7 binary criteria for judging a YCO skincare report (e.g., "names at least 2 detected concerns", "every recommendation maps to a detected concern", "no product invented that isn't in the catalog", "tone is non-alarmist"). Conjunctive: all pass = accept.
2. A script \`npm run eval\` that reads eval cases from \`eval_cases\`, calls an LLM judge (a DIFFERENT model family than the generator, to avoid self-preference bias), applies the rubric, and writes one row per case to \`agent_runs\` (verdict, score, tokens, cost).
3. The judge prompt MUST evaluate criteria independently, output strict JSON {criterion: pass/fail, evidence: "<quote>"}, and run in BOTH orderings where a comparison is involved, averaging to cancel position bias.
4. Print a summary: pass rate, and Cohen's kappa vs the \`expected_verdict\` column for anchor cases.

Put the judge prompt in a separate file \`prompts/judge.md\` so I can review and edit it.`,
  },
  {
    id: "p3", epoch: "03", name: "儀表板 + 成本路由",
    note: "重點是 cost_report：用你自己的資料量出真實節省，不要相信行銷數字。",
    body: `In worktracker, build the eval dashboard and add model routing to the harness.
State your one-line verification plan per item first.

1. A \`/dashboard\` page showing, from \`agent_runs\`: overall pass rate over time (line), pass rate by rubric version, a table of latest runs with verdict + evidence quote, total cost_usd and tokens this week, and a marker whenever \`rubric_version\` changes (our "epoch boundary").
2. Add routing to \`npm run eval\`: a cheap model grades all cases (bulk); any case where the cheap judge is low-confidence OR near the accept/reject threshold gets re-judged by a strong model. Log which model judged each case and the cost of each.
3. Add a \`cost_report\` printing cheap-only cost vs actual routed cost vs strong-only cost, so I can SEE the real savings on MY data (not a marketing number).

Keep charts simple. Show me the routing threshold logic as readable code I can adjust.`,
  },
  {
    id: "p4", epoch: "04", name: "紀元轉換 + 打包成 Skill",
    note: "整個計畫的收斂點。選擇性擦除用 stale 旗標實作，保留原始輸出。",
    body: `In worktracker, implement a lightweight epoch transition and package the eval workflow as a Claude Skill.
Verification plan first, one line each.

1. Create rubric v2 (a stricter/clearer version of skincare-report-v1).
2. Add \`npm run epoch-transition\`: (a) score BOTH v1 and v2 ONLY on anchor cases; (b) promote v2 to "active" ONLY if it agrees with my anchor labels at least as well as v1 (compare Cohen's kappa on anchors); (c) if promoted, mark all non-anchor agent_runs scored under v1 as \`stale=true\` (selective erasure — keep the rows and raw outputs, just stop trusting the scores); (d) log an epoch_transition row (from_version, to_version, anchor_kappa_v1, anchor_kappa_v2, promoted boolean, timestamp).
3. Adversarial relabel: find agent_runs where v1 said "accept" but I later marked reject; add them to eval_cases as anchor "reject" cases before scoring v2.
4. Package everything as \`.claude/skills/eval-loop/SKILL.md\` with progressive disclosure: frontmatter (name, description), a short body, and reference files for the rubric schema and judge prompt.

Show me the SKILL.md so I can review it.`,
  },
];

const SKILL_MD = `---
name: eval-loop
description: Run a rubric-based, bias-controlled evaluation of an AI agent's outputs against a versioned rubric and a human-verified anchor set. Use when the user wants to score agent outputs, calibrate an LLM judge, track eval cost/tokens, or run an epoch transition (rubric version upgrade). Triggers on "evaluate the agent", "score these outputs", "run the eval", "upgrade the rubric", "epoch transition".
---

# Eval Loop Skill

A lightweight, RQGM-inspired evaluation workflow. Grades agent outputs against a
versioned rubric, calibrates the judge against human-verified anchors, tracks
cost, and supports disciplined rubric upgrades (epochs).

## When to use
- Scoring a batch of agent outputs (e.g., YCO skincare reports, YCM spec resolutions).
- Checking whether an LLM judge is trustworthy (Cohen's kappa vs anchors).
- Upgrading a rubric safely (anchor-gated promotion + selective erasure).

## Core principles (do not skip)
1. Use a judge from a DIFFERENT model family than the generator (avoid self-preference bias).
2. Conjunctive rubric: ALL binary criteria must pass to "accept".
3. Judge outputs strict JSON with an evidence quote per criterion.
4. Run comparisons in both orderings and average (position bias).
5. Never optimize against anchor cases; they are held-out ground truth.

## Workflow
1. Load the active rubric (rubrics table, active=true) and eval cases.
2. For each case: call the judge, apply criteria independently, record verdict +
   evidence + tokens + cost + model_used to agent_runs.
3. Route: cheap model for bulk; escalate near-threshold/low-confidence cases to a strong model.
4. Report: pass rate, pass rate by rubric version, Cohen's kappa on anchors, total cost.
5. For an epoch transition, see reference/epoch-transition.md.

## Files
- reference/rubric-schema.md — rubric JSON structure and criteria-writing rules.
- reference/judge-prompt.md — the judge system prompt (edit here, not inline).
- reference/epoch-transition.md — anchor-gated promotion, selective erasure, adversarial relabeling.

## Anti-patterns to check every run
- Held-out anchor kappa diverging from training kappa -> reward hacking.
- Judge accepting a known-bad planted output -> over-acceptance.
- Verdicts flipping on order/length swap -> uncontrolled bias.
- Eval set not growing from real failures -> overfitting.

## Verification
State in one line how the current run will be verified before running. After
running, confirm: kappa >= 0.6 on anchors, cost logged, no errors.`;

const SCHEMA_SQL = `-- WorkTracker · eval-aware schema
create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text, priority text, source text,
  notion_id text unique,
  updated_at timestamptz default now()
);

create table rubrics (
  id uuid primary key default gen_random_uuid(),
  name text not null, version int not null,
  criteria_json jsonb not null,
  active boolean default false,
  created_at timestamptz default now()
);

create table eval_cases (
  id uuid primary key default gen_random_uuid(),
  case_ref text, input text,
  expected_verdict text,        -- 'accept' | 'reject'  (your label)
  is_anchor boolean default false,
  source text, created_at timestamptz default now()
);

create table agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent_name text,
  input_ref uuid references eval_cases(id),
  rubric_version int, model_used text,
  verdict text, score numeric,
  per_criterion_json jsonb, evidence_json jsonb,
  tokens_in int, tokens_out int, cost_usd numeric,
  stale boolean default false,   -- selective erasure flag
  created_at timestamptz default now()
);

create table epoch_transitions (
  id uuid primary key default gen_random_uuid(),
  rubric_name text,
  from_version int, to_version int,
  anchor_kappa_from numeric, anchor_kappa_to numeric,
  promoted boolean, notes text,
  created_at timestamptz default now()
);`;

const ANTIPATTERNS = [
  { id: "a1", t: "獎勵駭客 / Goodhart", s: "分數上升，實際品質沒動。", d: "留幾條你從不拿來優化的錨點；若「保留錨點 κ」與「訓練錨點 κ」開始分歧，你在鑽指標的漏洞。" },
  { id: "a2", t: "Judge 過度接受", s: "同家族 judge 對 AI 產出蓋橡皮圖章。", d: "定期塞一份你知道很爛的輸出進去；如果它照樣 accept，judge 太鬆。這正是 RQGM 對抗性重標要修的東西 —— 手動做即可。" },
  { id: "a3", t: "錨點漂移", s: "為了讓 v2 好看，偷偷改錨點標註。", d: "錨點只能 append，帶時間戳；要改標註必須留下一行說明。" },
  { id: "a4", t: "過擬合小評估集", s: "20 條背起來了，真實輸入照樣失敗。", d: "每一次真實線上失敗都要變成新的評估案例；如果評估集永遠不長大，你沒在學東西。" },
  { id: "a5", t: "順序／長度偏誤失控", s: "換個順序，判決就翻盤。", d: "兩種順序都跑；若判決不一致 > 10%，那是偏誤，不是判斷力。" },
  { id: "a6", t: "條目太模糊", s: "「這份報告好不好？」得到的分數不穩定。", d: "同一輸入跑兩次若逐條結果不同，代表該條目定義不足，改用字而不是改標註。" },
];

const REALITY = {
  ok: [
    "非平穩效用 / 評估器與 Agent 共演化 —— 核心論點，屬實。",
    "Controlled Utility Evolution：紀元內凍結、邊界才換，且需通過錨點上的 ε-best-belief。",
    "CMP 公式與 ε-best-belief 公式 BB_ε(a) = I⁻¹_ε(1+S, 1+F)，論文中 ε = 0.05。",
    "UCB-Air 擴張門閥 N_t^α ≥ |T_t|，論文 α = 0.6。",
    "選擇性擦除：不擦除的對照組排名被「釘死」在 ρ ≥ 0.90（Figure 3）。",
    "攤銷轉換：指數間距檢查點（ρ=2）把成本從 O(B²) 降到 O(B)。",
    "四個錨點：Polyglot、APReS、IMO-GradingBench、CRAVE。",
    "Polyglot 69.9% → 71.7%；token 省 1.35×–1.72×；論文接受率 21.8% → 40.5%（1.78×–1.86×）；grader 準確率 +9%。",
  ],
  bad: [
    { t: "「13.0 倍成本削減」—— 論文中不存在，是虛構數字。", d: "全文沒有任何 13× 的說法。真實的最大倍數是 grader 搜尋成本約 3×。不要引用這個數字。" },
    { t: "「Nemotron 3 Ultra」—— 名稱錯誤。", d: "論文用的是 Nemotron 3 Super 120B，而且只出現在附錄消融實驗；論文明說 GPT-5.5 → Nemotron 的委派「從未被觀察到實際發生」。所以路由這條線是願景，不是已驗證的成果。" },
    { t: "「三層抽樣」—— 大致正確但標籤有誤。", d: "論文稱 Three-Level Sampling Hierarchy（node → role → task）。Least-Measured Cell（Algorithm 1, line 18）同時選 role 與 task，不是只選 role。" },
    { t: "整體性質：2026/6 的 preliminary preprint。", d: "單次執行、搜尋視野短。概念可靠，數字全部視為暫定。拿它當思考架構，不要當生產配方。" },
  ],
};

const MVR = {
  build: [
    "有版本的 rubric（就是你的驗收條件）",
    "20–30 條評估案例，其中 ~10 條人工驗證的錨點",
    "跨模型家族的 judge，含順序／長度／證據控制",
    "Cohen's κ 對錨點的校準",
    "成本／Token 記錄 + 便宜→強模型路由",
    "一次錨點閘門的紀元轉換 + 選擇性擦除 + 對抗性重標",
    "看得到全部的儀表板，與可重用的 eval-loop Skill",
  ],
  skip: [
    { t: "Agent 變體的樹搜尋 / archive", w: "工程量巨大，你的規模沒有回報。手動換 rubric 版本就好。" },
    { t: "CMP 上的 Thompson 抽樣", w: "需要大量自動生成的譜系。你只會有 1–2 個變體，不是一個 clade。理解概念即可。" },
    { t: "UCB-Air 擴張門閥 / O(N^α)", w: "只有當機器要決定「擴張還是評估」時才有意義。" },
    { t: "程式裡實作 ε-best-belief 反向 Beta 排序", w: "20–30 條案例用 pass rate + κ 就夠。留下「不要相信小樣本」的習慣。" },
    { t: "指數間距攤銷檢查點", w: "那是長時間自動化搜尋的效率技巧；你的跑批很短且手動。" },
    { t: "多角色共演化工作空間（Meta-Agent）", w: "保留 generator + judge 兩個 prompt 就好，不要 meta-agent。" },
    { t: "完整 TrainEval / ValEval 隔離", w: "簡化不省略：別拿回報分數的同一批案例去調 judge，錨點與迭代案例分開放。" },
  ],
};

const MAPPING = [
  ["非平穩效用 / 共演化", "有版本、你刻意升級的 rubric", "2 · 4"],
  ["Controlled Utility Evolution", "一次只有一個 active rubric，版本變更留紀錄", "2–4"],
  ["Ground-truth anchors", "~10 條你自己過去的 accept／reject 決策", "2"],
  ["ε-best-belief 升級閘門", "只有 v2 的錨點 κ ≥ v1 才升級", "4"],
  ["CMP + Thompson 抽樣", "跳過機制，保留「別過度相信單一變體」的直覺", "概念"],
  ["UCB-Air 擴張門閥", "跳過 —— 你手動換版本", "—"],
  ["選擇性擦除（ρ≥0.90 釘死）", "舊的非錨點 runs 標 stale = true", "4"],
  ["攤銷重評估 O(B²)→O(B)", "重評快取輸出，不重跑 Task Agent", "4"],
  ["多智能體工作空間", "兩個 prompt：generator + 跨家族 judge", "2–3"],
  ["對抗性重標", "把你曾誤接受的案例加成錨點 reject", "4"],
  ["Agent-as-a-Judge", "跨家族 LLM judge + 成本路由", "2–3"],
  ["LLM judge 偏誤控制", "順序交換、長度正規化、跨家族、κ 校準", "2–3"],
  ["TrainEval vs ValEval 隔離", "錨點與迭代案例分開", "2 · 6"],
];

/* ─────────────────────────  storage  ───────────────────────── */

const KEY = "rqgm:console:v1";
const EMPTY = { done: {}, cases: [], epochs: [], ledger: [] };

/* ─────────────────────────  small ui atoms  ───────────────────────── */

function Copy({ text, label = "複製" }) {
  const [hit, setHit] = useState(false);
  return (
    <button
      className="copy"
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); } catch (e) { /* noop */ }
        setHit(true); setTimeout(() => setHit(false), 1400);
      }}
    >{hit ? "已複製" : label}</button>
  );
}

function Check({ on, onClick, children }) {
  return (
    <button className={"chk" + (on ? " on" : "")} onClick={onClick} aria-pressed={on}>
      <span className="box" aria-hidden="true">{on ? "✓" : ""}</span>
      <span className="chk-t">{children}</span>
    </button>
  );
}

/* ─────────────────────────  signature: co-evolution track  ───────────────────────── */

function Track({ done, onJump }) {
  const stats = EPOCHS.map((e) => {
    const ids = [...e.lessons.map((l) => l.id), ...e.gates.map((g) => g.id)];
    const n = ids.filter((i) => done[i]).length;
    return { pct: Math.round((n / ids.length) * 100) };
  });
  return (
    <div className="track-wrap">
      <div className="track-scroll">
        <div className="track">
          <div className="lane-key">
            <span className="lk verd">BUILD</span>
            <span className="lk queen">JUDGE</span>
          </div>
          {EPOCHS.map((e, i) => (
            <button
              key={e.n}
              className="col"
              onClick={() => onJump(i)}
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="col-head">
                <span className="ep">EPOCH {e.n}</span>
                <span className="pct">{stats[i].pct}%</span>
              </div>
              <div className="cell build">
                <div className="fill verd-fill" style={{ width: `${stats[i].pct}%` }} />
                <span>{e.build}</span>
              </div>
              <div className="cell judge">
                <div className="fill queen-fill" style={{ width: `${stats[i].pct}%` }} />
                <span>{e.judge}</span>
              </div>
              <div className="col-foot">{e.week} · {e.hours}</div>
            </button>
          ))}
        </div>
      </div>
      <p className="track-cap">
        兩條軌道必須一起跑。上軌領先太多 → 你在造沒人驗證的東西；下軌領先太多 → 你在校準沒人用的尺。
      </p>
    </div>
  );
}

/* ─────────────────────────  views  ───────────────────────── */

function ConsoleView({ st, go }) {
  const anchors = st.cases.filter((c) => c.anchor && c.judge);
  const k = useMemo(() => {
    let a = 0, b = 0, c = 0, d = 0;
    anchors.forEach((x) => {
      if (x.mine === "accept" && x.judge === "accept") a++;
      else if (x.mine === "accept" && x.judge === "reject") b++;
      else if (x.mine === "reject" && x.judge === "accept") c++;
      else d++;
    });
    return cohenKappa(a, b, c, d);
  }, [anchors]);
  const band = kappaBand(k);
  const spend = st.ledger.reduce((s, x) => s + (Number(x.usd) || 0), 0);

  const allIds = EPOCHS.flatMap((e) => [...e.lessons.map((l) => l.id), ...e.gates.map((g) => g.id)]);
  const doneN = allIds.filter((i) => st.done[i]).length;

  const nextItem = (() => {
    for (const e of EPOCHS) {
      for (const l of e.lessons) if (!st.done[l.id]) return { e, t: l.t, kind: "課程" };
      for (const g of e.gates) if (!st.done[g.id]) return { e, t: g.t, kind: "關卡" };
    }
    return null;
  })();

  return (
    <div className="stack">
      <header className="hero">
        <p className="eyebrow">Red Queen Gödel Machine · 共演化控制台</p>
        <h1>停在原地，<br />就是落後。</h1>
        <p className="lede">
          你的評估器和你的 Agent 一樣會失準、會過時、會偏袒。這台儀表的工作只有一件：
          逼你把「什麼叫做好」寫成有版本、有錨點、可以被推翻的東西。
        </p>
      </header>

      <Track done={st.done} onJump={(i) => go("plan", i)} />

      <div className="grid-3">
        <div className="panel">
          <p className="lbl">整體進度</p>
          <p className="big">{doneN}<span className="of">/{allIds.length}</span></p>
          <div className="bar"><div className="bar-fill" style={{ width: `${(doneN / allIds.length) * 100}%` }} /></div>
          <p className="sub">課程 + 關卡</p>
        </div>

        <div className={"panel gate-" + band.tone}>
          <p className="lbl">Judge 信任度 · 錨點 κ</p>
          <p className="big">{k === null ? "—" : k.toFixed(2)}</p>
          <p className={"badge " + band.tone}>{band.label}</p>
          <p className="sub">Week 2 硬性關卡：κ ≥ 0.60（{anchors.length} 條已判錨點）</p>
        </div>

        <div className="panel">
          <p className="lbl">評估花費</p>
          <p className="big">${spend.toFixed(2)}</p>
          <p className="sub">{st.ledger.length} 筆紀錄 · {st.epochs.length} 次紀元轉換</p>
        </div>
      </div>

      {nextItem && (
        <div className="panel next">
          <p className="lbl">下一步</p>
          <p className="next-t"><span className="tag">EPOCH {nextItem.e.n} · {nextItem.kind}</span> {nextItem.t}</p>
          <button className="btn" onClick={() => go("plan", Number(nextItem.e.n) - 1)}>前往該紀元</button>
        </div>
      )}

      <div className="panel">
        <p className="lbl">先讀這個 · 來源材料的真偽</p>
        <p className="sub" style={{ marginBottom: 14 }}>
          RQGM 是真實論文（arXiv 2606.26294，2026/6/24，Cambridge MLSys + NVIDIA）。但你手上的中文摘要有夾帶。
        </p>
        <div className="two">
          <div>
            <p className="mini good">已驗證屬實</p>
            <ul className="ul">{REALITY.ok.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </div>
          <div>
            <p className="mini bad">請謹慎 / 有誤</p>
            <ul className="ul">
              {REALITY.bad.map((x, i) => <li key={i}><strong>{x.t}</strong><br /><span className="dim">{x.d}</span></li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanView({ st, set, focus }) {
  const [open, setOpen] = useState(focus ?? 0);
  useEffect(() => { if (focus != null) setOpen(focus); }, [focus]);
  const toggle = (id) => set((s) => ({ ...s, done: { ...s.done, [id]: !s.done[id] } }));

  return (
    <div className="stack">
      <header className="view-head">
        <p className="eyebrow">四個紀元 · 約 40–50 小時</p>
        <h2>學習計畫</h2>
        <p className="lede">每個紀元內 rubric 凍結，邊界才升級 —— 這既是 RQGM 的機制，也是你這四週的節奏。不通過關卡不要往下走。</p>
      </header>

      {EPOCHS.map((e, i) => {
        const isOpen = open === i;
        const ids = [...e.lessons.map((l) => l.id), ...e.gates.map((g) => g.id)];
        const n = ids.filter((x) => st.done[x]).length;
        return (
          <section key={e.n} className={"epoch" + (isOpen ? " open" : "")}>
            <button className="epoch-head" onClick={() => setOpen(isOpen ? -1 : i)}>
              <span className="ep-n">{e.n}</span>
              <span className="ep-body">
                <span className="ep-title">{e.title}</span>
                <span className="ep-meta">{e.week} · {e.hours} · {n}/{ids.length}</span>
              </span>
              <span className="ep-arrow">{isOpen ? "−" : "+"}</span>
            </button>

            {isOpen && (
              <div className="epoch-body">
                <p className="obj">{e.objective}</p>

                <div className="lanes">
                  <div className="lane-card verd-card">
                    <p className="mini">BUILD 產出</p>
                    <p>{e.build}</p>
                  </div>
                  <div className="lane-card queen-card">
                    <p className="mini">JUDGE 產出</p>
                    <p>{e.judge}</p>
                  </div>
                </div>

                <p className="lbl">課程</p>
                {e.lessons.map((l) => (
                  <Check key={l.id} on={!!st.done[l.id]} onClick={() => toggle(l.id)}>
                    {l.t} <span className="hrs">{l.h}h</span>
                  </Check>
                ))}

                <p className="lbl">通過關卡</p>
                {e.gates.map((g) => (
                  <Check key={g.id} on={!!st.done[g.id]} onClick={() => toggle(g.id)}>{g.t}</Check>
                ))}

                <p className="lbl">閱讀</p>
                <ul className="reads">
                  {e.reading.map((r, j) => (
                    <li key={j}>
                      <span className={"pri p" + r.p[1]}>{r.p}</span>
                      <a href={r.u} target="_blank" rel="noreferrer">{r.t}</a>
                      <span className="mins">{r.m}m</span>
                    </li>
                  ))}
                </ul>

                {PROMPTS.filter((p) => p.epoch === e.n).map((p) => (
                  <div key={p.id} className="prompt-inline">
                    <div className="prompt-head">
                      <span>{p.name}</span>
                      <Copy text={p.body} />
                    </div>
                    <p className="sub">{p.note}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function CmpLab() {
  const [self, setSelf] = useState({ s: 3, f: 2 });
  const [kids, setKids] = useState([{ s: 8, f: 2 }, { s: 9, f: 1 }]);
  const S = self.s + kids.reduce((a, k) => a + Number(k.s || 0), 0);
  const F = self.f + kids.reduce((a, k) => a + Number(k.f || 0), 0);
  const selfRate = self.s + self.f ? self.s / (self.s + self.f) : 0;
  const cmp = S + F ? S / (S + F) : 0;
  const gap = cmp - selfRate;

  return (
    <div className="panel instr">
      <p className="lbl">儀器 01 · Clade Metaproductivity</p>
      <p className="sub">不要用一個版本自己的分數判斷它，要看它「整個後代家族」的累積成功率。</p>

      <div className="row" style={{ marginTop: 16 }}>
        <span className="rl">自身</span>
        <input type="number" min="0" value={self.s} onChange={(e) => setSelf({ ...self, s: +e.target.value })} />
        <span className="sep">成功 /</span>
        <input type="number" min="0" value={self.f} onChange={(e) => setSelf({ ...self, f: +e.target.value })} />
        <span className="sep">失敗</span>
      </div>
      {kids.map((k, i) => (
        <div className="row" key={i}>
          <span className="rl">後代 {i + 1}</span>
          <input type="number" min="0" value={k.s} onChange={(e) => { const c = [...kids]; c[i] = { ...c[i], s: +e.target.value }; setKids(c); }} />
          <span className="sep">成功 /</span>
          <input type="number" min="0" value={k.f} onChange={(e) => { const c = [...kids]; c[i] = { ...c[i], f: +e.target.value }; setKids(c); }} />
          <span className="sep">失敗</span>
          <button className="x" onClick={() => setKids(kids.filter((_, j) => j !== i))}>×</button>
        </div>
      ))}
      <div className="row">
        <button className="btn ghost" onClick={() => setKids([...kids, { s: 0, f: 0 }])}>+ 後代</button>
        <button className="btn ghost" onClick={() => { setSelf({ s: 4, f: 1 }); setKids([{ s: 1, f: 9 }, { s: 2, f: 8 }]); }}>載入 Agent B（看起來好，其實很差）</button>
        <button className="btn ghost" onClick={() => { setSelf({ s: 3, f: 2 }); setKids([{ s: 8, f: 2 }, { s: 9, f: 1 }]); }}>載入 Agent A</button>
      </div>

      <div className="readout">
        <div><p className="mini">自身通過率</p><p className="num">{(selfRate * 100).toFixed(0)}%</p></div>
        <div><p className="mini">CMP（整支系）</p><p className={"num " + (gap >= 0 ? "verd-t" : "queen-t")}>{(cmp * 100).toFixed(0)}%</p></div>
        <div><p className="mini">誤判缺口</p><p className="num">{gap >= 0 ? "+" : ""}{(gap * 100).toFixed(0)}pt</p></div>
      </div>
      <p className="note">
        {Math.abs(gap) > 0.1
          ? `這就是 Metaproductivity–Performance Mismatch：單看自身分數會${gap > 0 ? "低估" : "高估"}這個版本 ${Math.abs(gap * 100).toFixed(0)} 個百分點。`
          : "支系表現與自身表現接近，此時單看自身分數不會誤導你。"}
      </p>
    </div>
  );
}

function BeliefLab() {
  const [s, setS] = useState(1);
  const [f, setF] = useState(0);
  const [eps, setEps] = useState(0.05);
  const raw = s + f ? s / (s + f) : 0;
  const bb = betaQuantile(eps, 1 + s, 1 + f);
  const path = useMemo(() => {
    const pts = [];
    let max = 0;
    for (let i = 0; i <= 120; i++) {
      const x = i / 120;
      const y = betaPdf(Math.min(Math.max(x, 1e-6), 1 - 1e-6), 1 + s, 1 + f);
      pts.push([x, y]); if (y > max && Number.isFinite(y)) max = y;
    }
    if (!max) return "";
    return pts.map(([x, y], i) => `${i ? "L" : "M"}${(x * 300).toFixed(1)},${(70 - Math.min(y / max, 1) * 62).toFixed(1)}`).join(" ");
  }, [s, f]);

  return (
    <div className="panel instr">
      <p className="lbl">儀器 02 · ε-Best-Belief（Beta 後驗保守估計）</p>
      <p className="sub">小樣本的通過率會騙人。1 勝 0 敗的「100%」不值錢；這台儀器告訴你「有把握的下限」。</p>

      <div className="slider" style={{ marginTop: 18 }}>
        <label>成功 S <b>{s}</b></label>
        <input type="range" min="0" max="60" value={s} onChange={(e) => setS(+e.target.value)} />
      </div>
      <div className="slider">
        <label>失敗 F <b>{f}</b></label>
        <input type="range" min="0" max="60" value={f} onChange={(e) => setF(+e.target.value)} />
      </div>
      <div className="slider">
        <label>ε（保守程度） <b>{eps.toFixed(2)}</b></label>
        <input type="range" min="0.01" max="0.5" step="0.01" value={eps} onChange={(e) => setEps(+e.target.value)} />
      </div>

      <svg viewBox="0 0 300 76" className="curve" preserveAspectRatio="none">
        <path d={path} className="curve-line" />
        <line x1={bb * 300} y1="4" x2={bb * 300} y2="72" className="curve-mark" />
        <line x1={raw * 300} y1="4" x2={raw * 300} y2="72" className="curve-raw" />
      </svg>
      <div className="curve-key">
        <span><i className="k-raw" />原始通過率</span>
        <span><i className="k-bb" />保守估計 BB_ε</span>
      </div>

      <div className="readout">
        <div><p className="mini">原始通過率</p><p className="num">{(raw * 100).toFixed(1)}%</p></div>
        <div><p className="mini">BB_ε 下限</p><p className="num queen-t">{(bb * 100).toFixed(1)}%</p></div>
        <div><p className="mini">被扣掉的樂觀</p><p className="num">−{((raw - bb) * 100).toFixed(1)}pt</p></div>
      </div>
      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn ghost" onClick={() => { setS(1); setF(0); }}>載入 X：1 勝 0 敗</button>
        <button className="btn ghost" onClick={() => { setS(18); setF(2); }}>載入 Y：18 勝 2 敗</button>
      </div>
      <p className="note">X 的原始分數 100% 高於 Y 的 90%，但保守估計把 X 打到 ~22%、Y 保持在 ~74%。你要學的不是這個公式，是這個習慣：<b>永遠不要用小樣本的原始通過率排名。</b></p>
    </div>
  );
}

function KappaLab() {
  const [m, setM] = useState({ a: 7, b: 1, c: 2, d: 6 });
  const k = cohenKappa(m.a, m.b, m.c, m.d);
  const band = kappaBand(k);
  const n = m.a + m.b + m.c + m.d;
  const po = n ? (m.a + m.d) / n : 0;

  return (
    <div className="panel instr">
      <p className="lbl">儀器 03 · Cohen's κ（Judge 對錨點的一致性）</p>
      <p className="sub">單純的「同意百分比」會被運氣灌水。κ 扣掉隨機猜中的部分。Week 2 的硬性關卡是 κ ≥ 0.60。</p>

      <div className="matrix" style={{ marginTop: 18 }}>
        <div className="mh" />
        <div className="mh">Judge 接受</div>
        <div className="mh">Judge 拒絕</div>
        <div className="mh side">你接受</div>
        <input type="number" min="0" value={m.a} onChange={(e) => setM({ ...m, a: +e.target.value })} />
        <input type="number" min="0" value={m.b} onChange={(e) => setM({ ...m, b: +e.target.value })} />
        <div className="mh side">你拒絕</div>
        <input type="number" min="0" value={m.c} onChange={(e) => setM({ ...m, c: +e.target.value })} />
        <input type="number" min="0" value={m.d} onChange={(e) => setM({ ...m, d: +e.target.value })} />
      </div>

      <div className="readout">
        <div><p className="mini">表面同意率</p><p className="num">{(po * 100).toFixed(0)}%</p></div>
        <div><p className="mini">Cohen's κ</p><p className={"num " + (band.tone === "good" ? "verd-t" : band.tone === "bad" ? "queen-t" : "amber-t")}>{k === null ? "—" : k.toFixed(2)}</p></div>
        <div><p className="mini">判定</p><p className={"badge " + band.tone} style={{ marginTop: 4 }}>{band.label}</p></div>
      </div>
      <p className="note">
        {k !== null && k >= 0.6
          ? "通過 Week 2 關卡。Judge 值得信任，可以往儀表板走。"
          : "未達 0.60。停下來修 rubric 的用字（讓條目更二元、更可驗證），不要去改你的標註 —— 那是錨點漂移。"}
      </p>
    </div>
  );
}

function LabView() {
  return (
    <div className="stack">
      <header className="view-head">
        <p className="eyebrow">三台儀器</p>
        <h2>概念實驗室</h2>
        <p className="lede">你不需要手刻這些演算法，但你需要對它們有肌肉記憶。動手轉旋鈕，直到直覺變成本能。</p>
      </header>
      <CmpLab />
      <BeliefLab />
      <KappaLab />
    </div>
  );
}

function CasesView({ st, set }) {
  const [ref, setRef] = useState("");
  const [anchor, setAnchor] = useState(true);
  const [mine, setMine] = useState("accept");

  const add = () => {
    if (!ref.trim()) return;
    set((s) => ({ ...s, cases: [...s.cases, { id: Date.now() + "", ref: ref.trim(), anchor, mine, judge: null }] }));
    setRef("");
  };
  const upd = (id, patch) => set((s) => ({ ...s, cases: s.cases.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  const del = (id) => set((s) => ({ ...s, cases: s.cases.filter((c) => c.id !== id) }));

  const anchors = st.cases.filter((c) => c.anchor);
  const judged = anchors.filter((c) => c.judge);
  let a = 0, b = 0, c2 = 0, d = 0;
  judged.forEach((x) => {
    if (x.mine === "accept" && x.judge === "accept") a++;
    else if (x.mine === "accept" && x.judge === "reject") b++;
    else if (x.mine === "reject" && x.judge === "accept") c2++;
    else d++;
  });
  const k = cohenKappa(a, b, c2, d);
  const band = kappaBand(k);

  const [tr, setTr] = useState({ from: 1, to: 2, k1: "", k2: "" });
  const logTransition = () => {
    const k1 = parseFloat(tr.k1), k2 = parseFloat(tr.k2);
    if (Number.isNaN(k1) || Number.isNaN(k2)) return;
    set((s) => ({
      ...s,
      epochs: [...s.epochs, {
        id: Date.now() + "", from: tr.from, to: tr.to, k1, k2,
        promoted: k2 >= k1, at: new Date().toISOString().slice(0, 10),
      }],
    }));
    setTr({ from: tr.to, to: tr.to + 1, k1: "", k2: "" });
  };

  const [led, setLed] = useState({ label: "", usd: "" });

  return (
    <div className="stack">
      <header className="view-head">
        <p className="eyebrow">錨點集 · 紀元紀錄 · 花費</p>
        <h2>評估台帳</h2>
        <p className="lede">錨點只能新增，不能為了讓新 rubric 好看而回頭修改。這條規則是整套機制唯一的誠實保證。</p>
      </header>

      <div className="panel">
        <p className="lbl">新增案例</p>
        <div className="row wrap">
          <input className="grow" placeholder="案例代號，例如 TBD-MV-04 或 report-0912" value={ref} onChange={(e) => setRef(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
          <select value={mine} onChange={(e) => setMine(e.target.value)}>
            <option value="accept">我的判定：接受</option>
            <option value="reject">我的判定：拒絕</option>
          </select>
          <button className={"toggle" + (anchor ? " on" : "")} onClick={() => setAnchor(!anchor)}>{anchor ? "錨點" : "一般"}</button>
          <button className="btn" onClick={add}>加入</button>
        </div>
        <p className="sub">目標：20–30 條（約 15 核心 / 10 邊界），其中你最有把握的 ~10 條設為錨點。</p>
      </div>

      <div className={"panel gate-" + band.tone}>
        <p className="lbl">錨點校準</p>
        <div className="readout" style={{ marginTop: 4, paddingTop: 0, borderTop: 0 }}>
          <div><p className="mini">錨點數</p><p className="num">{anchors.length}</p></div>
          <div><p className="mini">已有 judge 判決</p><p className="num">{judged.length}</p></div>
          <div><p className="mini">Cohen's κ</p><p className={"num " + (band.tone === "good" ? "verd-t" : band.tone === "bad" ? "queen-t" : "amber-t")}>{k === null ? "—" : k.toFixed(2)}</p></div>
        </div>
        <p className={"badge " + band.tone} style={{ marginTop: 14 }}>{band.label}</p>
      </div>

      <div className="panel">
        <p className="lbl">案例（{st.cases.length}）</p>
        {st.cases.length === 0 && <p className="empty">還沒有案例。從你過去真實的 accept／reject 決策開始 —— YCM 的 TBD 決議、YCO 原型 QA 判定都可以。</p>}
        <div className="cases">
          {st.cases.map((c) => (
            <div key={c.id} className={"case" + (c.anchor ? " anchor" : "")}>
              <button className={"pin" + (c.anchor ? " on" : "")} onClick={() => upd(c.id, { anchor: !c.anchor })} title="切換錨點">{c.anchor ? "⚑" : "⚐"}</button>
              <span className="cref">{c.ref}</span>
              <span className="verdict">我 · {c.mine === "accept" ? "接受" : "拒絕"}</span>
              <div className="jbtns">
                <button className={"jb" + (c.judge === "accept" ? " on acc" : "")} onClick={() => upd(c.id, { judge: c.judge === "accept" ? null : "accept" })}>J 接受</button>
                <button className={"jb" + (c.judge === "reject" ? " on rej" : "")} onClick={() => upd(c.id, { judge: c.judge === "reject" ? null : "reject" })}>J 拒絕</button>
              </div>
              {c.judge && c.judge !== c.mine && <span className="mismatch">分歧</span>}
              <button className="x" onClick={() => del(c.id)}>×</button>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <p className="lbl">紀元轉換紀錄</p>
        <div className="row wrap">
          <span className="rl">v</span>
          <input type="number" style={{ width: 56 }} value={tr.from} onChange={(e) => setTr({ ...tr, from: +e.target.value })} />
          <span className="sep">→ v</span>
          <input type="number" style={{ width: 56 }} value={tr.to} onChange={(e) => setTr({ ...tr, to: +e.target.value })} />
          <input style={{ width: 110 }} placeholder="舊版 κ" value={tr.k1} onChange={(e) => setTr({ ...tr, k1: e.target.value })} />
          <input style={{ width: 110 }} placeholder="新版 κ" value={tr.k2} onChange={(e) => setTr({ ...tr, k2: e.target.value })} />
          <button className="btn" onClick={logTransition}>記錄</button>
        </div>
        <p className="sub">升級規則：只有新版在<b>錨點</b>上的 κ ≥ 舊版才准升級。升級後把舊版的非錨點 runs 標成 stale。</p>
        {st.epochs.length > 0 && (
          <div className="epochs">
            {st.epochs.map((e) => (
              <div key={e.id} className={"erow " + (e.promoted ? "ok" : "no")}>
                <span className="mono">v{e.from} → v{e.to}</span>
                <span className="mono dim">κ {e.k1.toFixed(2)} → {e.k2.toFixed(2)}</span>
                <span className="epill">{e.promoted ? "已升級" : "已駁回"}</span>
                <span className="dim mono">{e.at}</span>
                <button className="x" onClick={() => set((s) => ({ ...s, epochs: s.epochs.filter((x) => x.id !== e.id) }))}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <p className="lbl">花費台帳</p>
        <div className="row wrap">
          <input className="grow" placeholder="說明，例如 eval run #3（便宜模型批次）" value={led.label} onChange={(e) => setLed({ ...led, label: e.target.value })} />
          <input style={{ width: 110 }} placeholder="USD" value={led.usd} onChange={(e) => setLed({ ...led, usd: e.target.value })} />
          <button className="btn" onClick={() => {
            if (!led.label.trim() || !led.usd) return;
            set((s) => ({ ...s, ledger: [...s.ledger, { id: Date.now() + "", label: led.label.trim(), usd: parseFloat(led.usd) || 0, at: new Date().toISOString().slice(0, 10) }] }));
            setLed({ label: "", usd: "" });
          }}>加入</button>
        </div>
        {st.ledger.map((l) => (
          <div key={l.id} className="lrow">
            <span>{l.label}</span>
            <span className="mono">${Number(l.usd).toFixed(2)}</span>
            <span className="dim mono">{l.at}</span>
            <button className="x" onClick={() => set((s) => ({ ...s, ledger: s.ledger.filter((x) => x.id !== l.id) }))}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function KitView({ st, set }) {
  const toggle = (id) => set((s) => ({ ...s, done: { ...s.done, [id]: !s.done[id] } }));
  return (
    <div className="stack">
      <header className="view-head">
        <p className="eyebrow">可貼可用的東西</p>
        <h2>工具包</h2>
        <p className="lede">五段 Claude Code 指令、一份 SKILL.md、一份 schema，以及在你自欺之前先攔住你的稽核清單。</p>
      </header>

      {PROMPTS.map((p) => (
        <details key={p.id} className="panel det">
          <summary>
            <span className="tag">EPOCH {p.epoch}</span>
            <span className="det-t">{p.name}</span>
          </summary>
          <p className="sub">{p.note}</p>
          <div className="codewrap">
            <div className="code-bar"><span className="mono dim">prompt</span><Copy text={p.body} /></div>
            <pre>{p.body}</pre>
          </div>
        </details>
      ))}

      <details className="panel det">
        <summary><span className="tag">W4</span><span className="det-t">eval-loop / SKILL.md</span></summary>
        <div className="codewrap">
          <div className="code-bar"><span className="mono dim">.claude/skills/eval-loop/SKILL.md</span><Copy text={SKILL_MD} /></div>
          <pre>{SKILL_MD}</pre>
        </div>
      </details>

      <details className="panel det">
        <summary><span className="tag">W1</span><span className="det-t">Supabase schema</span></summary>
        <div className="codewrap">
          <div className="code-bar"><span className="mono dim">supabase/schema.sql</span><Copy text={SCHEMA_SQL} /></div>
          <pre>{SCHEMA_SQL}</pre>
        </div>
      </details>

      <div className="panel">
        <p className="lbl">最小可行 RQGM</p>
        <div className="two">
          <div>
            <p className="mini good">要做（40 小時內做得完的 20%）</p>
            <ul className="ul">{MVR.build.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </div>
          <div>
            <p className="mini bad">刻意跳過</p>
            <ul className="ul">{MVR.skip.map((x, i) => <li key={i}><strong>{x.t}</strong><br /><span className="dim">{x.w}</span></li>)}</ul>
          </div>
        </div>
      </div>

      <div className="panel">
        <p className="lbl">反模式稽核 · 每次跑完評估都掃一遍</p>
        {ANTIPATTERNS.map((x) => (
          <div key={x.id} className="anti">
            <Check on={!!st.done[x.id]} onClick={() => toggle(x.id)}>
              <b>{x.t}</b> — {x.s}
            </Check>
            <p className="detect">偵測方式：{x.d}</p>
          </div>
        ))}
      </div>

      <div className="panel">
        <p className="lbl">概念對照表</p>
        <div className="tbl">
          {MAPPING.map((r, i) => (
            <div className="trow" key={i}>
              <div>{r[0]}</div><div className="dim">{r[1]}</div><div className="mono">{r[2]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────  shell  ───────────────────────── */

const TABS = [
  { id: "console", t: "控制台" },
  { id: "plan", t: "計畫" },
  { id: "lab", t: "實驗室" },
  { id: "cases", t: "台帳" },
  { id: "kit", t: "工具包" },
];

export default function App() {
  const [tab, setTab] = useState("console");
  const [focus, setFocus] = useState(null);
  const [st, setSt] = useState(EMPTY);
  const [ready, setReady] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(KEY);
        if (r && r.value) setSt({ ...EMPTY, ...JSON.parse(r.value) });
      } catch (e) { /* first run — no saved ledger yet */ }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => {
      try { window.storage.set(KEY, JSON.stringify(st)).catch(() => {}); } catch (e) { /* noop */ }
    }, 400);
    return () => clearTimeout(t);
  }, [st, ready]);

  const go = (t, f) => {
    setTab(t);
    setFocus(f ?? null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app">
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,700&family=Instrument+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

.app{
  --ink:#101319; --panel:#171B23; --panel2:#1E232D; --line:#2A313D; --line2:#39424F;
  --bone:#E9E5DB; --mute:#8A93A3; --dim:#646E7D;
  --queen:#D2405A; --queen-d:#4A1F29;
  --verd:#4FA394; --verd-d:#1B3733;
  --amber:#D8A24C;
  background:var(--ink); color:var(--bone);
  font-family:'Instrument Sans',system-ui,sans-serif;
  min-height:100vh; -webkit-font-smoothing:antialiased;
}
.app *{box-sizing:border-box}
.app button,.app input,.app select{font-family:inherit}
.app a{color:var(--bone); text-decoration:none; border-bottom:1px solid var(--line2)}
.app a:hover{border-color:var(--queen)}
.app :focus-visible{outline:2px solid var(--verd); outline-offset:2px}

.app .mono,.app pre,.app .num,.app .ep,.app .pct{font-family:'IBM Plex Mono',monospace}
.app .dim{color:var(--dim)}
.app .verd-t{color:var(--verd)} .app .queen-t{color:var(--queen)} .app .amber-t{color:var(--amber)}

.app .shell{max-width:1080px;margin:0 auto;padding:0 20px 96px}
.app .nav{position:sticky;top:0;z-index:30;background:rgba(16,19,25,.93);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.app .nav-in{max-width:1080px;margin:0 auto;padding:0 20px;display:flex;align-items:center;gap:22px;overflow-x:auto}
.app .brand{font-family:'Fraunces',serif;font-weight:500;font-size:15px;padding:16px 0;white-space:nowrap;color:var(--bone)}
.app .brand i{color:var(--queen);font-style:normal}
.app .nav button{background:none;border:0;color:var(--mute);padding:16px 0;font-size:13px;cursor:pointer;white-space:nowrap;border-bottom:2px solid transparent;margin-bottom:-1px;letter-spacing:.02em}
.app .nav button:hover{color:var(--bone)}
.app .nav button.on{color:var(--bone);border-bottom-color:var(--queen)}

.app .stack{display:flex;flex-direction:column;gap:20px;padding-top:34px}

.app .eyebrow{font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--queen);margin:0 0 14px}
.app .hero h1{font-family:'Fraunces',serif;font-weight:300;font-size:clamp(38px,7.5vw,66px);line-height:.98;letter-spacing:-.02em;margin:0 0 18px}
.app .lede{color:var(--mute);font-size:15px;line-height:1.65;max-width:56ch;margin:0}
.app .view-head h2{font-family:'Fraunces',serif;font-weight:300;font-size:clamp(28px,5vw,40px);margin:0 0 12px;letter-spacing:-.015em}

.app .track-wrap{margin:8px 0 6px}
.app .track-scroll{overflow-x:auto}
.app .track{display:grid;grid-template-columns:64px repeat(4,minmax(150px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);min-width:700px}
.app .lane-key{background:var(--ink);display:flex;flex-direction:column;justify-content:center;gap:30px;padding:44px 8px 26px}
.app .lk{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.12em}
.app .lk.verd{color:var(--verd)} .app .lk.queen{color:var(--queen)}
.app .col{background:var(--panel);border:0;text-align:left;padding:14px;cursor:pointer;display:flex;flex-direction:column;gap:8px;color:var(--bone);animation:rise .5s ease both}
.app .col:hover{background:var(--panel2)}
.app .col-head{display:flex;justify-content:space-between;align-items:baseline}
.app .ep{font-size:9.5px;letter-spacing:.14em;color:var(--dim)}
.app .pct{font-size:11px;color:var(--mute)}
.app .cell{position:relative;padding:9px 10px;font-size:11.5px;line-height:1.4;background:var(--ink);border:1px solid var(--line);min-height:54px;display:flex;align-items:center;overflow:hidden}
.app .cell span{position:relative;z-index:2}
.app .fill{position:absolute;top:0;bottom:0;left:0;z-index:1;transition:width .5s cubic-bezier(.2,.7,.3,1)}
.app .verd-fill{background:var(--verd-d)} .app .queen-fill{background:var(--queen-d)}
.app .cell.build{border-left:2px solid var(--verd)} .app .cell.judge{border-left:2px solid var(--queen)}
.app .col-foot{font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:var(--dim)}
.app .track-cap{color:var(--dim);font-size:12.5px;margin:12px 0 0;line-height:1.6}
@keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

.app .panel{background:var(--panel);border:1px solid var(--line);padding:20px}
.app .grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.app .lbl{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);margin:0 0 12px}
.app .big{font-family:'Fraunces',serif;font-size:44px;font-weight:300;line-height:1;margin:0 0 8px;letter-spacing:-.02em}
.app .of{font-size:18px;color:var(--dim)}
.app .sub{color:var(--mute);font-size:12.5px;line-height:1.6;margin:6px 0 0}
.app .bar{height:3px;background:var(--line);margin:10px 0 0}
.app .bar-fill{height:100%;background:var(--verd);transition:width .5s}
.app .badge{display:inline-block;font-family:'IBM Plex Mono',monospace;font-size:10.5px;padding:3px 8px;border:1px solid var(--line);margin:0}
.app .badge.good{color:var(--verd);border-color:var(--verd-d);background:var(--verd-d)}
.app .badge.warn{color:var(--amber);border-color:#3B3220;background:#2A2417}
.app .badge.bad{color:var(--queen);border-color:var(--queen-d);background:var(--queen-d)}
.app .badge.mute{color:var(--dim)}
.app .gate-good{border-left:2px solid var(--verd)}
.app .gate-warn{border-left:2px solid var(--amber)}
.app .gate-bad{border-left:2px solid var(--queen)}
.app .next-t{font-size:15px;line-height:1.7;margin:0 0 14px}
.app .tag{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.1em;color:var(--queen);border:1px solid var(--queen-d);padding:2px 6px;margin-right:8px;white-space:nowrap}
.app .two{display:grid;grid-template-columns:1fr 1fr;gap:26px}
.app .mini{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);margin:0 0 8px}
.app .mini.good{color:var(--verd)} .app .mini.bad{color:var(--queen)}
.app .ul{margin:0;padding-left:16px;color:var(--mute);font-size:12.5px;line-height:1.7}
.app .ul li{margin-bottom:8px}
.app .ul strong{color:var(--bone);font-weight:500}
.app .empty{color:var(--dim);font-size:13px;line-height:1.6;margin:0}

.app .epoch{background:var(--panel);border:1px solid var(--line)}
.app .epoch.open{border-color:var(--line2)}
.app .epoch-head{width:100%;background:none;border:0;display:flex;align-items:center;gap:16px;padding:18px 20px;cursor:pointer;color:var(--bone);text-align:left}
.app .epoch-head:hover{background:var(--panel2)}
.app .ep-n{font-family:'Fraunces',serif;font-size:26px;font-weight:300;color:var(--dim);min-width:34px}
.app .epoch.open .ep-n{color:var(--queen)}
.app .ep-body{flex:1;display:flex;flex-direction:column;gap:4px}
.app .ep-title{font-size:15.5px;font-weight:500}
.app .ep-meta{font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--dim)}
.app .ep-arrow{font-size:20px;color:var(--dim);font-weight:300}
.app .epoch-body{padding:0 20px 22px;border-top:1px solid var(--line)}
.app .obj{color:var(--mute);font-size:13.5px;line-height:1.75;margin:18px 0;max-width:62ch}
.app .lanes{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:22px}
.app .lane-card{padding:12px 14px;background:var(--ink);border:1px solid var(--line);font-size:12.5px;line-height:1.5}
.app .lane-card p:last-child{margin:0}
.app .verd-card{border-left:2px solid var(--verd)}
.app .queen-card{border-left:2px solid var(--queen)}
.app .epoch-body .lbl{margin-top:22px}

.app .chk{display:flex;gap:11px;align-items:flex-start;width:100%;background:none;border:0;border-bottom:1px solid var(--line);padding:9px 0;cursor:pointer;color:var(--mute);text-align:left;font-size:13px;line-height:1.55}
.app .chk:hover{color:var(--bone)}
.app .chk .box{width:15px;height:15px;border:1px solid var(--line2);flex-shrink:0;margin-top:2px;font-size:10px;display:flex;align-items:center;justify-content:center;color:var(--ink)}
.app .chk.on .box{background:var(--verd);border-color:var(--verd)}
.app .chk.on{color:var(--dim);text-decoration:line-through;text-decoration-color:var(--line2)}
.app .hrs{font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--dim);margin-left:6px}

.app .reads{list-style:none;margin:0;padding:0}
.app .reads li{display:flex;gap:10px;align-items:baseline;padding:8px 0;border-bottom:1px solid var(--line);font-size:13px}
.app .pri{font-family:'IBM Plex Mono',monospace;font-size:9.5px;padding:1px 5px;border:1px solid var(--line2);color:var(--dim)}
.app .pri.p1{color:var(--queen);border-color:var(--queen-d)}
.app .pri.p2{color:var(--mute)}
.app .reads a{flex:1;border-bottom-color:transparent}
.app .reads a:hover{border-bottom-color:var(--queen)}
.app .mins{font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--dim)}

.app .prompt-inline{margin-top:22px;background:var(--ink);border:1px solid var(--line);border-left:2px solid var(--verd);padding:14px}
.app .prompt-head{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:13.5px;font-weight:500}

.app .row{display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap}
.app .rl{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--dim);min-width:52px}
.app .sep{font-size:11.5px;color:var(--dim)}
.app input,.app select{background:var(--ink);border:1px solid var(--line2);color:var(--bone);padding:7px 9px;font-size:13px;width:66px}
.app input.grow{flex:1;min-width:150px;width:auto}
.app select{width:auto}
.app input[type=range]{width:100%;padding:0;border:0;background:transparent;accent-color:var(--queen)}
.app .slider{margin-bottom:14px}
.app .slider label{display:flex;justify-content:space-between;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--mute);margin-bottom:6px}
.app .slider b{color:var(--bone)}
.app .readout{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:18px;padding-top:16px;border-top:1px solid var(--line)}
.app .num{font-size:26px;font-weight:500;margin:0;letter-spacing:-.01em}
.app .note{color:var(--mute);font-size:12.5px;line-height:1.7;margin:14px 0 0;padding-top:14px;border-top:1px solid var(--line)}
.app .note b{color:var(--bone)}
.app .curve{width:100%;height:76px;margin:6px 0 2px;background:var(--ink);border:1px solid var(--line);display:block}
.app .curve-line{fill:none;stroke:var(--verd);stroke-width:1.4;vector-effect:non-scaling-stroke}
.app .curve-mark{stroke:var(--queen);stroke-width:1.4;vector-effect:non-scaling-stroke}
.app .curve-raw{stroke:var(--line2);stroke-width:1.2;stroke-dasharray:3 3;vector-effect:non-scaling-stroke}
.app .curve-key{display:flex;gap:16px;font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--dim);margin-bottom:6px}
.app .curve-key i{display:inline-block;width:14px;height:2px;margin-right:5px;vertical-align:middle}
.app .k-raw{background:var(--line2)} .app .k-bb{background:var(--queen)}
.app .matrix{display:grid;grid-template-columns:auto 1fr 1fr;gap:8px;align-items:center}
.app .mh{font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--dim);text-align:center}
.app .mh.side{text-align:left}
.app .matrix input{width:100%}

.app .btn{background:var(--bone);color:var(--ink);border:0;padding:8px 14px;font-size:12.5px;cursor:pointer;font-weight:500}
.app .btn:hover{background:#fff}
.app .btn.ghost{background:none;color:var(--mute);border:1px solid var(--line2)}
.app .btn.ghost:hover{color:var(--bone);border-color:var(--bone);background:none}
.app .copy{background:none;border:1px solid var(--line2);color:var(--mute);font-family:'IBM Plex Mono',monospace;font-size:10px;padding:4px 9px;cursor:pointer;letter-spacing:.06em}
.app .copy:hover{color:var(--bone);border-color:var(--bone)}
.app .x{background:none;border:0;color:var(--dim);cursor:pointer;font-size:16px;padding:0 4px;line-height:1;width:auto}
.app .x:hover{color:var(--queen)}
.app .toggle{background:none;border:1px solid var(--line2);color:var(--dim);padding:7px 11px;font-size:12px;cursor:pointer}
.app .toggle.on{color:var(--queen);border-color:var(--queen);background:var(--queen-d)}

.app .cases{display:flex;flex-direction:column}
.app .case{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line);font-size:12.5px;flex-wrap:wrap}
.app .case.anchor{border-left:2px solid var(--queen);padding-left:10px}
.app .pin{background:none;border:0;color:var(--dim);cursor:pointer;font-size:13px;padding:0;width:auto}
.app .pin.on{color:var(--queen)}
.app .cref{font-family:'IBM Plex Mono',monospace;flex:1;min-width:110px}
.app .verdict{font-family:'IBM Plex Mono',monospace;font-size:10px;padding:2px 6px;border:1px solid var(--line2);color:var(--mute)}
.app .jbtns{display:flex;gap:4px}
.app .jb{background:none;border:1px solid var(--line2);color:var(--dim);font-size:10px;padding:3px 7px;cursor:pointer;font-family:'IBM Plex Mono',monospace}
.app .jb.on.acc{color:var(--verd);border-color:var(--verd)}
.app .jb.on.rej{color:var(--queen);border-color:var(--queen)}
.app .mismatch{font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:var(--amber);border:1px solid #3B3220;padding:2px 5px}
.app .epochs{margin-top:14px}
.app .erow{display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line);font-size:12px;flex-wrap:wrap}
.app .erow.ok{border-left:2px solid var(--verd);padding-left:10px}
.app .erow.no{border-left:2px solid var(--queen);padding-left:10px}
.app .epill{font-family:'IBM Plex Mono',monospace;font-size:9.5px;padding:2px 6px;border:1px solid var(--line2);color:var(--mute)}
.app .erow.ok .epill{color:var(--verd);border-color:var(--verd-d)}
.app .lrow{display:flex;gap:12px;align-items:center;padding:9px 0;border-bottom:1px solid var(--line);font-size:12.5px}
.app .lrow span:first-child{flex:1}

.app .det summary{cursor:pointer;display:flex;align-items:center;font-size:14px;font-weight:500;list-style:none}
.app .det summary::-webkit-details-marker{display:none}
.app .det summary::before{content:"+";color:var(--dim);margin-right:10px;font-weight:300;font-size:17px}
.app .det[open] summary::before{content:"−";color:var(--queen)}
.app .det-t{flex:1}
.app .codewrap{margin-top:14px;border:1px solid var(--line);background:var(--ink)}
.app .code-bar{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:1px solid var(--line);font-size:10px}
.app .det pre{margin:0;padding:14px;font-size:11.5px;line-height:1.65;overflow:auto;color:var(--mute);white-space:pre-wrap;word-break:break-word;max-height:420px}
.app .anti{padding-bottom:12px}
.app .detect{color:var(--dim);font-size:12px;line-height:1.6;margin:6px 0 0 26px}
.app .trow{display:grid;grid-template-columns:1fr 1.2fr 60px;gap:12px;padding:10px 0;border-bottom:1px solid var(--line);font-size:12.5px;line-height:1.5}
.app .trow .mono{font-size:11px;color:var(--dim)}

@media(max-width:820px){
  .app .grid-3{grid-template-columns:1fr}
  .app .two{grid-template-columns:1fr;gap:22px}
  .app .lanes{grid-template-columns:1fr}
  .app .readout{grid-template-columns:1fr;gap:12px}
  .app .trow{grid-template-columns:1fr;gap:3px}
  .app .shell{padding:0 16px 90px}
  .app .nav-in{padding:0 16px;gap:16px}
}
@media(prefers-reduced-motion:reduce){
  .app *{animation:none !important;transition:none !important}
}
      `}</style>

      <nav className="nav">
        <div className="nav-in">
          <span className="brand">RQGM <i>·</i> 共演化控制台</span>
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? "on" : ""} onClick={() => go(t.id)}>{t.t}</button>
          ))}
        </div>
      </nav>

      <div className="shell">
        {!ready ? (
          <div className="stack"><p className="sub" style={{ paddingTop: 40 }}>載入台帳中…</p></div>
        ) : (
          <>
            {tab === "console" && <ConsoleView st={st} go={go} />}
            {tab === "plan" && <PlanView st={st} set={setSt} focus={focus} />}
            {tab === "lab" && <LabView />}
            {tab === "cases" && <CasesView st={st} set={setSt} />}
            {tab === "kit" && <KitView st={st} set={setSt} />}
          </>
        )}
      </div>
    </div>
  );
}
