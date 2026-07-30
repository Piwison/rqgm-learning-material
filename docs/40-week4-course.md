# Week 4 教材 · 換一次尺

**六課合計約 12 小時，加上週末回顧約 1 小時。**

---

## 開場：這週你要做的事，可能會失敗

前三週你建了一把尺（rubric v1）、校準了它（κ ≥ 0.6）、讓它便宜又看得見。

**這週你要換掉它。**

你會寫一份 rubric v2，然後把它跟 v1 放在同一組錨點上比。
**只有 v2 跟你的判斷對得比 v1 好或一樣好，才升級。**

### 先講清楚一件事

> **v2 有可能沒通過。**

你會花一個半小時寫一份看起來明顯更嚴謹、更清楚的 v2，然後閘門告訴你：
它在錨點上的 κ 比 v1 低。**不准升級。**

那一刻你會很想繞過它 —— 調一下閘門、或者「順手」改一條錨點標註。

**不要。那一刻就是這整個四週計畫存在的理由。**

一個永遠不會擋下你的閘門，等於沒有閘門。**v2 被擋下來，是這套機制第一次真的替你
攔住一個錯誤決定** —— 而它攔下的是你自己的直覺，那正是最難攔的東西。

---

## 本週地圖

| 課 | 內容 | 時間 | 必做？ |
|---|---|---|---|
| Lesson 0 | 紀元轉換的三個動作 | 1.5 hr | **必做** |
| Lesson 1 | 寫 v2 + 加對抗樣本 | 1.5 hr | **必做** |
| Lesson 2 | 跑一次真的紀元轉換 | 3 hr | **必做** |
| Lesson 3 | 打包成 `eval-loop` Skill | 3 hr | **必做** |
| Lesson 4 | Notion 回寫 | 1.5 hr | **必做** |
| Lesson 5 | 反模式稽核：我的迴圈在騙我嗎 | 1.5 hr | **必做** |
| 週末回顧 | 四週收尾 | 1 hr | **必做** |

**全部必做，合計 13 小時。** 這週沒有選做的東西 —— 每一課都對應本週關卡的一項。

**節奏建議：** Day 1 做 L0+L1，Day 2 做 L2（**留整天，這是核心**），Day 3 做 L3，
Day 4 做 L4+L5。

### 前置條件

```
□ rubric v1 是 active，錨點 κ ≥ 0.6，而且數字記在 PROGRESS.md
□ agent_runs 裡有至少兩輪資料
□ /dashboard 在 Vercel 上打得開
□ canary 測試會在 judge 變鬆時報錯
```

---

# Lesson 0 · 紀元轉換的三個動作（1.5 小時）

「紀元轉換」聽起來很大，實際上是**三個動作，按順序做**。

## 動作一 · 錨點閘門（決定要不要換）

**只在錨點上**跑 v1 和 v2，比 κ。

```
κ_anchor(v1) = 0.72
κ_anchor(v2) = 0.78     →  v2 ≥ v1，升級 ✓

κ_anchor(v1) = 0.72
κ_anchor(v2) = 0.65     →  v2 < v1，不升級 ✗
```

**為什麼只在錨點上比？** 因為錨點是唯一沒有被任何一版 rubric 影響過的東西。
用非錨點案例比，等於用「被 v1 塑造過的資料」去評判 v1 的挑戰者 —— 那不公平，
而且偏向 v1。

> 論文用的是 ε-best-belief 做這個閘門（`BB_ε(a) = I⁻¹_ε(1+S, 1+F)`，ε = 0.05），
> 也就是「保守估計下的成功率下界」。
>
> **你這裡刻意簡化成直接比 κ。** 理由：10 條錨點的規模下，
> 那個 Beta 後驗的計算不會告訴你更多東西。**保留的是那個習慣 ——
> 不要用小樣本的原始數字排名。** 這一課的重點是閘門存在，不是閘門的數學。

## 動作二 · 選擇性擦除（讓舊分數停止干擾）

升級之後，把**舊版本的非錨點分數**標成 `stale = true`。

**三個「不要」：**

