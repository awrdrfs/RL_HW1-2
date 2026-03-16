document.addEventListener('DOMContentLoaded', () => {
    // 獲取 DOM 元素
    const generateBtn = document.getElementById('generate-btn');
    const evaluateBtn = document.getElementById('evaluate-btn');
    const gridSizeInput = document.getElementById('grid-size');
    const gridContainer = document.getElementById('grid-container');
    const statusMessage = document.getElementById('status-message');
    const obstacleCountSpan = document.getElementById('obstacle-count');
    const stateDot = document.getElementById('state-dot');
    const statusCard = document.querySelector('.status-card');

    // 狀態變數
    let currentN = 5;
    let maxObstacles = 0;
    let obstaclesPlaced = 0;
    // 狀態機：WAITING -> PLACE_START -> PLACE_END -> PLACE_OBSTACLES -> DONE
    let currentState = 'WAITING'; 
    let startIndex = null;
    let endIndex = null;
    let obstacleIndices = [];

    // 初始化網格
    function initGrid() {
        const inputVal = gridSizeInput.value;
        let n = parseInt(inputVal, 10);
        
        // 驗證輸入範圍：5 到 9
        if (isNaN(n) || n < 5 || n > 9) {
            alert('請輸入 5 到 9 之間的有效整數！');
            // 將數值修正到合法範圍內
            n = Math.max(5, Math.min(9, isNaN(n) ? 5 : n));
            gridSizeInput.value = n;
            return;
        }

        currentN = n;
        maxObstacles = n - 2;
        obstaclesPlaced = 0;
        currentState = 'PLACE_START';
        startIndex = null;
        endIndex = null;
        obstacleIndices = [];
        evaluateBtn.disabled = true;
        
        // 清空現有網格
        gridContainer.innerHTML = '';
        
        // 設定 CSS Grid 的列數
        gridContainer.style.gridTemplateColumns = `repeat(${n}, 1fr)`;

        // 動態生成 n x n 個單元格
        for (let i = 0; i < n * n; i++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cell.dataset.index = i;
            
            // 綁定點擊事件
            cell.addEventListener('click', () => handleCellClick(cell));
            
            // 設定編號
            const numberSpan = document.createElement('span');
            numberSpan.classList.add('cell-value');
            numberSpan.textContent = i + 1;
            cell.appendChild(numberSpan);
            
            // 增加進場動畫延遲，產生波浪效果
            cell.style.animationDelay = `${(Math.floor(i / n) + (i % n)) * 0.02}s`;
            cell.style.animation = 'fadeIn 0.3s ease-out both';
            
            gridContainer.appendChild(cell);
        }

        updateUI();
    }

    // 處理單元格點擊事件
    function handleCellClick(cell) {
        // 如果單元格已經被標記，則不可重複點擊
        if (cell.classList.contains('start') || 
            cell.classList.contains('end') || 
            cell.classList.contains('obstacle')) {
            return;
        }

        switch (currentState) {
            case 'PLACE_START':
                cell.classList.add('start');
                startIndex = parseInt(cell.dataset.index);
                currentState = 'PLACE_END';
                updateUI();
                break;
                
            case 'PLACE_END':
                cell.classList.add('end');
                endIndex = parseInt(cell.dataset.index);
                currentState = 'PLACE_OBSTACLES';
                updateUI();
                break;
                
            case 'PLACE_OBSTACLES':
                if (obstaclesPlaced < maxObstacles) {
                    cell.classList.add('obstacle');
                    obstacleIndices.push(parseInt(cell.dataset.index));
                    obstaclesPlaced++;
                    updateUI();
                    
                    // 當障礙物達到上限，進入完成狀態
                    if (obstaclesPlaced >= maxObstacles) {
                        currentState = 'DONE';
                        evaluateBtn.disabled = false;
                        updateUI();
                    }
                }
                break;
        }
    }

    // 更新使用者介面文字與狀態指示燈
    function updateUI() {
        // 更新剩餘數量
        obstacleCountSpan.textContent = Math.max(0, maxObstacles - obstaclesPlaced);
        
        // 移除所有狀態 class
        stateDot.className = 'dot';
        statusCard.style.backgroundColor = '';
        statusCard.style.borderColor = '';

        switch(currentState) {
            case 'PLACE_START':
                statusMessage.textContent = '步驟 1：請點擊地圖設定「起點」（將顯示為綠色）';
                stateDot.classList.add('start');
                statusCard.style.backgroundColor = '#ecfdf5'; // 淺綠色背景
                statusCard.style.borderColor = '#a7f3d0';
                break;
            case 'PLACE_END':
                statusMessage.textContent = '步驟 2：請點擊地圖設定「終點」（將顯示為紅色）';
                stateDot.classList.add('end');
                statusCard.style.backgroundColor = '#fef2f2'; // 淺紅色背景
                statusCard.style.borderColor = '#fecaca';
                break;
            case 'PLACE_OBSTACLES':
                statusMessage.textContent = `步驟 3：請點擊設定「障礙物」，最多還可設定 ${maxObstacles - obstaclesPlaced} 個`;
                stateDot.classList.add('obstacle');
                statusCard.style.backgroundColor = '#f3f4f6'; // 淺灰色背景
                statusCard.style.borderColor = '#e5e7eb';
                break;
            case 'DONE':
                statusMessage.textContent = '設定完成！您可以點擊「策略評估」來推導價值函數 V(s)，或點擊「重置網格」重新設定。';
                stateDot.classList.add('done');
                statusCard.style.backgroundColor = '#eff6ff'; // 恢復預設藍色
                statusCard.style.borderColor = '#bfdbfe';
                break;
            default:
                statusMessage.textContent = '請點擊「重置網格」以開始設定。';
                stateDot.classList.add('waiting');
        }
    }

    // 執行策略評估並顯示更新 (靜態版：直接在前端運算)
    function runPolicyEvaluation() {
        if (currentState !== 'DONE') return;
        
        evaluateBtn.disabled = true;
        const originalText = evaluateBtn.textContent;
        evaluateBtn.textContent = '評估中...';

        // 模擬異步行為以避免 UI 凍結
        setTimeout(() => {
            try {
                const result = calculateValuesAndPolicy(currentN, startIndex, endIndex, obstacleIndices);
                
                // 收到結果後，更新每個格子的顯示內容
                updateGridWithValues(result.values, result.policy);
                statusMessage.textContent = '策略評估完成！箭頭指向目前價值函數下的最優行動。';
                
            } catch (error) {
                console.error('Error assessing policy:', error);
                alert('策略評估失敗。');
            } finally {
                evaluateBtn.disabled = false;
                evaluateBtn.textContent = originalText;
            }
        }, 100);
    }

    // 將原先 app.py 的邏輯移植過來
    function calculateValuesAndPolicy(n, startIdx, endIdx, obstacles) {
        const theta = 1e-4;
        const gamma = 1.0;
        const reward = -1;
        const prob = 0.25;
        const actions = [
            { dr: -1, dc: 0, name: 'up' },
            { dr: 1, dc: 0, name: 'down' },
            { dr: 0, dc: -1, name: 'left' },
            { dr: 0, dc: 1, name: 'right' }
        ];

        let V = new Array(n * n).fill(0);
        
        const getRowCol = (idx) => [Math.floor(idx / n), idx % n];
        const getIdx = (r, c) => r * n + c;
        const isValid = (r, c) => r >= 0 && r < n && c >= 0 && c < n;

        // Value Iteration (Policy Evaluation for Random Policy)
        while (true) {
            let delta = 0;
            let nextV = [...V];
            
            for (let s = 0; s < n * n; s++) {
                if (s === endIdx || obstacles.includes(s)) continue;

                const [r, c] = getRowCol(s);
                let v = 0;

                for (const action of actions) {
                    let nextR = r + action.dr;
                    let nextC = c + action.dc;
                    let nextS;

                    if (isValid(nextR, nextC) && !obstacles.includes(getIdx(nextR, nextC))) {
                        nextS = getIdx(nextR, nextC);
                    } else {
                        nextS = s;
                    }
                    v += prob * (reward + gamma * V[nextS]);
                }

                nextV[s] = v;
                delta = Math.max(delta, Math.abs(nextV[s] - V[s]));
            }
            
            V = nextV;
            if (delta < theta) break;
        }

        // Calculate Greedy Policy
        let policy = Array.from({ length: n * n }, () => []);
        for (let s = 0; s < n * n; s++) {
            if (s === endIdx || obstacles.includes(s)) continue;

            const [r, c] = getRowCol(s);
            let actionValues = [];

            for (const action of actions) {
                let nextR = r + action.dr;
                let nextC = c + action.dc;
                let nextS;

                if (isValid(nextR, nextC) && !obstacles.includes(getIdx(nextR, nextC))) {
                    nextS = getIdx(nextR, nextC);
                } else {
                    nextS = s;
                }
                actionValues.push(reward + gamma * V[nextS]);
            }

            const maxVal = Math.max(...actionValues);
            actionValues.forEach((val, i) => {
                if (Math.abs(val - maxVal) < 1e-6) {
                    policy[s].push(actions[i].name);
                }
            });
        }

        // Normalization (0 ~ 1)
        const vMin = Math.min(...V);
        const vMax = Math.max(...V);
        let vNorm;
        
        if (vMax > vMin) {
            vNorm = V.map(v => (v - vMin) / (vMax - vMin));
        } else {
            vNorm = new Array(n * n).fill(0);
        }

        const roundedV = vNorm.map(v => Math.round(v * 100) / 100);
        return { values: roundedV, policy: policy };
    }

    // 更新網格顯示 Values 與 Arrows
    function updateGridWithValues(values, policy) {
        const cells = document.querySelectorAll('.grid-cell');
        cells.forEach((cell, idx) => {
            const valueSpan = cell.querySelector('.cell-value');
            
            // 清除現有的箭頭
            const existingArrows = cell.querySelectorAll('.arrow');
            existingArrows.forEach(a => a.remove());
            
            if (cell.classList.contains('end')) {
                valueSpan.textContent = '1';
            } else if (cell.classList.contains('obstacle')) {
                valueSpan.textContent = ''; // 隱藏障礙物的數值
            } else {
                valueSpan.textContent = values[idx];
                
                // 畫最優策略的箭頭
                if (policy && policy[idx]) {
                    policy[idx].forEach(dir => {
                        const arrow = document.createElement('div');
                        arrow.className = `arrow arrow-${dir}`;
                        const arrowsDict = {'up': '↑', 'down': '↓', 'left': '←', 'right': '→'};
                        arrow.textContent = arrowsDict[dir];
                        cell.appendChild(arrow);
                    });
                }
            }
        });
    }

    // 綁定按鍵事件
    generateBtn.addEventListener('click', initGrid);
    evaluateBtn.addEventListener('click', runPolicyEvaluation);
    
    // 頁面載入時預設初始化一個網格
    initGrid();
});
