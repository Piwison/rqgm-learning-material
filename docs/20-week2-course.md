# Week 2 教材 · Rubric、錨點、與那個 0.6

**六課合計約 13 小時，加上週末總結約 40 分鐘。**

---

## 開場：這週你要跨過一個關卡

Week 1 你做了一件事：讓 AI 判了 8–12 條你的 spec 決議，然後對照它跟你差多少。
你看到了一個 κ 數字，而且我告訴你不用管它是多少。

**這週要管了。**

這週結束時，你的 κ 必須 **≥ 0.6**。這是整個四週計畫裡唯一的硬性關卡，也是唯一一個
「沒過就不要往下走」的地方。

原因很直接：κ 是「AI 那把尺跟你這把尺有多像」。如果它們不像，那麼 Week 3 的儀表板
會很好看但沒有意義，Week 4 的紀元轉換會拿一把歪的尺去換另一把歪的尺。**下游全部建在流沙上。**

### 這週的一條規則

> **如果 κ < 0.6，你要改的是 rubric 的用字，永遠不是你的標註。**

這句話會在這份教材裡出現三次。它是這整個計畫最容易違反、而且違反了最沒人會發現的一條。

改標註讓數字變好看，是這個專案裡你能做的最糟的一件事 —— 因為它把「檢驗工具」變成
「自我安慰工具」，而且從此之後你再也不會知道自己的評估是不是在騙你。

---

## 本週地圖

| 課 | 內容 | 時間 | 必做？ |
|---|---|---|---|
| Lesson 0 | 建你的評估集：20–30 條，其中約 10 條當錨點 | 2.5 hr | **必做** |
| Lesson 1 | κ 到底在算什麼（附兩個算過的例子） | 1.5 hr | **必做** |
| Lesson 2 | Rubric v1：5–7 條二元條目，寫成 JSON | 1.5 hr | **必做** |
| Lesson 3 | Eval Harness v1：`npm run eval` 一鍵跑完 | 4 hr | **必做** |
| Lesson 4 | 把 κ 拉過 0.6 | 2.5 hr | **必做** |
| Lesson 5 | Notion 同步（唯讀） | 1 hr | 選做 |
| 週末總結 | 三題開放性問答 | 40 min | **必做** |

**必做合計 12 小時。** Lesson 5 是選做 —— 它不在本週關卡裡，但如果你想在 Week 3 的
儀表板上看到真實的任務資料，這一小時要花。

**節奏建議：** Day 1 做 L0，Day 2 做 L1+L2，Day 3–4 做 L3，Day 5 做 L4。
**不要把 L4 排在最後一天** —— 如果 κ 沒過，你需要一天的緩衝去改 rubric 重跑。

### 開始前的兩個前置條件

照順序確認，缺任何一個就先回去補：

```
□ Week 1 的 spec-judge 跑得起來，而且你手上有 spec-judge-report.md
□ Vercel 上那個骨架打得開，/ 和 /runs 顯示空狀態
□ Supabase 的五張表都在（到 Table Editor 看得到 tasks / rubrics /
  eval_cases / agent_runs / epoch_transitions）
□ .env 裡的 JUDGE_API_KEY 有值
```

**第 3 項沒過的話**：到 Supabase → SQL Editor，把 `supabase/schema.sql` 整份貼進去執行。
不要讓 AI 重新產生一份。

---

# Lesson 0 · 建你的評估集（2.5 小時）

**這一課沒有新概念，但它是這週最重要的一課。** 你的 κ 好不好，一半取決於這一課做得多誠實。

## 先看一條寫好的

評估集裡的一條長這樣：

```
案例代號    TBD-MV-03
輸入        「播放體驗要流暢」
我的判定    reject
是錯點嗎？  是
來源        YCM spec v1.2 review, 2026-05
備註        （空的。只有改動標註時才需要填）
```

**只有五個欄位，而且其中一個通常空著。** 這就是一條案例的全部。

## 為什麼要 20–30 條

