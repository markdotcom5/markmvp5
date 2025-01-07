export function initCountdownTimer(elementId, targetDate) {
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

    const intervalId = setInterval(updateTimer, 1000);
    updateTimer(); // Initial update
}
