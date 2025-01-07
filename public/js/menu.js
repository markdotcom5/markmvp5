// public/js/menu.js
document.addEventListener('DOMContentLoaded', () => {
    const translations = {
        en: {
            home: 'Home',
            why: 'Why StelTrek',
            about: 'About',
            leaderboard: 'Leaderboard',
            login: 'Login',
            retail: 'Retail Store',
            profile: 'Profile',
            signup: 'Sign Up',
            academy: 'StelTrek Academy',
            welcome: 'Welcome',
            subscribe: 'Subscribe'
        },
        // ... other translations
    };

    const menuItems = [
        { key: 'home', href: '/index.html' },
        { key: 'why', href: '/Why-StelTrek.html' },
        // ... other menu items
    ];

    // Language selection handling
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            document.cookie = `language=${lang};path=/`;
            
            // Hide language container
            document.getElementById('language-container').style.display = 'none';
            
            // Show menu button
            document.getElementById('menu-button').style.display = 'block';
            
            // Initialize menu with selected language
            initializeMenu(lang);
        });
    });

    // Check if language is already selected
    const selectedLang = document.cookie.split(';')
        .find(c => c.trim().startsWith('language='));
    
    if (selectedLang) {
        const lang = selectedLang.split('=')[1];
        initializeMenu(lang);
    }

    function initializeMenu(lang) {
        const menuContainer = document.getElementById('menu-container');
        const menuContent = menuContainer.querySelector('.menu-content');
        const menuButton = document.getElementById('menu-button');

        // Clear existing menu items
        menuContent.innerHTML = '';

        // Add translated menu items
        menuItems.forEach(item => {
            const link = document.createElement('a');
            link.href = item.href;
            link.textContent = translations[lang][item.key];
            link.className = 'menu-item';
            menuContent.appendChild(link);
        });

        // Menu hover behavior
        menuButton.addEventListener('mouseenter', () => {
            menuContainer.style.display = 'flex';
        });

        menuContainer.addEventListener('mouseleave', () => {
            menuContainer.style.display = 'none';
        });
    }
});