| 條數 | 會發生什麼 |
|---|---|
| 8–12（你 Week 1 的量） | κ 會亂跳。加一條案例可能讓 κ 從 0.3 變 0.6，那不是進步，是雜訊 |
| **20–30** | **κ 開始穩定。這是最小的有意義規模** |
| 100+ | 更穩，但你要標一整天，而且這個階段不會告訴你更多東西 |

**20–30 是「夠用的最小值」，不是妥協。**

## 組成：15 條核心 + 10 條邊界

**核心案例（約 15 條）** —— 你判起來很快、很確定的。這些定義「正常情況」。

**邊界案例（約 10 條）** —— 你當時猶豫過的、或跟人爭論過的。這些才會抓出 rubric 的漏洞。

> **邊界案例才是有價值的那一半。** 如果你的 25 條全部是「一看就知道」的案例，
> 你的 rubric 會在真實使用時第一天就破功 —— 因為它從來沒被難題考過。

**怎麼找邊界案例：** 回想「我當時多看了兩遍才決定」或「我跟 RD 為這條來回過」的那些。
猶豫本身就是標記。

## 錨點：約 10 條，而且從此不再動

從那 20–30 條裡挑出 **你最有把握的約 10 條**，標成**錨點**。

錨點的規則只有三條，但都是絕對的：

1. **只能新增，不能修改。** append-only。
2. **改動任何一條錨點的標註，必須在 commit message 裡留一行說明為什麼。**
3. **永遠不要拿錨點來優化。** 它們是保留的答案卷。

**為什麼要有錨點：** 因為 Week 4 你會換 rubric。換的時候你需要一把「沒有被新 rubric
影響過」的尺，來判斷新 rubric 是真的更好、還是只是更會討好自己。錨點就是那把尺。

### 挑錨點的標準（勾得起來才算）

對每一條候選問這三題：

```
□ 這條我現在判、跟三個月後再判，會是同一個答案
□ 我可以用一句話說出判定理由，而且那句話不含「感覺」「大概」
□ 如果有人問我為什麼，我拿得出具體證據（引得出原文）
```

**三題都勾才標成錨點。** 勾不滿就當普通案例 —— 普通案例也有用，只是不當尺。

## 動手：三步

**第一步（1 小時）· 湊到 20 條**

你已經有素材了，不用從零開始：

| 來源 | 大概能湊幾條 |
|---|---|
| Week 1 的 L3 改寫表格 | 3–5 |
| Week 1 的 L0 三個案例 | 3 |
| 已經收掉的 TBD 決議 | 5–10 |
| 你打回過的 YCO 原型 / RD handoff | 5–10 |

**湊不到 20 條就先做 15 條。** 15 條能跑，κ 會比較晃而已。**不要編假的湊數** ——
假案例會讓你的 κ 好看但毫無意義，那正是這整門課要防的事。

**第二步（1 小時）· 標判定**

每一條填 `accept` 或 `reject`。**不要想太久** —— 你第一個直覺就是你的標註。
想超過 20 秒的那條，代表它是邊界案例，記下來。

**第三步（30 分鐘）· 挑錨點並寫進資料庫**

用上面三題檢查，挑出約 10 條標成錨點，然後寫進 Supabase。

**去哪裡輸入：** Supabase → Table Editor → `eval_cases` → Insert row。
一條一條點很慢，所以用下面這段讓 Claude Code 幫你：

```
GOAL: Insert my eval cases into the Supabase `eval_cases` table.

I will paste a list of cases in this format:
  TBD-MV-03 | 播放體驗要流暢 | reject | anchor
  TBD-MV-07 | 首幀 300ms 內出現 | accept |
(the 4th column is "anchor" or empty)

WHAT TO DO:
1. Write ONE SQL INSERT statement covering all of them, mapping to the existing
   columns: case_ref, input, expected_verdict, is_anchor, source.
   Set source to 'week2-manual'.
2. Show me the SQL BEFORE running anything. I want to read it.
3. Do NOT invent, reword or "improve" any of my verdicts or inputs. Copy them
   exactly. If a row looks ambiguous to you, leave it and tell me which one.
4. After I approve, tell me how to run it (I will paste it into the Supabase
   SQL Editor myself).
```

> **注意第 3 條約束。** 那不是客套 —— 如果 AI「順手」改了你的標註用字，你的錨點就污染了，
> 而且你不會發現。這條約束在後面每一週的 prompt 裡都會出現。

