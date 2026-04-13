# AI 開發與自我驗證守則
1. 核心開發流程：紅燈/綠燈/重構 (Red-Green-Refactor)
先寫測試： 在修改任何邏輯前，必須先提供自動化測試（Vitest / React Testing Library）。

故意失敗驗證： 測試完成後，你必須故意修改程式碼邏輯（例如反轉 if 條件或改錯變數），證明測試會變紅燈（失敗），嚴禁測試一開始就是綠燈。

恢復與通過： 證明測試有效後，才允許恢復正確代碼並讓測試通過。

2. 視覺與體驗驗證清單 (UI/UX Audit)
在交付任何組件前，請依照下列標準檢查：

玻璃質感 (Glassmorphism)： 是否包含 backdrop-filter: blur(...) 與帶有透明度的邊框？

彈簧動效 (Spring Physics)： Framer Motion 是否設定了物理參數（如 stiffness, damping），而非簡單的線性時間？

呼吸空間 (Breathing Space)： 邊距 (Padding/Margin) 是否遵循 iOS Design Guidelines，確保視覺不擁擠？

響應式檢查： 組件在行動裝置與桌面端是否都能保持良好的操作感？

3. 測試誠信與品質守則 (Test Integrity)
禁止無效斷言： 嚴禁使用 expect(x).toBe(x) 或缺乏實質檢查的斷言。

拒絕目視證據： 不得將 console.log 或「我看起來沒問題」作為通過標準，必須以測試腳本的綠燈為準。

真實邏輯 mock： 除非是 fixture/mock 測試，否則禁止使用與真實邏輯無關的硬編碼資料。

4. 代碼輸出規範 (Token Efficiency)
省 Token 模式： 僅輸出受影響的函數或組件區塊，並使用註釋標註修改起始位置，禁止全文輸出。



# 核心開發邏輯與省 Token 模式

1. **先規劃後動手**：在撰寫任何程式碼前，請先在 `<thought>` 標籤中簡短分析變動範圍與潛在風險。
2. **省 Token 模式**：當優化或修改程式碼時，僅輸出受影響的函數或組件，**禁止全文輸出**，並使用註釋 `// ... existing code ...` 標註未修改位置。
3. **TypeScript 規範**：必須為導出的函數添加明確類型，嚴禁使用 `any`，優先使用 Spread Operator 進行不可變更新，非同步操作必須包含 try-catch。
4. **C# 規範** (若有使用)：優先使用 `record` 定義資料模型，非同步方法必須傳遞 `CancellationToken` 並使用 `async/await`，嚴禁字串拼接 SQL 或硬編碼密鑰。