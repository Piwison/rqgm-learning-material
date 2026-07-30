# Week 3 教材 · 偏誤、成本、與看得見

**六課合計約 11.5 小時，加上週末總結約 40 分鐘。**

---

## 開場：這週沒有硬性關卡，但有一個陷阱

Week 2 你跨過了 κ ≥ 0.6。**那代表你的尺跟你的判斷對得上了。**

這週要做的是讓這套東西**能長期跑下去**，而不是每次都要你盯著。三件事：

1. **控制偏誤** —— 把 Week 1 學的四種偏誤真的實作出來，不只是知道它們存在
2. **控制成本** —— 便宜模型跑大量、強模型只處理邊界，然後**量出你自己資料上的真實節省**
3. **看得見** —— 一個 `/dashboard`，讓通過率、成本、紀元分界都在同一頁上

### 這週的陷阱

> **你這週會看到通過率上升，而且會很想相信那是進步。**

它可能是。也可能是你剛剛裝好的成本路由讓便宜模型判了大部分案例，
而便宜模型比較鬆。**分數上升和品質上升是兩件事** —— 這週的每一課都在教你怎麼分辨。

這就是為什麼 Week 2 的錨點這週還要繼續用：**它們是唯一不會跟著你的優化一起漂移的東西。**

---

## 本週地圖

| 課 | 內容 | 時間 | 必做？ |
|---|---|---|---|
| Lesson 0 | 把四種偏誤實作出來 | 1.5 hr | **必做** |
| Lesson 1 | 成本與 token 追蹤 | 1 hr | **必做** |
| Lesson 2 | 便宜 → 強模型路由 | 2 hr | **必做** |
| Lesson 3 | `cost_report`：量你自己的數字 | 1.5 hr | **必做** |
| Lesson 4 | `/dashboard` 上線 | 4 hr | **必做** |
| Lesson 5 | Trajectory 評估（記錄過程，不只看結果） | 1.5 hr | 選做 |
| 週末總結 | 三題開放性問答 | 40 min | **必做** |

**必做合計 10 小時。**

**節奏建議：** Day 1 做 L0+L1，Day 2 做 L2+L3，Day 3–4 做 L4。
Lesson 4 是這週唯一的大工程，其他都是在既有的 harness 上加東西。

### 前置條件

```
□ npm run eval 跑得起來，錨點 κ ≥ 0.6
□ agent_runs 裡已經有至少一輪完整的資料
□ rubric v1 是 active，而且 commit 進 repo 了
□ Vercel 上的骨架打得開
```

**第 2 項是這週的基礎** —— 沒有歷史資料，儀表板上的「時間軸」只會有一個點。

---

# Lesson 0 · 把四種偏誤實作出來（1.5 小時）

Week 1 你學了四種偏誤和它們的防禦手段。**這一課把「知道」變成「程式碼裡真的有」。**

## 對照表：知識 → 實作

| 偏誤 | Week 1 學的防禦 | 這週要寫進 harness 的東西 |
|---|---|---|
| 位置偏誤 | 兩種順序都跑、取平均 | 只在做兩兩比較時需要。**你目前的 harness 是逐條判定，沒有比較，所以先不用做** |
| 冗長偏誤 | 用二元條目 | **你已經做到了。** rubric v1 全是二元條目 |
| 自我偏好偏誤 | 跨模型家族 | **你已經做到了。** judge 是非 Claude |
| 校準不良 | 要求引用原文證據 | **你已經做到了。** evidence 欄位是必填 |

**看清楚這張表：四個防禦裡你已經有三個了。**

這不是我在恭喜你 —— 這是要你認出**Week 1 和 Week 2 的設計決策，就是偏誤控制本身**。
二元條目、跨家族、要求證據，這三件事不是「好習慣」，它們各自對應一個具體的失敗模式。

## 所以這一課實際要做什麼

三件事，都很小：

### 一、加一個「植入已知壞輸出」的測試（40 分鐘）

**這是唯一能主動偵測 judge 太鬆的方法。**

做法：寫一個你**確定應該被拒絕**的輸出，讓它每次 eval 都跑一遍。如果 judge 判 accept，
就大聲報錯。