> **檢核點：** Supabase 的 `eval_cases` 表裡有 ≥ 15 列，其中 `is_anchor = true` 的有 8–12 列。
> 到 Table Editor 數一下就好。

---

# Lesson 1 · κ 到底在算什麼（1.5 小時）

## 先講為什麼不能只看一致率

假設你和 AI 判了 20 條，**15 條一致**。一致率 75%，聽起來不錯。

**問題來了：如果你們兩個都習慣判 accept，那麼「一致」有一部分是碰巧的。**

極端一點：如果你 20 條全判 accept，AI 也 20 條全判 accept，一致率是 100% ——
但這完全沒有告訴你 AI 有判斷力。它可能只是學會了永遠說 accept。

**κ 就是在扣掉這個「碰巧一致」的部分。**

## 兩個算過的例子（重點在對照，不在公式）

### 例子一：一致率 75%，但 κ 只有 0.50 —— 沒過關

20 條案例，攤成四格：

|  | AI 判 accept | AI 判 reject |
|---|---|---|
| **你判 accept** | 8 | 3 |
| **你判 reject** | 2 | 7 |

- 一致的是對角線：8 + 7 = **15 條，75%**
- 但你判 accept 有 11 條、AI 判 accept 有 10 條 —— **你們都偏向 accept**
- 扣掉碰巧的部分之後：**κ = 0.50**

**0.50 沒過 0.6 的關卡。** 一致率看起來還行，但實際判斷力只有中等。

### 例子二：一致率 85%，κ = 0.70 —— 過關

同樣 20 條，只是多對了 2 條：

|  | AI 判 accept | AI 判 reject |
|---|---|---|
| **你判 accept** | 9 | 2 |
| **你判 reject** | 1 | 8 |

- 一致：9 + 8 = **17 條，85%**
- **κ = 0.70**

### 把這兩個例子放在一起看

| | 一致條數 | 一致率 | κ | 過關？ |
|---|---|---|---|---|
| 例子一 | 15 / 20 | 75% | 0.50 | ✗ |
| 例子二 | 17 / 20 | 85% | 0.70 | ✓ |

**多對 2 條，κ 從 0.50 跳到 0.70。**

這就是你這週實際要做的事的規模 —— **不是大改造，是找出那 2–3 條判錯的，看它們為什麼錯。**

## κ 的數字怎麼讀

Landis & Koch（1977）的分級，這是學界慣用的參考點：

| κ | 分級 | 對你的意思 |
|---|---|---|
| < 0.20 | Slight | 幾乎沒有一致性。rubric 大概有根本性的問題 |
| 0.21–0.40 | Fair | 有一點，但不能信 |
| 0.41–0.60 | Moderate | **這是最危險的區間** —— 看起來像有在運作，其實不能靠 |
| **0.61–0.80** | **Substantial** | **這是你的目標** |
| 0.81–1.00 | Almost Perfect | 很好，但也要懷疑一下是不是案例太簡單 |

**0.6 這個門檻不是隨便挑的** —— 它是「Moderate」跳到「Substantial」的界線。

> **這些是社群慣例，不是物理定律。** 它們是判斷用的參考尺，不要當成精確閾值來爭論
> 0.59 和 0.61 的差別。

## 想自己玩數字的話

`web/rqgm-console.html` → 實驗室分頁 → κ 計算器。四個格子填進去，κ 立刻算出來。

**建議做一件事（5 分鐘）：** 把例子一的數字填進去，然後**一次只改一格**，看 κ 怎麼動。
你會很快發現：把 `b`（你 accept、AI reject）從 3 改成 1，κ 的變化比你預期的大。

**那個直覺比公式有用。** 它會告訴你：κ 對「少數幾條系統性判錯」特別敏感 ——
而那正是 rubric 用字不清楚的典型症狀。

## Spearman ρ：這週只要知道它存在

ρ 是**排名相關係數**。1.0 = 兩份排名完全一樣，0 = 完全無關。

