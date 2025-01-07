document.addEventListener('DOMContentLoaded', async () => {
    // Initialize dashboard
    initializeDashboard();
    
    // Set up event listeners
    setupEventListeners();
});

async function initializeDashboard() {
    try {
        const [userStats, achievements, nextMission] = await Promise.all([
            fetchUserStats(),
            fetchAchievements(),
            fetchNextMission()
        ]);

        updateStats(userStats);
        updateAchievements(achievements);
        updateNextMission(nextMission);
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showError('Failed to load dashboard data');
    }
}

async function fetchUserStats() {
    const response = await fetch('/api/user/stats', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch user stats');
    }
    
    return response.json();
}

async function fetchAchievements() {
    const response = await fetch('/api/achievements', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch achievements');
    }
    
    return response.json();
}

async function fetchNextMission() {
    const response = await fetch('/api/training/next-mission', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch next mission');
    }
    
    return response.json();
}

function updateStats(stats) {
    // Update progress bar
    const progressBar = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    const progress = stats.progress || 0;
    
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${progress}%`;
    progressBar.parentElement.setAttribute('aria-valuenow', progress);

    // Update stats
    document.getElementById('user-rank').textContent = stats.rank || '--';
    document.getElementById('user-score').textContent = stats.score || '0';
    document.getElementById('missions-completed').textContent = stats.missionsCompleted || '0';
}

function updateAchievements(achievements) {
    const achievementsList = document.getElementById('achievements-list');
    achievementsList.innerHTML = '';

    if (achievements.length === 0) {
        achievementsList.innerHTML = '<li class="achievement-item">No achievements yet</li>';
        return;
    }

    achievements.forEach(achievement => {
        const li = document.createElement('li');
        li.className = 'achievement-item';
        li.innerHTML = `
            <span class="achievement-icon">🏆</span>
            <div class="achievement-info">
                <strong>${achievement.title}</strong>
                <p>${achievement.description}</p>
            </div>
        `;
        achievementsList.appendChild(li);
    });
}

function updateNextMission(mission) {
    const missionContainer = document.getElementById('next-mission');
    
    if (!mission) {
        missionContainer.innerHTML = '<p>No upcoming missions</p>';
        return;
    }

    missionContainer.innerHTML = `
        <h3 class="mission-title">${mission.title}</h3>
        <p class="mission-description">${mission.description}</p>
        <button onclick="startMission('${mission.id}')" class="mission-button">
            Start Mission
        </button>
    `;
}

async function startMission(missionId) {
    try {
        const response = await fetch(`/api/training/start-mission/${missionId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to start mission');
        }

        const result = await response.json();
        window.location.href = `/training/mission/${missionId}`;
    } catch (error) {
        console.error('Error starting mission:', error);
        showError('Failed to start mission');
    }
}

function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Add other event listeners as needed
}

async function handleLogout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Logout failed');
        }

        localStorage.removeItem('token');
        window.location.href = '/login';
    } catch (error) {
        console.error('Logout error:', error);
        showError('Failed to log out');
    }
}

function showError(message) {
    // Implement error notification system
    console.error(message);
    // You could add a toast notification or alert here
}

// Add event listener for real-time updates if needed
function setupWebSocket() {
    const ws = new WebSocket(getWebSocketUrl());
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleRealtimeUpdate(data);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    return ws;
}

function handleRealtimeUpdate(data) {
    switch