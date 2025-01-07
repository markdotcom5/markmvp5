document.addEventListener("DOMContentLoaded", async () => {
    // Initialize subscription page
    initializeSubscriptionPage();

    // Set up event listeners
    setupEventListeners();
});

async function initializeSubscriptionPage() {
    try {
        const userSubscription = await fetchUserSubscription();
        updateSubscriptionUI(userSubscription);
    } catch (error) {
        console.error("Error initializing subscription page:", error);
        showError("Failed to load subscription details");
    }
}

async function fetchUserSubscription() {
    const response = await fetch("/api/payment/subscription", {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
    });

    if (!response.ok) {
        throw new Error("Failed to fetch user subscription");
    }

    return response.json();
}

function updateSubscriptionUI(subscription) {
    const planButtons = document.querySelectorAll("[data-plan]");
    planButtons.forEach(button => {
        button.classList.remove("selected-plan");
        if (button.dataset.plan === subscription.plan) {
            button.classList.add("selected-plan");
        }
    });

    const currentPlanText = document.getElementById("current-plan");
    if (currentPlanText) {
        currentPlanText.textContent = subscription.plan || "No subscription";
    }
}

function setupEventListeners() {
    const planButtons = document.querySelectorAll("[data-plan]");
    planButtons.forEach(button => {
        button.addEventListener("click", () => handlePlanSelection(button.dataset.plan));
    });

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", handleLogout);
    }
}

async function handlePlanSelection(plan) {
    try {
        const response = await fetch("/api/payment/subscribe", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ plan })
        });

        if (!response.ok) {
            throw new Error("Failed to update subscription");
        }

        const result = await response.json();
        alert(`Successfully subscribed to the ${plan} plan!`);
        updateSubscriptionUI(result);
    } catch (error) {
        console.error("Subscription error:", error);
        showError("Failed to update subscription");
    }
}

async function handleLogout() {
    try {
        const response = await fetch("/api/auth/logout", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (!response.ok) {
            throw new Error("Logout failed");
        }

        localStorage.removeItem("token");
        window.location.href = "/login";
    } catch (error) {
        console.error("Logout error:", error);
        showError("Failed to log out");
    }
}

function showError(message) {
    console.error(message);
    alert(message); // Optional: Replace with a toast notification
}
