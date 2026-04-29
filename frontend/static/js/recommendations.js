let allUsers = [];
let currentRecommendations = [];
let activeSliders = new Map();

async function loadUsers() {
  const data = await mockAPI('/api/users');
  allUsers = data.users || [];
  renderUserList(allUsers);
}

function renderUserList(users) {
  const container = document.getElementById('userList');
  if (!container) return;

  container.innerHTML = users.map(user => `
        <button class="user-chip" data-user-id="${user.id}">
            ${user.nickname} (ID: ${user.id})
        </button>
    `).join('');

  document.querySelectorAll('.user-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('userIdInput').value = btn.dataset.userId;
      searchRecommendations();
    });
  });
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
      if (!isActive) {
        if (interval) clearInterval(interval);
        return;
      }
      index = (index + 1) % track.children.length;
      track.style.transform = `translateX(-${index * 100}%)`;
    }, 1250);
  };

  if (window.innerWidth > 768) {
    slider.addEventListener('mouseenter', () => {
      isActive = true;
      startSlider();
    });

    slider.addEventListener('mouseleave', () => {
      isActive = false;
      stopSlider();
    });
  } else {
    let isObserving = false;

    const checkCenter = () => {
      const rect = card.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const centerPoint = windowHeight / 2;
      const cardTop = rect.top;
      const cardBottom = rect.bottom;
      const isInView = cardTop < windowHeight && cardBottom > 0;

      if (!isInView) {
        if (isActive) {
          isActive = false;
          stopSlider();
        }
        return;
      }

      const cardCenter = cardTop + rect.height / 2;
      const distanceToCenter = Math.abs(cardCenter - centerPoint);
      const isCentered = distanceToCenter < rect.height / 2;

      if (isCentered && !isActive) {
        document.querySelectorAll('.uni-card').forEach(otherCard => {
          if (otherCard !== card) {
            const otherSlider = otherCard.querySelector('.uni-slider');
            if (otherSlider && otherSlider.stopMobile) {
              otherSlider.stopMobile();
            }
          }
        });
        isActive = true;
        startSlider();
      } else if (!isCentered && isActive) {
        isActive = false;
        stopSlider();
      }
    };

    slider.stopMobile = () => {
      if (isActive) {
        isActive = false;
        stopSlider();
      }
    };

    const visibilityObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !isObserving) {
          isObserving = true;
          checkCenter();
          window.addEventListener('scroll', checkCenter);
          window.addEventListener('resize', checkCenter);
          visibilityObserver.unobserve(card);
        }
      });
    }, { threshold: 0.1 });

    visibilityObserver.observe(card);
  }
}

function cleanupSliders() {
  activeSliders.forEach((interval, cardId) => {
    if (interval) clearInterval(interval);
  });
  activeSliders.clear();
}

function filterRecommendations() {
  const filterValue = document.getElementById('filterSelect')?.value || 'all';

  if (!currentRecommendations.length) return;

  let filtered = [...currentRecommendations];

  if (filterValue !== 'all') {
    filtered = currentRecommendations.filter(uni => uni.city === filterValue);
  }

  renderRecommendations(filtered);
}

function sortRecommendations() {
  const sortValue = document.getElementById('sortSelect')?.value || 'match';

  if (!currentRecommendations.length) return;

  let sorted = [...currentRecommendations];

  if (sortValue === 'name') {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortValue === 'match') {
    sorted.sort((a, b) => b.match_percentage - a.match_percentage);
  }

  renderRecommendations(sorted);
}

