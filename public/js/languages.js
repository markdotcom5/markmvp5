// languages.js
const translations = {
    en: {
        nav: {
            home: "Home",
            about: "About",
            academy: "StelTrek Academy",
            profile: "Profile",
            subscribe: "Subscribe"
        },
        common: {
            footer: "© 2024 StelTrek Academy. All rights reserved."
        },
        welcome: {
            videoTagline: "Enough dreaming, let’s take a walk to show how we can get you up to space.",
            ctaMessage: "Are you ready to begin your space journey?",
            joinButton: "Join Now",
            proceedButton: "Proceed"
        }
        // Add more page-specific keys as needed
    },
    zh: {
        nav: {
            home: "首页",
            about: "关于我们",
            academy: "斯特尔特雷克学院",
            profile: "个人资料",
            subscribe: "订阅"
        },
        common: {
            footer: "© 2024 斯特尔特雷克学院。版权所有。"
        },
        welcome: {
            videoTagline: "够了的梦想，让我们走一走，看看我们如何让你进入太空。",
            ctaMessage: "您准备好开始您的太空之旅了吗？",
            joinButton: "现在加入",
            proceedButton: "继续"
        }
    },
    // Add more languages (ko, es, etc.)
};
export function getTranslation(lang, key) {
    const keys = key.split('.');
    let value = translations[lang];

    keys.forEach(k => {
        value = value ? value[k] : null;
    });

    return value || translations.en[key]; // Default to English if translation is missing
}
export function applyTranslations(lang) {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.dataset.i18n;
        const translation = getTranslation(lang, key);
        if (translation) {
            element.textContent = translation;
        }
    });
}
document.querySelectorAll('.language-flag').forEach(flag => {
    flag.addEventListener('click', (e) => {
        const selectedLang = flag.dataset.lang || 'en';
        localStorage.setItem('preferredLanguage', selectedLang);
        window.location.reload(); // Reload the page to apply the new language
    });
});

export default translations;
