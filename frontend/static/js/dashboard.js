
function animateValue(element, start, end, duration = 1000, suffix = '') {
  if (!element) return;
  const range = end - start;
  const increment = range / (duration / 16);
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if (current >= end) {
      element.innerText = Math.round(end) + suffix;
      clearInterval(timer);
    } else {
      element.innerText = Math.round(current) + suffix;
    }
  }, 16);
}

function addStatTooltips() {
  const statCards = document.querySelectorAll('.stat-card');
  const tooltips = {
    totalRespondents: 'Общее количество студентов, принявших участие в опросе',
    meanAge: 'Средний возраст всех респондентов',
    genderRatio: 'Соотношение женщин и мужчин среди опрошенных',
    budgetRatio: 'Соотношение бюджетников и контрактников'
  };

  Object.keys(tooltips).forEach(id => {
    const element = document.getElementById(id);
    if (element && element.parentElement) {
      const card = element.closest('.stat-card');
      if (card) {
        card.setAttribute('data-tooltip', tooltips[id]);
        card.classList.add('has-tooltip');
      }
    }
  });
}

function animateGenderRatio(element, startFemale, startMale, endFemale, endMale, duration) {
  if (!element) return;
  const startTime = performance.now();
  const femaleRange = endFemale - startFemale;
  const maleRange = endMale - startMale;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const currentFemale = Math.round(startFemale + femaleRange * progress);
    const currentMale = Math.round(startMale + maleRange * progress);

    element.innerHTML = `${currentFemale} / ${currentMale}`;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

function animateBudgetRatio(element, startBudget, startContract, endBudget, endContract, duration) {
  if (!element) return;
  const startTime = performance.now();
  const budgetRange = endBudget - startBudget;
  const contractRange = endContract - startContract;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const currentBudget = Math.round(startBudget + budgetRange * progress);
    const currentContract = Math.round(startContract + contractRange * progress);

    element.innerHTML = `${currentBudget} / ${currentContract}`;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

async function loadDashboard() {
  // Проверяем доступность бэка
  const isBackendAvailable = await API.checkBackendHealth();

  // Загружаем данные (из реального бэка или mock)
  const data = await API.fetchStatistics();

  // Если бэк вернул ошибку или нет данных
  if (!data || data.message === 'no data yet') {
    console.warn('Нет данных от бэка');
    document.getElementById('totalRespondents').innerText = '0';
    document.getElementById('footerCount').innerHTML = '0 респондентов';
    return;
  }

  // ========== РАНЖИРОВАНИЕ ФАКТОРОВ ==========
  let rankingFactors = [];
  if (data.ranking && data.ranking.factors) {
    rankingFactors = data.ranking.factors;
  } else if (data.factor_ranking && data.factor_ranking.all) {
    // fallback на mock-структуру
    rankingFactors = data.factor_ranking.all;
  }

  const top5 = rankingFactors.slice(0, 5);
  const topHtml = top5.map((f, i) => `
        <div class="rank-item">
            <div class="rank-number">${i + 1}</div>
            <div class="rank-name">${f.FactorName || f.name}</div>
            <div class="rank-bar-bg"><div class="rank-bar" style="width: ${(f.Average || f.mean) * 10}%"></div></div>
            <div class="rank-score">${(f.Average || f.mean).toFixed(1)}</div>
        </div>
    `).join('');
  document.getElementById('topFactorsList').innerHTML = topHtml;

  // ========== ANOVA ==========
  let anovaHtml = '';
  const anovaItems = [];

  if (data.anova_budget) {
    anovaItems.push({
      name: 'Бюджет',
      f: data.anova_budget.f_value,
      p: data.anova_budget.p_value,
      sig: data.anova_budget.significant
    });
  }
  if (data.anova_distance) {
    anovaItems.push({
      name: 'Близость к дому',
      f: data.anova_distance.f_value,
      p: data.anova_distance.p_value,
      sig: data.anova_distance.significant
    });
  }
  if (data.anova_dormitory) {
    anovaItems.push({
      name: 'Общежитие',
      f: data.anova_dormitory.f_value,
      p: data.anova_dormitory.p_value,
      sig: data.anova_dormitory.significant
    });
  }

  anovaHtml = `<table class="stats-table">${anovaItems.map(r => `
        <tr>
            <td><strong>${r.name}</strong></td>
            <td>F = ${r.f.toFixed(4)}</td>
            <td>p = ${r.p.toFixed(4)}</td>
            <td class="${r.sig ? 'sig-yes' : 'sig-no'}">${r.sig ? '✓ значимо' : '○ не значимо'}</td>
        </tr>
    `).join('')}</table>`;
  document.getElementById('anovaTable').innerHTML = anovaHtml;

  // ========== КРАСКЕЛА-УОЛЛИСА ==========
  if (data.kruskal_wallis) {
    const kw = data.kruskal_wallis;
    const kwHtml = `
            <table class="stats-table">
                <tr>
                    <td><strong>${kw.group_name || 'Направление и страна'}</strong></td>
                    <td>H = ${kw.h_value?.toFixed(4) || '?'}</td>
                    <td>p = ${kw.p_value?.toFixed(4) || '?'}</td>
                    <td class="${kw.significant ? 'sig-yes' : 'sig-no'}">${kw.significant ? '✓ значимо' : '○ не значимо'}</td>
                </tr>
            </table>
        `;
    document.getElementById('kruskalTable').innerHTML = kwHtml;
  }

  // ========== КОРРЕЛЯЦИЯ СПИРМЕНА ==========
  if (data.spearman) {
    const sp = data.spearman;
    const corrHtml = `
            <div class="corr-row">
                <span>${sp.variable_x}</span>
                <span>↔</span>
                <span>${sp.variable_y}</span>
                <span class="${Math.abs(sp.rho) > 0.6 ? 'corr-high' : 'corr-low'}">ρ = ${sp.rho.toFixed(4)}</span>
            </div>
            <div class="corr-row" style="justify-content: flex-start; gap: 16px;">
                <span>Сила: ${sp.strength}</span>
                <span>Направление: ${sp.direction}</span>
                <span>n = ${sp.count}</span>
            </div>
        `;
    document.getElementById('correlationList').innerHTML = corrHtml;
  }

  // ========== ДОВЕРИТЕЛЬНЫЕ ИНТЕРВАЛЫ ==========
  if (data.confidence_intervals && data.confidence_intervals.intervals) {
    const ciSelect = document.getElementById('ciFactorSelect');
    const intervals = data.confidence_intervals.intervals;

    ciSelect.innerHTML = '<option value="">-- выберите фактор --</option>' +
      intervals.map((ci, idx) => `<option value="${idx}">${ci.factor_name}</option>`).join('');

    ciSelect.addEventListener('change', (e) => {
      const idx = e.target.value;
      if (idx !== '') {
        renderConfidenceIntervalsFromBackend(intervals[idx]);
      }
    });
  }

  // ========== КРИТЕРИЙ ТЬЮКИ ==========
  if (data.tukey && data.tukey.pairs) {
    const tukeySelect = document.getElementById('tukeyFactorSelect');
    // Для Тьюки пока просто отображаем все пары
    renderTukeyTableFromBackend(data.tukey.pairs);
    if (tukeySelect) tukeySelect.style.display = 'none';
  }

  // ========== КАРТОЧКИ СТАТИСТИКИ (из mock, т.к. бэк не отдает) ==========
  // Пока оставляем mock-данные для карточек
  const mockData = await mockAPI('/api/statistics');
  if (mockData.descriptive_stats) {
    animateValue(document.getElementById('totalRespondents'), 0, mockData.descriptive_stats.total_respondents, 1500, '');
    animateValue(document.getElementById('meanAge'), 0, mockData.descriptive_stats.mean_age, 1000, '');
    animateGenderRatio(document.getElementById('genderRatio'), 0, 0,
      mockData.descriptive_stats.gender_distribution.female,
      mockData.descriptive_stats.gender_distribution.male, 1200);
    animateBudgetRatio(document.getElementById('budgetRatio'), 0, 0,
      mockData.descriptive_stats.education_form_distribution.budget,
      mockData.descriptive_stats.education_form_distribution.contract, 1200);
    document.getElementById('footerCount').innerHTML = `${mockData.descriptive_stats.total_respondents} респондентов`;
  }

  // График курсов (из mock)
  if (mockData.charts_data && mockData.charts_data.course_bar) {
    const courseData = mockData.charts_data.course_bar;
    const maxValue = Math.max(...courseData.values);
    const barsHtml = courseData.labels.map((label, i) => `
            <div class="bar-item">
                <div class="bar" style="height: ${(courseData.values[i] / maxValue) * 120}px;"></div>
                <div class="bar-label">${label}</div>
                <div class="bar-value">${courseData.values[i]}</div>
            </div>
        `).join('');
    document.getElementById('courseBars').innerHTML = barsHtml;
  }

  // Дата обновления
  const date = new Date();
  document.getElementById('lastUpdateDate').innerHTML = date.toLocaleDateString();

  addStatTooltips();
}

// Функция для отображения доверительных интервалов из бэка
function renderConfidenceIntervalsFromBackend(ci) {
  const container = document.getElementById('ciChartContainer');
  if (!container) return;

  const html = `
        <div style="margin-top: 20px;">
            <div style="margin-bottom: 24px;">
                <div style="font-size: 13px; color: #6B6355; margin-bottom: 6px;">${ci.factor_name} (n=${ci.count})</div>
                <div style="position: relative; background: #D4CBBA; height: 8px; border-radius: 10px;">
                    <div style="position: absolute; left: ${ci.lower * 10}%; width: ${(ci.upper - ci.lower) * 10}%; background: #C0441E; height: 8px; border-radius: 10px;"></div>
                    <div style="position: absolute; left: ${ci.mean * 10}%; width: 2px; height: 16px; background: #1C1912; top: -4px; transform: translateX(-50%);"></div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 11px; color: #6B6355;">
                    <span>${ci.lower.toFixed(2)}</span>
                    <span style="color:#C0441E">среднее: ${ci.mean.toFixed(2)}</span>
                    <span>${ci.upper.toFixed(2)}</span>
                </div>
            </div>
        </div>
    `;
  container.innerHTML = html;
}

// Функция для отображения таблицы Тьюки из бэка
function renderTukeyTableFromBackend(pairs) {
  const container = document.getElementById('tukeyTableContainer');
  if (!container) return;

  const html = `
        <table class="stats-table" style="width:100%; border-collapse: collapse; margin-top: 16px;">
            <thead>
                <tr>
                    <th>Группа 1</th>
                    <th>Группа 2</th>
                    <th>Разница средних</th>
                    <th>p-value</th>
                    <th>Значимость</th>
                </tr>
            </thead>
            <tbody>
                ${pairs.map(p => `
                    <tr>
                        <td>${p.group1}</td>
                        <td>${p.group2}</td>
                        <td>${p.mean_diff.toFixed(2)}</td>
                        <td>${p.p_value.toFixed(4)}</td>
                        <td class="${p.significant ? 'sig-yes' : 'sig-no'}">${p.significant ? '✓ значимо' : '○ не значимо'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
  container.innerHTML = html;
}

// Остальные функции (animateValue, animateGenderRatio, animateBudgetRatio, addStatTooltips) остаются без изменений

document.addEventListener('DOMContentLoaded', loadDashboard);