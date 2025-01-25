const EventEmitter = require('events');

const CONFIG = {
    REFRESH_INTERVAL: 30000,
    ANIMATION_DURATION: 300,
    WEBSOCKET_URL: `wss://${window.location.host}/ws`
};

const UI = {
    elements: {
        filters: {
            ranking: document.getElementById('rankingFilter'),
            time: document.getElementById('timeFilter'),
            search: document.getElementById('searchCadets')
        },
        pagination: {
            prev: document.getElementById('prevPage'),
            next: document.getElementById('nextPage')
        },
        sections: {
            hero: document.querySelector('#hero .stats'),
            modules: document.querySelector('#training-modules .card'),
            leaderboard: document.querySelector('#leaderboard-section .carousel')
        }
    },
    animations: {
        fadeIn: [
            { opacity: 0, transform: 'translateY(20px)' },
            { opacity: 1, transform: 'translateY(0)' }
        ],
        pulse: [
            { transform: 'scale(1)' },
            { transform: 'scale(1.05)' },
            { transform: 'scale(1)' }
        ]
    }
};

class LeaderboardManager extends EventEmitter {
    constructor(webSocketService) {
        super();
        this.ws = webSocketService;
        this.cache = {
            data: new Map(),
            timeout: 5 * 60 * 1000
        };
        this.bindEvents();
    }

    bindEvents() {
        this.on('rankUpdate', this.handleRankUpdate.bind(this));
        this.on('achievementUnlocked', this.handleAchievement.bind(this));
        this.on('scoreUpdate', this.handleScoreUpdate.bind(this));
    }

    async handleRankUpdate({ userId, newRank }) {
        await this.broadcastUpdate('rank_change', { userId, newRank });
        this.clearCache();
    }

    async handleScoreUpdate({ userId, newScore }) {
        const rankings = await this.calculateNewRankings(userId, newScore);
        await this.broadcastUpdate('score_update', { userId, newScore, rankings });
    }
}

const WebSocketManager = {
    socket: null,
    retryAttempts: 0,
    maxRetries: 5,
     
    connect() {
        this.socket = new WebSocket(`wss://${window.location.host}/ws/leaderboard`);
        this.setupEventHandlers();
    },
     
    setupEventHandlers() {
        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch(data.type) {
                case 'score_update':
                    this.handleScoreUpdate(data);
                    break;
                case 'rank_change':
                    this.handleRankChange(data);
                    break;
                case 'achievement_unlocked':
                    this.handleAchievement(data);
                    break;
                case 'tournament_update':
                    this.handleTournamentUpdate(data);
                    break;
                case 'squadron_update':
                    this.handleSquadronUpdate(data);
                    break;
                case 'level_up':
                    this.handleLevelUp(data);
                    break;
                case 'status_change':
                    this.handleStatusChange(data);
                    break;
            }
        };
        this.socket.onclose = () => this.handleDisconnect();
    },

    handleScoreUpdate(data) {
        const row = document.querySelector(`tr[data-user-id="${data.userId}"]`);
        if (!row) return;
        
        const scoreCell = row.querySelector('.font-mono');
        const oldValue = parseInt(scoreCell.textContent.replace(/,/g, ''));
        AnimationController.animateValue(scoreCell, oldValue, data.newScore, 500);
        
        const changeCell = row.querySelector('.text-sm');
        changeCell.textContent = formatChange(data.change);
        AnimationController.pulseElement(changeCell);
    },

    handleRankChange(data) {
        const row = document.querySelector(`tr[data-user-id="${data.userId}"]`);
        if (!row) return;

        const targetPosition = data.newRank - 1;
        const tbody = row.parentElement;
        const currentIndex = Array.from(tbody.children).indexOf(row);
        
        if (currentIndex !== targetPosition) {
            AnimationController.animateElement(row, [
                { transform: 'translateX(0)' },
                { transform: 'translateX(10px)' },
                { transform: 'translateX(0)' }
            ]);
            
            setTimeout(() => {
                tbody.insertBefore(row, tbody.children[targetPosition]);
                AnimationController.updateRankNumbers(tbody);
            }, 300);
        }
    },

    handleAchievement(data) {
        const { achievement, userId } = data;
        const row = document.querySelector(`tr[data-user-id="${userId}"]`);
        if (!row) return;

        const achievementsCell = row.querySelector('.achievements-container');
        const achievementEl = document.createElement('div');
        achievementEl.className = 'achievement-badge';
        achievementEl.innerHTML = achievement.icon;
        
        AnimationController.fadeIn(achievementEl);
        achievementsCell.appendChild(achievementEl);
        this.showAchievementNotification(achievement);
    },

    handleTournamentUpdate(data) {
        const tournamentSection = document.getElementById('tournament-section');
        if (!tournamentSection) return;

        const { standings, timeLeft } = data;
        const tournamentContent = createTournamentContent(standings, timeLeft);
        tournamentSection.innerHTML = tournamentContent;
        AnimationController.fadeIn(tournamentSection);
    },

    handleSquadronUpdate(data) {
        const { squadronId, stats } = data;
        document.querySelectorAll(`tr[data-squadron="${squadronId}"]`)
            .forEach(row => {
                updateSquadronStats(row, stats);
                AnimationController.pulseElement(row);
            });
    },

    handleLevelUp(data) {
        const { userId, newLevel, rewards } = data;
        const row = document.querySelector(`tr[data-user-id="${userId}"]`);
        if (!row) return;

        const levelEl = row.querySelector('.level-container');
        levelEl.querySelector('.level-text').textContent = `Level ${newLevel}`;
        AnimationController.pulseElement(levelEl);
        
        this.showLevelUpNotification(newLevel, rewards);
    },

    handleDisconnect() {
        if (this.retryAttempts < this.maxRetries) {
            this.retryAttempts++;
            setTimeout(() => this.connect(), 1000 * Math.pow(2, this.retryAttempts));
        }
    },

    showAchievementNotification(achievement) {
        const notification = createNotification('Achievement Unlocked!', achievement);
        AnimationController.fadeIn(notification);
        setTimeout(() => notification.remove(), 5000);
    },

    showLevelUpNotification(level, rewards) {
        const notification = createNotification('Level Up!', { level, rewards });
        AnimationController.fadeIn(notification);
        setTimeout(() => notification.remove(), 5000);
    }
};