```
✗ 不要刪掉那些列
✗ 不要刪掉原始輸出
✗ 不要碰錨點的分數
```

**只是把它們標成「不再信任」。**

### 為什麼一定要做這個動作

因為不做的話，**舊排名會把新排名釘死**。

論文做了一個對照實驗：不做擦除的組別，換了評估器之後，排名的 Spearman ρ 停在 **≥ 0.90**
—— 也就是排名幾乎完全沒變。

**換了尺，等於沒換。**

原因很直覺：如果你有 100 筆舊分數和 25 筆新分數混在一起，
**舊的那 100 筆在數量上就壓過新的了**。任何排名、任何平均、任何趨勢圖，
都還是由舊尺量出來的結果在主導。

> **`stale` 這個旗標，就是那個 ρ ≥ 0.90 問題在你資料庫裡的解法。**
> 它是這整個 schema 裡最不明顯、但最重要的一個欄位。

### 為什麼保留原始輸出

因為**重新評分比重新執行便宜得多**。

換了 rubric 之後，你想知道舊案例在新尺下是幾分。你**不需要重新跑一次 agent** ——
原始輸出還在，直接拿 v2 重新判就好。

> 論文把這件事做成指數間隔的檢查點，把成本從 O(B²) 降到 O(B)。
> **你不需要那個機制，但你需要那個習慣：留著輸出，重判就好。**

## 動作三 · 對抗性重標（把你被騙過的地方變成考題）

找出**v1 判 accept、但你後來認為該 reject** 的案例。
把它們加進錨點，標成 `reject`，**而且要在跑 v2 之前加。**

### 為什麼順序很重要

如果你在 v2 跑完之後才加對抗案例，你就是在挑對 v2 有利的考題。
**先加，再考** —— 這樣 v2 才是在一個它沒見過的考卷上被評分。

### 這在修什麼

RQGM 論文測到：最強的基準審查器對 **AI 寫的論文**的接受率，
高達對人類寫的論文的 **1.91 倍**。同樣品質，只因為是 AI 產出就更容易被接受。

**對抗性重標就是在修這個。** 你把「曾經被過度接受的東西」變成明確的 reject 錨點，
下一版 rubric 就必須學會擋它。

> **檢核點：** 三題選擇題。
>
> **1.** 為什麼閘門只在錨點上比較？
> （a）錨點比較少，跑得快　（b）錨點沒有被任何一版 rubric 影響過　（c）錨點比較難　（d）論文這樣寫
>
> **2.** 選擇性擦除要刪掉什麼？
> （a）舊的分數列　（b）舊的原始輸出　（c）都不刪，只加 stale 旗標　（d）舊的錨點標註
>
> **3.** 對抗案例要在什麼時候加？
> （a）v2 跑完之後　（b）v2 跑之前　（c）升級之後　（d）都可以
>
> **答案：1-(b)、2-(c)、3-(b)。**

---

# Lesson 1 · 寫 v2 + 加對抗樣本（1.5 小時）

## v2 該改什麼

**不是「加更多條目」。** 5–7 條仍然是甜蜜點。

v2 該做的是：**把 v1 在真實使用中暴露出來的模糊處講清楚。**

你已經有一份現成的清單 —— **Week 2 Lesson 4 你改過的那些條目**。
那時候你改到 κ ≥ 0.6 就停了（正確的做法）。**現在把剩下的模糊處處理掉。**

### 三個實際的改法

**改法一 · 把「差一條就過」的案例拿來當素材**

Week 3 的路由記錄了哪些案例是「剛好一條沒過」。**那些就是你 rubric 的邊界所在。**
看那些案例卡在哪一條，那一條就是 v2 要講清楚的。

**改法二 · 拆掉還在晃的條目**

如果有任何一條在 Week 2–3 期間讓你猶豫過「這條到底算過還是不算過」，拆成兩條。

**改法三 · 補上 canary 沒抓到的漏洞**

你的 canary 抓的是一種特定的壞。**還有哪些壞法它抓不到？** 那些就是 v2 的新條目。

## 動手 · 寫 v2（45 分鐘）

