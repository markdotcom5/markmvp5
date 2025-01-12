document.addEventListener('DOMContentLoaded', () => {
    // ======== Language Selector ========
    const languageSelector = document.getElementById('languageSelector');
    const currentLanguage = localStorage.getItem('language') || 'en';

    if (languageSelector) {
        languageSelector.value = currentLanguage;
        languageSelector.addEventListener('change', (event) => {
            const lang = event.target.value;
            localStorage.setItem('language', lang);
            console.log(`Language switched to: ${lang}`);
            updatePageLanguage(lang);
        });
    }

    function updatePageLanguage(lang) {
        const translations = {
            zh: { h1: '每一个旅程从一个简单的梦想开始' },
            ko: { h1: '모든 여행은 간단한 꿈에서 시작됩니다' },
            es: { h1: 'Cada viaje comienza con un sueño simple' },
            en: { h1: 'Every Journey Begins with a Simple Dream' },
        };
        const content = translations[lang] || translations.en;
        const heading = document.querySelector('h1');
        if (heading) heading.innerText = content.h1;
    }

    updatePageLanguage(currentLanguage);

    // ======== Menu Toggle ========
    const menuOverlay = document.getElementById('menuOverlay');
    const menuTrigger = document.querySelector('.menu-trigger');
    const closeButton = document.querySelector('.close-button');

    if (menuTrigger && menuOverlay) {
        // Open the menu when the menu trigger is clicked
        menuTrigger.addEventListener('click', () => {
            menuOverlay.classList.add('active');
            console.log('📂 Menu opened');
        });

        // Close the menu when the close button is clicked
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                menuOverlay.classList.remove('active');
                console.log('📂 Menu closed');
            });
        }

        // Close the menu if the overlay background is clicked
        menuOverlay.addEventListener('click', (event) => {
            if (event.target === menuOverlay) {
                menuOverlay.classList.remove('active');
                console.log('📂 Menu closed via overlay click');
            }
        });
    } else {
        console.warn('⚠️ Menu elements (menuTrigger or menuOverlay) not found');
    }

    // ======== AI Toggle ========
    const aiToggleOptions = document.querySelectorAll('.toggle-option');
    if (aiToggleOptions.length > 0) {
        aiToggleOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove active class from all toggle options
                aiToggleOptions.forEach(opt => opt.classList.remove('active'));

                // Add active class to the clicked toggle option
                option.classList.add('active');
                console.log(`🧠 AI Mode switched to: ${option.innerText}`);
            });
        });
    } else {
        console.warn('⚠️ No AI toggle options found');
    }

    // ======== Video Background Handler ========
    const videoBackground = document.querySelector('.video-background');
    if (videoBackground) {
        videoBackground.onerror = () => {
            console.error('Video failed to load. Applying fallback image.');
            const container = document.querySelector('.video-container');
            if (container) {
                container.style.backgroundImage = 'url(/images/fallback-hero-bg.jpg)';
                container.classList.add('fallback');
            }
        };
    }

    // ======== Stats Counter Animation ========
    const animateStats = () => {
        const stats = document.querySelectorAll('.stat .number');
        stats.forEach(stat => {
            const target = parseInt(stat.dataset.target, 10);
            let current = 0;
            const increment = target / 50;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    clearInterval(timer);
                    stat.textContent = target;
                } else {
                    stat.textContent = Math.floor(current);
                }
            }, 30);
        });
    };

    // ======== Timeline Chart ========
    const initializeTimeline = () => {
        const canvas = document.getElementById('timeline-chart');
        if (!canvas) return;

        new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['2024', '2029', '2034', '2049'],
                datasets: [{
                    label: 'Space Travel Cost ($)',
                    data: [250000, 50000, 10000, 5000],
                    borderColor: '#00ffff',
                    backgroundColor: 'rgba(0, 255, 255, 0.1)',
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: '#00ffff',
                    fill: true,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#ffffff' } },
                    title: { text: 'Cost Evolution Timeline', color: '#ffffff', font: { size: 18 } },
                },
                scales: {
                    x: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                    y: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                },
            },
        });
    };

    // ======== Countdown Timer ========
    const initializeCountdown = () => {
        const countdownElement = document.getElementById('countdown-timer');
        if (!countdownElement) return;

        const targetDate = new Date('2025-12-31T23:59:59');
        const updateCountdown = () => {
            const diff = targetDate - new Date();
            if (diff <= 0) {
                countdownElement.textContent = 'Launch commenced!';
                return;
            }
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / 1000 / 60) % 60);
            const seconds = Math.floor((diff / 1000) % 60);
            countdownElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        };
        setInterval(updateCountdown, 1000);
        updateCountdown();
    };

    // ======== Initialize All Functions ========
    animateStats();
    initializeTimeline();
    initializeCountdown();
});