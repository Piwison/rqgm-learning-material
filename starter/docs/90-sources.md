# 來源，以及哪些是我自己的判斷

**這份文件的存在本身就是那條規則的實踐：引用的時候把「誰說的、什麼條件」一起講出來。**

查證日期：2026-08-26。

---

## 有來源的部分

### Boris Cherny（Claude Code 作者）

- **explore → plan → code → commit**，多數 session 從 plan mode 開始（shift+tab 兩次），
  跟模型來回到計畫可以接受，再切到 auto-accept
- **CLAUDE.md 進 git，而且會長大** —— Anthropic 內部每個團隊維護一份，
  記錄犯過的錯和團隊慣例。看到 Claude 做錯什麼就加一條
- **把每天重複多次的內圈工作流做成 slash command**，放 `.claude/commands/`，進版控
- 平行開多個 Claude 分頁

來源：[How the Creator of Claude Code Actually Uses Claude Code](https://getpushtoprod.substack.com/p/how-the-creator-of-claude-code-actually) ·
[Boris Cherny's Claude Code Tips](https://howborisusesclaudecode.com/) ·
[claude-code-best-practice（整理版）](https://github.com/shanraisshan/claude-code-best-practice)

> ⚠️ 這些是二手整理，不是 Anthropic 官方文件。官方那篇
> （anthropic.com/engineering/claude-code-best-practices）我在查證時無法存取，
> **所以上面每一條都應該當成轉述，不是原文。**

### Matt Pocock

- **`grill-me`** —— 手動觸發的訪談型 skill，一路問到「設計樹的每一個分支都收斂」。
  它要解決的問題是「沒有人確切知道自己要什麼」
- **smart zone / dumb zone** —— LLM 大約在 10 萬 token 之後明顯退化，
  跟宣稱的視窗大小無關；1M 的視窗只是更多的笨區間。
  他的結論是解法不在更會下 prompt 或更大的模型，**而在回頭用經典軟體工程原則**：
  小而可獨立測試的任務、深模組、TDD、人在迴圈裡把關
- **PRD 是 destination document** —— 結構化地描述目的地，不是拿來逐字精讀的
- **垂直切片 / tracer bullet** —— 每片穿過 schema、service、API、前端，
  薄但完整（詞出自《The Pragmatic Programmer》）
- 完整五步：`/grill-me` → PRD → 切成有相依關係的垂直切片 issue → TDD 紅綠重構 → **在乾淨的 context 裡 review**
- **Evalite** —— 他做的 TypeScript 原生 eval runner，定位是「AI 應用的 Vitest」

來源：[mattpocock/skills](https://github.com/mattpocock/skills) ·
[Workflow for AI Coding 筆記](https://leomax.fyi/blog/matt-pocock-workflow-for-ai-coding/) ·
[Smart Zone 報導](https://finance.biggo.com/news/e7209c094224b09c) ·
[Evalite（InfoQ）](https://www.infoq.com/news/2025/11/evalite-ai-testing/)

### Andrej Karpathy

- **評估危機** —— 他說現在不知道該看什麼指標；MMLU 早就過時，
  SWE-Bench Verified 他喜歡但太窄，Chatbot Arena 被各家實驗室過擬合
  （prompt mining、私有評估轟炸、直接拿排名當訓練訊號）
- **好的評估非常難建** —— 在 Tesla 大約 1/3 時間在資料、1/3 在評估、1/3 在其他所有事
- 他認為**一堆私有評估的集合**可能是一條出路

來源：[Karpathy on the evaluation crisis](https://x.com/karpathy/status/1896266683301659068) ·
[Karpathy on why evals are hard](https://x.com/karpathy/status/1795873666481402010)

### RQGM（這個 repo 的評估部分）

*The Red Queen Gödel Machine: Co-Evolving Agents and Their Evaluators*,
arXiv 2606.26294v1, 2026-06-24, Cambridge MLSys + NVIDIA。

用到的概念：紀元與 Controlled Utility Evolution、ground-truth 錨點、
選擇性擦除（不做的話舊排名被釘死在 Spearman ρ ≥ 0.90）、
邊界上的對抗性重標（最強基準審查器對 AI 產出的接受率最高達人類的 1.91 倍）。

> ⚠️ **作者自己定義它是 preliminary preprint** —— 單次執行、搜尋視野短。
> **概念可靠，所有數字都是暫定的。** 不要拿它的數字當定論。

### 其他有引用的數字

- **Cohen's κ 分級** — Landis & Koch (1977), *Biometrics* 33:159–174。**慣例，不是定律。**
- **LLM judge 與人類的一致率 >80%，約等於人類之間的一致率** — Zheng et al. 2023
  （提出 MT-Bench 的那篇），arXiv 2306.05685
- **RouteLLM 最高 3.66× 成本節省** — Ong et al. 2024, UC Berkeley / Anyscale, ICLR 2025。
  **在 MT Bench 上、維持 95% GPT-4 品質、只送約 14% 給強模型。**
  這是他們資料分佈上的上界，**不是你的**

---

## 沒有來源的部分 —— 這些是我的判斷，不要掛在誰名下

- **證據階梯的五個階數**（`01-verification.md`）—— 我編的分類，方便對話用
- **「什麼時候可以跳過流程」的判斷標準**（做錯了多久才會發現 > 一天就走流程）
- **`/verify`、`/slice`、`/review-fresh` 的具體實作** —— 概念有來源，字是我寫的
- **`/grill-me` 的五個優先鑽點和收尾格式** —— Matt Pocock 有這個 skill，
  但上面那份是我自己的實作，不是他的原文
- **零依賴的 harness 設計**（Node 原生 TS + 內建測試 runner）—— 我的取捨。
  Matt Pocock 的 Evalite 是這個領域比較成熟的工具，**如果你想要 UI 和 trace，用它**

---

## 為什麼要分這一節

因為**二手摘要會夾帶**。

這個 repo 有一個現成的例子：原本的中文摘要裡有「13.0 倍成本削減」和
「Nemotron 3 Ultra」兩個說法，**兩個都不存在於論文裡**。

上面那些連結我查過，但你如果要拿任何一條去說服別人，**自己再點進去看一眼。**