**這週你不會用到它。** Week 4 才會 —— 那時候你要判斷「換了 rubric 之後，排名有沒有真的變」。
論文裡不做選擇性擦除的對照組，排名被舊分數釘死在 ρ ≥ 0.90，也就是**換了尺等於沒換**。

現在只要記住這個名字和「它在量排名有沒有變」就夠了。

> **檢核點：** 兩題，都是選擇題：
>
> **1.** 一致率 90%、κ = 0.15 的情況，最可能的原因是？
> （a）AI 很爛　（b）你們兩個都幾乎只判同一邊　（c）案例太少　（d）rubric 太嚴
>
> **2.** κ 跑出 0.55，正確的下一步是？
> （a）改幾條標註讓它過 0.6　（b）多加 20 條簡單案例　（c）找出判不一致的那幾條、改 rubric 用字　（d）換更強的 judge 模型
>
> **答案：1-(b)、2-(c)。** 第 2 題答錯的話，回去看本課開頭那條規則。

---

# Lesson 2 · Rubric v1（1.5 小時）

## 你已經會寫了

Week 1 的 Lesson 3 你已經做過這件事：把模糊的驗收條件改成二元可驗證的。
**Rubric 就是那些條目排在一起，加上一個版本號。**

這一課只加三件新東西：**寫成 JSON、放進資料庫、標上版本。**

## 一份 rubric v1 長什麼樣

以 YCO 膚況報告為例（**你要換成你自己的領域**）：

```json
{
  "name": "skincare-report",
  "version": 1,
  "criteria": [
    { "id": "c1", "text": "報告列出了至少 2 個偵測到的膚況問題" },
    { "id": "c2", "text": "每一個推薦產品都對應到報告中明確列出的某個膚況問題" },
    { "id": "c3", "text": "沒有出現任何不在產品目錄裡的產品名稱" },
    { "id": "c4", "text": "沒有出現「嚴重」「病變」「異常」等醫療警示用語" },
    { "id": "c5", "text": "報告有給出一個具體的下一步動作（不是「請諮詢專業人士」）" }
  ],
  "acceptance": "conjunctive"
}
```

**注意三件事：**

1. **每一條都是是／否。** 沒有分數、沒有權重。
2. **`"acceptance": "conjunctive"`** —— 全部通過才算 accept。這個欄位存在的意義是提醒
   你自己：**不要哪天手癢改成加權平均。**
3. **5 條。** 5–7 是甜蜜點。超過 10 條，judge 的一致性會開始掉，而且你自己維護不動。

## 三條寫作規則（Week 1 學過，這裡是實戰版）

### 規則一：二元

**檢查方法：** 把條目唸出來，如果答案不是「有」或「沒有」，就還沒寫完。

### 規則二：證據約束

Judge 必須為每一條引用原文。這不是寫在 rubric 裡，是寫在 judge 的 prompt 裡 ——
Lesson 3 會做。

### 規則三：結合式

全部通過才 accept。

> **為什麼不用加權平均：** 因為一份編造了不存在產品的報告（c3 fail），
> 不該因為語氣親切、格式漂亮就及格。**嚴重錯誤不能被小優點抵銷。**

## 動手：挑出寫壞的條目（先練認的）

下面 5 條，**有 3 條寫壞了**。哪三條，為什麼？

```
1. 報告的專業度足夠。
2. 報告中每一個數字都有標明來源。
3. 報告長度在 300–800 字之間。
4. 報告的建議品質達到可上線標準（8/10 以上）。
5. 報告沒有把使用者的膚況描述成疾病。
```

<br>

**答案：1、4 壞得很明顯，3 是陷阱。**

| # | 判定 | 為什麼 |
|---|---|---|
| 1 | ✗ | 「專業度足夠」不可驗證。兩個人判不一樣。典型的「換一個模糊詞」 |
| 2 | ✓ | 可以逐一檢查，答案是有／沒有 |
| 3 | **△ 陷阱** | 技術上二元、可驗證 —— 但它在**量長度**，這會直接助長冗長偏誤。刪掉它 |
| 4 | ✗ | 出現了「8/10」。需要打分數就代表沒拆解完 |
| 5 | ✓ | 有明確判準，可以引原文佐證 |

