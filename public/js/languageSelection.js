document.addEventListener('DOMContentLoaded', async () => {
  const langButtons = document.querySelectorAll('.lang-btn');
  const contentElements = document.querySelectorAll('[data-i18n]');
  const apiGeolocationUrl = 'https://ipapi.co/json/'; // Replace with your preferred API endpoint

  // Language Map
  const translations = {
      en: {
          heroTitle: "Keep Dreaming & Start Saving Up for Your Next First to SPACE",
          joinNow: "Join Now",
          communityHub: "Explore Community Hub",
      },
      zh: {
          heroTitle: "继续梦想并开始为您的下一次太空之旅存钱",
          joinNow: "立即加入",
          communityHub: "探索社区中心",
      },
      ko: {
          heroTitle: "꿈을 계속 꾸고 다음 우주 여행을 위해 저축을 시작하세요",
          joinNow: "지금 가입하세요",
          communityHub: "커뮤니티 허브 탐험하기",
      },
      es: {
          heroTitle: "Sigue soñando y comienza a ahorrar para tu próximo viaje al espacio",
          joinNow: "Únete ahora",
          communityHub: "Explorar el Centro Comunitario",
      },
  };

  // Apply translations dynamically
  const applyTranslations = (lang) => {
      contentElements.forEach((el) => {
          const key = el.dataset.i18n;
          el.textContent = translations[lang]?.[key] || el.textContent;
      });
  };

  // Get saved language from cookies
  const getCookie = (name) => {
      const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
      return match ? match[2] : null;
  };

  // Save language to cookies
  const setCookie = (name, value, days) => {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      document.cookie = `${name}=${value}; path=/; expires=${date.toUTCString()}`;
  };

  // Detect language from IP location
  const detectLanguageByIP = async () => {
      try {
          const response = await fetch(apiGeolocationUrl);
          const data = await response.json();
          const country = data.country_name;

          const languageMap = {
              'United States': 'en',
              'China': 'zh',
              'Korea': 'ko',
              'Spain': 'es',
          };

          return languageMap[country] || 'en'; // Default to English
      } catch (error) {
          console.error('Failed to fetch geolocation data:', error);
          return 'en'; // Default to English on failure
      }
  };

  // Detect language from browser metadata
  const detectLanguageFromBrowser = () => {
      const userLanguage = navigator.language || navigator.userLanguage;
      const supportedLanguages = ['en', 'zh', 'ko', 'es'];
      return supportedLanguages.includes(userLanguage.slice(0, 2)) ? userLanguage.slice(0, 2) : 'en';
  };

  // Initialize Language Selection
  const initLanguage = async () => {
      let selectedLang = getCookie('language');

      if (!selectedLang) {
          selectedLang = await detectLanguageByIP(); // Attempt IP-based detection
          setCookie('language', selectedLang, 30); // Save detected language in cookies
      }

      applyTranslations(selectedLang); // Apply the selected language to the page
  };

  // Language Button Click Handler
  langButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
          const selectedLang = button.dataset.lang;
          setCookie('language', selectedLang, 30); // Save selected language to cookies
          applyTranslations(selectedLang); // Update page content
      });
  });

  // Run Language Initialization
  initLanguage();
});
