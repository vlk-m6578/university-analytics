let rawResponses = [];

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
    avgScore: 'Средняя сумма баллов ЦТ/ЦЭ (0-300)'
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

function updateDashboardStats(responses) {
  const total = responses.length;

  let ages = [];
  let maleCount = 0, femaleCount = 0;
  let scores = [];

  responses.forEach(r => {
    const age = parseInt(r["Ваш возраст?"]);
    if (!isNaN(age)) ages.push(age);

    const gender = r["Ваш пол?"];
    if (gender === "Мужской") maleCount++;
    else if (gender === "Женский") femaleCount++;

    const score = parseInt(r["Введите сумму баллов ЦТ и ЦЭ (0-300):"]);
    if (!isNaN(score)) scores.push(score);
  });

  const meanAge = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;
  const meanScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  animateValue(document.getElementById('totalRespondents'), 0, total, 1500, '');
  animateValue(document.getElementById('meanAge'), 0, meanAge, 1000, '');
  document.getElementById('genderRatio').innerHTML = `${femaleCount} / ${maleCount}`;
  document.getElementById('avgScore').innerHTML = meanScore;
  document.getElementById('footerCount').innerHTML = `${total} участников`;
}

function renderGenderChart(responses) {
  let male = 0, female = 0;
  responses.forEach(r => {
    const gender = r["Ваш пол?"];
    if (gender === "Мужской") male++;
    else if (gender === "Женский") female++;
  });
  const total = male + female;
  if (total === 0) return;
  const malePercent = (male / total) * 360;
  const femalePercent = (female / total) * 360;
  const pie = document.querySelector('.pie');
  if (pie) {
    pie.style.background = `conic-gradient(#1C1912 0deg ${malePercent}deg, #B8AF9E ${malePercent}deg 360deg)`;
  }
}

function renderStudyFormatChart(responses) {
  let fulltime = 0, parttime = 0;
  responses.forEach(r => {
    const format = r["Какой формат обучения Вам подходит?"];
    if (format === "Очный (дневной)") fulltime++;
    else if (format === "Заочный") parttime++;
  });
  const total = fulltime + parttime;
  if (total === 0) return;
  const fulltimePercent = (fulltime / total) * 360;
  const pie = document.querySelector('.chart-box:last-child .pie');
  if (pie) {
    pie.style.background = `conic-gradient(#B8AF9E 0deg ${fulltimePercent}deg, #1C1912 ${fulltimePercent}deg 360deg)`;
  }

  const legend = document.querySelector('.chart-box:last-child .legend');
  if (legend) {
    legend.innerHTML = `
      <div><span class="legend-dot" style="background:#B8AF9E"></span> Очный</div>
      <div><span class="legend-dot" style="background:#1C1912"></span> Заочный</div>
    `;
  }
}