存成 `rubrics/spec-resolution-v2.json`，`version: 2`，**`active: false`**。

> **`active` 一定要是 false。** 升級是閘門的職責，不是你手動改的。
> 資料庫上那個唯一索引也會阻止你有兩列 active。

**寫完用一題檢查：**

```
□ 對每一條改動，我能說出「v1 的哪一個具體案例暴露了這個問題」
```

**說不出來的改動，刪掉。** 那是憑感覺改的，不是被證據驅動的 ——
而憑感覺改的 rubric 就是這門課從第一天就在防的東西。

## 動手 · 加對抗案例（45 分鐘）

**去哪裡找：**

```sql
-- 在 Supabase SQL Editor 跑這段，找出 v1 接受過的案例
select r.id, c.case_ref, c.input, r.verdict, c.expected_verdict
from   agent_runs r
join   eval_cases c on c.id = r.input_ref
where  r.rubric_version = 1
  and  r.verdict = 'accept'
  and  not r.stale
order  by r.created_at desc;
```

**然後自己看一遍那份清單**，問每一條：

> **我現在還同意這個 accept 嗎？**

不同意的那些，就是你的對抗案例。**通常會有 1–3 條。一條都沒有也是合理的結果**
（代表 v1 沒有明顯的過度接受），那就跳過這一步，不要為了湊數硬找。

**加進去：** 新增 `eval_cases` 列，`expected_verdict = 'reject'`、`is_anchor = true`、
`is_adversarial = true`、`note` 填一句「v1 accepted this; I disagree because ___」。

> **注意：這是新增錨點，不是修改錨點。** 新增永遠合法。
> `is_adversarial` 欄位 schema 裡已經有了。

> **檢核點：**
> ```
> □ rubrics 表有 version = 2、active = false
> □ v2 的每一條改動我都能指出是哪個案例逼出來的
> □ 對抗案例已經加進 eval_cases（或我確認一條都沒有，並知道為什麼）
> □ 我沒有修改任何既有的錨點標註
> ```

---

# Lesson 2 · 跑一次真的紀元轉換（3 小時）

**這是這整個四週計畫的核心 3 小時。**

## 先預測（不要跳過）

```
我猜 κ_anchor(v1) = ＿＿＿
我猜 κ_anchor(v2) = ＿＿＿
我猜 v2 會不會通過閘門：會 / 不會
```

**寫下來。** 這是四週來第四次用同一招，而這次的對照最重要 ——
因為你會發現自己對「我寫的東西有多好」的直覺，準確度有多低。

## 動手

```
GOAL: In worktracker/, add `npm run epoch-transition`. This is the most
consequential script in the project — be conservative and loud.

State your one-line verification plan per item BEFORE writing any of it.

1. Score BOTH the active rubric and the challenger (pass version numbers as
   arguments) on ANCHOR CASES ONLY (is_anchor = true). Include adversarial
   anchors. Do not touch non-anchor cases in this step.

2. Compute anchor kappa for each version. Print both, plus the anchor count and
   how many of those anchors are adversarial.

3. GATE: promote the challenger ONLY IF kappa(challenger) >= kappa(incumbent).
   - If it does not pass, print the two numbers, print "NOT PROMOTED", change
     nothing, and exit 0. A blocked promotion is a successful run, not an error.
   - Never auto-adjust the threshold. Never retry with different cases.

4. If promoted:
   a. Set the challenger active = true and the incumbent active = false.
   b. SELECTIVE ERASURE: set stale = true on all agent_runs rows for the
      incumbent version where the case is NOT an anchor.
      - Do NOT delete any row. Do NOT touch raw outputs or evidence.
      - Do NOT mark anchor rows stale.
      - Print how many rows were marked.
   c. Insert one epoch_transitions row: rubric_name, from_version, to_version,
      anchor_kappa_from, anchor_kappa_to, promoted, n_anchors, n_marked_stale,
      and a notes field I will pass in as an argument.

5. If NOT promoted, still insert an epoch_transitions row with promoted = false
   and both kappa values. A rejected challenger is a result worth keeping.

HARD CONSTRAINTS — these protect the integrity of the whole project:
- NEVER write to eval_cases. Not the verdicts, not the anchor flags, nothing.
- NEVER modify expected_verdict anywhere, for any reason.
- Run in a dry-run mode by default; require an explicit --commit flag to write.
  Print exactly what --commit would do.
```

