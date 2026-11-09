const MOCK_SIMULATION_RESULT = {
  iterations: 1000,
  anova_significant_rate: 0.12,
  tukey_results: [
    { pair: "Mobile vs DevOps", rate: 87, ci: { lower: 5.2, upper: 18.5, mean: 12.9 } },
    { pair: "Mobile vs Embedded", rate: 84, ci: { lower: 6.1, upper: 19.2, mean: 14.9 } },
    { pair: "Mobile vs Backend", rate: 45, ci: { lower: -2.1, upper: 10.5, mean: 6.1 } },
    { pair: "Mobile vs Frontend", rate: 22, ci: { lower: -5.5, upper: 8.2, mean: 3.4 } },
    { pair: "Mobile vs DataScience", rate: 65, ci: { lower: 1.2, upper: 14.3, mean: 11.1 } },
    { pair: "Embedded vs Backend", rate: 12, ci: { lower: -4.0, upper: 6.1, mean: 8.7 } },
    { pair: "DevOps vs Frontend", rate: 8, ci: { lower: -3.5, upper: 7.2, mean: 9.5 } },
    { pair: "DataScience vs Backend", rate: 15, ci: { lower: -2.1, upper: 5.3, mean: 5.0 } }
  ],
  p_value_histogram: [
    { bin: "0.0-0.1", count: 120 },
    { bin: "0.1-0.2", count: 80 },
    { bin: "0.2-0.3", count: 70 },
    { bin: "0.3-0.4", count: 90 },
    { bin: "0.4-0.5", count: 100 },
    { bin: "0.5-0.6", count: 110 },
    { bin: "0.6-0.7", count: 105 },
    { bin: "0.7-0.8", count: 95 },
    { bin: "0.8-0.9", count: 115 },
    { bin: "0.9-1.0", count: 115 }
  ]
};

async function runSimulation() {
  const runBtn = document.getElementById('runSimBtn');
  const iterationsInput = document.getElementById('iterationsInput');
  const resultsDiv = document.getElementById('simulationResults');
  const statusBadge = document.getElementById('simStatus');
  const errorDiv = document.getElementById('simError');

  const iterations = parseInt(iterationsInput.value);
  if (isNaN(iterations) || iterations < 100 || iterations > 10000) {
    errorDiv.style.display = 'block';
    errorDiv.innerText = 'Введите число от 100 до 10000';
    return;
  }

  errorDiv.style.display = 'none';
  runBtn.disabled = true;
  runBtn.innerText = 'Симуляция...';
  statusBadge.innerText = 'Выполняется';
  resultsDiv.style.display = 'none';

  setTimeout(() => {
    const data = { ...MOCK_SIMULATION_RESULT };

    data.iterations = iterations;
    data.anova_significant_rate = 0.10 + (Math.random() * 0.05);

    data.tukey_results = data.tukey_results.map(item => {
      const newRate = Math.min(99, Math.max(1, item.rate + (Math.random() * 4 - 2)));
      return {
        ...item,
        rate: newRate,
        ci: {
          lower: item.ci.lower + (Math.random() * 1 - 0.5),
          upper: item.ci.upper + (Math.random() * 1 - 0.5),
          mean: item.ci.mean + (Math.random() * 0.5 - 0.25)
        }
      };
    });

    renderSimulationResults(data);

    runBtn.disabled = false;
    runBtn.innerText = 'Запустить симуляцию';
    statusBadge.innerText = 'Завершено';
    resultsDiv.style.display = 'block';
  }, 1500);
}

function renderSimulationResults(data) {
  const anovaPercent = (data.anova_significant_rate * 100).toFixed(1);
  document.getElementById('anovaStability').innerHTML = `
        ${anovaPercent}% 
        <span style="font-size: 12px; color: var(--ink-muted); font-weight: 400; margin-left: 8px;">
            (${Math.round(data.anova_significant_rate * data.iterations)} из ${data.iterations})
        </span>
    `;

  const tbody = document.getElementById('tukeyTableBody');
  if (tbody) {
    tbody.innerHTML = data.tukey_results.map(item => {
      const isSignificant = item.rate > 50;
      return `
        <tr>
          <td>${item.pair}</td>
          <td style="font-family: var(--mono); font-weight: 600; color: ${isSignificant ? 'var(--accent-2)' : 'var(--ink-muted)'};">
            ${item.rate.toFixed(1)}%
          </td>
          <td style="font-family: var(--mono);">[${item.ci.lower.toFixed(1)}; ${item.ci.upper.toFixed(1)}]</td>
          <td class="${isSignificant ? 'sig-yes' : 'sig-no'}">${isSignificant ? '✓ Устойчиво' : '○ Случайно'}</td>
        </tr>
      `;
    }).join('');
  }

  const histContainer = document.getElementById('pValueHistogram');
  if (histContainer) {
    const maxCount = Math.max(...data.p_value_histogram.map(b => b.count));

    histContainer.innerHTML = data.p_value_histogram.map(bin => {
      const heightPx = (bin.count / maxCount) * 250;

      return `
              <div style="flex: 1; display: flex; flex-direction: column; justify-content: flex-end; height: 100%; position: relative;">
                  <!-- Значение сверху -->
                  <div style="font-size: 11px; font-family: var(--mono); color: var(--ink); text-align: center; margin-bottom: 4px;">${bin.count}</div>
                  
                  <!-- Сам столбец -->
                  <div style="width: 100%; height: ${heightPx}px; background: var(--ink); border-radius: 2px 2px 0 0; transition: height 0.5s ease;"></div>
                  
                  <!-- Подпись снизу (диапазон) -->
                  <div style="height: 40px; display: flex; align-items: flex-start; justify-content: center;">
                      <div style="font-size: 9px; font-family: var(--mono); color: var(--ink-muted); white-space: nowrap; transform: rotate(-45deg); transform-origin: top center; margin-top: 8px;">${bin.bin}</div>
                  </div>
              </div>
          `;
    }).join('');
  }

  const matrixObj = {};
  data.tukey_results.forEach(r => matrixObj[r.pair] = r.rate);
  renderHeatmap(matrixObj);

  renderAllLollipops(data.tukey_results);
}

