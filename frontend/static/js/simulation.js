const ALPHA = 0.05;

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fmt(x, digits = 2) {
  return (typeof x === 'number' && isFinite(x)) ? x.toFixed(digits) : '—';
}

function fmtP(p) {
  if (typeof p !== 'number' || !isFinite(p)) return '—';
  if (p === 0) return '< 0.001';
  return p < 0.001 ? '< 0.001' : p.toFixed(4);
}

function kv(label, value, color) {
  return `
    <div style="display:flex; justify-content:space-between; gap:16px; padding:8px 0; border-bottom:1px solid var(--border);">
      <span style="font-size:13px; color:var(--ink-muted);">${label}</span>
      <span style="font-family:var(--mono); font-weight:600; ${color ? `color:${color};` : ''}">${value}</span>
    </div>`;
}

function badge(ok, yes, no) {
  return `<span class="${ok ? 'sig-yes' : 'sig-no'}" style="font-weight:600;">${ok ? yes : no}</span>`;
}

function renderGroups(groups) {
  const el = document.getElementById('groupsContainer');
  if (!el) return;
  el.innerHTML = (groups || []).map(g => `
    <div class="stat-card" style="flex:1; min-width:180px;">
      <div class="stat-value">${fmt(g.mean, 1)}</div>
      <div class="stat-label">${esc(g.name)}</div>
      <div style="font-size:12px; color:var(--ink-muted); margin-top:6px; font-family:var(--mono);">n = ${g.count}</div>
    </div>
  `).join('');
}

function renderBootstrap(b) {
  const el = document.getElementById('bootstrapBlock');
  if (!el) return;

  const maxAbs = Math.max(Math.abs(b.ci_low), Math.abs(b.ci_high), Math.abs(b.diff), 1) * 1.2;
  const pos = v => Math.max(0, Math.min(100, ((v + maxAbs) / (2 * maxAbs)) * 100));
  const left = pos(b.ci_low);
  const width = Math.max(0, pos(b.ci_high) - left);
  const color = b.stable ? 'var(--accent-2)' : 'var(--ink-muted)';

  el.innerHTML = `
    <div style="position:relative; height:28px; background:var(--bg-panel); border-radius:6px; overflow:hidden;">
      <div style="position:absolute; top:50%; left:0; width:100%; height:2px; background:var(--border); transform:translateY(-50%);"></div>
      <div style="position:absolute; top:50%; left:${left}%; width:${width}%; height:8px; background:${color}; transform:translateY(-50%); border-radius:4px;"></div>
      <div style="position:absolute; top:50%; left:${pos(b.diff)}%; width:14px; height:14px; background:${color}; border:2px solid var(--bg-card); border-radius:50%; transform:translate(-50%,-50%); z-index:2;"></div>
      <div style="position:absolute; top:0; left:50%; height:100%; width:1.5px; background:#f44336; z-index:1;"></div>
    </div>
    <div style="display:flex; justify-content:space-between; font-size:11px; font-family:var(--mono); color:var(--ink-muted); margin:4px 0 16px;">
      <span>${fmt(-maxAbs, 1)}</span><span style="color:#f44336;">0</span><span>${fmt(maxAbs, 1)}</span>
    </div>
    ${kv('Разница средних', fmt(b.diff, 2))}
    ${kv('95% ДИ', `[${fmt(b.ci_low, 2)}; ${fmt(b.ci_high, 2)}]`)}
    ${kv('Доля пересборок, где разница > 0', `${fmt(b.prob_positive * 100, 1)}%`)}
  `;
}

function renderPermutation(p) {
  const el = document.getElementById('permutationBlock');
  if (!el) return;
  el.innerHTML = `
    ${kv('Реальное F', fmt(p.f_value, 4))}
    ${kv('p-value (перестановочный)', fmtP(p.p_value), p.significant ? 'var(--accent-2)' : undefined)}
    ${kv('Порог значимости', ALPHA)}
  `;
}

function jackknifeVerdict(j) {
  if (j.total > 0 && j.significant_count === 0) return 'stable_ns';
  if (j.total > 0 && j.significant_count === j.total) return 'stable_sig';
  return 'unstable';
}