### 認出這段 prompt 裡的三個設計決策

| 設計 | 它在防什麼 |
|---|---|
| 「A blocked promotion is a successful run」 | 防止 AI 把「沒通過」當成錯誤，然後「幫你」重試到通過 |
| 「NEVER write to eval_cases」出現兩次 | 這是你的 ground truth。說兩次不是冗贅，是因為這條被違反的後果無法復原 |
| dry-run 預設 + `--commit` 才寫入 | 讓你在真的改資料庫之前先看一遍它要做什麼 |

## 跑：先 dry-run

```
npm run epoch-transition -- --from 1 --to 2
```

**看它印出來的東西，逐項確認：**

```
□ 錨點數對不對（含對抗案例）
□ 兩個 κ 都印出來了
□ 它的升級判斷跟我自己拿那兩個數字比的結果一樣
□ 如果會升級，它說要標 stale 的列數合理（≈ 非錨點案例數 × 已跑輪數）
□ 它沒有說要改任何 eval_cases 的東西
```

**最後一項最重要。** 有任何跡象要動 `eval_cases`，停下來，先改程式碼。

## 然後 commit

```
npm run epoch-transition -- --from 1 --to 2 --commit --notes "v2: 拆開 c2、補上 c3 的系列名漏洞"
```

## 兩種結果，兩種正確反應

### 結果 A · v2 通過了

1. 到 `/dashboard` 看 —— **應該出現你的第一條紀元分界線**（v1 → v2）
2. 確認舊的非錨點分數被標了 stale，而且**曲線因此變短了**（因為儀表板只看 `stale = false`）
3. 確認**錨點的分數沒有被標 stale**

> 那條垂直線是你這四週最具體的產出。**它讓「我換過尺」這件事永久地無法被藏起來。**

### 結果 B · v2 沒通過

**這才是需要紀律的那個結果。**

**正確的下一步：**

```
✓ 找出 v2 在哪幾條錨點上判錯了、v1 判對了
✓ 看那些錨點有什麼共同點 —— 通常是你 v2 改嚴的那一條改過頭了
✓ 寫 v3，只改那一個地方，重跑閘門
```

**錯誤的下一步（每一個都會毀掉這個專案）：**

```
✗ 調閘門條件（例如改成「差 0.05 以內也算過」）
✗ 改那幾條錨點的標註
✗ 把那幾條錨點從錨點集移除
✗ 加幾條 v2 判得好的新錨點來稀釋
```

> **最後那一項是最陰險的，因為它看起來完全合理** —— 「多加幾條案例讓評估更全面」
> 聽起來像好事。
>
> 但如果你是**看了 v2 的結果之後**才決定加哪些案例，那你就是在挑對 v2 有利的考題。
> **這是對錨點優化，只是繞了一圈。**
>
> 分辨方法：**如果我還不知道 v2 的分數，我還會想加這幾條嗎？**

> **檢核點：**
> ```
> □ epoch_transitions 表有一列，兩個 κ 值和 promoted 都有記
> □ 如果升級了：dashboard 上有紀元分界線，非錨點舊分數 stale = true，錨點沒有
> □ 如果沒升級：我寫下了 v2 在哪幾條錨點上輸給 v1，而且我沒有動閘門或標註
> □ eval_cases 的 expected_verdict 一個都沒變（跟 Week 2 的 commit 比對）
> ```
> 最後一項用 git 或 SQL 比對，**不要靠記憶**。

---

# Lesson 3 · 打包成 `eval-loop` Skill（3 小時）

## 為什麼要打包

因為你現在有一套流程，散在幾個 npm script、一個 prompt 檔案、和你腦中的順序裡。