function renderConfidenceIntervals(intervals) {
  const container = document.getElementById('ciChartContainer');
  if (!container || !intervals?.length) {
    container.innerHTML = '<div style="color:#6B6355; padding:40px; text-align:center">Нет данных для доверительных интервалов</div>';
    return;
  }

  const maxVal = 10;
  let html = '<div style="width:100%; overflow-x: hidden;">';

  intervals.forEach(ci => {
    let leftPercent = ((ci.lower - 0) / (maxVal - 0)) * 100;
    let widthPercent = ((ci.upper - ci.lower) / (maxVal - 0)) * 100;

    leftPercent = Math.max(0, Math.min(100, leftPercent));
    widthPercent = Math.max(0, Math.min(100 - leftPercent, widthPercent));

    html += `
      <div style="margin-bottom: 24px; width: 100%;">
        <div style="font-size: 13px; color: #6B6355; margin-bottom: 6px;">${ci.factor_name} (n=${ci.count})</div>
        <div style="position: relative; background: #D4CBBA; height: 8px; border-radius: 10px; width: 100%; overflow: hidden;">
          <div style="position: absolute; left: ${leftPercent}%; width: ${widthPercent}%; background: #C0441E; height: 8px; border-radius: 10px;"></div>
          <div style="position: absolute; left: ${((ci.mean - 0) / (maxVal - 0)) * 100}%; width: 2px; height: 16px; background: #1C1912; top: -4px; transform: translateX(-50%);"></div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 11px; color: #6B6355;">
          <span>${ci.lower.toFixed(2)}</span>
          <span style="color:#C0441E">среднее: ${ci.mean.toFixed(2)}</span>
          <span>${ci.upper.toFixed(2)}</span>
        </div>
      </div>
    `;
  });

  html += '</div>';
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

function renderLanguagesChart(responses) {
  const langMap = {};
  responses.forEach(r => {
    let lang = r["Какой язык программирования Вам ближе?"];
    if (lang) {
      lang = lang.trim();
      langMap[lang] = (langMap[lang] || 0) + 1;
    }
  });

  const sorted = Object.entries(langMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = Math.max(...sorted.map(l => l[1]), 1);
  const container = document.getElementById('languagesChart');
  if (!container) return;

  if (sorted.length === 0) {
    container.innerHTML = '<div style="color:#6B6355; text-align:center; padding:40px;">Нет данных о языках программирования</div>';
    return;
  }

  container.innerHTML = sorted.map(([lang, count]) => `
    <div style="margin-bottom: 16px;">
      <div style="font-size: 12px; font-family: 'IBM Plex Mono', monospace; color: #1C1912; margin-bottom: 6px;">${lang}</div>
      <div style="background: #D4CBBA; height: 24px; border-radius: 12px; overflow: hidden;">
        <div style="width: ${(count / max) * 100}%; background: #C0441E; height: 100%; border-radius: 12px; transition: width 0.5s ease;"></div>
      </div>
      <div style="font-size: 11px; color: #6B6355; margin-top: 4px;">${count} ${count === 1 ? 'человек' : 'человек'}</div>
    </div>
  `).join('');
}

async function loadDashboard() {
  const stats = await API.fetchStatistics();
  if (!stats) {
    console.warn('Нет данных от бэка');
    return;
  }

  const responses = await API.fetchResponses();
  if (responses && responses.length > 0) {
    updateDashboardStats(responses);
    renderGenderChart(responses);
    renderStudyFormatChart(responses);
  } else {
    console.warn('Нет сырых ответов');
  }

  document.getElementById('lastUpdateDate').innerHTML = new Date().toLocaleDateString();

  // ========== РАНЖИРОВАНИЕ ==========
  const ranking = stats.ranking?.factors || [];
  document.getElementById('topFactorsList').innerHTML = ranking.slice(0, 5).map((f, i) => `
    <div class="rank-item">
      <div class="rank-number">${i + 1}</div>
      <div class="rank-name">${f.factor_name}</div>
      <div class="rank-bar-bg"><div class="rank-bar" style="width: ${f.average * 10}%"></div></div>
      <div class="rank-score">${f.average.toFixed(1)}</div>
    </div>
  `).join('');

  // ========== ANOVA ==========
  const anovaHtml = [stats.anova_budget, stats.anova_distance, stats.anova_dormitory]
    .filter(Boolean).map(r => `
      <tr>
        <td><strong>${r.group_name}</strong></td>
        <td>F = ${r.f_value.toFixed(4)}</td>
        <td>p = ${r.p_value.toFixed(4)}</td>
        <td class="${r.significant ? 'sig-yes' : 'sig-no'}">${r.significant ? '✓ значимо' : '○ не значимо'}</td>
      </tr>
    `).join('');
  document.getElementById('anovaTable').innerHTML = `<table class="stats-table">${anovaHtml || '<tr><td colspan="4">Нет данных</tr>'}</table>`;

  // ========== КРАСКЕЛА-УОЛЛИС ==========
  const kw = stats.kruskal_wallis;
  const kwHtml = kw ? `
    <table class="stats-table">
      <tr>
        <td><strong>${kw.group_name || 'Критерий'}</strong></td>
        <td>H = ${kw.h_value?.toFixed(4) || '?'}</td>
        <td>p = ${kw.p_value?.toFixed(4) || '?'}</td>
        <td class="${kw.significant ? 'sig-yes' : 'sig-no'}">${kw.significant ? '✓ значимо' : '○ не значимо'}</td>
      </tr>
    </table>
  ` : '<div>Нет данных</div>';
  document.getElementById('kruskalTable').innerHTML = kwHtml;

  // ========== КОРРЕЛЯЦИЯ ==========
  const sp = stats.spearman;
  if (sp) {
    document.getElementById('correlationList').innerHTML = `
      <div class="corr-row"><span>${sp.variable_x}</span><span>↔</span><span>${sp.variable_y}</span><span class="${Math.abs(sp.rho) > 0.6 ? 'corr-high' : 'corr-low'}">ρ = ${sp.rho.toFixed(4)}</span></div>
      <div class="corr-row" style="justify-content: flex-start; gap: 16px;"><span>Сила: ${sp.strength}</span><span>Направление: ${sp.direction}</span><span>n = ${sp.count}</span></div>
    `;
  } else {
    document.getElementById('correlationList').innerHTML = '<div>Нет данных</div>';
  }

  // ========== ДОВЕРИТЕЛЬНЫЕ ИНТЕРВАЛЫ ==========
  const intervals = stats.confidence_intervals?.intervals || [];
  renderConfidenceIntervals(intervals);

  // ========== ТЬЮКИ ==========
  const tukeyPairs = stats.tukey?.pairs || [];
  renderTukeyTable(tukeyPairs);

  addStatTooltips();

  renderLanguagesChart(responses);
}

document.addEventListener('DOMContentLoaded', loadDashboard);