let allUsers = [];

async function loadUsers() {
    const data = await mockAPI('/api/users');
    allUsers = data.users || [];
    renderUserList(allUsers);
}

function renderUserList(users) {
    const container = document.getElementById('userList');
    if (!container) return;
    
    if (users.length === 0) {
        container.innerHTML = '<div style="color:#5a6077;">no users</div>';
        return;
    }
    
    container.innerHTML = users.map(user => `
        <button class="user-chip" data-nickname="${user.nickname}" style="background:#1a1d27; border:1px solid #2a2f3f; padding:8px 20px; border-radius:40px; cursor:pointer; transition: all 0.2s;">
            ${user.nickname}
        </button>
    `).join('');

    document.querySelectorAll('.user-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('nicknameInput').value = btn.dataset.nickname;
            searchRecommendations();
        });
        btn.addEventListener('mouseenter', () => {
            btn.style.background = '#ff4d4d';
            btn.style.color = '#0b0c10';
            btn.style.borderColor = '#ff4d4d';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = '#1a1d27';
            btn.style.color = '#e5e9f0';
            btn.style.borderColor = '#2a2f3f';
        });
    });
}

async function searchRecommendations() {
    const nickname = document.getElementById('nicknameInput').value.trim();
    const errorDiv = document.getElementById('errorMessage');
    const resultsGrid = document.getElementById('recommendationsGrid');
    const userInfoDiv = document.getElementById('userInfo');
    
    if (!nickname) {
        errorDiv.style.display = 'block';
        errorDiv.innerText = 'Enter nickname';
        resultsGrid.innerHTML = '<div style="color:#5a6077; text-align:center; padding:60px;">Enter nickname</div>';
        userInfoDiv.style.display = 'none';
        return;
    }
    
    errorDiv.style.display = 'none';
    resultsGrid.innerHTML = '<div style="color:#5a6077; text-align:center; padding:60px;">Loading...</div>';
    
    const data = await mockAPI('/api/recommendations', { nickname });
    
    if (!data.success || !data.recommendations) {
        errorDiv.style.display = 'block';
        errorDiv.innerText = data.error || 'user not found';
        resultsGrid.innerHTML = '<div style="color:#5a6077; text-align:center; padding:60px;">user not found</div>';
        userInfoDiv.style.display = 'none';
        return;
    }
   
    const user = allUsers.find(u => u.nickname === nickname);
    if (user) {
        userInfoDiv.style.display = 'block';
        userInfoDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                <div><strong>Nickname:</strong> ${user.nickname}</div>
                <div><strong>Age:</strong> ${user.age} years</div>
                <div><strong>Gender:</strong> ${user.gender === 'male' ? 'male' : (user.gender === 'female' ? 'female' : 'other')}</div>
                <div><strong>Course:</strong> ${user.course}</div>
                <div><strong>Form of education:</strong> ${user.education_form === 'budget' ? 'budget' : 'paid'}</div>
            </div>
        `;
    } else {
        userInfoDiv.style.display = 'none';
    }
    
    const recs = data.recommendations.recommendations;
    if (recs && recs.length > 0) {
        resultsGrid.innerHTML = recs.map(uni => `
            <div class="uni-card">
                <div class="uni-percent">★ ${uni.match_percentage}%</div>
                <div class="uni-name">${uni.name}</div>
                <div class="uni-meta">${uni.city}</div>
                ${uni.reasons.map(reason => `<div class="uni-reason">✓ ${reason}</div>`).join('')}
                <button class="uni-detail-btn" onclick="alert('more about ${uni.name}')">more details →</button>
            </div>
        `).join('');
    } else {
        resultsGrid.innerHTML = '<div style="color:#5a6077; text-align:center; padding:60px;">there are no recommendations for this user yet</div>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', searchRecommendations);
    }
    
    const inputField = document.getElementById('nicknameInput');
    if (inputField) {
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchRecommendations();
        });
    }
});