**打包成 Skill 之後，你可以對 Claude Code 說「跑一次 eval」，它就知道整套規則。**
包括那些你花了四週才學會的規則 —— 跨家族、二元、結合式、引證據、不要動錨點。

## Skill 是什麼（10 分鐘就夠）

一個 Skill 就是**一個資料夾加一個 `SKILL.md`**：

```
.claude/skills/eval-loop/
├── SKILL.md                        ← 主檔案
└── reference/
    ├── rubric-schema.md
    ├── judge-prompt.md
    └── epoch-transition.md
```

`SKILL.md` 的開頭是 frontmatter：

```markdown
---
name: eval-loop
description: Run a rubric-based, bias-controlled evaluation... Triggers on
  "evaluate the agent", "run the eval", "epoch transition".
---
```

### 兩件關於 `description` 的事

1. **它決定這個 Skill 什麼時候被載入。** 寫得模糊，該用的時候不會被觸發。
2. **它要包含使用者可能說的話。** 這就是為什麼上面那段結尾列了觸發語。

### 漸進揭露（progressive disclosure）

**這是 Skill 設計的核心概念，而且它跟你這四週學的東西是同一個原理。**

- `SKILL.md` **本體要短** —— 只放「總是需要知道的規則」
- 細節放 `reference/` 裡的檔案 —— **需要的時候才讀**

**為什麼：** 因為 context 是有限資源。把三千字的 rubric 撰寫指南塞進主檔案，
會讓每一次無關的對話都付那個成本。

> **這個取捨你已經很熟了：** 它跟「rubric 5–7 條就好，超過 10 條一致性會掉」
> 是同一件事的不同版本 —— **資訊多不等於判斷好。**

### Skill 和 Subagent 的差別（一句話）

| | 是什麼 | 什麼時候用 |
|---|---|---|
| **Skill** | 一組載入到**當前對話**的指示 | 你要 Claude 用特定方式做事 |
| **Subagent** | 一個**獨立 context** 的助手，跑完回報結果 | 你要平行處理、或不想讓中間過程佔用你的 context |

**你的 eval-loop 是 Skill**，因為你要在自己的對話裡看著它跑、隨時介入。

## 動手

**`.claude/skills/eval-loop/SKILL.md` 已經存在了，但它是 stub** —— 從 Week 1 就放在那裡，
標明「這在 Week 4 變成真的」。

**現在把它變成真的。**

```
GOAL: Turn the stub at .claude/skills/eval-loop/SKILL.md into a working skill
that reflects what I ACTUALLY built over four weeks, not what the stub aspires to.

1. Read the existing stub first. Keep its structure and its principles — they are
   correct. Replace anything that describes a capability I did not build.

2. Read my actual scripts in worktracker/ and make the workflow section match the
   real commands, real table names, and real file paths. If the stub mentions
   something that does not exist, either remove it or mark it explicitly as
   "not built — see PROGRESS.md".

3. Create the three reference files the stub already lists:
   - reference/rubric-schema.md — the JSON shape, plus the criteria-writing rules
     (binary, evidence-bounded, conjunctive) and the trap that a criterion can
     satisfy every rule and still be bad (e.g. measuring length).
   - reference/judge-prompt.md — the actual judge prompt I am using, copied from
     worktracker/prompts/judge.md, not a rewritten version.
   - reference/epoch-transition.md — the gate, selective erasure, adversarial
     relabeling, and the list of things that must NEVER be done when a challenger
     fails the gate.

4. Keep SKILL.md itself SHORT. Details belong in reference/. Progressive
   disclosure is the point.

CONSTRAINTS:
- Do not describe capabilities I did not build. An honest skill that says
  "position-bias control is not implemented" is worth more than one that implies
  it is.
- The "never modify anchor labels" rule must appear in SKILL.md itself, not
  buried in a reference file. It is the one rule that must always be loaded.
```

**最後那條約束是這一課的重點。** 漸進揭露的判斷標準是：
**「如果這條規則沒被載入，會發生無法復原的壞事嗎？」** 會的話就放主檔案。

「不要改錨點標註」符合這個標準。「rubric JSON 的欄位順序」不符合。