function renderAllLollipops(tukeyResults) {
  const container = document.getElementById('lollipopContainer');
  if (!container) return;

  const scale = 20;

  container.innerHTML = tukeyResults.map(item => {
    let leftPercent = (item.ci.lower / scale) * 100;
    let widthPercent = ((item.ci.upper - item.ci.lower) / scale) * 100;
    let meanPercent = (item.ci.mean / scale) * 100;

    leftPercent = Math.max(0, Math.min(100, leftPercent));
    widthPercent = Math.max(0, Math.min(100 - leftPercent, widthPercent));
    meanPercent = Math.max(0, Math.min(100, meanPercent));

    const isSignificant = item.ci.lower > 0;
    const color = isSignificant ? 'var(--accent-2)' : 'var(--ink-muted)';

    return `
      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; font-size: 12px; font-family: var(--mono); margin-bottom: 4px;">
          <span>${item.pair}</span>
          <span style="color: ${color}; font-weight: 600;">
            ${isSignificant ? '✓ значимо' : '○ не значимо'}
          </span>
        </div>
        
        <div style="position: relative; height: 24px; background: var(--bg-panel); border-radius: 6px; overflow: hidden;">
          <!-- Линия оси -->
          <div style="position: absolute; top: 50%; left: 0; width: 100%; height: 2px; background: var(--border); transform: translateY(-50%);"></div>
          
          <!-- Интервал -->
          <div style="position: absolute; top: 50%; left: ${leftPercent}%; width: ${widthPercent}%; height: 6px; background: ${color}; transform: translateY(-50%); border-radius: 3px;"></div>
          
          <!-- Среднее (кружок) -->
          <div style="position: absolute; top: 50%; left: ${meanPercent}%; width: 12px; height: 12px; background: ${color}; border: 2px solid var(--bg-card); border-radius: 50%; transform: translate(-50%, -50%); z-index: 2;"></div>
          
          <!-- Линия нуля -->
          <div style="position: absolute; top: 0; left: 0; height: 100%; width: 1.5px; background: #f44336; z-index: 1;"></div>
        </div>
        
        <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--ink-muted); font-family: var(--mono); margin-top: 2px;">
          <span>${item.ci.lower.toFixed(1)}</span>
          <span>${item.ci.upper.toFixed(1)}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderHeatmap(matrix) {
  const container = document.getElementById('heatmapContainer');
  if (!container) return;

  const pairs = Object.entries(matrix).sort((a, b) => b[1] - a[1]);

  container.innerHTML = pairs.map(([pair, percent]) => {
    const greenOpacity = percent / 100;
    const bgColor = `rgba(76, 175, 80, ${greenOpacity})`;
    const textColor = percent > 50 ? '#fff' : 'var(--ink)';

    return `
            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px; padding: 8px; border-radius: 8px; background: var(--bg-panel);">
                <div style="width: 150px; font-family: var(--mono); font-size: 12px;">${pair.replace(/_/g, ' ')}</div>
                <div style="flex: 1; height: 24px; background: var(--border); border-radius: 12px; overflow: hidden; position: relative;">
                    <div style="width: ${percent}%; height: 100%; background: ${bgColor}; transition: width 0.5s;"></div>
                </div>
                <div style="width: 50px; text-align: right; font-family: var(--mono); font-weight: 600; color: ${textColor};">${percent.toFixed(1)}%</div>
            </div>
        `;
  }).join('');
}

function renderLollipop(ci) {
  const container = document.getElementById('lollipopContainer');
  if (!container) return;

  const scale = 20;

  let leftPercent = (ci.lower / scale) * 100;
  let widthPercent = ((ci.upper - ci.lower) / scale) * 100;
  let meanPercent = (ci.mean / scale) * 100;

  leftPercent = Math.max(0, Math.min(100, leftPercent));
  widthPercent = Math.max(0, Math.min(100 - leftPercent, widthPercent));
  meanPercent = Math.max(0, Math.min(100, meanPercent));

  container.innerHTML = `
        <div style="position: relative; height: 60px; margin-top: 20px; background: var(--bg-panel); border-radius: 8px; overflow: hidden;">
            <!-- Линия оси -->
            <div style="position: absolute; top: 50%; left: 0; width: 100%; height: 2px; background: var(--border); transform: translateY(-50%);"></div>
            
            <!-- Интервал -->
            <div style="position: absolute; top: 50%; left: ${leftPercent}%; width: ${widthPercent}%; height: 8px; background: var(--ink); transform: translateY(-50%); border-radius: 4px;"></div>
            
            <!-- Среднее (кружок) -->
            <div style="position: absolute; top: 50%; left: ${meanPercent}%; width: 16px; height: 16px; background: var(--accent); border: 3px solid var(--bg-card); border-radius: 50%; transform: translate(-50%, -50%); z-index: 2;"></div>
            
            <!-- Метка 0 -->
            <div style="position: absolute; top: 0; left: 0; height: 100%; width: 2px; background: #f44336; z-index: 1;"></div>
            <div style="position: absolute; bottom: -20px; left: 0; font-size: 11px; color: #f44336; font-family: var(--mono);">0</div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
  const runBtn = document.getElementById('runSimBtn');
  if (runBtn) {
    runBtn.addEventListener('click', runSimulation);
  }
});