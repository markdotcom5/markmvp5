// Initialize when document is ready
document.addEventListener("DOMContentLoaded", () => {
    try {
        // Initialize AI Guidance System
        const aiSystem = new AIGuidanceSystem();

        // Menu and Navigation
        initializeNavigation();

        // Video Background Handler
        initializeVideoBackground();

        // Initialize Timeline
        initializeTimeline();

        // Start countdown timer
        initializeCountdown();
    } catch (error) {
        console.error("Error initializing application:", error);
    }
});
document.addEventListener("DOMContentLoaded", () => {
    const aiModes = document.querySelectorAll(".ai-mode");

    aiModes.forEach((mode) => {
        mode.addEventListener("click", () => {
            aiModes.forEach((m) => m.classList.remove("active")); // Remove active from others
            mode.classList.add("active"); // Activate clicked mode
            console.log(`AI Mode Switched: ${mode.dataset.mode}`); // Log selected mode
        });
    });
});
// In your main.js
document.addEventListener('DOMContentLoaded', function() {
    // Menu Toggle
    window.toggleMenu = function() {
        document.querySelector('.menu-overlay')?.classList.toggle('active');
    };

    // AI Toggle
    const toggleOptions = document.querySelectorAll('.toggle-option');
    toggleOptions.forEach(option => {
        option.addEventListener('click', function() {
            toggleOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
        });
    });
});
// AI Guidance System Class
class AIGuidanceSystem {
    constructor() {
        this.currentMode = 'full-guidance';
        this.learningProgress = 0;
        this.systemStatus = 'initializing';

        // Initialize UI Elements
        this.initializeUI();
        this.initializeEventListeners();
    }

    initializeUI() {
        try {
            this.elements = {
                modeSelector: document.querySelector('.ai-mode-selector'),
                progressionBar: document.querySelector('.ai-progression-fill'),
                statusIndicators: document.querySelector('.ai-status-indicators')
            };

            // Add glowing effect
            this.addGlowingEffects();
        } catch (error) {
            console.error("Error initializing AI UI elements:", error);
        }
    }

    initializeEventListeners() {
        try {
            if (this.elements.modeSelector) {
                this.elements.modeSelector.addEventListener('click', (e) => {
                    const mode = e.target.closest('.ai-mode');
                    if (mode && !mode.classList.contains('active')) {
                        this.switchMode(mode.dataset.mode);
                    }
                });
            }
        } catch (error) {
            console.error("Error setting up AI event listeners:", error);
        }
    }

    switchMode(mode) {
        try {
            const modes = document.querySelectorAll('.ai-mode');
            modes.forEach(m => m.classList.remove('active'));

            const selectedMode = document.querySelector(`.ai-mode[data-mode="${mode}"]`);
            if (selectedMode) {
                selectedMode.classList.add('active');
                this.currentMode = mode;
                this.updateStatus(mode);
            }
        } catch (error) {
            console.error("Error switching AI mode:", error);
        }
    }

    updateStatus(mode) {
        try {
            const statusConfigs = {
                'full-guidance': { status: 'learning', progress: 75 },
                'manual-navigation': { status: 'active', progress: 30 }
            };

            const config = statusConfigs[mode] || { status: 'learning', progress: 50 };
            this.updateStatusIndicator(config.status);
            this.updateProgress(config.progress);
        } catch (error) {
            console.error("Error updating AI status:", error);
        }
    }

    updateStatusIndicator(status) {
        try {
            const dot = this.elements.statusIndicators?.querySelector('.ai-status-dot');
            if (dot) {
                dot.className = `ai-status-dot ai-status-dot--${status}`;
            }
        } catch (error) {
            console.error("Error updating AI status indicator:", error);
        }
    }

    updateProgress(percentage) {
        try {
            if (this.elements.progressionBar) {
                this.elements.progressionBar.style.width = `${percentage}%`;
            }
        } catch (error) {
            console.error("Error updating AI progression bar:", error);
        }
    }

    addGlowingEffects() {
        try {
            const aiPanel = document.querySelector('.ai-panel');
            if (aiPanel) {
                aiPanel.classList.add('glowing');
            }
        } catch (error) {
            console.error("Error adding glowing effects:", error);
        }
    }
}