## 驗證：真的用一次

**不要只看檔案寫得對不對。** 開一個新的 Claude Code session，說：

```
用 eval-loop skill 跑一次評估
```

**看它有沒有：**

```
□ 自動載入這個 skill（不用你貼任何東西）
□ 講出跨家族 judge 的要求
□ 提到不能改錨點
□ 用對的指令和對的表名
```

**沒有自動載入的話**，問題在 `description` —— 它沒有涵蓋你剛才說的那句話。改它，再試。

> **檢核點：** 一個新 session 光憑「跑一次評估」就能正確載入並執行，
> 而且它主動提到了錨點規則。

---

# Lesson 4 · Notion 回寫（1.5 小時）

## 這一課在做什麼

把評估摘要寫回你的 Notion task。**讓評估結果出現在你本來就會看的地方。**

Week 2 的同步是**唯讀**（Notion → Supabase）。這一課加**回寫**（Supabase → Notion）。

## 先講風險

> **這是這四週唯一一個會修改外部系統的動作。**

前面所有的東西最壞的情況是「你的資料庫裡有錯的數字」。**這一課最壞的情況是
「你的真實工作任務被改壞了」。**

所以這一課的約束比其他課都嚴：

```
✓ 只寫一個地方：task 頁面的 comment 或一個專用欄位
✗ 不改 Task 標題
✗ 不改 Status
✗ 不改 Due Date
✗ 不刪任何東西
```

## 動手

```
GOAL: In worktracker/, add `npm run report-to-notion`.

It writes a short evaluation summary back to ONE Notion task that I specify by
ID on the command line.

WHAT TO WRITE: a comment on that page containing:
- active rubric name and version
- anchor kappa, and whether it is above 0.6
- pass rate over non-stale runs for the active version
- total cost_usd for the current version
- the date of the most recent epoch transition, if any

HARD CONSTRAINTS:
- Append a COMMENT only. Do not modify any page property — not Status, not Task,
  not Due Date, nothing.
- Never delete or edit an existing comment. Append only.
- Dry-run by default. Print the exact text it would post. Require --commit to
  actually post.
- Take the target page ID as an explicit argument. Never loop over all tasks,
  and never guess which task I meant.
```

> **「Never loop over all tasks」那條不是多慮。** 一個寫成迴圈的回寫腳本，
> 一次執行就能在你所有真實任務上留下留言。**dry-run 預設 + 明確指定目標**，
> 是這裡唯一的保險。

**先跑 dry-run，把它要貼的文字讀一遍，再加 `--commit`。**

> **檢核點：** 你的一則 Notion task 上有一條評估摘要留言，
> 而且那則 task 的所有屬性都沒變（自己去頁面上看一眼）。

---

# Lesson 5 · 反模式稽核（1.5 小時）

**最後一課，也是這四週真正的期末考：你的評估迴圈在騙你嗎？**

## 六個反模式，一個一個查

對每一項，**去看實際的資料或程式碼**，不要憑印象回答。

### 1 · 獎勵駭客 / Goodhart

**症狀：** 分數上升，實際品質沒動。

**怎麼查：** 比較**錨點上的 κ** 和**非錨點案例的通過率**這四週的走勢。

```
□ 通過率上升，錨點 κ 也上升或持平  →  正常
□ 通過率上升，但錨點 κ 下降        →  ⚠️ 你在鑽自己的指標
```

### 2 · Judge 過度接受

**症狀：** 同家族 judge 對 AI 產出蓋橡皮圖章。

**怎麼查：** 你有 canary 了。**去看它最後一次執行的結果。**

```
□ canary 被正確拒絕，而且是因為對的條目  →  正常
□ canary 通過了                          →  ⚠️ judge 太鬆，通過率不能信
□ 我不記得 canary 上次跑是什麼時候        →  ⚠️ 去跑一次
```

### 3 · 錨點漂移

**症狀：** 為了讓新版好看，偷偷改錨點標註。

**怎麼查：** 這個可以**用 git 精確查**：