function jackknifeBadge(j) {
  const v = jackknifeVerdict(j);
  if (v === 'stable_ns') return '<span class="sig-no" style="font-weight:600;">○ Стабильно незначимо: ни один респондент не меняет вывод (различий нет)</span>';
  if (v === 'stable_sig') return '<span class="sig-yes" style="font-weight:600;">✓ Стабильно значимо: различие сохраняется при удалении любого респондента</span>';
  return '<span class="sig-no" style="font-weight:600;">✗ Хлипкий вывод: значимость зависит от отдельных респондентов</span>';
}

function renderJackknife(j) {
  const el = document.getElementById('jackknifeBlock');
  if (!el) return;
  const share = j.total ? (j.significant_count / j.total) * 100 : 0;
  el.innerHTML = `
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:0 32px;">
      <div>
        ${kv('Базовая разница средних', fmt(j.base_diff, 2))}
        ${kv('Всего пересчётов (n групп 1 + n групп 2)', j.total)}
        ${kv('Значимых (p < 0.05)', `${j.significant_count} из ${j.total} (${fmt(share, 1)}%)`)}
      </div>
      <div>
        ${kv('p-value: минимум', fmtP(j.p_min))}
        ${kv('p-value: максимум', fmtP(j.p_max))}
        ${kv('p-value: среднее ± σ', `${fmt(j.p_mean, 4)} ± ${fmt(j.p_std_dev, 4)}`)}
      </div>
    </div>
    
  `;
}

function renderPValueHistogram(pValues) {
  const el = document.getElementById('pValueHistogram');
  if (!el) return;

  if (!pValues || !pValues.length) {
    el.innerHTML = '<div style="color:var(--ink-muted); margin:auto;">Нет данных</div>';
    return;
  }

  const BINS = 20;
  const counts = new Array(BINS).fill(0);
  pValues.forEach(v => {
    const idx = Math.min(BINS - 1, Math.max(0, Math.floor(v * BINS)));
    counts[idx]++;
  });
  const maxCount = Math.max(...counts, 1);

  const cap = document.getElementById('histCaption');
  if (cap) {
    // cap.innerHTML = counts[0] > 0
    //   ? `Красная линия — порог p = 0.05. Зелёный столбец слева от неё — пересчёты со значимым результатом: ${counts[0]} из ${pValues.length}.`
    //   : `Красная линия — порог p = 0.05. Значимых результатов (зелёный столбец слева от линии) нет: все ${pValues.length} пересчётов лежат правее порога.`;
  }

  el.innerHTML = counts.map((count, i) => {
    const h = (count / maxCount) * 250;
    const significant = i === 0;
    const tick = i % 5 === 0 ? (i / BINS).toFixed(2) : '';
    const endTick = i === BINS - 1
      ? '<span style="position:absolute; right:0; top:6px; white-space:nowrap;">1.00</span>'
      : '';
    return `
      <div style="flex:1 1 0; min-width:0; display:flex; flex-direction:column; justify-content:flex-end; height:100%;">
        <div style="font-size:10px; font-family:var(--mono); text-align:center; margin-bottom:4px; overflow:hidden; min-height:14px;">${count > 0 ? count : ''}</div>
        <div style="width:100%; height:${h}px; background:${significant ? 'var(--accent-2)' : 'var(--ink)'}; border-radius:2px 2px 0 0; transition:height 0.5s ease;"></div>
        <div style="position:relative; height:24px; font-size:10px; font-family:var(--mono); color:var(--ink-muted);">
          <span style="position:absolute; left:0; top:6px; white-space:nowrap;">${tick}</span>${endTick}
        </div>
      </div>`;
  }).join('') + `
    <div style="position:absolute; top:0; bottom:24px; left:5%; width:0; border-left:2px dashed #f44336; pointer-events:none;"></div>
    <div style="position:absolute; top:0; left:5%; margin-left:6px; font-size:11px; font-family:var(--mono); color:#f44336; white-space:nowrap;">порог p = 0.05</div>`;
  el.style.position = 'relative';
}