**第 3 條是這一課的重點。** 一個條目可以「符合二元規則」但仍然是壞條目 ——
因為它獎勵了錯的東西。**規則是過濾器，不是保證。**

## 動手：寫你自己的 v1

**5 條，不是 7 條。** 挑你最確定的 5 條先跑起來，之後再加。

從哪裡來：

1. Week 1 L3 那張改寫表格 → 直接搬 2–3 條
2. 你的錨點案例裡，你判 reject 的理由 → 每個理由通常就是一條條目
3. 你最常在 review 裡講的那句話

**寫完用這三題檢查每一條：**

```
□ 答案是「有」或「沒有」（不是程度、不是分數）
□ 兩個人分別檢查，會得到同樣結論
□ 它獎勵的是「做對」，不是「寫多」或「寫得像專業人士」
```

第三題就是第 3 條陷阱教你的東西。

### 放進資料庫

**去哪裡：** 存成 `rubrics/spec-resolution-v1.json`（在 `worktracker/` 裡面），
然後寫一列進 Supabase 的 `rubrics` 表，`version = 1`、`active = true`。

`rubrics` 表上有一個唯一索引，會**強制同一個 name 只能有一列 active**。
這是刻意的：**同一時間只有一把尺在用**，這就是「紀元」在資料庫層的樣子。

> **檢核點：** `rubrics` 表裡有一列 `version = 1`、`active = true`，
> `criteria_json` 裡有 5–7 條，而且**每一條你都能唸出來、答案都是有／沒有**。

---

# Lesson 3 · Eval Harness v1（4 小時）

**這一課是這週的工程量所在。** 概念都學過了，這裡是把它們接起來。

## 要做出來的東西

一個指令：

```
npm run eval
```

跑完之後：

- `agent_runs` 表裡每個案例多一列
- 終端機印出：通過率、**錨點上的 κ**、總花費
- 每一列都有逐條判定和**引用的原文證據**

## 開始前先預測（60 秒，不要跳過）

**你的 rubric v1 第一次跑，你猜 κ 會是多少？** 寫下來。

```
我猜 κ ≈ ＿＿＿＿
```

**寫下來的理由：** Week 1 的預測-對照告訴你哪裡標準不清楚。這次是同一招用在 rubric 上。
第一次跑出來的 κ 通常比人預期的低 —— 而**被打臉的那一刻，才是你真的學到「我的標準沒寫清楚」
的時候。**

## 執行

```
GOAL: In the worktracker/ subdirectory, add an eval harness I can run from the
command line. I drive Claude Code and review code — keep it simple, readable
TypeScript, no clever abstractions, no eval framework.

State your one-line verification plan for each numbered item BEFORE writing it.

1. Read the active rubric from the `rubrics` table (active = true) and the cases
   from `eval_cases`. Do not hardcode either.

2. For each case, call the judge model from JUDGE_MODEL / JUDGE_API_KEY in .env.
   This MUST be a different model family from Claude — that is the whole point,
   do not "simplify" it to a Claude call.

3. The judge evaluates each criterion INDEPENDENTLY and returns strict JSON:
   { "criterion_id": "c1", "verdict": "pass" | "fail", "evidence": "<exact quote
   from the input that drove this verdict>" }
   - A verdict with an empty evidence field is an error, not a result. Fail loudly.
   - Acceptance is CONJUNCTIVE: all criteria pass -> accept, otherwise reject.

4. Write one row per case to `agent_runs`: agent_name, input_ref, rubric_version,
   model_used, verdict, per_criterion_json, evidence_json, tokens_in, tokens_out,
   cost_usd.

5. Print a summary: pass rate, Cohen's kappa computed ONLY over cases where
   is_anchor = true (compare agent_runs.verdict against eval_cases.expected_verdict),
   the anchor count, and total cost_usd.

6. Put the judge prompt in `worktracker/prompts/judge.md` as a separate file, not
   inline in the code. I need to edit it without touching TypeScript.

CONSTRAINTS:
- Never write to `eval_cases`. That table is my ground truth; the harness reads it.
- If the judge returns malformed JSON, retry once, then record the failure. Do not
  silently guess a verdict.
- Print the exact model ID actually used, so it lands in model_used.
```