```bash
git log -p --all -- supabase/ | grep -i "expected_verdict"
```

然後對照 `eval_cases.note` 欄位和 commit message。

```
□ 所有錨點標註從建立以來沒動過                    →  正常
□ 有動過，而且 commit message 和 note 都有說明     →  可接受
□ 有動過，但沒有記錄                              →  ⚠️ 這是最嚴重的一項
```

### 4 · 過擬合小評估集

**症狀：** 那 25 條背起來了，真實輸入照樣失敗。

**怎麼查：** 看 `eval_cases.created_at` 的分佈。

```
□ 案例是分幾週陸續加的，包含後來遇到的真實失敗  →  正常
□ 所有案例都是同一天建的，之後再也沒長大        →  ⚠️ 你沒在學東西
```

> **這一項你這四週大概不會過關，而那是正常的** —— 四週太短。
> 重點是**認出這個習慣要在後面養成**：每一次真實失敗都變成一條新案例。

### 5 · 順序 / 冗長偏誤失控

**怎麼查：**

```
□ rubric 全部是二元條目，沒有任何一條在量長度        →  正常
□ 有在做兩兩比較，但沒有做順序交換                   →  ⚠️
□ 沒有做兩兩比較，所以不適用（而且 PROGRESS.md 記了）  →  正常
```

**Week 3 Lesson 0 要你記那一行，就是為了這一刻。**

### 6 · 條目太模糊

**怎麼查：** 同一批案例跑兩次，逐條比對。

```
□ 兩次的 per_criterion_json 完全一樣  →  正常
□ 有條目結果不同                      →  ⚠️ 那條定義不足，拆掉它
```

## 把結果寫下來

**六項的稽核結果寫進 `PROGRESS.md`。** 有 ⚠️ 的項目，寫一句「我打算怎麼修」。

> **不要為了讓稽核表好看而修東西。** 這份表的價值完全在於它是誠實的 ——
> 一份六項全綠但你知道有一項是硬湊的稽核表，比一份四綠兩紅的誠實表格糟糕得多。

> **檢核點：** `PROGRESS.md` 裡有六項稽核結果，每一項都是看了實際資料或程式碼之後填的，
> 而且 ⚠️ 的項目都有一句後續計畫。

---

# 週末回顧（1 小時）

**這是四週的最後一份作業。** 四題。

### 第 1 題（15 分鐘）· 閘門的那一刻

回答：

> **v2 通過了還是被擋下來？我當時第一個念頭是什麼？**

如果被擋下來了 —— **你有沒有想過繞過它？想過什麼繞法？**

如果通過了 —— **如果它沒通過，你覺得你會怎麼做？誠實回答。**

**這一題沒有正確答案，但它是這四週最重要的一題。** 因為「想繞過閘門」的衝動是
永遠不會消失的，而唯一的防禦是你認得出它。

### 第 2 題（20 分鐘）· 三個你還不相信的東西

回去看 Week 1、2、3 週末的第 3 題 —— 你寫了三件「學到但還不相信」的事。

對每一件回答：**驗證了嗎？結果是什麼？**

```
Week 1 我不相信：＿＿＿＿  →  結果：＿＿＿＿
Week 2 我不相信：＿＿＿＿  →  結果：＿＿＿＿
Week 3 我不相信：＿＿＿＿  →  結果：＿＿＿＿
```

**至少有一個應該是「我原本的懷疑是對的，課程講得太滿」。** 如果三個都變成
「課程說的沒錯」，那更可能是你沒有真的在檢驗它。

### 第 3 題（15 分鐘）· 你會帶回日常工作的一件事

**不是「我學到很多」。** 具體一件事，而且要能在下週一做。

範例（不要照抄）：

> 「我下一份 spec 的每一條驗收條件，都要通過四題檢查表。過不了四題的就不寫進 spec。」

然後回答：**這件事我上週有做嗎？沒做的原因是什麼？**

### 第 4 題（10 分鐘）· 更新 PROGRESS.md

把這些寫進去：

