console.log("Homepage script loaded successfully.");

// =======================
// Initialize Countdown Timer
// =======================
function initCountdownTimer(elementId, targetDate) {
    const timerElement = document.getElementById(elementId);
    if (!timerElement) return;

    const updateTimer = () => {
        const now = new Date();
        const target = new Date(targetDate);
        const diff = target - now;

        if (diff <= 0) {
            timerElement.textContent = "The event has started!";
            clearInterval(intervalId);
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        timerElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);
}

// =======================
// Render Timeline Chart
// =======================
function renderTimelineChart(elementId) {
    const canvas = document.getElementById(elementId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    new Chart(ctx, {
        type: "line",
        data: {
            labels: ["2023", "2028", "2033", "2038", "2043", "2049"],
            datasets: [
                {
                    label: "Max Price",
                    data: [1, 0.8, 0.5, 0.3, 0.1, 0.05],
                    borderColor: "#007bff",
                    backgroundColor: "rgba(0, 123, 255, 0.2)",
                    fill: true,
                },
                {
                    label: "Min Price",
                    data: [0.8, 0.5, 0.3, 0.2, 0.05, 0.01],
                    borderColor: "#fca311",
                    backgroundColor: "rgba(252, 163, 17, 0.2)",
                    fill: true,
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: "Decreasing Cost of Space Travel",
                },
                tooltip: {
                    mode: "index",
                    intersect: false,
                },
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Year",
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: "Cost (relative to $1M)",
                    },
                    beginAtZero: true,
                },
            },
        },
    });
}

// =======================
// Language Content Loader
// =======================
function loadLanguageContent(lang) {
    const content = {
        en: {
            heroTitle: "StelTrek Academy: Prepare Your Journey to the Stars",
            heroSubtitle: "Countdown to humanity's next great adventure:",
        },
        zh: {
            heroTitle: "斯特尔特雷克学院：为您的星际之旅做好准备",
            heroSubtitle: "倒计时：人类下一次伟大的冒险：",
        },
        ko: {
            heroTitle: "스텔트렉 아카데미: 별을 향한 여정을 준비하세요",
            heroSubtitle: "인류의 다음 위대한 모험까지 카운트다운:",
        },
        es: {
            heroTitle: "Academia StelTrek: Prepárate para tu viaje a las estrellas",
            heroSubtitle: "Cuenta regresiva para la próxima gran aventura de la humanidad:",
        },
    };

    const heroTitle = document.querySelector(".hero-content h1");
    const heroSubtitle = document.querySelector(".hero-content p");

    if (heroTitle && heroSubtitle) {
        heroTitle.textContent = content[lang]?.heroTitle || content.en.heroTitle;
        heroSubtitle.textContent =
            content[lang]?.heroSubtitle || content.en.heroSubtitle;
    }
}

// =======================
// Goal Prompt Logic
// =======================
const userGoal = prompt(
    "Hi! What’s your goal today: training, certification, or exploring content?"
);
if (userGoal) {
    const normalizedGoal = userGoal.trim().toLowerCase();
    if (normalizedGoal === "training") {
        window.location.href = "/training.html";
    } else if (normalizedGoal === "certification") {
        alert("Certification is under development!");
    } else if (normalizedGoal === "exploring content") {
        alert("Explore our amazing content!");
    } else {
        alert(
            "Invalid goal. Please enter training, certification, or exploring content."
        );
    }
}

// =======================
// Language Selection Logic
// =======================
document.querySelectorAll(".language-flag").forEach((button) => {
    button.addEventListener("click", (e) => {
        e.preventDefault();
        const selectedLang = button.dataset.lang || "en";
        localStorage.setItem("preferredLanguage", selectedLang);
        loadLanguageContent(selectedLang);
        console.log(`Language set to: ${selectedLang}`);
    });
});

// =======================
// Button Click Tracking
// =======================
document.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", (event) => {
        console.log(`Button clicked: ${event.target.textContent}`);
    });
});

// =======================
// Initialize Language Content
// =======================
const savedLanguage = localStorage.getItem("preferredLanguage") || "en";
loadLanguageContent(savedLanguage);

// =======================
// Initialize Countdown Timer
// =======================
initCountdownTimer("countdown-timer", "2049-01-01T00:00:00");

// =======================
// Render Timeline Chart
// =======================
renderTimelineChart("timeline-chart");

// =======================
// Auto-Detect Language Based on IP Location
// =======================
fetch("https://ipapi.co/json/")
    .then((response) => response.json())
    .then((data) => {
        const userCountry = data.country_name;
        console.log(`User country: ${userCountry}`);
        const languageMap = {
            "United States": "en",
            China: "zh",
            Korea: "ko",
            Spain: "es",
        };
        const selectedLanguage = languageMap[userCountry] || "en";
        localStorage.setItem("preferredLanguage", selectedLanguage);
        loadLanguageContent(selectedLanguage);
        console.log(`Auto-detected language: ${selectedLanguage}`);
    })
    .catch((error) => {
        console.error("Error detecting IP location:", error.message);
    });

// =======================
// Browser Language Detection and Device Logging
// =======================
const preferredLanguage = navigator.language || "en";
console.log(`Browser language: ${preferredLanguage}`);

const isMobile = /Mobi|Android/i.test(navigator.userAgent);
console.log(`Device type: ${isMobile ? "Mobile" : "Desktop"}`);

// =======================
// Join Now Button Logic
// =======================
document.getElementById("join-now").addEventListener("click", () => {
    window.location.href = "/signup.html";
});

// =======================
// Menu Toggle Logic
// =======================
const menuButton = document.querySelector(".menu-icon");
const menuList = document.querySelector("#dropdown-menu");

if (menuButton && menuList) {
    menuButton.addEventListener("click", () => {
        const isExpanded =
            menuButton.getAttribute("aria-expanded") === "true";
        menuButton.setAttribute("aria-expanded", !isExpanded);
        menuList.classList.toggle("show");
        console.log("Menu toggled");
    });
}
