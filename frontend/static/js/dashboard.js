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

function renderConfidenceIntervals(intervals) {
  const container = document.getElementById('ciChartContainer');
  if (!container || !intervals?.length) {
    container.innerHTML = '<div style="color:#6B6355; padding:40px; text-align:center">Нет данных для доверительных интервалов</div>';
    return;
  }
  const html = intervals.map(ci => `
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
    `).join('');
  container.innerHTML = html;
}

function renderTukeyTable(pairs) {
  const container = document.getElementById('tukeyTableContainer');
  if (!container || !pairs?.length) {
    container.innerHTML = '<div style="color:#6B6355; padding:40px; text-align:center">Нет данных для критерия Тьюки</div>';
    return;
  }
  const html = `
        <table class="stats-table" style="width:100%; border-collapse: collapse; margin-top: 16px;">
            <thead><tr><th>Группа 1</th><th>Группа 2</th><th>Разница средних</th><th>p-value</th><th>Значимость</th></tr></thead>
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

async function loadDashboard() {
  const data = await API.fetchStatistics();
  if (!data) {
    console.warn('Нет данных от бэка');
    return;
  }

  // ========== КАРТОЧКИ статистики из mock (в бэке нет) ==========
  const mockData = await fetch('/static/js/mock-data.js').then(res => res.json()).catch(() => null);
  if (mockData?.descriptive_stats) {
    animateValue(document.getElementById('totalRespondents'), 0, mockData.descriptive_stats.total_respondents, 1500, '');
    animateValue(document.getElementById('meanAge'), 0, mockData.descriptive_stats.mean_age, 1000, '');
    const g = mockData.descriptive_stats.gender_distribution;
    document.getElementById('genderRatio').innerHTML = `${g.female} / ${g.male}`;
    const e = mockData.descriptive_stats.education_form_distribution;
    document.getElementById('budgetRatio').innerHTML = `${e.budget} / ${e.contract}`;
    document.getElementById('footerCount').innerHTML = `${mockData.descriptive_stats.total_respondents} респондентов`;
  }

  document.getElementById('lastUpdateDate').innerHTML = new Date().toLocaleDateString();

  // ========== РАНЖИРОВАНИЕ ==========
  const ranking = data.ranking?.factors || [];
  document.getElementById('topFactorsList').innerHTML = ranking.slice(0, 5).map((f, i) => `
        <div class="rank-item">
            <div class="rank-number">${i + 1}</div>
            <div class="rank-name">${f.factor_name}</div>
            <div class="rank-bar-bg"><div class="rank-bar" style="width: ${f.average * 10}%"></div></div>
            <div class="rank-score">${f.average.toFixed(1)}</div>
        </div>
    `).join('');

  // ========== ANOVA ==========
  const anovaHtml = [data.anova_budget, data.anova_distance, data.anova_dormitory]
    .filter(Boolean).map(r => `
            <tr><td><strong>${r.group_name}</strong></td><td>F = ${r.f_value.toFixed(4)}</td><td>p = ${r.p_value.toFixed(4)}</td><td class="${r.significant ? 'sig-yes' : 'sig-no'}">${r.significant ? '✓ значимо' : '○ не значимо'}</td></tr>
        `).join('');
  document.getElementById('anovaTable').innerHTML = `<table class="stats-table">${anovaHtml || '<tr><td colspan="4">Нет данных</td></tr>'}</table>`;

  // ========== КРАСКЕЛА-УОЛЛИС ==========
  const kw = data.kruskal_wallis;
  const kwHtml = kw ? `
        <table class="stats-table"><tr><td><strong>${kw.group_name || 'Критерий'}</strong></td><td>H = ${kw.h_value?.toFixed(4) || '?'}</td><td>p = ${kw.p_value?.toFixed(4) || '?'}</td><td class="${kw.significant ? 'sig-yes' : 'sig-no'}">${kw.significant ? '✓ значимо' : '○ не значимо'}</td></tr></table>
    ` : '<div>Нет данных</div>';
  document.getElementById('kruskalTable').innerHTML = kwHtml;

  // ========== КОРРЕЛЯЦИЯ ==========
  const sp = data.spearman;
  if (sp) {
    document.getElementById('correlationList').innerHTML = `
            <div class="corr-row"><span>${sp.variable_x}</span><span>↔</span><span>${sp.variable_y}</span><span class="${Math.abs(sp.rho) > 0.6 ? 'corr-high' : 'corr-low'}">ρ = ${sp.rho.toFixed(4)}</span></div>
            <div class="corr-row" style="justify-content: flex-start; gap: 16px;"><span>Сила: ${sp.strength}</span><span>Направление: ${sp.direction}</span><span>n = ${sp.count}</span></div>
        `;
  } else {
    document.getElementById('correlationList').innerHTML = '<div>Нет данных</div>';
  }

  // ========== ДОВЕРИТЕЛЬНЫЕ ИНТЕРВАЛЫ ==========
  const intervals = data.confidence_intervals?.intervals || [];
  renderConfidenceIntervals(intervals);

  // ========== ТЬЮКИ ==========
  const tukeyPairs = data.tukey?.pairs || [];
  renderTukeyTable(tukeyPairs);

  // ========== ГРАФИК КУРСОВ (из mock) ==========
  if (mockData?.charts_data?.course_bar) {
    const cd = mockData.charts_data.course_bar;
    const max = Math.max(...cd.values);
    document.getElementById('courseBars').innerHTML = cd.labels.map((l, i) => `
            <div class="bar-item"><div class="bar" style="height: ${(cd.values[i] / max) * 120}px;"></div><div class="bar-label">${l}</div><div class="bar-value">${cd.values[i]}</div></div>
        `).join('');
  }

  addStatTooltips();
}

document.addEventListener('DOMContentLoaded', loadDashboard);