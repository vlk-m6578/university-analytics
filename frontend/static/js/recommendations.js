const USE_RECOMMENDATIONS_MOCK = false;

let allResponses = [];
let currentRecommendations = [];

async function loadResponses() {
  const data = await API.fetchResponses();
  if (data && Array.isArray(data)) {
    allResponses = data;
    renderUserList(allResponses);
  } else {
    console.warn('Нет данных от /api/responses');
  }
}

function renderUserList(responses) {
  const container = document.getElementById('userList');
  if (!container) return;

  if (responses.length === 0) {
    container.innerHTML = '<div style="color:#6B6355;">Нет пользователей в базе</div>';
    return;
  }

  container.innerHTML = responses.map((resp, idx) => `
    <button class="user-chip" data-user-id="${idx + 1}">
      ID: ${idx + 1} — ${resp["В каком городе Вы живёте?"] || 'город не указан'}
    </button>
  `).join('');

  document.querySelectorAll('.user-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('userIdInput').value = btn.dataset.userId;
      searchRecommendations();
    });
  });
}

function transformToRecommendRequest(rawData, userId) {
  function getValue(key) {
    const matchedKey = Object.keys(rawData).find(k => k.trim() === key);
    return matchedKey ? rawData[matchedKey] : "";
  }

  const benefitsText = getValue("Какие льготы или индивидуальные достижения у вас есть?") || "";
  const benefits = {
    gold_medal: benefitsText.includes("Золотая медаль"),
    silver_medal: benefitsText.includes("Серебряная медаль"),
    republican_olympiad: benefitsText.includes("республиканской олимпиады"),
    regional_olympiad: benefitsText.includes("областной олимпиады"),
    sports_rank: benefitsText.includes("Спортивные разряды"),
    university_diploma: benefitsText.includes("Диплом универсиады")
  };

  let direction = "";
  const job = getValue("Кем Вы работаете или стажируетесь?");

  if (job.includes("Mobile")) direction = "Mobile";
  else if (job.includes("Data")) direction = "DataScience";
  else if (job.includes("Frontend")) direction = "Frontend";
  else if (job.includes("Backend")) direction = "Backend";
  else if (job.includes("DevOps")) direction = "DevOps";
  else if (job.includes("Embedded")) direction = "Embedded";
  else direction = "Backend";

  return {
    age: getValue("Ваш возраст?") || "",
    gender: getValue("Ваш пол?") || "",
    avg_score: parseInt(getValue("Введите сумму баллов ЦТ и ЦЭ (0-300):")) || 0,
    avg_grade: parseFloat(rawData["Введите средний балл аттестата:"]) || 0,
    city: getValue("В каком городе Вы живёте?") || "",
    direction: direction,
    study_format: getValue("Какой формат обучения Вам подходит?") || "Очный (дневной)",
    budget_needed: parseInt(getValue("Насколько для Вас важно поступление на бюджетную форму обучения?")) >= 6,
    dormitory_needed: parseInt(getValue("Насколько для Вас важно наличие общежития?")) >= 6,
    distance_importance: parseInt(getValue("Насколько для Вас важна близость ВУЗа к дому?")) || 5,
    benefits: benefits
  };
}

function renderRecommendations(recs) {
  const container = document.getElementById('recommendationsGrid');
  if (!container) return;

  if (!recs || recs.length === 0) {
    container.innerHTML = '<div class="loading" style="text-align:center; padding:60px;">Нет рекомендаций для этого пользователя</div>';
    return;
  }

  container.innerHTML = recs.map((rec, i) => {
    const siteUrl = UNIVERSITY_LINKS[rec.university_name] || "#";
    return `
      <div class="uni-card" style="animation-delay:${i * 0.1}s">
        <div class="uni-slider">
          <div class="uni-slides">
            ${(UNIVERSITY_IMAGES[rec.university_name] || UNIVERSITY_IMAGES["default"]).map(img => `
            <img src="${img}" alt="${rec.university_name}" loading="lazy">
            `).join('')}
          </div>
        </div>
        <div class="uni-percent">
          <span class="match-value">${Math.round(rec.match_score)}</span>%
          <div class="match-bar">
            <div class="match-fill" style="width: ${rec.match_score}%"></div>
          </div>
        </div>
        <div class="uni-meta">
          <div class="uni-name">${rec.university_name}</div>
        <div class="city-badge">📍${rec.university_city}</div>
        </div>
        <div class="uni-reason">${rec.specialty_name || rec.direction}</div>
        <div class="uni-reason">Расстояние: ${rec.distance_km?.toFixed(1) || '?'} км</div>
        <div class="uni-reason">Направление: ${rec.direction}</div>
        <a href="${siteUrl}" target="_blank" rel="noopener noreferrer" class="uni-detail-btn" style="display: block; text-align: center; text-decoration: none;">
          Подробнее →
        </a>
      </div>
    `;
  }).join('');

  setTimeout(() => {
    document.querySelectorAll('.match-fill').forEach(bar => {
      const width = bar.style.width;
      bar.style.width = '0%';
      setTimeout(() => { bar.style.width = width; }, 100);
    });
  }, 100);

  currentRecommendations = recs;

  document.querySelectorAll('.uni-card').forEach(card => {
    if (typeof initSliderForCard === 'function') {
      initSliderForCard(card);
    }
  });
}