### 這段 prompt 裡有四個約束值得你認出來

| 約束 | 它在防什麼 |
|---|---|
| 「MUST be a different model family」+「do not simplify」 | AI 常會為了少接一個 API 而改用 Claude 判。那會毀掉整個實驗 |
| 「empty evidence is an error」 | 沒有證據的判定 = 憑感覺。這條讓它壞得大聲，不要悄悄過 |
| 「Never write to `eval_cases`」 | **這是保護你的錨點。** 這條是這段 prompt 裡最重要的一行 |
| 「judge prompt 放獨立檔案」 | 因為 Lesson 4 你要改它。改用字，不改標註 |

## 跑完之後做這件事（20 分鐘，不要跳過）

1. **你的預測是多少？實際是多少？**
2. 打開 `agent_runs`，找出**你和 judge 判不一致**的那幾條
3. 對每一條，只問一個問題：

> **是 judge 判錯了，還是我的 rubric 沒把這件事寫清楚？**

**第 3 題就是 Lesson 4 的全部內容。** 現在先把不一致的案例列出來就好。

> **檢核點：**
> ```
> □ npm run eval 跑完沒有錯誤
> □ agent_runs 的列數 = 我的案例數
> □ 隨機打開一列，evidence_json 裡是真的原文引用，不是 judge 的自述
> □ 終端機印出了 κ 和花費
> □ 我列出了判不一致的案例清單
> ```
> 第 3 項特別要看 —— 如果 evidence 裡寫的是「這條符合要求」而不是引用原文，
> 你的 judge 在憑感覺，先修那個再往下走。

---

# Lesson 4 · 把 κ 拉過 0.6（2.5 小時）

## 唯一的規則，第三次

> **改 rubric 的用字，不要改你的標註。**

如果你在這一課動了任何一條錨點的 `expected_verdict`，這整個計畫就失去意義了。

**唯一的例外：** 你重新看那條案例，發現**自己當初真的標錯了**（不是「新 rubric 這樣說比較好」，
是「我當初看漏了一句話」）。那種情況可以改，但必須：

1. 在 commit message 裡寫一行：改了哪條、從什麼改成什麼、為什麼
2. 在 `eval_cases.note` 欄位填同一句話

**這個摩擦是刻意設計的。** 改標註應該讓你覺得麻煩，因為它應該很少發生。

## 診斷：三種不一致，三種修法

打開你 Lesson 3 列出的不一致清單，一條一條歸類：

### 類型 A · Judge 判 fail，你覺得該 pass

**最常見。** 通常意思是**條目寫得比你心裡的標準嚴**。

修法：在條目裡加上你心裡那個沒寫出來的例外。

```
改前：報告有給出一個具體的下一步動作
改後：報告有給出一個具體的下一步動作。
      「建議持續觀察 2 週後複拍」算具體；「請諮詢專業人士」不算。
```

**注意改法：加一個正例和一個反例，比重寫整句有效。**

### 類型 B · Judge 判 pass，你覺得該 fail

意思是**條目有漏洞，judge 從漏洞鑽過去了**。

修法：把漏掉的對象補進去。

```
改前：沒有出現不在產品目錄裡的產品名稱
改後：沒有出現不在產品目錄裡的產品名稱。系列名、子品牌名、
      以及「同系列其他產品」這類指涉，都算產品名稱。
```

### 類型 C · 同一條案例，跑兩次結果不同

**這不是 judge 的問題，是條目定義不足。**

修法：這條**一定**要重寫，而且要拆。不穩定的條目會讓你所有數字都變成雜訊。

```
改前：報告的資訊是準確的
改後（拆成兩條）：
  - 報告引用的每個偵測數值，都和輸入的偵測結果一致
  - 報告沒有宣稱任何輸入資料裡沒有的膚況問題
```

## 動手：改-重跑循環

```
1. 挑「影響最多案例」的那一條條目來改（不是最容易改的那條）
2. 只改那一條，改完存檔
3. npm run eval 重跑
4. 看 κ 動了多少
5. 沒過 0.6 就回到第 1 步
```

