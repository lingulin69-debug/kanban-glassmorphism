# AI 協作開發指南 — Web 應用專案範本

> **用途**：給 AI 的「框架規則文件」。開新專案時把本文件丟給 AI，省去反覆解釋。
> **適用對象**：美術端 / 非程式背景人員，由 AI 執行全部程式碼。

---

## 0. 專案啟動清單（必讀）

在要求 AI 寫任何程式碼之前，先決定以下項目並告知 AI：

| 項目 | 說明 | 範例 |
|------|------|------|
| **專案名稱** | 英文、小寫、用連字號 | `kanban-glassmorphism` |
| **專案類型** | SPA / MPA / 靜態頁面 | SPA（單頁應用） |
| **技術棧** | 框架 + 構建工具 + CSS 方案 | React + Vite + Tailwind CSS |
| **後端/資料庫** | 有無伺服器端 | Supabase（BaaS） |
| **部署目標** | 部署到哪裡 | Vercel / GitHub Pages |
| **設計風格** | 視覺基調 | 深色玻璃態 / Glassmorphism |
| **音效需求** | 有無互動音效 | 有，Web Audio API + 300% 增益 |

---

## 1. 資料夾結構規範

```
project-root/
├── public/              # 靜態資源（音效、圖片、favicon）
│   └── audio/
├── src/
│   ├── main.jsx         # 進入點，掛載 ErrorBoundary
│   ├── App.jsx          # 主應用邏輯（單一元件不超過 600 行）
│   ├── ErrorBoundary.jsx
│   ├── supabaseClient.js
│   ├── utils/           # 共用工具（音效、日期、格式化）
│   │   ├── audio.js
│   │   └── date.js
│   └── components/      # 獨立元件（超過 200 行就拆出來）
│       ├── GraphView.jsx
│       └── NurturingView.jsx
├── .env.local           # 機密金鑰（不進 Git）
├── .gitignore
├── package.json
└── vite.config.js
```

### 拆檔規則
- **單一檔案不超過 600 行**。超過就拆成獨立元件。
- **共用邏輯抽成 `utils/`**。同樣的函式出現兩次以上 → 抽出。
- **元件與頁面分開放**。頁面級元件放 `src/` 根層，小元件放 `components/`。

---

## 2. 安全性規則（非常重要）

### 2.1 金鑰管理
```
⛔ 絕對不做：
  const url = "https://xxx.supabase.co"     // 硬編碼金鑰
  const key = "eyJhbGciOiJIUzI1NiIs..."     // 直接寫在程式碼裡

✅ 必須這樣做：
  .env.local 裡放：
    VITE_SUPABASE_URL=https://xxx.supabase.co
    VITE_SUPABASE_ANON_KEY=eyJ...

  程式碼裡用：
    import.meta.env.VITE_SUPABASE_URL
```

### 2.2 .gitignore 必備項
```
.env.local
.env
node_modules/
dist/
```

### 2.3 輸入驗證
- 表單送出前：檢查必填欄位（標題不能空）
- 日期邏輯：結束日期 ≥ 開始日期
- JSON 欄位：存入 DB 前確認格式正確

---

## 3. 元件設計模式

### 3.1 錯誤邊界（必備）
```jsx
// main.jsx — 永遠用 ErrorBoundary 包住 App
<ErrorBoundary>
  <App />
</ErrorBoundary>
```
**用途**：任何子元件崩潰時顯示友善錯誤頁面，而非白屏。

### 3.2 Props vs 直接 Import
```
✅ 共用工具（音效、日期）→ 直接 import
   import { playClick } from "./utils/audio"

⛔ 不要透過層層 props 傳遞工具函式
   <Child playClick={playClick} />  // 除非有特殊理由
```

### 3.3 狀態管理原則
- **20 個以下 state** → `useState` 就好
- **超過 20 個相關 state** → 考慮 `useReducer`
- **跨 3 層以上元件** → 考慮 Context
- **全域狀態複雜** → 考慮 Zustand（輕量）

### 3.4 效能守則
- `useMemo` / `useCallback`：只在列表渲染、昂貴計算時使用
- `memo()`：包住不常變化的子元件
- 音效、API Client 等重物件：模組層級初始化一次，不放進元件
- 大型元件：用 React.lazy + Suspense 做程式碼分割

---

## 4. CSS / 視覺風格規範

### 4.1 Tailwind CSS 使用原則
```
✅ 用 Tailwind 類別
✅ 用 CSS 變數做主題切換
⛔ 避免寫 inline style（除非動態計算值）
⛔ 避免 !important
```

### 4.2 深色 / 淺色主題
```javascript
// 用一個 theme 物件統一管理
const themes = {
  dark: { bg: "bg-[#14161F]", text: "text-neutral-100", ... },
  light: { bg: "bg-[#F4F2EF]", text: "text-neutral-800", ... }
}
```

### 4.3 玻璃態（Glassmorphism）注意事項
```
⚠️ backdrop-filter 效能問題：
   - 卡片層級用 rgba + 細邊框 模擬（偽玻璃態）
   - 只有最外層容器或對話框才用真正的 backdrop-blur

   偽玻璃態公式：
     background: rgba(30, 30, 30, 0.8);
     border: 1px solid rgba(255, 255, 255, 0.06);
```

### 4.4 動畫規則
```
✅ 用 Framer Motion 做進場/退場
✅ 設定 willChange 提示瀏覽器
✅ transition 時間 ≤ 300ms（感覺流暢不拖沓）
⛔ 不要在列表的每個項目都加複雜動畫
```

---

## 5. 資料庫規範（Supabase）