async function searchRecommendations() {
  const userId = document.getElementById('userIdInput').value.trim();
  const errorDiv = document.getElementById('errorMessage');
  const resultsGrid = document.getElementById('recommendationsGrid');
  const userInfoDiv = document.getElementById('userInfo');
  const shareBtn = document.getElementById('shareResultsBtn');

  if (!userId) {
    errorDiv.style.display = 'block';
    errorDiv.innerText = 'Введите ID пользователя';
    if (shareBtn) shareBtn.style.display = 'none';
    return;
  }

  errorDiv.style.display = 'none';
  resultsGrid.innerHTML = '<div class="loading">Загрузка рекомендаций...</div>';
  if (shareBtn) shareBtn.style.display = 'none';

  const userIndex = parseInt(userId) - 1;
  const userData = allResponses[userIndex];

  if (!userData) {
    errorDiv.style.display = 'block';
    resultsGrid.innerHTML = '<div style="color:#5a6077; text-align:center; padding:60px;">Пользователь не найден</div>';
    if (shareBtn) shareBtn.style.display = 'none';
    return;
  }

  userInfoDiv.style.display = 'block';
  userInfoDiv.innerHTML = `
    <div class="user-info-card">
      <div class="user-info-header">
        <strong class="user-nickname">ID: ${userId}</strong>
        <button class="user-info-close" onclick="document.getElementById('userInfo').style.display='none'">✕</button>
      </div>
      <div class="user-info-details">
        <span class="user-detail">${userData["Ваш возраст?"] || '?'} лет</span>
        <span class="user-detail">${userData["Ваш пол?"] === "Мужской" ? '♂ Мужской' : (userData["Ваш пол?"] === "Женский" ? '♀ Женский' : '?')}</span>
        <span class="user-detail">📍 ${userData["В каком городе Вы живёте?"] || '?'}</span>
        <span class="user-detail">${userData["Какой формат обучения Вам подходит?"] || '?'}</span>
        <span class="user-detail">${userData["Какой язык программирования Вам ближе?"] || '?'}</span>
        <span class="user-detail">Баллы ЦТ/ЦЭ: ${userData["Введите сумму баллов ЦТ и ЦЭ (0-300):"] || '?'}</span>
        <span class="user-detail">Средний балл: ${userData["Введите средний балл аттестата:"] ? parseFloat(userData["Введите средний балл аттестата:"]).toFixed(1) : '?'}</span>
        <span class="user-detail">Важность бюджета: ${userData["Насколько для Вас важно поступление на бюджетную форму обучения?"] || '?'}</span>
        <span class="user-detail">Важность близости: ${userData["Насколько для Вас важна близость ВУЗа к дому?"] || '?'}</span>
        <span class="user-detail">Важность общежития: ${userData["Насколько для Вас важно наличие общежития?"] || '?'}</span>
        <span class="user-detail">Льготы: ${userData["Какие льготы или индивидуальные достижения у вас есть?"] || '?'}</span>
      </div>
    </div>
  `;

  const requestData = transformToRecommendRequest(userData, userId);

  console.log('Отправляем запрос на /api/recommend:', JSON.stringify(requestData, null, 2));

  let response;
  if (USE_RECOMMENDATIONS_MOCK) {
    response = await mockRecommendationsAPI('/api/recommend');
  } else {
    response = await API.postRecommendations(requestData);
  }

  console.log('Ответ от бэка:', response);

  if (response && response.recommendations) {
    // Фильтруем: оставляем только вузы с match_score > 0
    response.recommendations = response.recommendations.filter(rec => rec.match_score > 0);
  }

  if (response && response.recommendations) {
    renderRecommendations(response.recommendations);
    if (shareBtn) shareBtn.style.display = 'flex';
  } else {
    console.error('❌ Ошибка: рекомендации не пришли', response);
    resultsGrid.innerHTML = '<div style="color:#5a6077; text-align:center; padding:60px;">❌ Не удалось получить рекомендации</div>';
    if (shareBtn) shareBtn.style.display = 'none';
  }
}