function renderRecommendations(recs) {
  const container = document.getElementById('recommendationsGrid');

  if (!recs.length) {
    container.innerHTML = '<div class="loading" style="text-align:center; padding:60px;">Нет рекомендаций для выбранного города</div>';
    return;
  }

  container.innerHTML = recs.map((uni, i) => `
        <div class="uni-card" style="animation-delay:${i * 0.1}s" data-university-id="${uni.university_id}">
            <div class="uni-slider">
                <div class="uni-slides">
                    ${(uni.images || [
      "https://www.google.com/search?q=%D1%84%D0%BE%D1%82%D0%BE+%D1%81+%D1%83%D0%BD%D0%B8%D0%B2%D0%B5%D1%80%D1%81%D0%B8%D1%82%D0%B5%D1%82%D0%B0&sca_esv=5cb8f0632b7ab272&udm=2&biw=1422&bih=739&sxsrf=ANbL-n74leEC6Naa5yQO_cYvNJ2uA4iv6g%3A1776026030508&ei=rgHcafjSHq3ixc8P-9OoyQg&oq=%D1%84%D0%BE%D1%82%D0%BE&gs_lp=Egtnd3Mtd2l6LWltZyII0YTQvtGC0L4qAggAMgcQIxjJAhgnMgcQIxjJAhgnMggQABiABBixAzIEEAAYAzILEAAYgAQYsQMYgwEyBBAAGAMyCBAAGIAEGLEDMgQQABgDMgsQABiABBixAxiDATIEEAAYA0j3FlC8AVi-DnAEeACQAQGYAXugAesFqgEDMi41uAEByAEA-AEBmAIIoAKsBKgCAMICChAAGIAEGIoFGEPCAgYQABgHGB7CAgUQABiABMICDBAAGAEYgAQYsQMYCsICDhAAGIAEGIoFGLEDGIMBmAMCiAYBkgcDMy41oAfeNbIHAzAuNbgHlgTCBwMyLTjIByqACAE&sclient=gws-wiz-img#sv=CAMSVhoyKhBlLUVoWHROUkdwS3R6RlZNMg5FaFh0TlJHcEt0ekZWTToOZHVPRF9XYWtWeHJGb00gBCocCgZtb3NhaWMSEGUtRWhYdE5SR3BLdHpGVk0YADABGAcgt4iEpAtKCBACGAEgAigB",
      "https://www.google.com/search?q=%D1%84%D0%BE%D1%82%D0%BE+%D1%81+%D1%83%D0%BD%D0%B8%D0%B2%D0%B5%D1%80%D1%81%D0%B8%D1%82%D0%B5%D1%82%D0%B0&sca_esv=5cb8f0632b7ab272&udm=2&biw=1422&bih=739&sxsrf=ANbL-n74leEC6Naa5yQO_cYvNJ2uA4iv6g%3A1776026030508&ei=rgHcafjSHq3ixc8P-9OoyQg&oq=%D1%84%D0%BE%D1%82%D0%BE&gs_lp=Egtnd3Mtd2l6LWltZyII0YTQvtGC0L4qAggAMgcQIxjJAhgnMgcQIxjJAhgnMggQABiABBixAzIEEAAYAzILEAAYgAQYsQMYgwEyBBAAGAMyCBAAGIAEGLEDMgQQABgDMgsQABiABBixAxiDATIEEAAYA0j3FlC8AVi-DnAEeACQAQGYAXugAesFqgEDMi41uAEByAEA-AEBmAIIoAKsBKgCAMICChAAGIAEGIoFGEPCAgYQABgHGB7CAgUQABiABMICDBAAGAEYgAQYsQMYCsICDhAAGIAEGIoFGLEDGIMBmAMCiAYBkgcDMy41oAfeNbIHAzAuNbgHlgTCBwMyLTjIByqACAE&sclient=gws-wiz-img#sv=CAMSVhoyKhBlLUVoWHROUkdwS3R6RlZNMg5FaFh0TlJHcEt0ekZWTToOZHVPRF9XYWtWeHJGb00gBCocCgZtb3NhaWMSEGUtRWhYdE5SR3BLdHpGVk0YADABGAcgt4iEpAtKCBACGAEgAigB",
      "https://www.google.com/search?q=%D1%84%D0%BE%D1%82%D0%BE+%D1%81+%D1%83%D0%BD%D0%B8%D0%B2%D0%B5%D1%80%D1%81%D0%B8%D1%82%D0%B5%D1%82%D0%B0&sca_esv=5cb8f0632b7ab272&udm=2&biw=1422&bih=739&sxsrf=ANbL-n74leEC6Naa5yQO_cYvNJ2uA4iv6g%3A1776026030508&ei=rgHcafjSHq3ixc8P-9OoyQg&oq=%D1%84%D0%BE%D1%82%D0%BE&gs_lp=Egtnd3Mtd2l6LWltZyII0YTQvtGC0L4qAggAMgcQIxjJAhgnMgcQIxjJAhgnMggQABiABBixAzIEEAAYAzILEAAYgAQYsQMYgwEyBBAAGAMyCBAAGIAEGLEDMgQQABgDMgsQABiABBixAxiDATIEEAAYA0j3FlC8AVi-DnAEeACQAQGYAXugAesFqgEDMi41uAEByAEA-AEBmAIIoAKsBKgCAMICChAAGIAEGIoFGEPCAgYQABgHGB7CAgUQABiABMICDBAAGAEYgAQYsQMYCsICDhAAGIAEGIoFGLEDGIMBmAMCiAYBkgcDMy41oAfeNbIHAzAuNbgHlgTCBwMyLTjIByqACAE&sclient=gws-wiz-img#sv=CAMSVhoyKhBlLUVoWHROUkdwS3R6RlZNMg5FaFh0TlJHcEt0ekZWTToOZHVPRF9XYWtWeHJGb00gBCocCgZtb3NhaWMSEGUtRWhYdE5SR3BLdHpGVk0YADABGAcgt4iEpAtKCBACGAEgAigB"
    ]).map(img => `<img src="${img}" alt="${uni.name}" loading="lazy">`).join('')}
                </div>
            </div>
            <div class="uni-percent">
                <span class="match-value">${uni.match_percentage}</span>%
                <div class="match-bar">
                    <div class="match-fill" style="width: ${uni.match_percentage}%"></div>
                </div>
            </div>
            <div class="uni-name">${uni.name}</div>
            <div class="uni-meta">
                <span class="city-badge">📍 ${uni.city}</span>
            </div>
            ${uni.reasons.map(r => `<div class="uni-reason">${r}</div>`).join('')}
            <button class="uni-detail-btn" onclick="showUniversityDetails('${uni.name}')">
                Подробнее →
            </button>
        </div>
    `).join('');

  setTimeout(() => {
    document.querySelectorAll('.match-fill').forEach(bar => {
      const width = bar.style.width;
      bar.style.width = '0%';
      setTimeout(() => {
        bar.style.width = width;
      }, 100);
    });
  }, 100);

  document.querySelectorAll('.uni-card').forEach(card => {
    initSliderForCard(card);
  });

  currentRecommendations = recs;
}