```
GOAL: In worktracker/, add a canary case to the eval harness.

1. Add a file `eval/canary.json` holding ONE deliberately bad output plus the
   list of criterion_ids it should fail. I will write the content myself — you
   just create the file with a documented shape and one example.

2. On every `npm run eval`, judge the canary alongside the real cases but do NOT
   write it to agent_runs (it is a self-test, not data).

3. If the canary is judged "accept", print a loud warning:
   "CANARY ACCEPTED — the judge is too lenient. Do not trust this run's pass rate."
   Exit with a non-zero status code.

4. If the canary is rejected but fails the WRONG criteria, print which ones it
   expected vs got. That is a weaker signal but still worth seeing.
```

**你的 canary 要寫什麼：** 拿你 rubric 裡最重要的那一條，故意違反它。
例如 c3 是「沒有出現不在目錄裡的產品」，那 canary 就編一個假產品名。

> **為什麼這件事重要：** 你的通過率會隨著時間上升。canary 是唯一能告訴你
> 「上升是因為變好，還是因為尺變鬆」的東西。**它比儀表板上任何一條線都有用。**

### 二、確認 judge 的溫度是 0（10 分鐘）

如果同一條案例跑兩次結果不同，你所有的數字都是雜訊。

**檢查方法：** 打開 `worktracker/prompts/judge.md` 旁邊的呼叫程式碼，找 `temperature`。
應該是 `0`。不是的話改成 0。

**然後驗證：** 同一批案例跑兩次，比對 `agent_runs` 裡的 verdict。**應該完全一樣。**

不一樣的話，問題不在溫度，在條目定義 —— 回去看 Week 2 Lesson 4 的類型 C。

### 三、記下你「還沒做」的那一個（10 分鐘）

位置偏誤的防禦你**沒有**實作，因為現在還不需要。**在 `PROGRESS.md` 裡記一行：**

```
- 位置偏誤控制（順序交換）：尚未實作。目前 harness 是逐條獨立判定，沒有兩兩比較，
  所以不適用。哪一天開始做「v1 vs v2 哪個輸出更好」這種比較，就必須補上。
```

**為什麼要記：** 因為 Week 4 你會比較兩份 rubric。那時候如果忘了這件事，
你會拿一個有位置偏誤的比較結果去做升級決策。

> **檢核點：**
> ```
> □ canary 跑起來了，而且我故意讓它壞的時候，它會報錯並讓 eval 失敗
> □ temperature = 0，同一批跑兩次 verdict 完全相同
> □ PROGRESS.md 記了「位置偏誤尚未實作」和它的觸發條件
> ```
> 第 1 項要真的測 —— 把 canary 改成一個「應該通過」的輸出，確認它會抱怨，然後改回去。
> **沒測過的警報等於沒有警報。**

---

# Lesson 1 · 成本與 token 追蹤（1 小時）

## 為什麼現在就要記

因為**你想省成本之前，必須先知道成本在哪裡**。而且 `agent_runs` 已經有欄位了
（`tokens_in`、`tokens_out`、`cost_usd`）—— Week 2 的 harness 已經在填了。

這一課只做一件事：**確認那些數字是真的。**

## 動手：核對一次（30 分鐘）

1. 跑一次 `npm run eval`
2. 到你的 judge 供應商的用量頁面（OpenAI 是 platform.openai.com → **Usage**）
3. 對照：**你的 `agent_runs` 加總起來的 `cost_usd`，跟供應商顯示的差多少？**

**差 10% 以內算正常**（計價會有四捨五入和快取差異）。

**差一個數量級的話**，最常見的兩個原因：

| 症狀 | 原因 |
|---|---|
| 你的數字遠**低**於供應商 | 價格寫死在程式裡，而且過期了。或是只算了 output、沒算 input |
| 你的數字遠**高**於供應商 | 單位搞錯（每 1K token vs 每 1M token）|

**修法：** 讓 Claude Code 把價格改成從一個**單一常數檔案**讀，並在檔案裡寫上你查價的日期。

```
GOAL: In worktracker/, move all model pricing into one file, `config/pricing.ts`.

1. One entry per model ID, with input and output price per 1M tokens, plus a
   comment recording the date I looked the price up and the URL.
2. The harness reads from there — no prices anywhere else in the codebase.
3. If a run uses a model ID not in that file, print a warning and record
   cost_usd as null rather than guessing a price.
```

**第 3 條很重要。** 猜一個價格會讓你的 `cost_report` 說謊。**寧可留空。**

## 一個要先知道的數字感