async function shareRecommendations() {
  const userId = document.getElementById('userIdInput').value.trim();
  const shareBtn = document.getElementById('shareResultsBtn');

  if (!userId) {
    alert('Сначала найдите пользователя');
    return;
  }

  if (!currentRecommendations || currentRecommendations.length === 0) {
    alert('Нет рекомендаций для сохранения');
    return;
  }

  shareBtn.innerHTML = 'Подготовка...';
  shareBtn.disabled = true;

  try {
    const userInfoDiv = document.getElementById('userInfo');
    const userName = userInfoDiv.querySelector('.user-nickname')?.innerText || `ID: ${userId}`;

    let report = `ВУЗ-АНАЛИТИКА
Рекомендации на основе ваших предпочтений
Пользователь: ${userName}
Дата: ${new Date().toLocaleDateString()}

===========================================
РЕКОМЕНДОВАННЫЕ ВУЗЫ
===========================================

`;

    currentRecommendations.forEach((rec, idx) => {
      report += `${idx + 1}. ${rec.university_name}
   Город: ${rec.university_city}
   Направление: ${rec.direction}
   Специальность: ${rec.specialty_name || '—'}
   Совпадение: ${Math.round(rec.match_score)}%
   Расстояние: ${rec.distance_km?.toFixed(1) || '?'} км

`;
    });

    report += `===========================================
ВУЗ-АНАЛИТИКА — подбор вузов на основе статистических данных`;

    const fileBlob = new Blob([report], { type: 'text/plain' });
    const fileName = `recommendations_${userId}.txt`;

    shareBtn.innerHTML = 'Готово...';

    if (navigator.canShare && navigator.canShare({ files: [new File([fileBlob], fileName, { type: 'text/plain' })] })) {
      const userChoice = confirm('Нажмите OK, чтобы поделиться файлом, или Отмена, чтобы скачать');

      if (userChoice) {
        const file = new File([fileBlob], fileName, { type: 'text/plain' });
        await navigator.share({
          title: `Рекомендации для ID ${userId}`,
          text: `Рекомендованные вузы для пользователя ${userName}`,
          files: [file]
        });
      } else {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(fileBlob);
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(link.href);
      }
    } else {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(fileBlob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);
      alert('Файл скачан. Функция "Поделиться" недоступна в этом браузере.');
    }

    shareBtn.innerHTML = '📎 Поделиться';
    shareBtn.disabled = false;

  } catch (error) {
    console.error('Ошибка:', error);
    alert('Не удалось подготовить файл');
    shareBtn.innerHTML = '📎 Поделиться';
    shareBtn.disabled = false;
  }
}

function initSliderForCard(card) {
  const slider = card.querySelector('.uni-slider');
  if (!slider) return;

  const track = slider.querySelector('.uni-slides');
  if (!track || track.children.length <= 1) return;

  let index = 0;
  let interval = null;
  let isActive = false;

  const stopSlider = () => {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
    index = 0;
    track.style.transform = 'translateX(0)';
    isActive = false;
  };

  const startSlider = () => {
    if (interval) clearInterval(interval);
    if (!isActive) return;

    interval = setInterval(() => {
      if (!isActive || !track.children.length) {
        if (interval) clearInterval(interval);
        return;
      }
      index = (index + 1) % track.children.length;
      track.style.transform = `translateX(-${index * 100}%)`;
    }, 1200);
  };

  slider.removeEventListener('mouseenter', slider._mouseEnterHandler);
  slider.removeEventListener('mouseleave', slider._mouseLeaveHandler);

  slider._mouseEnterHandler = () => {
    isActive = true;
    startSlider();
  };
  slider._mouseLeaveHandler = () => {
    isActive = false;
    stopSlider();
  };

  slider.addEventListener('mouseenter', slider._mouseEnterHandler);
  slider.addEventListener('mouseleave', slider._mouseLeaveHandler);
}

document.addEventListener('DOMContentLoaded', () => {
  loadResponses();

  const searchBtn = document.getElementById('searchBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', searchRecommendations);
  }

  const shareBtn = document.getElementById('shareResultsBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', shareRecommendations);
  }

  const userIdInput = document.getElementById('userIdInput');
  if (userIdInput) {
    userIdInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') searchRecommendations();
    });
  }
});