const AnimationController = {
    animateElement(element, keyframes, options = {}) {
        const defaultOptions = {
            duration: CONFIG.ANIMATION_DURATION,
            easing: 'ease-out',
            fill: 'forwards'
        };
        return element.animate(keyframes, { ...defaultOptions, ...options });
    },
    
    animateValue(element, start, end, duration) {
        const startTime = performance.now();
        const updateValue = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const value = Math.floor(start + (end - start) * this.easeOutCubic(progress));
            element.textContent = value.toLocaleString();
            if (progress < 1) requestAnimationFrame(updateValue);
        };
        requestAnimationFrame(updateValue);
    },
 
    updateRankNumbers(tbody) {
        Array.from(tbody.children).forEach((row, index) => {
            const rankCell = row.querySelector('.rank-number');
            if (rankCell) {
                rankCell.textContent = `#${index + 1}`;
                rankCell.className = `rank-number ${this.getRankColorClass(index + 1)}`;
            }
        });
    },
 
    getRankColorClass(rank) {
        const colors = {
            1: 'text-yellow-400',
            2: 'text-gray-300',
            3: 'text-amber-600'
        };
        return colors[rank] || 'text-blue-400';
    },
 
    pulseElement(element) {
        return this.animateElement(element, [
            { transform: 'scale(1)' },
            { transform: 'scale(1.05)' },
            { transform: 'scale(1)' }
        ], { duration: 500 });
    },
 
    fadeIn(element) {
        return this.animateElement(element, [
            { opacity: 0, transform: 'translateY(20px)' },
            { opacity: 1, transform: 'translateY(0)' }
        ]);
    },
 
    slideSort(element, fromY, toY) {
        return this.animateElement(element, [
            { transform: `translateY(${fromY}px)` },
            { transform: `translateY(${toY}px)` }
        ]);
    },
 
    easeOutCubic(x) {
        return 1 - Math.pow(1 - x, 3);
    }
 };


 const TournamentManager = {
    active: null,
    rankings: new Map(),
 
    initialize(config) {
        this.active = {
            id: config.id,
            name: config.name,
            startTime: new Date(config.startTime),
            endTime: new Date(config.endTime),
            rewards: config.rewards,
            standings: []
        };
        this.startTimer();
        this.refreshStandings();
    },
 
    startTimer() {
        const updateTimer = () => {
            const now = new Date();
            const timeLeft = this.active.endTime - now;
            
            if (timeLeft <= 0) {
                this.endTournament();
                return;
            }
 
            document.getElementById('tournamentTimer').textContent = 
                this.formatTimeLeft(timeLeft);
            requestAnimationFrame(updateTimer);
        };
        updateTimer();
    },
 
    async refreshStandings() {
        try {
            const response = await fetch(`/api/tournament/${this.active.id}/standings`);
            const data = await response.json();
            this.updateStandings(data.standings);
        } catch (error) {
            console.error('Tournament refresh error:', error);
        }
    },
 
    updateStandings(newStandings) {
        const tbody = document.getElementById('tournamentBody');
        if (!tbody) return;
 
        newStandings.forEach((player, index) => {
            const row = this.createStandingRow(player, index + 1);
            const existing = tbody.querySelector(`tr[data-user-id="${player.id}"]`);
            
            if (existing) {
                if (existing.dataset.rank !== String(index + 1)) {
                    AnimationController.slideSort(
                        existing,
                        existing.offsetTop,
                        row.offsetTop
                    );
                }
                existing.replaceWith(row);
            } else {
                tbody.appendChild(row);
                AnimationController.fadeIn(row);
            }
        });
    }
 };
 
 const AchievementSystem = {
    badges: new Map(),
    unlocked: new Set(),
 
    initialize(achievements) {
        achievements.forEach(achievement => {
            this.badges.set(achievement.id, achievement);
        });
        this.checkPendingAchievements();
    },
 
    async checkPendingAchievements() {
        const response = await fetch('/api/achievements/pending');
        const pending = await response.json();
        
        pending.forEach(achievement => {
            if (!this.unlocked.has(achievement.id)) {
                this.unlockAchievement(achievement);
            }
        });
    },
 
    unlockAchievement(achievement) {
        this.unlocked.add(achievement.id);
        
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="flex items-center space-x-4 bg-gray-800/90 p-4 rounded-lg border border-blue-500/30">
                <div class="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    ${achievement.icon}
                </div>
                <div>
                    <h4 class="text-blue-400 font-bold">Achievement Unlocked!</h4>
                    <p class="text-white">${achievement.name}</p>
                    <p class="text-sm text-gray-400">${achievement.description}</p>
                </div>
            </div>
        `;
        
        document.getElementById('achievementContainer').appendChild(notification);
        AnimationController.fadeIn(notification);
        setTimeout(() => notification.remove(), 5000);
    },
 
    getProgressBar(achievementId) {
        const achievement = this.badges.get(achievementId);
        if (!achievement) return '';
 
        return `
            <div class="w-full h-2 bg-gray-700 rounded-full mt-2">
                <div class="h-full bg-blue-500 rounded-full" 
                     style="width: ${achievement.progress}%"></div>
            </div>
        `;
    }
 };

 const LeaderboardAPI = {
    async getGlobalRankings(page, filter, timeRange, search) {
        const params = new URLSearchParams({ 
            page, 
            filter, 
            timeRange, 
            search,
            squadronId: state.squadronFilter,
            tournamentId: state.activeTournament
        });
        return await this.fetchWithRetry(`/api/leaderboard/global?${params}`);
    },
 
    async getUserStats() {
        return await this.fetchWithRetry('/api/leaderboard/user-stats');
    },
 
    async getTournamentStandings(tournamentId) {
        return await this.fetchWithRetry(`/api/tournament/${tournamentId}/standings`);
    },
 
    async getSquadronStats(squadronId) {
        return await this.fetchWithRetry(`/api/squadron/${squadronId}/stats`);
    },
 
    async fetchWithRetry(url, retries = 3) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error(response.statusText);
            return await response.json();
        } catch (error) {
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                return this.fetchWithRetry(url, retries - 1);
            }
            throw error;
        }
    }
 };
 
 const state = {
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    filter: 'global',
    timeRange: 'allTime',
    searchQuery: '',
    squadronFilter: null,
    activeTournament: null,
    sortColumn: 'rank',
    sortDirection: 'asc',
    selectedDivision: null,
    updateQueue: new Set(),
    animations: {
        enabled: true,
        duration: 300
    },
    filters: {
        rankColors: {
            1: 'text-yellow-400',
            2: 'text-gray-300',
            3: 'text-amber-600'
        },
        divisionClasses: {
            'Alpha': 'bg-purple-500/20 text-purple-400',
            'Beta': 'bg-blue-500/20 text-blue-400',
            'Gamma': 'bg-green-500/20 text-green-400'
        },
        statusStyles: {
            online: { dot: 'bg-green-500', text: 'text-green-400' },
            away: { dot: 'bg-yellow-500', text: 'text-yellow-400' },
            offline: { dot: 'bg-gray-500', text: 'text-gray-400' }
        }
    },
    cache: {
        data: new Map(),
        timeout: 5 * 60 * 1000,
        clear() {
            this.data.clear();
        },
        get(key) {
            const item = this.data.get(key);
            if (!item) return null;
            if (Date.now() - item.timestamp > this.timeout) {
                this.data.delete(key);
                return null;
            }
            return item.value;
        },
        set(key, value) {
            this.data.set(key, {
                value,
                timestamp: Date.now()
            });
        }
    }
 };
 function initializeState() {
    const params = new URLSearchParams(window.location.search);
    state.currentPage = parseInt(params.get('page')) || 1;
    state.filter = params.get('filter') || 'global';
    state.timeRange = params.get('timeRange') || 'allTime';
    state.squadronFilter = params.get('squadron') || null;
    state.selectedDivision = params.get('division') || null;
 }

// Event Handlers
const EventHandlers = {
    setupEventListeners() {
        // Filter Handlers
        UI.elements.filters.ranking?.addEventListener('change', this.handleFilterChange);
        UI.elements.filters.time?.addEventListener('change', this.handleFilterChange);
        UI.elements.filters.search?.addEventListener('input', this.handleSearch);
 
        // Pagination
        UI.elements.pagination.prev?.addEventListener('click', () => this.handlePageChange('prev'));
        UI.elements.pagination.next?.addEventListener('click', () => this.handlePageChange('next'));
 
        // Video Section Handlers
        const videoSections = document.querySelectorAll('.video-section video');
        videoSections.forEach(video => {
            video.addEventListener('error', this.handleVideoError);
            video.addEventListener('canplay', () => this.handleVideoLoad(video));
        });
 
        // Tournament Events
        document.addEventListener('tournament:update', this.handleTournamentUpdate);
        document.addEventListener('achievement:unlock', this.handleAchievementUnlock);
    },
 
    handleFilterChange(e) {
        state[e.target.id] = e.target.value;
        state.currentPage = 1;
        state.cache.clear();
        updateURL();
        refreshLeaderboard();
    },
 
    handleSearch: debounce((e) => {
        state.searchQuery = e.target.value.trim();
        state.currentPage = 1;
        refreshLeaderboard();
    }, 300),
 
    handlePageChange(direction) {
        if (direction === 'prev' && state.currentPage > 1) {
            state.currentPage--;
        } else if (direction === 'next' && state.currentPage < state.totalPages) {
            state.currentPage++;
        }
        updateURL();
        refreshLeaderboard();
    },
 
    handleVideoError(e) {
        console.error('Video loading error:', e);
        const section = e.target.closest('.video-section');
        if (section) {
            section.style.backgroundColor = '#1a1a1a';
            e.target.style.display = 'none';
        }
    },
 
    handleVideoLoad(video) {
        AnimationController.fadeIn(video.closest('.video-section'));
    },
 
    handleTournamentUpdate(e) {
        TournamentManager.updateStandings(e.detail.standings);
    },
 
    handleAchievementUnlock(e) {
        AchievementSystem.unlockAchievement(e.detail);
    }
 };
 
 // Initialization
 function initializeApp() {
    initializeState();
    EventHandlers.setupEventListeners();
    WebSocketManager.connect();
    
    // Initialize Managers
    TournamentManager.initialize({
        id: 'current-tournament',
        name: 'Weekly Challenge',
        startTime: new Date(),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
 
    AchievementSystem.initialize([
        // Add initial achievements
    ]);
 
    // Initial data load
    Promise.all([
        refreshLeaderboard(),
        LeaderboardAPI.getUserStats()
    ]).then(([leaderboardData, userStats]) => {
        updateUI(leaderboardData);
        updateUserStats(userStats);
    }).catch(error => {
        console.error('Initialization error:', error);
        showError('Failed to initialize leaderboard');
    });
 
    // Start periodic updates
    setInterval(refreshLeaderboard, CONFIG.REFRESH_INTERVAL);
 }
 
 // Helper Functions
 function updateURL() {
    const params = new URLSearchParams({
        page: state.currentPage,
        filter: state.filter,
        timeRange: state.timeRange
    });
    if (state.squadronFilter) params.set('squadron', state.squadronFilter);
    if (state.selectedDivision) params.set('division', state.selectedDivision);
    
    window.history.replaceState(
        {}, 
        '', 
        `${window.location.pathname}?${params.toString()}`
    );
 }
 
 function debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
 }
 
 function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
 }
 
 // Start the application
 document.addEventListener('DOMContentLoaded', initializeApp);