這週你會做成本路由，而**你要省的絕對金額大概是幾分美金**。

**這不是浪費時間。** 理由：

- 這個練習的產出是**一套可以在真實流量上用的機制**，不是這週的帳單
- 25 條案例省 60% 是幾美分；同一套機制在每天 5,000 份 YCO 報告上就是真錢
- **而且「量出真實節省」這個習慣，比省下的錢有價值得多** —— Lesson 3 會講為什麼

> **檢核點：** `agent_runs.cost_usd` 的加總跟供應商用量頁面差 10% 以內，
> 而且價格只寫在一個檔案裡、有查價日期。

---

# Lesson 2 · 便宜 → 強模型路由（2 小時）

## 概念：不是所有案例都需要強模型

大部分案例很明確 —— 便宜模型判得跟強模型一樣。**只有邊界案例需要花錢。**

問題是：**你怎麼知道哪些是邊界案例？**

## 三種路由觸發條件（挑一個開始，不要全做）

### 觸發條件 A · 逐條判定不一致

便宜模型跑兩次（temperature 0 應該一致，但仍可能因為模型不穩定而不同），
不一致就升級。

**優點：** 直接。**缺點：** 成本變兩倍，抵銷了一部分節省。

### 觸發條件 B · 差一條就通過 ← **建議從這個開始**

結合式接受意味著：**5 條全過才 accept**。所以：

- 5 條全過 → 明確 accept，不用升級
- 5 條全不過 → 明確 reject，不用升級
- **只有 1 條沒過** → **這是邊界。升級。**

**為什麼這個最好：** 它不需要模型自我報告信心（Week 1 學過：校準不良，
模型的信心不可信），而是**用 rubric 的結構本身當訊號**。

### 觸發條件 C · 模型自報信心低

**不要用這個。** Week 1 的第四種偏誤就是校準不良 —— 它說 95% 確定的時候實際只有 64%。
拿一個已知不可靠的訊號當路由依據，是在把偏誤放大。

## 動手

```
GOAL: In worktracker/, add cheap -> strong routing to the eval harness.

State your one-line verification plan per item first.

1. Two model IDs in config: JUDGE_MODEL_CHEAP and JUDGE_MODEL_STRONG. BOTH must
   be a different family from Claude — this does not change.

2. Every case is judged by the cheap model first.

3. Escalate to the strong model when the cheap model's result is NEAR THE
   THRESHOLD: exactly one criterion failed. All-pass and multi-fail cases are
   unambiguous and stay cheap.
   - Put that rule in ONE clearly named function with a comment explaining why
     "exactly one failure" is the boundary. I want to be able to change it.
   - Do NOT use the model's self-reported confidence. It is poorly calibrated.

4. Record on each agent_runs row which model actually produced the final verdict
   (model_used) and the cost of every call including the escalated one.

5. Print the routing split: how many cheap-only, how many escalated, and what
   percentage of total cost the escalated ones account for.

CONSTRAINT: when a case is escalated, the STRONG model's verdict is the one
recorded. Do not average them, do not let the cheap verdict win.
```

## 跑完之後：一個必須看的警訊

比較「便宜模型的判定」和「強模型的判定」**在錨點上**的差異。

| 分歧率 | 意思 |
|---|---|
| < 10% | 正常。路由可以信 |
| **> 10%** | **警訊。便宜模型跟強模型對你的 rubric 理解不同** |

**> 10% 的處理方式：** 不是調路由閾值，是**全部改用強模型**，然後回去看 rubric 的用字
—— 兩個模型讀出不同意思，通常代表條目有歧義。

> **這件事的邏輯跟 Week 2 一樣：數字不對的時候，改尺的說明，不要改量法。**

> **檢核點：**
> ```
> □ 印出了路由分佈（幾條便宜、幾條升級、升級佔成本幾成）
> □ 我能指著任何一列說出它為什麼走便宜或走強模型
> □ 便宜 vs 強模型在錨點上的分歧率 < 10%（或我知道它超過了，並改用強模型）
> ```
> 第 2 項是這一課真正的檢核點。**看不懂自己的路由邏輯，那個節省就不能信。**

---

# Lesson 3 · `cost_report`：量你自己的數字（1.5 小時）

## 先看別人的數字，然後不要相信它們

這兩個是這個領域最常被引用的節省數字：

