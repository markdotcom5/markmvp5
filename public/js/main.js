document.addEventListener("DOMContentLoaded", () => {
    // Existing Functionality
    const languageFlags = document.querySelectorAll(".language-flag");
    const menuButton = document.querySelector(".menu-icon");
    const menuList = document.querySelector("#dropdown-menu");

    // Menu Toggle
    menuButton?.addEventListener("click", () => {
        const isExpanded = menuButton.getAttribute("aria-expanded") === "true";
        menuButton.setAttribute("aria-expanded", !isExpanded);
        menuList?.classList.toggle("show");
    });

    // Menu Overlay Toggle
    function toggleMenu() {
        console.log("Menu toggle triggered");
        const menuOverlay = document.getElementById('menuOverlay');
        menuOverlay?.classList.toggle('active');
    }
    
    // Video Loading Handler
    const video = document.querySelector('.video-background');
    if (video) {
        video.addEventListener('loadeddata', function() {
            video.setAttribute('loaded', '');
        });
    }

    // Countdown Timer
    const countdownElement = document.getElementById("countdown-timer");
    const targetDate = new Date("2025-12-31T23:59:59");

    function updateCountdown() {
        if (!countdownElement) return;
        
        const now = new Date();
        const diff = targetDate - now;

        if (diff <= 0) {
            countdownElement.textContent = "The event has started!";
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        countdownElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    setInterval(updateCountdown, 1000);
});
    // Timeline Chart
    const ctx = document.getElementById("timeline-chart").getContext("2d");
    new Chart(ctx, {
        type: "line",
        data: {
            labels: ["2024", "2029", "2034", "2049"],
            datasets: [
                {
                    label: "Max Price ($)",
                    data: [250000, 100000, 25000, 5000],
                    borderColor: "#ff6384",
                    fill: false
                },
                {
                    label: "Min Price ($)",
                    data: [250000, 50000, 10000, 1000],
                    borderColor: "#36a2eb",
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true
                },
                title: {
                    display: true,
                    text: "Price Evolution Timeline"
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Year"
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: "Price ($)"
                    },
                    beginAtZero: false
                }
            }
        }
    });

    // AI Guidance System
    class AIGuidanceSystem {
        constructor() {
            // Core AI Guidance Configuration
            this.currentMode = 'full-guidance';
            this.learningProgress = 0;
            this.systemStatus = 'initializing';
            this.personalizedSkills = {};

            // DOM Element References
            this.modeSelector = document.querySelector('.ai-mode-selector');
            this.progressionBar = document.querySelector('.ai-progression-fill');
            this.statusIndicators = document.querySelector('.ai-status-indicators');

            // Initialize Event Listeners
            this.initEventListeners();
        }

        initEventListeners() {
            // Mode Selection Handler
            if (this.modeSelector) {
                this.modeSelector.addEventListener('click', (event) => {
                    const selectedMode = event.target.closest('.ai-mode');
                    if (selectedMode && !selectedMode.classList.contains('active')) {
                        this.switchAIMode(selectedMode.dataset.mode);
                    }
                });
            }
        }

        switchAIMode(newMode) {
            // Remove active state from all modes
            document.querySelectorAll('.ai-mode').forEach(mode => {
                mode.classList.remove('active');
            });

            // Activate selected mode
            const selectedModeElement = document.querySelector(`.ai-mode[data-mode="${newMode}"]`);
            if (selectedModeElement) {
                selectedModeElement.classList.add('active');

                // Update current mode
                this.currentMode = newMode;

                // Trigger mode-specific behaviors
                this.updateSystemStatus(newMode);
                this.createContextualHint(newMode);
            }
        }

        updateSystemStatus(mode) {
            let status = 'learning';
            let progressPercentage = 0;

            switch(mode) {
                case 'full-guidance':
                    status = 'learning';
                    progressPercentage = 75;
                    break;
                case 'manual-navigation':
                    status = 'warning';
                    progressPercentage = 30;
                    break;
                default:
                    status = 'learning';
                    progressPercentage = 50;
            }

            // Update status dot
            this.updateStatusIndicator(status);

            // Update progression bar
            this.updateProgressionBar(progressPercentage);
        }

        updateStatusIndicator(status) {
            if (this.statusIndicators) {
                // Clear previous status classes
                const statusDot = this.statusIndicators.querySelector('.ai-status-dot');
                if (statusDot) {
                    statusDot.className = 'ai-status-dot';
                    // Add current status class
                    statusDot.classList.add(`ai-status-dot--${status}`);
                }
            }
        }

        updateProgressionBar(percentage) {
            if (this.progressionBar) {
                this.progressionBar.style.width = `${percentage}%`;
            }
        }

        createContextualHint(mode) {
            // Remove existing hints
            const existingHints = document.querySelectorAll('.ai-context-hint');
            existingHints.forEach(hint => hint.remove());

            // Create new hint based on mode
            const hintContent = {
                'full-guidance': 'AI is optimizing your entire learning path',
                'manual-navigation': 'You have more control, but less AI optimization',
                'hybrid': 'Balanced approach between AI guidance and manual control'
            };

            const hintElement = document.createElement('div');
            hintElement.classList.add('ai-context-hint');
            hintElement.textContent = hintContent[mode] || 'Select your AI interaction mode';

            // Attach to the selected mode
            const selectedMode = document.querySelector(`.ai-mode[data-mode="${mode}"]`);
            if (selectedMode) {
                selectedMode.appendChild(hintElement);
            }
        }

        // Advanced AI Tracking Methods
        trackPersonalizedSkill(skillName, proficiencyLevel) {
            this.personalizedSkills[skillName] = proficiencyLevel;
            this.updateSkillVisualization();
        }

        updateSkillVisualization() {
            // Future enhancement: Create a visualization of skill progression
            console.log('Personalized Skills:', this.personalizedSkills);
        }

        // Potential future method for more complex AI interactions
        generateNextTrainingRecommendation() {
            // Logic to suggest next training steps based on current progress
            const recommendations = [
                'Focus on zero-gravity adaptation',
                'Improve spacecraft systems knowledge',
                'Practice emergency procedure simulations'
            ];

            return recommendations[Math.floor(Math.random() * recommendations.length)];
        }
    }

    // Header Scroll Effect
    function handleHeaderScroll() {
        const header = document.querySelector('.header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }

    // Scroll Event Listener for Header
    window.addEventListener('scroll', handleHeaderScroll);

    // Menu Toggle Function
    window.toggleMenu = () => {
        const menuOverlay = document.getElementById('menuOverlay');
        menuOverlay.classList.toggle('active');
    };

    // Language Change Function
    window.changeLanguage = (lang) => {
        // Placeholder for language change logic
        console.log(`Changing language to: ${lang}`);
        // Implement actual language switching mechanism
    };

    // Initialize the AI Guidance System
    window.aiGuidanceSystem = new AIGuidanceSystem();
});