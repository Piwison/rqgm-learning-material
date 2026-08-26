# eval/ — 評估 harness

**零依賴。** Node 22 直接跑 TypeScript，不需要 `npm install`。

---

## 30 秒試跑

```bash
cd eval
npm run eval
```

沒有設 API key 的話，它會用**離線的假 judge**跑完整條 pipeline。

你會看到 κ = 0.462、未過關，還有四條判定不一致的案例。**那是刻意的** ——
一個開箱就顯示「✓ 過關」的範例什麼都教不了。

看那四條不一致：**其中三條的根因是同一個** —— 條目 `c2` 硬要求輸入裡有數字，
但「檔名包含當日日期」「導向 /login」這種東西不用數字也能十秒內驗證。

**這就是完整的示範：** 要修的是 `c2` 的用字，不是那三條案例的標註。

---

## 跑真的 judge

```bash
cp ../.env.example ../.env    # 填 JUDGE_MODEL 和 JUDGE_API_KEY
export $(grep -v '^#' ../.env | xargs)
npm run eval
```

**judge 不能是 Claude。** 試試看：

```bash
JUDGE_MODEL=claude-opus-5 JUDGE_API_KEY=x npm run eval
```

它會拒絕執行並解釋為什麼。**那條規則是程式碼，不是文件裡的一句話**
—— 文件裡的規則你半夜十一點會忘記。

---

## 測試

```bash
npm test
```

7 個測試，其中兩個斷言文件裡引用的 κ 數字（0.50 和 0.70）。
**測試紅了就代表文件在說謊**，先搞清楚哪邊錯了。

---

## 檔案

```
rubrics/example-v1.json   有版本的二元條目清單
cases/example.json        你的評估集（ground truth，harness 只讀不寫）
prompts/judge.md          judge 的 system prompt —— 改這裡，不要改 TS
runs/                     每次執行一個 JSONL，append-only
src/
  types.ts     共用型別
  kappa.ts     Cohen's κ + Landis & Koch 分級
  kappa.test.ts
  judge.ts     mock + OpenAI，跨家族檢查在這裡
  store.ts     檔案儲存（要換 Supabase 就換這一個檔案）
  run.ts       主流程
```

---

## 換成你自己的東西

1. **`cases/example.json`** —— 換成你真實的判斷。20–30 條，其中約 10 條標 `is_anchor`
2. **`rubrics/example-v1.json`** —— 換成你的條目，5–7 條。
   把 `mock` 欄位刪掉（那只有假 judge 會看）
3. 跑 `npm run eval`，看 κ
4. **κ < 0.6 → 改條目的用字，不要改標註**

寫條目的規則在 `../.claude/skills/eval-loop/reference/rubric-schema.md`。

---

## 兩個刻意的設計

**`cost_usd` 預設是 `null`，不是 0。**
「不知道價格」和「免費」是兩件事，混在一起的時候錯誤方向永遠對你有利
—— 所以你不會發現。要填的話從一張**有標查價日期**的價格表讀。

**harness 絕不寫入 `cases/`。**
那是你的 ground truth。程式碼改壞了有測試擋；資料被「順手整理」過，沒有任何東西會擋。

---

## 為什麼零依賴

Node 22 的 strip-only 模式可以直接跑 `.ts`，`node:test` 是內建的。
所以這個 harness 不需要 tsx、不需要 vitest、不需要 `npm install`。

**代價：** strip-only 只會擦掉型別，不會編譯。所以**不能用**
constructor parameter property、`enum`、`namespace`。
（`store.ts` 裡有一條註解記著這件事，因為我踩過。）

**想要 UI、trace、成本追蹤的話**，Matt Pocock 的 **Evalite** 是這個領域比較成熟的工具。
這裡選擇薄 harness 是為了每一行都看得懂、改得動 —— 那是刻意的取捨，不是它比較好。