**一次只改一條。** 一次改三條然後 κ 上升，你不知道是哪一條起作用 ——
下次遇到同樣問題你還是不會修。

### 什麼時候該停

| 狀況 | 做什麼 |
|---|---|
| κ ≥ 0.6 | **停。** 不要繼續優化。過關就往下走 |
| κ 卡在 0.5 附近，改了三輪沒動 | 看是不是**案例太少**。補到 25 條再看 |
| κ 越改越低 | 你可能在對著錨點優化了。**停下來**，回去看你改的是用字還是判準 |
| 某一條怎麼改都不穩 | 刪掉它。5 條穩定的 rubric 勝過 7 條裡有 2 條在擲骰子 |

> **⚠️ 最後一格是真的陷阱。** 如果你發現自己在想「怎麼改條目才能讓錨點都對」——
> **那就是在對錨點優化**，也就是這門課從第一天就在防的事。
>
> 分辨方法：**你是在讓條目更清楚，還是在讓條目更符合這 10 條的答案？**
> 前者會讓新案例也判得更好，後者只會讓這 10 條好看。

## 過關之後：把版本記下來

κ 過了 0.6，做兩件事：

1. **把最終的 rubric JSON commit 進 repo。** 這是你的 v1，Week 4 要拿它跟 v2 比。
2. **把 κ 的數字寫進 `PROGRESS.md`。** 連同錨點數量和跑的日期。

> **檢核點：**
> ```
> □ 錨點上的 κ ≥ 0.6，而且是 npm run eval 印出來的，不是我手算的
> □ 我沒有改任何一條錨點標註（或改了，而且 commit message 和 note 都有記）
> □ rubric v1 的最終版在 repo 裡
> □ PROGRESS.md 記了 κ 值、錨點數、日期
> ```

---

# Lesson 5 · Notion 同步（1 小時，選做）

**這一課不在本週關卡裡。** 做它的唯一理由是：Week 3 的儀表板上會有真實的任務資料，
而不是空表格。

**跳過不會影響 Week 3 和 Week 4 的關卡。**

## Part A · 拿 token（20 分鐘）

1. 到 **notion.so/my-integrations** → New integration → 選 internal → 建立 → 複製 token
2. **關鍵的一步，很多人漏掉：** 回到你的 `[PF] Tasks Database` 頁面 →
   右上 **⋯ → Connections → 加入你剛建的 integration**

   **漏了這步，API 會回 404，而且錯誤訊息只會說「找不到」，不會告訴你是權限問題。**

3. 拿 **database ID**：

   打開 `[PF] Tasks Database` 的頁面，看瀏覽器網址列：

   ```
   https://www.notion.so/你的workspace/1a2b3c4d5e6f7890abcd1234ef567890?v=...
                                        └────── 這 32 個字就是 ID ──────┘
   ```

   **就是 workspace 名稱後面、`?v=` 前面那一長串。** 有沒有連字號都可以。

4. 填進 `.env`：`NOTION_TOKEN` 和 `NOTION_TASKS_DB_ID`

## Part B · 同步（40 分鐘）

```
GOAL: In worktracker/, add `npm run sync-notion` that pulls my Notion tasks into
the Supabase `tasks` table. READ-ONLY from Notion — this must never write back.

Source: the Notion database in NOTION_TASKS_DB_ID. Its properties are
Task, Status, Priority, Due Date, Label, Done.

WHAT TO BUILD:
1. Map those to the existing `tasks` columns: title, status, priority, due_date,
   label, done, notion_id. Do not add columns.
2. Upsert on notion_id so running it twice does not duplicate rows.
3. Print how many rows were inserted vs updated.

CONSTRAINTS:
- Read-only against Notion. No writes, no property updates. (Write-back is Week 4.)
- If the Notion API returns 404, print a message saying the most likely cause is
  that the integration has not been added to the database page via
  Connections — not a wrong ID.
```

> 最後那條約束是為了你自己好。那個 404 你大概會遇到一次，
> 而那時候有一句人話的錯誤訊息，可以省你 20 分鐘。

> **檢核點：** Vercel 上的 `/` 頁面顯示真實的任務，不是空狀態。跑兩次不會變兩倍。

---

# 週末總結作業（40 分鐘）

