const USE_MOCK = false;

const API_BASE = 'http://localhost:8080';

async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch (error) {
    console.log('❌ Бэкенд недоступен:', error);
    return false;
  }
}

async function apiRequest(endpoint, data = null) {
  try {
    const options = {
      method: data ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : null
    };
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`❌ Ошибка запроса к ${endpoint}:`, error);
    return null;
  }
}

async function fetchStatistics() {
  return apiRequest('/api/stats');
}

async function fetchRecommendations(userId) {
  return apiRequest(`/api/recommendations/${userId}`);
}

window.API = {
  fetchStatistics,
  fetchRecommendations,
  checkBackendHealth,
  USE_MOCK
};