| 研究 | 聲稱 | 條件 |
|---|---|---|
| **RouteLLM**（Ong et al., 2024, UC Berkeley / Anyscale, ICLR 2025） | 最高 **3.66×** 成本節省 | 在 MT Bench 上，維持 95% 的 GPT-4 品質，只把約 14% 的 query 送給強模型 |
| **FrugalGPT**（Chen et al., Stanford, 2023） | 最高 **98%** 降幅 | 用串接式 cascade |

**這些都是真的，而且都不適用於你。**

原因：它們是**在他們自己的資料分佈上**測出來的上界。你的案例是 spec 決議或膚況報告，
不是 MT Bench 的通用問答。**分佈不同，節省就不同。**

> **這一課的整個重點：** 學會說「在我自己的資料上，這個數字是 X」，
> 而不是「文獻說可以省 3.66 倍」。
>
> 這也是 RQGM 那篇論文教你的第一課 —— 你 Week 1 就做過一次，
> 當你發現那份中文摘要裡的「13.0 倍」根本不存在的時候。

## 要做出來的東西

一份印出三個數字的報告：

```
全部用便宜模型：   $0.0182
實際（路由後）：    $0.0341   ← 你真的花的
全部用強模型：     $0.1120

相對「全部用強模型」的節省：3.28×
升級的案例：4 / 25（16%），佔總成本的 62%
```

**三個數字都要有，因為只有中間那個是真的，另外兩個是參考線。**

## 動手

```
GOAL: In worktracker/, add `npm run cost-report`.

Read agent_runs (the current rubric version, non-stale rows only) and print:
1. Hypothetical total cost if every case had used the cheap model.
2. ACTUAL total cost of the routed run.
3. Hypothetical total cost if every case had used the strong model.
4. The savings ratio of (3) over (2), stated as "on my own data".
5. How many cases escalated, what share of cases that is, and what share of the
   total cost those escalated cases account for.

CONSTRAINTS:
- (1) and (3) are estimates from token counts x the price table. Label them
  clearly as estimates in the output. Only (2) is measured.
- If any row has cost_usd = null (unknown model price), exclude it and say how
  many rows were excluded. Do not silently treat null as zero.
```

**最後一條約束是這段 prompt 裡最重要的。** `null` 當成 0 會讓你的節省倍數變得很漂亮
而且完全錯誤 —— 這正是「評估迴圈在騙你」的一個具體實例。

## 跑完之後回答一個問題

> **你的節省倍數，跟 RouteLLM 的 3.66× 差多少？為什麼？**

不用寫長文。**兩句話就好，但要有一個原因。** 常見的真實原因：

- 你的案例太短，強模型和便宜模型的價差在絕對值上很小
- 你的升級率比 14% 高很多 → 你的 rubric 邊界案例比較多
- 你只有 25 條，其中 4 條升級 → 樣本太小，這個倍數本身就不穩

> **檢核點：** `cost_report` 印出三個數字，估算值有標記為估算，
> 而且我能用一句話說出我的倍數為什麼跟論文不一樣。

---

# Lesson 4 · `/dashboard` 上線（4 小時）

**這週唯一的大工程。** 但它是純讀取 —— 資料都已經在 `agent_runs` 裡了。

## 要有的五個東西

| 元件 | 為什麼要有 |
|---|---|
| 通過率時間軸 | 看趨勢。但**要搭配紀元標記才有意義** |
| 按 rubric 版本分組的通過率 | 因為換了尺就不能直接比 |
| **紀元分界標記** | `rubric_version` 改變的那條垂直線。**這是整個儀表板最重要的元素** |
| 最近的判定表（含證據引用） | 你隨機抽查的入口 |
| 本週成本與 token | 一個數字就好 |

## 為什麼紀元標記最重要

因為**沒有它，那條通過率曲線會騙你**。

想像通過率從 68% 跳到 81%。看起來很棒 —— 直到你發現那個跳點正好是你換 rubric 的那天。
那不是變好，那是**換了一把比較鬆的尺**。

> **那條垂直線的作用，就是讓「換尺」這件事不可能被藏起來。**
> 這是 RQGM 的「紀元」概念在你的儀表板上唯一的樣子，而它是必要的。

## 動手

