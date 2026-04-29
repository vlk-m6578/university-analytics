const USE_MOCK = false;

const API_BASE = 'http://localhost:8080';

async function checkBackendHealth() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        if (response.ok) {
            console.log('✅ Бэкенд доступен');
            return true;
        }
    } catch (error) {
        console.log('❌ Бэкенд недоступен:', error);
    }
    return false;
}

async function apiRequest(endpoint, data = null) {
    if (USE_MOCK) {
        console.log(`[MOCK] ${endpoint}`);
        return mockAPI(endpoint, data);
    }
    
    try {
        const options = {
            method: data ? 'POST' : 'GET',
            headers: { 'Content-Type': 'application/json' },
            body: data ? JSON.stringify(data) : null
        };
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`❌ Ошибка запроса к ${endpoint}:`, error);
        // Если бэк недоступен, используем mock как fallback
        console.log('🔄 Используем mock-данные как fallback');
        // return mockAPI(endpoint, data);
    }
}

// Статистика для дашборда — теперь используем /api/stats
async function fetchStatistics() {
    return apiRequest('/api/stats');
}

async function fetchRecommendations(userId) {
    // TODO: когда бэк добавит эндпоинт для рекомендаций по ID
    return mockAPI('/api/recommendations', { userId });
}

window.API = {
    fetchStatistics,
    fetchRecommendations,
    checkBackendHealth,
    USE_MOCK
};