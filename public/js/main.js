// main.js

document.addEventListener("DOMContentLoaded", () => {
    const languageFlags = document.querySelectorAll(".language-flag");
    const menuButton = document.querySelector(".menu-icon");
    const menuList = document.querySelector("#dropdown-menu");

    // Menu Toggle
    menuButton.addEventListener("click", () => {
        const isExpanded = menuButton.getAttribute("aria-expanded") === "true";
        menuButton.setAttribute("aria-expanded", !isExpanded);
        menuList.classList.toggle("show");
    });

    // Countdown Timer
    const countdownElement = document.getElementById("countdown-timer");
    const targetDate = new Date("2025-12-31T23:59:59");

    function updateCountdown() {
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
});