window.showUniversityDetails = function (universityName) {
  const uni = currentRecommendations.find(u => u.name === universityName);
  if (!uni) return;

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
        <div class="modal-content">
            <span class="modal-close">&times;</span>
            <h2>${uni.name}</h2>
            <div class="modal-stats">
                <div class="modal-stat">
                    <span class="stat-label">Совпадение</span>
                    <span class="stat-value">${uni.match_percentage}%</span>
                </div>
                <div class="modal-stat">
                    <span class="stat-label">Город</span>
                    <span class="stat-value">${uni.city}</span>
                </div>
            </div>
            <h3>Почему этот вуз?</h3>
            <ul>
                ${uni.reasons.map(r => `<li>${r}</li>`).join('')}
            </ul>
            <button class="btn modal-btn" onclick="this.closest('.modal').remove()">Закрыть</button>
        </div>
    `;

  document.body.appendChild(modal);

  modal.querySelector('.modal-close').onclick = () => modal.remove();
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
}

async function searchRecommendations() {
  const userId = document.getElementById('userIdInput').value.trim();
  const errorDiv = document.getElementById('errorMessage');
  const resultsGrid = document.getElementById('recommendationsGrid');
  const userInfoDiv = document.getElementById('userInfo');
  const shareBtn = document.getElementById('shareResultsBtn');

  if (!userId) {
    errorDiv.style.display = 'block';
    errorDiv.innerText = 'Введите ID';
    if (shareBtn) shareBtn.style.display = 'none';
    return;
  }

  errorDiv.style.display = 'none';
  resultsGrid.innerHTML = '<div class="loading">Загрузка рекомендаций...</div>';
  if (shareBtn) shareBtn.style.display = 'none';

  // TODO: когда бэк добавит эндпоинт /api/recommendations/{userId}
  // const data = await API.fetchRecommendations(userId);

  // Пока используем mock
  const user = allUsers.find(u => u.id.toString() === userId);
  if (!user) {
    errorDiv.style.display = 'block';
    errorDiv.innerText = 'Пользователь не найден';
    if (shareBtn) shareBtn.style.display = 'none';
    return;
  }

  const data = await mockAPI('/api/recommendations', { nickname: user.nickname });

  if (!data.success) {
    errorDiv.style.display = 'block';
    errorDiv.innerText = 'Рекомендации не найдены';
    return;
  }

  if (shareBtn) shareBtn.style.display = 'flex';

  // Отображение информации о пользователе
  userInfoDiv.style.display = 'block';
  userInfoDiv.innerHTML = `
        <div class="user-info-card">
            <div class="user-info-header">
                <span class="user-emoji">👤</span>
                <strong class="user-nickname">${user.nickname} (ID: ${user.id})</strong>
                <button class="user-info-close" onclick="document.getElementById('userInfo').style.display='none'">✕</button>
            </div>
            <div class="user-info-details">
                <span class="user-detail">${user.age} лет</span>
                <span class="user-detail">${user.gender === 'male' ? '♂ Мужской' : '♀ Женский'}</span>
                <span class="user-detail">${user.course} курс</span>
                <span class="user-detail">${user.education_form === 'budget' ? 'Бюджет' : 'Контракт'}</span>
            </div>
        </div>
    `;

  renderRecommendations(data.recommendations.recommendations);
}

async function shareRecommendations() {
  const nickname = document.getElementById('nicknameInput').value.trim();
  const shareBtn = document.getElementById('shareResultsBtn');

  if (!nickname) {
    alert('Сначала найдите пользователя');
    return;
  }

  const shareUrl = `${window.location.origin}${window.location.pathname}?user=${encodeURIComponent(nickname)}`;

  try {
    if (navigator.share) {
      await navigator.share({
        title: `Рекомендации для ${nickname}`,
        text: `Посмотрите рекомендации вузов для ${nickname}`,
        url: shareUrl
      });
    } else {
      await navigator.clipboard.writeText(shareUrl);

      const originalText = shareBtn.innerHTML;
      shareBtn.innerHTML = 'Ссылка скопирована!';
      shareBtn.style.background = '#2B6054';

      setTimeout(() => {
        shareBtn.innerHTML = originalText;
        shareBtn.style.background = '';
      }, 2000);
    }
  } catch (err) {
    console.error('Ошибка шаринга:', err);
    alert('Не удалось поделиться. Попробуйте скопировать ссылку вручную.');
  }
}

function checkUrlForUser() {
  const urlParams = new URLSearchParams(window.location.search);
  const userParam = urlParams.get('user');

  if (userParam) {
    document.getElementById('nicknameInput').value = userParam;
    searchRecommendations();
  }
}

async function searchRecommendations() {
  const nickname = document.getElementById('nicknameInput').value.trim();
  const errorDiv = document.getElementById('errorMessage');
  const resultsGrid = document.getElementById('recommendationsGrid');
  const userInfoDiv = document.getElementById('userInfo');
  const shareBtn = document.getElementById('shareResultsBtn');

  if (!nickname) {
    errorDiv.style.display = 'block';
    errorDiv.innerText = 'Введите никнейм';
    errorDiv.style.animation = 'shake 0.5s';
    setTimeout(() => {
      errorDiv.style.animation = '';
    }, 500);
    if (shareBtn) shareBtn.style.display = 'none';
    return;
  }

  errorDiv.style.display = 'none';
  resultsGrid.innerHTML = '<div class="loading">Загрузка рекомендаций...</div>';
  if (shareBtn) shareBtn.style.display = 'none';

  const data = await mockAPI('/api/recommendations', { nickname });

  if (!data.success) {
    errorDiv.style.display = 'block';
    errorDiv.innerText = 'Пользователь не найден';
    if (shareBtn) shareBtn.style.display = 'none';
    return;
  }

  if (shareBtn) shareBtn.style.display = 'flex';

  const user = allUsers.find(u => u.nickname === nickname);
  if (user) {
    userInfoDiv.style.display = 'block';
    userInfoDiv.innerHTML = `
            <div class="user-info-card">
                <div class="user-info-header">
                    <span class="user-emoji">👤</span>
                    <strong class="user-nickname">${user.nickname}</strong>
                    <button class="user-info-close" onclick="document.getElementById('userInfo').style.display='none'">✕</button>
                </div>
                <div class="user-info-details">
                    <span class="user-detail">${user.age} лет</span>
                    <span class="user-detail">${user.gender === 'male' ? '♂ Мужской' : '♀ Женский'}</span>
                    <span class="user-detail">${user.course} курс</span>
                    <span class="user-detail">${user.education_form === 'budget' ? 'Бюджет' : 'Контракт'}</span>
                </div>
            </div>
        `;
  }

  let recs = data.recommendations.recommendations;
  renderRecommendations(recs);

  const filterSection = document.getElementById('filterControls');
  if (filterSection) filterSection.style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', () => {
  loadUsers();

  const searchBtn = document.getElementById('searchBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', searchRecommendations);
  }

  const shareBtn = document.getElementById('shareResultsBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', shareRecommendations);
  }

  const nicknameInput = document.getElementById('nicknameInput');
  if (nicknameInput) {
    nicknameInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') searchRecommendations();
    });
  }

  checkUrlForUser();

  const resultsSection = document.getElementById('resultsSection');
  if (resultsSection && !document.getElementById('filterControls')) {
    const filterHtml = `
            <div id="filterControls" style="display: none; gap: 12px; margin: 20px 0;">
                <select id="sortSelect" class="filter-select">
                    <option value="match">По совпадению ▼</option>
                    <option value="name">По названию ▲</option>
                </select>
                <select id="filterSelect" class="filter-select">
                    <option value="all">Все города</option>
                    <option value="Москва">Москва</option>
                    <option value="Санкт-Петербург">Санкт-Петербург</option>
                </select>
            </div>
        `;
    resultsSection.insertAdjacentHTML('afterbegin', filterHtml);

    document.getElementById('sortSelect')?.addEventListener('change', sortRecommendations);
    document.getElementById('filterSelect')?.addEventListener('change', filterRecommendations);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  loadUsers();

  const searchBtn = document.getElementById('searchBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', searchRecommendations);
  }

  const userIdInput = document.getElementById('userIdInput');
  if (userIdInput) {
    userIdInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') searchRecommendations();
    });
  }

  const resultsSection = document.getElementById('resultsSection');
  if (resultsSection && !document.getElementById('filterControls')) {
    const filterHtml = `
            <div id="filterControls" style="display: none; gap: 12px; margin: 20px 0;">
                <select id="sortSelect" class="filter-select">
                    <option value="match">По совпадению ▼</option>
                    <option value="name">По названию ▲</option>
                </select>
                <select id="filterSelect" class="filter-select">
                    <option value="all">Все города</option>
                    <option value="Москва">Москва</option>
                    <option value="Санкт-Петербург">Санкт-Петербург</option>
                </select>
            </div>
        `;
    resultsSection.insertAdjacentHTML('afterbegin', filterHtml);

    document.getElementById('sortSelect')?.addEventListener('change', sortRecommendations);
    document.getElementById('filterSelect')?.addEventListener('change', filterRecommendations);
  }
});