async function loadDashboardData() {
    try {
        const data = await mockAPI('/api/statistics');

        document.getElementById('totalRespondents').innerText = data.descriptive_stats.total_respondents;
        document.getElementById('meanAge').innerText = data.descriptive_stats.mean_age;
        document.getElementById('genderRatio').innerText = 
            `${data.descriptive_stats.gender_distribution.female} / ${data.descriptive_stats.gender_distribution.male}`;
        document.getElementById('budgetRatio').innerText = 
            `${data.descriptive_stats.education_form_distribution.budget} / ${data.descriptive_stats.education_form_distribution.contract}`;
        
        const factorsBody = document.getElementById('factorsTableBody');
        if (factorsBody) {
            factorsBody.innerHTML = data.factor_ranking.all.map(factor => `
                <tr>
                    <td>${factor.name}</td>
                    <td>${factor.mean}</td>
                    <td>${factor.median}</td>
                    <td>${factor.std}</td>
                </tr>
            `).join('');
        }

        const anovaBody = document.getElementById('anovaTableBody');
        if (anovaBody) {
            anovaBody.innerHTML = data.anova_results.map(result => `
                <tr>
                    <td>${result.factor_name}</td>
                    <td>${result.group_by}</td>
                    <td>${result.f_statistic}</td>
                    <td>${result.p_value}</td>
                    <td class="${result.significant ? 'sig-yes' : 'sig-no'}">${result.significant ? '✓ значимо' : '○ не значимо'}</td>
                </tr>
            `).join('');
        }
        
        if (data.system_settings && data.system_settings.last_parse_date) {
            const date = new Date(data.system_settings.last_parse_date);
            document.getElementById('lastUpdate').innerText = date.toLocaleString();
        }
        
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

async function loadRecommendations(priorities, filters) {
    try {
        const data = await mockAPI('/api/recommend', { priorities, filters });
        const resultsContainer = document.getElementById('universitiesGrid');
        
        if (resultsContainer && data.recommendations) {
            resultsContainer.innerHTML = data.recommendations.map(uni => `
                <div class="uni-card">
                    <div class="uni-rank">★ ${uni.match_percentage}%</div>
                    <div class="uni-name">${uni.name}</div>
                    <div class="uni-details">${uni.city} • ${uni.has_budget_places === 'yes' ? 'бюджетные места' : 'контракт'} • ${uni.has_dormitory === 'yes' ? 'общежитие' : 'без общежития'}</div>
                    <div class="uni-reasons">
                        ${Object.entries(uni.factor_scores).sort((a,b) => b[1] - a[1]).slice(0,3).map(([key, val]) => `<div class="reason">✓ ${key.replace(/_/g, ' ')}: ${val}</div>`).join('')}
                    </div>
                    <button class="uni-detail-btn">Подробнее →</button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Ошибка загрузки рекомендаций:', error);
    }
}

async function loadUniversities() {
    try {
        const data = await mockAPI('/api/admin/universities');
        const tableBody = document.getElementById('universitiesTableBody');
        
        if (tableBody && data.universities) {
            tableBody.innerHTML = data.universities.map(uni => `
                <tr>
                    <td>${uni.id}</td>
                    <td>${uni.name}</td>
                    <td>${uni.city}</td>
                    <td>${uni.has_budget_places === 'yes' ? 'есть' : uni.has_budget_places === 'limited' ? 'ограничено' : 'нет'}</td>
                    <td>${uni.has_dormitory === 'yes' ? 'есть' : uni.has_dormitory === 'limited' ? 'ограничено' : 'нет'}</td>
                    <td>
                        <button class="icon-btn">✏️</button>
                        <button class="icon-btn danger">🗑️</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Ошибка загрузки вузов:', error);
    }
}

async function loadLogs() {
    try {
        const data = await mockAPI('/api/admin/logs');
        const logsBody = document.getElementById('logsTableBody');
        
        if (logsBody && data.logs) {
            logsBody.innerHTML = data.logs.map(log => `
                <tr>
                    <td>${new Date(log.timestamp).toLocaleString()}</td>
                    <td>${log.operation}</td>
                    <td class="${log.status === 'success' ? 'status-success' : 'status-error'}">${log.status === 'success' ? '✓ Успех' : '✗ Ошибка'}</td>
                    <td>${log.message}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Ошибка загрузки логов:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('totalRespondents')) {
        loadDashboardData();
    }
    
    if (document.getElementById('universitiesTableBody')) {
        loadUniversities();
        loadLogs();
    }
    
    const recommendBtn = document.getElementById('getRecommendationsBtn');
    if (recommendBtn) {
        recommendBtn.addEventListener('click', () => {
            const priorities = {
                teaching_quality: parseInt(document.getElementById('teaching')?.value || 5),
                prestige: parseInt(document.getElementById('prestige')?.value || 5),
                employment_rate: parseInt(document.getElementById('job')?.value || 5),
                budget_slots: parseInt(document.getElementById('budget')?.value || 5),
                location: parseInt(document.getElementById('location')?.value || 5),
                dormitory: parseInt(document.getElementById('dorm')?.value || 5),
                extracurricular: parseInt(document.getElementById('life')?.value || 5),
                equipment: parseInt(document.getElementById('equip')?.value || 5)
            };
            
            const filters = {
                city: document.getElementById('city')?.value || null,
                education_form: document.querySelector('input[name="eduForm"]:checked')?.value || 'any'
            };
            
            loadRecommendations(priorities, filters);
        });
    }
});