```
- rubric 目前版本、錨點數、最新的錨點 κ
- 紀元轉換記錄（v1 → v2 通過或沒通過，兩個 κ 值）
- 六項反模式稽核結果
- 我刻意沒做的東西，以及觸發條件（例如位置偏誤控制）
- 下一步
```

**最後一項最重要。** 這四週結束了，但這個迴圈的價值在於它繼續跑。

---

# 本週自我檢核

1. 為什麼閘門只在錨點上比？
2. 選擇性擦除刪掉什麼？為什麼不刪原始輸出？
3. 不做選擇性擦除會發生什麼？那個現象的數字是什麼？
4. 對抗案例要在 v2 跑之前還是之後加？為什麼？
5. v2 沒通過閘門，四個絕對不能做的動作是什麼？
6. 「加幾條新錨點讓評估更全面」什麼時候是作弊？
7. 漸進揭露的判斷標準是什麼？
8. 為什麼「不要改錨點標註」必須寫在 `SKILL.md` 本體而不是 reference 裡？
9. Notion 回寫為什麼只能加留言、不能改屬性？
10. 六項反模式稽核裡，哪一項你這四週大概不會過關？為什麼那沒關係？

## 答案

1. 因為錨點沒有被任何一版 rubric 影響過。用非錨點案例比會偏向現任版本。
2. **什麼都不刪。** 只在舊版的非錨點分數上加 `stale = true`。保留原始輸出，因為重新評分比重新執行 agent 便宜得多。
3. 舊排名會把新排名釘死 —— 論文的對照組停在 Spearman **ρ ≥ 0.90**，換了尺等於沒換。
4. **之前。** 之後才加，等於在挑對 v2 有利的考題。
5. 調閘門條件、改錨點標註、把錨點移出錨點集、加新錨點稀釋。
6. **當你已經知道 v2 的分數之後才決定加哪些。** 分辨方法：如果我還不知道分數，我還會想加這幾條嗎？
7. 「這條規則沒被載入，會發生無法復原的壞事嗎？」會 → 主檔案；不會 → reference。
8. 因為它符合上面那個標準 —— 錨點被改動是無法復原的，所以那條規則必須永遠處於載入狀態。
9. 因為那是真實的工作任務。最壞情況從「資料庫裡有錯數字」變成「我的工作被改壞了」。
10. **第 4 項（過擬合小評估集）。** 四週太短，評估集不會有機會從真實失敗中長大。重點是認出那個習慣要在之後養成。

---

# 四週結束時你應該能說出的五句話

1. **評估有兩層：結果和過程。只看結果會高估能力，因為它可能靠運氣對。**
2. **LLM 裁判有四種系統性偏誤，最危險的是它偏袒自己家族的產出 —— 而最便宜的防禦是換一個家族。**
3. **好的評分條目是二元的、要引證據的、而且必須全部通過 —— 但符合這三條的條目仍然可能是壞條目。**
4. **一致率會騙人。κ 扣掉了碰巧一致的部分，而 0.6 是「看起來能用」和「真的能用」的界線。**
5. **固定的評分標準遲早會被鑽漏洞，所以標準必須有紀律地演化 —— 用錨點守住方向，用紀元守住比較基準，用選擇性擦除確保換尺是真的換。**

**第 5 句是這四週的中心。** 而你現在有一條資料庫記錄可以證明你真的做過一次。

---

# 接下來

這四週刻意跳過了一堆東西 —— 樹搜尋、Thompson sampling、UCB-Air 閘門、
自我修改的 Meta-Agent。理由寫在 `CLAUDE.md` 的「Deliberately out of scope」。

**那些東西的共同點：它們只在「大量自動產生的變體 + 長時間無人監督執行」的規模下才划算。**
你有一個人和四十幾個小時。

**什麼時候該回頭看它們？** 一個具體的觸發條件：
**當你同時維護 5 個以上的 agent 變體、而手動比較已經真的做不動的時候。**

在那之前，你手上這套東西 —— 一份有版本的 rubric、一組錨點、一個跨家族 judge、
一個會擋你的閘門、和一份誠實的稽核表 —— **已經是絕大多數團隊沒有的東西了。**
