# 專案起始樣板

一個新專案的起點：**工作流、驗證、評估**三件事都已經接好，而且評估的部分現在就跑得起來。

給用 Claude Code 驅動開發、自己不手寫程式碼的人。

---

## 怎麼用

```bash
cp -r starter ../my-new-project
cd ../my-new-project
git init
```

然後照順序做四件事：

```
1. 填 CLAUDE.md 裡所有【填】的地方          ← 最重要，不要跳
2. 填 PROGRESS.md 的「下一個動作」
3. cd eval && npm run eval                  ← 30 秒，確認環境沒問題
4. 開 Claude Code，跑 /grill-me
```

**第 1 步不要跳。** 一份沒填的 CLAUDE.md 比沒有 CLAUDE.md 更糟 ——
模型會照著範本裡的假設走。

---

## 裡面有什麼

```
CLAUDE.md              專案記憶範本。最重要的是「犯過的錯」那一節
PROGRESS.md            進度範本。含決策紀錄和「刻意跳過 + 觸發條件」
.env.example
docs/
  00-workflow.md       ★ 核心：五步工作流
  01-verification.md   什麼算證據（證據階梯）
  02-evaluation.md     沒有唯一正解的東西怎麼打分
  90-sources.md        來源，以及哪些是我的判斷
.claude/
  commands/            slash commands
    grill-me.md        逼問到設計收斂
    slice.md           切成垂直切片
    verify.md          證明它會動
    review-fresh.md    用乾淨的眼睛審 diff
  skills/eval-loop/    評估迴圈 skill + reference/
eval/                  ★ 零依賴、現在就能跑的評估 harness
```

---

## 五步工作流

```
1. /grill-me        逼問到設計收斂          ← 不寫程式碼
2. 寫下設計共識      給下一個 session 讀的    ← 不寫程式碼
3. /slice           切成垂直切片            ← 不寫程式碼
4. 做一片 + /verify                         ← 這裡才開始寫
5. /clear → /review-fresh                   ← 剛寫完的人審不動自己的東西
```

**前三步都不寫程式碼。** 這是刻意的，也是最多人跳過的部分。

細節、以及為什麼是這五步，在 `docs/00-workflow.md`。

---

## 先試跑評估

這是這個樣板裡唯一「現在就能動」的東西，值得先看：

```bash
cd eval && npm run eval
```

零依賴 —— Node 22 直接跑 TypeScript，不用 `npm install`。
沒有 API key 也能跑（會用離線假 judge）。

你會看到 **κ = 0.462、未過關**，加上四條判定不一致的案例。**那是設計成這樣的。**

看那四條：**其中三條的根因相同** —— 有一條 rubric 條目硬要求輸入裡有數字，
但「檔名包含當日日期」這種東西不用數字也能十秒內驗證。

**要修的是那條條目的用字，不是那三條案例的標註。** 整套評估紀律就是這一句話。

再試這個：

```bash
JUDGE_MODEL=claude-opus-5 JUDGE_API_KEY=x npm run eval
```

它會拒絕執行。**跨家族判定那條規則是程式碼，不是文件裡的一句話。**

---

## 三個設計取捨

**零依賴的 harness。** 代價是不能用 TypeScript 的 enum、namespace、
constructor parameter property（Node 只擦型別、不編譯）。
換來的是每一行你都看得懂、改得動。想要 UI 和 trace 的話，
Matt Pocock 的 **Evalite** 是這個領域比較成熟的工具。

**評估用檔案儲存，不用資料庫。** 開箱就能跑。要換 Supabase 只需要改 `eval/src/store.ts`
一個檔案 —— 那個檔案存在的唯一理由就是這個。

**規則寫成程式碼，不是寫成文件。** 跨家族檢查會拋錯、非結合式的 rubric 會拋錯、
沒有證據的判定會拋錯。**文件裡的規則你半夜十一點會忘記。**

---

## 來源

工作流的部分整理自 Boris Cherny（Claude Code 作者）、Matt Pocock、Andrej Karpathy
公開的做法；評估的部分來自 RQGM 那篇論文的精簡版。

**每一條的出處、以及哪些是我自己的判斷而不該掛在誰名下，都列在 `docs/90-sources.md`。**

那份文件的存在本身就是這套東西的一條規則：**引用的時候，把「誰說的、什麼條件」一起講出來。**