```
GOAL: In worktracker/, build /dashboard. Read-only. No new tables.

State your one-line verification plan per item first.

1. Pass rate over time (line chart), from agent_runs.created_at + verdict.
   Use only rows where stale = false.
2. Pass rate grouped by rubric_version (bar or small table). Never average
   across versions into a single number — different versions are different rulers.
3. A VERTICAL MARKER on the time axis at every point where rubric_version
   changes, labelled with the version numbers ("v1 -> v2"). This is the most
   important element on the page; make it visually obvious, not a subtle tick.
4. A table of the 20 most recent runs: case_ref, verdict, model_used, and the
   evidence quote for the first FAILED criterion (so I can spot-check the judge
   without opening the database).
5. Total cost_usd and tokens for the last 7 days.
6. Anchor kappa for the active rubric version, displayed prominently with the
   0.6 threshold marked.

CONSTRAINTS:
- Plain charts. No charting library unless there is genuinely no alternative —
  ask me first if you think there is.
- If a section has no data, show an empty state saying what would fill it. Never
  a spinner that never resolves, never an error.
- Do not compute anything new that the harness does not already compute. If the
  dashboard and `npm run eval` could ever disagree about kappa, that is a bug.
```

**最後一條約束是為了防一個真實的問題：** 如果儀表板自己算一次 κ、harness 自己算一次，
它們遲早會不一致，而你會不知道該相信哪個。**同一個數字只能有一個來源。**

> **檢核點：**
> ```
> □ /dashboard 在 Vercel 上打得開（不是只有本機）
> □ 紀元標記看得見（現在只有 v1，所以還沒有線 —— Week 4 會出現第一條）
> □ 判定表裡的證據引用是真的原文
> □ 儀表板上的 κ 跟 npm run eval 印的完全一樣
> □ 空的區塊顯示空狀態，不是錯誤或轉圈
> ```
> 最後一項容易被跳過。**故意清空一段時間範圍測一次** —— 空狀態壞掉的儀表板，
> 你在真的沒資料的那天才會發現。

---

# Lesson 5 · Trajectory 評估（1.5 小時，選做）

**Week 1 Lesson 1 講的「看過程」，這一課是它最小的實作版本。**

**跳過不影響 Week 4。** 做它的理由是：你目前所有的評估都是純結果評估，
而 Week 1 就告訴過你那會**系統性高估能力**。

## 最小可用的過程評估

不要記錄整個執行軌跡 —— 太貴，而且你現在不需要。**只記關鍵步驟有沒有發生。**

以 YCO 膚況報告為例，兩個旗標就夠：

```
called_detection_api   true / false
looked_up_catalog      true / false
```

**然後加一條 rubric 條目：**

```
{ "id": "c6", "text": "偵測 API 有被實際呼叫（不是從照片推測）" }
```

**這一條的判定不看輸出文字，看旗標。** 這就是結果評估和過程評估的差別，
在你的系統裡具體長成的樣子。

## 為什麼這件事值得做

因為它能抓到一種**結果評估永遠抓不到**的失敗：

> Agent 的偵測 API 超時了，但它從照片色調猜了一個合理的答案，剛好猜對。
> **報告完美，過程是壞的。** 純結果評估會給 PASS，而且下次遇到不典型的使用者就會爆。

## 動手

```
GOAL: In worktracker/, add minimal trajectory flags to the eval pipeline.

1. Extend eval_cases with an optional `trajectory_json` column (a small object of
   boolean step flags). Write the migration as SQL I will apply myself in the
   Supabase SQL Editor — show it to me first.
2. Criteria whose id starts with "t_" are evaluated against trajectory_json by
   plain code, NOT sent to the LLM judge. A step flag is a fact, not a judgement.
3. Conjunctive acceptance still applies across both kinds of criteria.
4. Print how many criteria were judged by code vs by the LLM.

CONSTRAINT: do not send trajectory flags to the judge as text and ask it to
interpret them. That reintroduces the exact uncertainty this is meant to remove.
```

**最後那條約束是重點。** 一個 boolean 不需要 LLM 判斷。**能用程式碼確定的事，
不要交給機率模型。**

> **檢核點：** 至少一條 `t_` 開頭的條目由程式碼判定，而且終端機印出了
> 「程式碼判定 N 條 / LLM 判定 M 條」。

---

# 週末總結作業（40 分鐘）

### 第 1 題（15 分鐘）· 你的節省數字

寫下這三個數字，然後回答一個問題：

