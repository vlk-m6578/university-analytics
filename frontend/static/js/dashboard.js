
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

async function loadDashboard() {
  const data = await mockAPI('/api/statistics');

  animateValue(document.getElementById('totalRespondents'), 0, data.descriptive_stats.total_respondents, 1500, '');
  animateValue(document.getElementById('meanAge'), 0, data.descriptive_stats.mean_age, 1000, '');

  animateGenderRatio(document.getElementById('genderRatio'), 0, 0, data.descriptive_stats.gender_distribution.female, data.descriptive_stats.gender_distribution.male, 1200);
  animateBudgetRatio(document.getElementById('budgetRatio'), 0, 0, data.descriptive_stats.education_form_distribution.budget, data.descriptive_stats.education_form_distribution.contract, 1200);
  
  document.getElementById('footerCount').innerHTML = `${data.descriptive_stats.total_respondents} респондентов`;
  
  const date = new Date(data.system_settings.last_parse_date);
  document.getElementById('lastUpdateDate').innerHTML = date.toLocaleDateString();

  const top5 = data.factor_ranking.all.slice(0, 5);
  const topHtml = top5.map((f, i) => `
    <div class="rank-item">
      <div class="rank-number">${i+1}</div>
      <div class="rank-name">${f.name}</div>
      <div class="rank-bar-bg"><div class="rank-bar" style="width: ${f.mean * 10}%"></div></div>
      <div class="rank-score">${f.mean}</div>
    </div>
  `).join('');
  document.getElementById('topFactorsList').innerHTML = topHtml;
  
  const anovaHtml = `<table class="stats-table">${data.anova_results.map(r => `
    <tr>
      <td><strong>${r.factor_name}</strong></td>
      <td>F = ${r.f_statistic}</td>
      <td>p = ${r.p_value}</td>
      <td class="${r.significant ? 'sig-yes' : 'sig-no'}">${r.significant ? '✓ значимо' : '○ не значимо'}</td>
    </tr>
  `).join('')}</table>`;
  document.getElementById('anovaTable').innerHTML = anovaHtml;
  
  const kruskalHtml = `<table class="stats-table">${data.kruskal_results.map(r => `
    <tr>
      <td><strong>${r.factor_name}</strong></td>
      <td>H = ${r.h_statistic}</td>
      <td>p = ${r.p_value}</td>
      <td class="${r.significant ? 'sig-yes' : 'sig-no'}">${r.significant ? '✓ значимо' : '○ не значимо'}</td>
    </tr>
  `).join('')}</table>`;
  document.getElementById('kruskalTable').innerHTML = kruskalHtml;

  const corrHtml = data.spearman_correlation.significant_pairs.map(p => `
    <div class="corr-row">
      <span>${p.factor1}</span>
      <span>↔</span>
      <span>${p.factor2}</span>
      <span class="${p.rho > 0.6 ? 'corr-high' : 'corr-low'}">ρ = ${p.rho}</span>
    </div>
  `).join('');
  document.getElementById('correlationList').innerHTML = corrHtml;

  const courseData = data.charts_data.course_bar;
  const maxValue = Math.max(...courseData.values);
  const barsHtml = courseData.labels.map((label, i) => `
    <div class="bar-item">
      <div class="bar" style="height: ${(courseData.values[i] / maxValue) * 120}px; background: var(--ink);"></div>
      <div class="bar-label">${label}</div>
      <div class="bar-value">${courseData.values[i]}</div>
    </div>
  `).join('');
  document.getElementById('courseBars').innerHTML = barsHtml;

  const ciSelect = document.getElementById('ciFactorSelect');
  if (ciSelect && data.confidence_intervals) {
    const factors = Object.keys(data.confidence_intervals);
    ciSelect.innerHTML = '<option value="">-- выберите фактор --</option>' + 
      factors.map(f => `<option value="${f}">${f.replace(/_/g, ' ')}</option>`).join('');
    
    ciSelect.addEventListener('change', (e) => {
      const selected = e.target.value;
      if (selected && data.confidence_intervals[selected]) {
        renderConfidenceIntervals(selected, data.confidence_intervals[selected]);
      } else {
        document.getElementById('ciChartContainer').innerHTML = '<div style="color:#6B6355; padding:40px; text-align:center">Выберите фактор для отображения доверительных интервалов</div>';
      }
    });
  }

  const tukeySelect = document.getElementById('tukeyFactorSelect');
  if (tukeySelect && data.tukey_results) {
    const factors = Object.keys(data.tukey_results);
    tukeySelect.innerHTML = '<option value="">-- выберите фактор --</option>' + 
      factors.map(f => `<option value="${f}">${f}</option>`).join('');
    
    tukeySelect.addEventListener('change', (e) => {
      const selected = e.target.value;
      if (selected && data.tukey_results[selected]) {
        renderTukeyTable(selected, data.tukey_results[selected]);
      } else {
        document.getElementById('tukeyTableContainer').innerHTML = '<div style="color:#6B6355; padding:40px; text-align:center">Выберите фактор для отображения попарных сравнений</div>';
      }
    });
  }
  
  addStatTooltips();
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

function renderConfidenceIntervals(factorName, data) {
  const container = document.getElementById('ciChartContainer');
  if (!container) return;
  
  const maxVal = 10;
  let html = '<div style="margin-top: 20px;">';
  data.forEach(item => {
    const leftPercent = (item.ci_lower / maxVal) * 100;
    const widthPercent = ((item.ci_upper - item.ci_lower) / maxVal) * 100;
    html += `
      <div style="margin-bottom: 24px;">
        <div style="font-size: 13px; color: #6B6355; margin-bottom: 6px;">${item.group} (n=${item.n})</div>
        <div style="position: relative; background: #D4CBBA; height: 8px; border-radius: 10px;">
          <div style="position: absolute; left: ${leftPercent}%; width: ${widthPercent}%; background: #C0441E; height: 8px; border-radius: 10px;"></div>
          <div style="position: absolute; left: ${(item.mean / maxVal) * 100}%; width: 2px; height: 16px; background: #1C1912; top: -4px; transform: translateX(-50%);"></div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 11px; color: #6B6355;">
          <span>${item.ci_lower}</span>
          <span style="color:#C0441E">среднее: ${item.mean}</span>
          <span>${item.ci_upper}</span>
        </div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

function renderTukeyTable(factorName, data) {
  const container = document.getElementById('tukeyTableContainer');
  if (!container) return;
  
  const html = `
    <table class="stats-table" style="width:100%; border-collapse: collapse; margin-top: 16px;">
      <thead>
        <tr>
          <th style="text-align:left; padding:12px 8px; color:#1C1912; border-bottom:2px solid #1C1912;">Группа 1</th>
          <th style="text-align:left; padding:12px 8px; color:#1C1912; border-bottom:2px solid #1C1912;">Группа 2</th>
          <th style="text-align:left; padding:12px 8px; color:#1C1912; border-bottom:2px solid #1C1912;">Разница средних</th>
          <th style="text-align:left; padding:12px 8px; color:#1C1912; border-bottom:2px solid #1C1912;">p-value</th>
          <th style="text-align:left; padding:12px 8px; color:#1C1912; border-bottom:2px solid #1C1912;">Значимость</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(item => `
          <tr>
            <td style="padding:12px 8px; border-bottom:1px solid #D4CBBA;">${item.group1}</td>
            <td style="padding:12px 8px; border-bottom:1px solid #D4CBBA;">${item.group2}</td>
            <td style="padding:12px 8px; border-bottom:1px solid #D4CBBA;">${item.mean_diff}</td>
            <td style="padding:12px 8px; border-bottom:1px solid #D4CBBA;">${item.p_value}</td>
            <td style="padding:12px 8px; border-bottom:1px solid #D4CBBA; color: ${item.significant ? '#2B6054' : '#E8962A'}">${item.significant ? '✓ значимо' : '○ не значимо'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', loadDashboard);