### 5.1 Schema 設計
```sql
-- 每張表都要有：
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
created_at timestamptz DEFAULT now(),
updated_at timestamptz DEFAULT now()

-- JSON 欄位給預設值：
income_records jsonb DEFAULT '[]'
tags jsonb DEFAULT '[]'

-- 布林欄位給預設值：
is_nurturing boolean DEFAULT false
```

### 5.2 Realtime 同步
```javascript
// 訂閱即時更新
supabase.channel('tasks')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, handler)
  .subscribe()
```

### 5.3 錯誤處理模式
```javascript
const { data, error } = await supabase.from('tasks').upsert(row)
if (error) {
  console.error('描述性錯誤訊息:', error)
  setSynced(false)  // 更新 UI 狀態
} else {
  setSynced(true)
}
```

---

## 6. 圖形依賴（Graph View）安全規則

### 6.1 循環依賴檢測（必備）
```
⚠️ 在接受新連線之前，必須做 DFS 檢查：
   - A → B → C → A ← 不允許
   - 自連線（A → A）← 不允許

   如果檢測到循環 → 拒絕連線 + console.warn
```

---

## 7. 部署檢查清單

### 部署前
- [ ] `.env.local` 的金鑰沒有出現在任何 `.js` / `.jsx` 檔案裡
- [ ] `npm run build` 沒有錯誤
- [ ] 所有 `console.log` 調試碼已移除
- [ ] ErrorBoundary 已掛載
- [ ] 圖片 / 音效 都在 `public/` 下

### GitHub + Vercel 部署
```bash
# 本地測試
npm run build
npm run preview

# 推送
git add .
git commit -m "描述性的 commit 訊息"
git push origin master
```

### Vercel 環境變數
```
⚠️ Vercel 的環境變數需要在 Dashboard 另外設定：
   Settings → Environment Variables → 加入：
     VITE_SUPABASE_URL
     VITE_SUPABASE_ANON_KEY
```

---

## 8. SQL Migration 範本

每次改 Schema，建立一個新的 SQL migration：

```sql
-- migration: YYYY-MM-DD_描述.sql
-- 說明：加入什麼欄位、為什麼

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS new_column type DEFAULT default_value;
```

---

## 9. AI 協作溝通範本

### 新功能開發（直接複製修改後貼給 AI）

```
我想要新增「XXX功能」

功能描述：
- 做什麼：___
- 數據要存哪裡：Supabase / localStorage / 不用存
- 需要新的 DB 欄位嗎：是（description） / 否

視覺設計：
- 風格：跟現有保持一致（偽玻璃態 + 深色主題）
- 佈局：Grid / Flex / 全寬
- 動畫：有 / 無
- 音效：有（哪個音效） / 無

技術限制：
- 不要用 backdrop-filter 在卡片上
- 要支持深淺色主題切換
- 要有 Supabase Realtime 同步

給我的輸出：
1. 改了哪些檔案（列表）
2. 需要跑的 SQL（如果有）
3. 自動「npm run build」確認無錯誤
```

### Bug 修復

```
我遇到一個問題：
- 什麼情況下出現：___
- 預期行為：___
- 實際行為：___
- Console 有沒有錯誤訊息：___

請找出原因並修復，修完後 build 確認沒有新錯誤。
```

### 程式碼審查

```
請全面檢查目前的程式碼，重點看：
1. 安全性（金鑰有沒有外洩、輸入有沒有驗證）
2. 效能（不必要的重新渲染、大檔案拆分）
3. 程式碼品質（重複程式碼、錯誤處理）
4. 可維護性（檔案大小、命名一致性）

一個一個列出問題，每個附上：
- 嚴重程度（🔴高 / 🟡中 / 🟢低）
- 說明
- 建議的修復方式
```

---

## 10. 已知陷阱與解決方案

| 陷阱 | 現象 | 解決方案 |
|------|------|----------|
| 金鑰外洩 | push 後 Supabase 寄警告信 | 用 `.env.local` + `import.meta.env` |
| 白屏崩潰 | 某個元件 JS 錯誤→整個 App 白屏 | 加 `ErrorBoundary` |
| 循環依賴 | Graph 連線後無限遞迴 | 在 `onConnect` 做 DFS 檢查 |
| 音效重複初始化 | 每個元件各建一個 AudioContext | 抽成 `utils/audio.js` 共用 |
| 日期時區問題 | `new Date()` 可能跑 UTC | 用 `localDateStr` 統一格式化 |
| Tailwind v4 設定 | 找不到 tailwind.config.js | v4 用 CSS-first，設定在 `@tailwindcss/vite` |
| Vercel 部署後 DB 失效 | 線上版讀不到 Supabase | Vercel Dashboard 要另外加環境變數 |
| 大檔案難維護 | 單檔超過 1000 行 AI 改一個地方壞三個 | 拆成 < 600 行的獨立元件 |
| 中文檔名問題 | Git / terminal 中文路徑出錯 | 專案名稱用英文，中文只在 UI 顯示 |

---

## 附錄：本專案技術棧速查

```json
{
  "framework": "React 19",
  "bundler": "Vite 8",
  "css": "Tailwind CSS v4 (CSS-first)",
  "animation": "Framer Motion 12",
  "database": "Supabase (PostgreSQL + Realtime)",
  "graph": "@xyflow/react 12",
  "icons": "lucide-react",
  "audio": "Web Audio API (custom gain)",
  "deploy": "Vercel (auto-deploy from GitHub)",
  "theme": "Dark / Light toggle",
  "style": "Pseudo-glassmorphism (rgba + border)"
}
```