**這是這週唯一需要自己寫一段的地方。** 三題。

### 第 1 題（15 分鐘）· 那條改了最多次的條目

找出你這週**改最多次**的那一條 rubric 條目，回答：

> 我原本以為它在說什麼？judge 以為它在說什麼？**這個落差告訴我，我平常寫 spec 時
> 有什麼習慣是靠人腦補的？**

**第三個問題才是重點。** 它會直接改善你下一份 spec，而且是這週最可能帶到日常工作的東西。

### 第 2 題（15 分鐘）· 你的 κ 故事

寫下三個數字和一句話：

```
第一次跑的 κ：＿＿＿　最後的 κ：＿＿＿　改了幾輪：＿＿＿

讓 κ 動最多的那一次改動是：＿＿＿＿＿＿
```

然後回答：**如果我當初改的是標註而不是用字，我現在會相信這個 0.6 嗎？**

### 第 3 題（10 分鐘）· 你還不相信的那件事

跟 Week 1 一樣：寫下**一件這週學到、但你還不太相信的事**，以及打算怎麼驗證。

Week 1 那題你寫了什麼？**回去看一下，然後回答：這週有驗證到嗎？**

---

# 本週自我檢核

不要回頭翻。

1. 為什麼一致率 90% 可能對應到很低的 κ？
2. κ = 0.55 的正確下一步是什麼？錯誤的下一步是什麼？
3. 錨點的三條規則是什麼？
4. 為什麼評估集裡的「邊界案例」比「核心案例」有價值？
5. 「報告長度在 300–800 字之間」是好條目還是壞條目？為什麼？
6. 同一條案例跑兩次得到不同結果，代表什麼？該怎麼修？
7. 為什麼 harness 的 prompt 裡要寫「never write to eval_cases」？
8. 你怎麼分辨「讓條目更清楚」和「對著錨點優化」？

## 答案

1. 因為如果雙方都偏向同一個判定，很大一部分的「一致」是碰巧的。κ 把那部分扣掉。
2. **正確：** 找出判不一致的案例，改 rubric 用字。**錯誤：** 改標註、或加一堆簡單案例稀釋。
3. 只能新增；改標註要留 commit 說明；永遠不拿來優化。
4. 因為核心案例只驗證「正常情況」。邊界案例才會暴露 rubric 的漏洞 —— 那些漏洞在真實使用時第一天就會被踩到。
5. **壞條目。** 它符合二元、可驗證，但它在量長度，會直接助長冗長偏誤。**規則是過濾器，不是保證。**
6. 條目定義不足。必須重寫，而且通常要拆成兩條。不穩定的條目會讓所有數字變雜訊。
7. 保護錨點。`eval_cases` 是你的 ground truth，harness 只能讀。
8. 問自己改動會不會讓**沒見過的新案例**也判得更好。只讓那 10 條好看的，就是在對錨點優化。

**答對 6 題以上：** 進 Week 3。
**4–5 題：** 回去看 Lesson 1 和 Lesson 4 的規則段落。
**3 題以下：** Lesson 4 的三種不一致類型重看一次，那是這週的核心。

---

# 你這週結束時應該能說出的三句話

1. **一致率會騙人，κ 把「碰巧一致」扣掉了 —— 而 0.6 是「看起來能用」和「真的能用」的界線。**
2. **κ 不夠的時候，要改的是尺的刻度說明，不是被量的東西。**
3. **錨點是我唯一不會被自己說服的東西。它們的價值完全來自我從不拿它們優化。**

---

# 下週預告

Week 3 你會做三件事，全部是「讓這套東西可以持續跑下去」：

- **控制偏誤**：順序交換、長度正規化，把 Week 1 學的四種偏誤真的實作出來
- **控制成本**：便宜模型跑大量、強模型只處理邊界案例，然後**用你自己的資料量出真實節省**
- **看得見**：`/dashboard` 上線，通過率時間軸 + 紀元分界標記

那個 `cost_report` 會很有趣 —— 因為你會看到自己資料上的真實數字，
而它幾乎一定跟論文和行銷素材上的數字不一樣。**那個落差本身就是這一課要教的東西。**