// Video Background Handler
function initializeVideoBackground() {
    const video = document.querySelector('.video-background');
    if (!video) return;

    video.onerror = () => {
        console.error("Video failed to load. Using fallback image.");
        const container = document.querySelector('.video-container');
        container.style.backgroundImage = 'url(/images/fallback-hero-bg.jpg)';
    };
}


function handleVideoFallback() {
    const videoContainer = document.querySelector('.video-container');
    if (videoContainer) {
        videoContainer.style.backgroundImage = 'url(/images/fallback-hero-bg.jpg)';
        videoContainer.classList.add('fallback');
    }
}


// Navigation Functions
function initializeNavigation() {
    try {
        const menuTrigger = document.querySelector('.menu-trigger');
        const menuOverlay = document.getElementById('menuOverlay');

        if (menuTrigger && menuOverlay) {
            menuTrigger.addEventListener('click', toggleMenu);
        }

        // Header scroll effect
        window.addEventListener('scroll', () => {
            const header = document.querySelector('.header');
            if (header) {
                header.classList.toggle('scrolled', window.scrollY > 50);
            }
        });
    } catch (error) {
        console.error("Error initializing navigation:", error);
    }
}

// Toggle menu functionality
function toggleMenu() {
    const menuOverlay = document.getElementById('menuOverlay');
    if (!menuOverlay) {
        console.error("Menu overlay element not found!");
        return;
    }

    const isActive = menuOverlay.classList.toggle('active');
    console.log(`Menu toggled: ${isActive}`);
}

  // Language switching
  function changeLanguage(lang) {
    fetch('/api/setLanguage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ language: lang }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          window.location.reload();
        }
      });
  }
 // Stats Counter Animation
function animateStats() {
    try {
        const stats = document.querySelectorAll('.stat .number');

        stats.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'), 10); // Use data-target for dynamic values
            let current = 0;

            const increment = target / 50; // Adjust for animation speed
            const updateInterval = 30; // Interval duration in milliseconds

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    clearInterval(timer);
                    current = target;
                }
                stat.textContent = Math.round(current);
            }, updateInterval);
        });
    } catch (error) {
        console.error("Error animating stats:", error);
    }
}

// Timeline Chart
function initializeTimeline() {
    try {
        const canvas = document.getElementById("timeline-chart");
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        new Chart(ctx, {
            type: "line",
            data: {
                labels: ["2024", "2029", "2034", "2049"],
                datasets: [
                    {
                        label: "Space Travel Cost ($)",
                        data: [250000, 50000, 10000, 5000],
                        borderColor: "#00ffff",
                        backgroundColor: "rgba(0, 255, 255, 0.1)",
                        tension: 0.4, // Smooth line curve
                        pointRadius: 5, // Highlight data points
                        pointBackgroundColor: "#00ffff",
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Better fit for smaller containers
                plugins: {
                    legend: { display: true, labels: { color: "#ffffff" } },
                    title: {
                        display: true,
                        text: "Cost Evolution Timeline",
                        color: "#ffffff",
                        font: { size: 18 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: "rgba(255, 255, 255, 0.1)"
                        },
                        ticks: { color: "#ffffff" }
                    },
                    x: {
                        grid: {
                            color: "rgba(255, 255, 255, 0.1)"
                        },
                        ticks: { color: "#ffffff" }
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error initializing timeline:", error);
    }
}

// Countdown Timer
function initializeCountdown() {
    try {
        const countdownElement = document.getElementById("countdown-timer");
        if (!countdownElement) return;

        const targetDate = new Date("2025-12-31T23:59:59");

        function updateCountdown() {
            const now = new Date();
            const diff = targetDate - now;

            if (diff <= 0) {
                countdownElement.textContent = "Launch commenced!";
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / 1000 / 60) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            countdownElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        }

        setInterval(updateCountdown, 1000);
        updateCountdown();
    } catch (error) {
        console.error("Error initializing countdown timer:", error);
    }
}

// Event Listeners to Initialize All Functions
document.addEventListener("DOMContentLoaded", () => {
    animateStats();
    initializeTimeline();
    initializeCountdown();
});