function renderConclusion(d) {
  const el = document.getElementById('conclusion');
  if (!el) return;

  const b = d.bootstrap, p = d.permutation, j = d.jackknife;
  const who = b.diff > 0 ? 'Бюджетники набирают больше баллов' : 'Платники набирают больше баллов';
  const lines = [];

  lines.push(b.stable
    ? `<strong>Бутстрэп:</strong> ${who.toLowerCase()}; 95% интервал разницы [${fmt(b.ci_low, 1)}; ${fmt(b.ci_high, 1)}] не содержит нуля, значит различие между группами настоящее.`
    : `<strong>Бутстрэп:</strong> интервал разницы [${fmt(b.ci_low, 1)}; ${fmt(b.ci_high, 1)}] содержит ноль, поэтому различие между группами нельзя считать доказанным.`);

  lines.push(p.significant
    ? `<strong>Перестановочный ANOVA:</strong> реальное F = ${fmt(p.f_value, 2)} лежит в хвосте перемешанных вариантов (p = ${fmtP(p.p_value)}), различия есть и без опоры на формулу.`
    : `<strong>Перестановочный ANOVA:</strong> реальное F = ${fmt(p.f_value, 2)} не выделяется среди перемешанных вариантов (p = ${fmtP(p.p_value)}).`);

  const jv = jackknifeVerdict(j);
  lines.push(jv === 'stable_ns'
    ? `<strong>Джекнайф:</strong> при удалении любого одного респондента различие так и остаётся незначимым (значимых ${j.significant_count} из ${j.total}), то есть результат не держится на одном человеке.`
    : jv === 'stable_sig'
      ? `<strong>Джекнайф:</strong> различие остаётся значимым при удалении любого одного респондента (значимых ${j.significant_count} из ${j.total}), результат не держится на одном человеке.`
      : `<strong>Джекнайф:</strong> значимость меняется при удалении отдельных респондентов (значимых ${j.significant_count} из ${j.total}), вывод хлипкий.`);

  const votes = [b.stable, p.significant, jv === 'stable_sig'];
  const yes = votes.filter(Boolean).length;
  let summary;
  if (yes === 0 && jv === 'stable_ns') {
    summary = 'Итог: все три метода согласны, связи между баллом ЦТ/ЦЭ и важностью бюджета обнаружить не удалось, и этот вывод устойчив.';
  } else if (yes === 3) {
    summary = 'Итог: все три метода согласны, различие между группами настоящее и устойчивое.';
  } else {
    summary = 'Итог: методы расходятся, вывод о различии между группами ненадёжен, нужно больше данных.';
  }
  lines.unshift(`<strong style="font-size:15px;">${summary}</strong>`);

  el.innerHTML = lines.map(l => `<p style="margin-bottom:8px;">${l}</p>`).join('');
}

function renderSimulationResults(d) {
  renderGroups(d.groups);
  renderConclusion(d);
  renderBootstrap(d.bootstrap);
  renderPermutation(d.permutation);
  renderJackknife(d.jackknife);
  renderPValueHistogram(d.jackknife.p_values);
}

async function runSimulation() {
  const runBtn = document.getElementById('runSimBtn');
  const resultsDiv = document.getElementById('simulationResults');
  const statusBadge = document.getElementById('simStatus');
  const errorDiv = document.getElementById('simError');

  errorDiv.style.display = 'none';
  runBtn.disabled = true;
  runBtn.innerText = 'Считаем...';
  statusBadge.innerText = 'Выполняется';
  resultsDiv.style.display = 'none';

  const data = await apiRequest('/api/simulation');

  runBtn.disabled = false;
  runBtn.innerText = 'Пересчитать';

  if (!data) {
    statusBadge.innerText = 'Ошибка';
    errorDiv.style.display = 'block';
    errorDiv.innerText = 'Не удалось получить данные с сервера. Проверьте, что бэкенд запущен.';
    return;
  }

  if (data.message) {
    statusBadge.innerText = 'Мало данных';
    errorDiv.style.display = 'block';
    errorDiv.innerText = 'Недостаточно ответов для моделирования: нужно минимум по 2 респондента в группах «Бюджетники (8–10)» и «Платники (1–3)».';
    return;
  }

  renderSimulationResults(data);
  statusBadge.innerText = 'Завершено';
  resultsDiv.style.display = 'block';
}

async function loadFooterCount() {
  const responses = await API.fetchResponses();
  const el = document.getElementById('footerCount');
  if (el && Array.isArray(responses)) el.innerText = `${responses.length} участников`;
}

document.addEventListener('DOMContentLoaded', () => {
  const runBtn = document.getElementById('runSimBtn');
  if (runBtn) runBtn.addEventListener('click', runSimulation);
  loadFooterCount();
  runSimulation(); 
});