```
我的節省倍數：＿＿＿×
RouteLLM 聲稱的：3.66×
我的升級率：＿＿＿%（RouteLLM 是約 14%）
```

> **如果我在一份簡報裡只寫「業界研究顯示可省 3.66 倍」，那份簡報哪裡不誠實？**

**這一題不是在講成本。** 它在練你這四週真正要學的東西：**引用數字時，
把「誰的資料、什麼條件」一起講出來。** 你平常審 spec 時會遇到同樣的問題。

### 第 2 題（15 分鐘）· canary 的價值

回答：

> **如果我沒有裝 canary，我要多久才會發現 judge 變鬆了？我會用什麼發現？**

如果你的答案是「看通過率」—— 再想一次。**通過率上升，正是 judge 變鬆的症狀，
也是品質變好的症狀。它自己分辨不出來。**

### 第 3 題（10 分鐘）· 你還不相信的那件事

跟前兩週一樣。**先回去看 Week 2 那題寫了什麼，有驗證到嗎？**

---

# 本週自我檢核

1. 四種偏誤的防禦，你在 Week 1–2 就已經實作了哪三個？
2. 為什麼不能用「模型自報的信心」當路由觸發條件？
3. 「剛好一條沒過」為什麼是好的升級訊號？
4. 便宜模型和強模型在錨點上分歧 12%，該做什麼？
5. 儀表板上最重要的元素是什麼？為什麼？
6. `cost_usd` 是 null 的列，為什麼不能當成 0？
7. canary 測試在偵測什麼？為什麼通過率偵測不到它？
8. 為什麼過程旗標要用程式碼判定，不要交給 LLM？

## 答案

1. 二元條目（防冗長）、跨模型家族（防自我偏好）、要求引用證據（防校準不良）。沒做的是位置偏誤控制，因為目前沒有兩兩比較。
2. 因為校準不良就是四種偏誤之一 —— 它的信心跟實際準確度對不上。拿不可靠的訊號當依據是在放大偏誤。
3. 因為它用的是 **rubric 的結構**（結合式接受）當訊號，不需要模型自我報告。全過和多條沒過都是明確的，只差一條才是真的邊界。
4. **改用強模型跑全部**，然後回去看 rubric 用字 —— 兩個模型讀出不同意思通常代表條目有歧義。不要調路由閾值。
5. **紀元分界標記。** 沒有它，換了一把較鬆的尺造成的通過率上升，會看起來像進步。
6. 因為那會讓節省倍數變得漂亮且錯誤。null 代表「不知道價格」，不代表「免費」。
7. 偵測 judge 變太鬆。通過率偵測不到，因為「品質變好」和「尺變鬆」在通過率上長得一模一樣。
8. 因為 boolean 是事實，不是判斷。能用程式碼確定的事交給機率模型，是把不確定性重新引入。

**答對 6 題以上：** 進 Week 4。
**5 題以下：** 重看 Lesson 2 和 Lesson 3 —— 這週的核心是「分辨真實節省和帳面節省」。

---

# 你這週結束時應該能說出的三句話

1. **分數上升有兩種原因：東西變好，或尺變鬆。canary 和紀元標記存在的唯一目的，就是分辨這兩件事。**
2. **文獻上的節省倍數是在別人的資料上量的。我只引用我自己量到的數字，並且講清楚條件。**
3. **能用程式碼確定的事，不要交給模型判斷。**

---

# 下週預告

Week 4 是收斂點。你會做這個計畫裡最像 RQGM 的一件事：**真的換一次尺。**

- 寫 rubric **v2**，然後**只在錨點上**比較 v1 和 v2
- **只有 v2 的錨點 κ ≥ v1 才升級** —— 這是論文的升級閘門，簡化成你能手動執行的版本
- 升級之後把舊的非錨點分數標成 `stale = true`（選擇性擦除），但**保留原始輸出**
- 把整套流程打包成 `.claude/skills/eval-loop/`，以後一句話就能跑
- 最後做一次**反模式稽核**：我的評估迴圈在騙我嗎？

那個升級閘門會有一個你可能不喜歡的結果：**v2 有可能沒通過。** 你花時間寫了一份更嚴謹的
rubric，然後閘門告訴你它跟你的判斷對得比 v1 差。

**那個情況不是失敗，那是這整套機制第一次真的替你擋下一個錯誤決定。**
