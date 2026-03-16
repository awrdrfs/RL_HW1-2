# 1-2 工作紀錄：Flask 網格地圖與策略評估 (Policy Evaluation)

## 專案目標
在原本動態網格地圖的基礎上，開發後端的強化學習模型策略評估：使用者透過介面設定出不同的環境模型（起點、終點、障礙物）後，透過點擊「策略評估」按鈕，由後端非同步計算並在網格上顯示每個狀態的預估價值 $V(s)$ 與四個隨機行動方向（↑, ↓, ←, →）。

> 提醒：若在開發前需要<span style="color:red">安裝</span> Flask 或 NumPy，請確認已經正確建立 Python 環境。

## 已完成功能與實作細節

### 1. 後端策略演算法 (Flask + Numpy)
- **`app.py` 擴充 API**：
  - 開發 `/evaluate` POST 路由：負責接收前端的網格 `n`，以及起點、終點與所有障礙物的陣列索引 `index`。
  - **Bellman Equation 價值計算**：宣告並反覆更新每個狀態上的價值陣列 $V(s)$ (Iterative Policy Evaluation)。
  - **環境獎勵機制**：收斂闕值 `theta = 1e-4`，時間折扣因子 `gamma = 1.0`，每次移動獎勵預設為 `reward = -1`。
  - **邊界與內外牆反射 (Bounce back)**：如果嘗試移動的下一格超出 $n \times n$ 的網格邊界，或是該格對應的是障礙物，則下個狀態改為停留在原地 (`next_s = s`)。
  - **終端狀態不予更新**：抵達終點或是作為障礙物的格子將被跳過，終端狀態價值直接鎖定為最大值（正規化後為 1）。
  - **隨機策略評估 (Random Policy Evaluation)**：反覆更新 $V(s)$ 時，假設每個狀態採取四個方向 (UP, DOWN, LEFT, RIGHT) 的機率皆相等 ($0.25$)，以推得在此策略下的價值函數。
  - **最佳行動箭頭 (Greedy Arrows)**：根據算完後的 $V(s)$，找出每個狀態下指向鄰近最大價值的行動方向，並以箭頭標示。
  - **數值正規化 (Normalization)**：計算完成後，將 $V(s)$ 透過 Min-Max Scaling 縮放到 0~1 之間，呈現狀態間的相對價值。

### 2. 前端介面與互動邏輯更新 (JavaScript / HTML / CSS)
- **`templates/index.html` 按鈕區塊**：
  - 於介面中新增「策略評估 (evaluate-btn)」主要按鈕，並且在達到 `DONE` 狀態前將其設為 `disabled` 防止誤觸。
- **`static/script.js` 價值與箭頭顯示**：
  - 收到後端回傳後，自動更新網格，顯示狀態價值 V(s)。
  - 根據後端提供的策略資訊，動態呈現指向「相鄰最大值」的箭頭，指引該狀態下的最優路徑。
- **`static/style.css` 標誌排版優化**：
  - 利用絕對定位建立四角延伸 `.arrow` 的 CSS Layout (包含了 `arrow-up`, `arrow-down` 等設置)，提供清爽和諧的觀看介面。層級控制下確保不遮蔽核心的 Value 數據。

## 1-2 修正：GitHub Pages 靜態化轉換

因應部署至 GitHub Pages 的需求，將原本依賴 Flask 後端計算的邏輯完整移植至前端 JavaScript。

- **靜態資源配置**：
  - 將 `index.html` 從 `templates/` 移至專案根目錄，並將資源連結（CSS/JS）改為相對路徑。
  - 此舉確保在不需要運行 Python 伺服器的情況下（如 GitHub Pages），使用者可以直接透過瀏覽器開啟 `index.html` 正常運作。
- **邏輯遷移 (Native JS)**：
  - 在 `script.js` 中重新實作 `calculateValuesAndPolicy` 函式。
  - 運算邏輯保持與原先 Python 版本完全一致，包含 Bellman Equation、隨機策略評估、貪婪行動箭頭生成以及 Min-Max 正規化。
- **使用者體驗**：
  - 保留所有原有的互動設計與導航功能。
  - 去除 API 呼叫的延遲，提升了策略評估的響應速度。

## 結論
1-2 的開發將純視覺的動態網格擴充成完整的環境，並實現了純前端的 Policy Evaluation 演算法。系統能正確避開使用者自由配置的障礙物與邊界阻擋，計算出隨機策略下的最終價值 $V(s)$，同時達到極佳的視覺化呈現，為接下來實作最佳化演算法 (Policy Iteration / Value Iteration) 的學習提供強力基礎。
