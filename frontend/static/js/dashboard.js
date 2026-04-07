async function loadDashboard() {
  const data = await mockAPI('/api/statistics');

  document.getElementById('totalRespondents').innerText = data.descriptive_stats.total_respondents;
  document.getElementById('meanAge').innerText = data.descriptive_stats.mean_age;
  document.getElementById('genderRatio').innerText = `${data.descriptive_stats.gender_distribution.female} / ${data.descriptive_stats.gender_distribution.male}`;
  document.getElementById('budgetRatio').innerText = `${data.descriptive_stats.education_form_distribution.budget} / ${data.descriptive_stats.education_form_distribution.contract}`;
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
  
  const anovaHtml = `<table>${data.anova_results.map(r => `
    <tr><td>${r.factor_name}</td><td>F = ${r.f_statistic}</td><td>p = ${r.p_value}</td><td>${r.significant ? '✓ значимо' : '○ нет'}</td></tr>
  `).join('')}</table>`;
  document.getElementById('anovaTable').innerHTML = anovaHtml;
  
  const kruskalHtml = `<table>${data.kruskal_results.map(r => `
    <tr><td>${r.factor_name}</td><td>H = ${r.h_statistic}</td><td>p = ${r.p_value}</td><td>${r.significant ? '✓ значимо' : '○ нет'}</td></tr>
  `).join('')}</table>`;
  document.getElementById('kruskalTable').innerHTML = kruskalHtml;

  const corrHtml = data.spearman_correlation.significant_pairs.map(p => `
    <div class="corr-row"><span>${p.factor1}</span><span>↔</span><span>${p.factor2}</span><span class="${p.rho > 0.6 ? 'corr-high' : 'corr-low'}">ρ = ${p.rho}</span></div>
  `).join('');
  document.getElementById('correlationList').innerHTML = corrHtml;

  const courseData = data.charts_data.course_bar;
  const barsHtml = courseData.labels.map((label, i) => `
    <div class="bar-item"><div class="bar" style="height: ${courseData.values[i] / 3}px"></div><div class="bar-label">${label}</div></div>
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
        document.getElementById('ciChartContainer').innerHTML = '<div style="color:#5a6077; padding:40px; text-align:center">Выберите фактор для отображения доверительных интервалов</div>';
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
        document.getElementById('tukeyTableContainer').innerHTML = '<div style="color:#5a6077; padding:40px; text-align:center">Выберите фактор для отображения попарных сравнений</div>';
      }
    });
  }
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
        <div style="font-size: 13px; color: #8b92a8; margin-bottom: 6px;">${item.group} (n=${item.n})</div>
        <div style="position: relative; background: #1e222d; height: 8px; border-radius: 10px;">
          <div style="position: absolute; left: ${leftPercent}%; width: ${widthPercent}%; background: #6976EB; height: 8px; border-radius: 10px;"></div>
          <div style="position: absolute; left: ${(item.mean / maxVal) * 100}%; width: 2px; height: 16px; background: white; top: -4px; transform: translateX(-50%);"></div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 11px; color: #5a6077;">
          <span>${item.ci_lower}</span>
          <span style="color:#6976EB">среднее: ${item.mean}</span>
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
    <table style="width:100%; border-collapse: collapse; margin-top: 16px;">
      <thead>
        <tr>
          <th style="text-align:left; padding:12px 8px; color:#6976EB; border-bottom:1px solid #2a2f3f;">Группа 1</th>
          <th style="text-align:left; padding:12px 8px; color:#6976EB; border-bottom:1px solid #2a2f3f;">Группа 2</th>
          <th style="text-align:left; padding:12px 8px; color:#6976EB; border-bottom:1px solid #2a2f3f;">Разница средних</th>
          <th style="text-align:left; padding:12px 8px; color:#6976EB; border-bottom:1px solid #2a2f3f;">p-value</th>
          <th style="text-align:left; padding:12px 8px; color:#6976EB; border-bottom:1px solid #2a2f3f;">Значимость</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(item => `
          <tr>
            <td style="padding:12px 8px; border-bottom:1px solid #1e222d;">${item.group1}</td>
            <td style="padding:12px 8px; border-bottom:1px solid #1e222d;">${item.group2}</td>
            <td style="padding:12px 8px; border-bottom:1px solid #1e222d;">${item.mean_diff}</td>
            <td style="padding:12px 8px; border-bottom:1px solid #1e222d;">${item.p_value}</td>
            <td style="padding:12px 8px; border-bottom:1px solid #1e222d; color: ${item.significant ? '#4aff8c' : '#ffb347'}">${item.significant ? '✓ значимо' : '○ не значимо'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  container.innerHTML = html;
}



document.addEventListener('DOMContentLoaded', loadDashboard);