document.addEventListener("DOMContentLoaded", () => {
    const globalList = document.getElementById('global-leaderboard-list');
    const regionalList = document.getElementById('regional-leaderboard-list');

    // Fetch Global Leaderboard
    fetch('/api/leaderboard/global')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch global leaderboard.');
            }
            return response.json();
        })
        .then(globalLeaderboard => {
            globalLeaderboard.forEach(player => {
                const listItem = document.createElement('li');
                listItem.textContent = `${player.rank}. ${player.name} - ${player.score} points`;
                globalList.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error('Error loading global leaderboard:', error);
            globalList.innerHTML = '<li class="error">Failed to load global leaderboard.</li>';
        });

    // Fetch Regional Leaderboard
    fetch('/api/leaderboard/regional')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch regional leaderboard.');
            }
            return response.json();
        })
        .then(regionalLeaderboard => {
            regionalLeaderboard.forEach(region => {
                const listItem = document.createElement('li');
                listItem.textContent = `${region.region}: ${region.name} - ${region.score} points`;
                regionalList.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error('Error loading regional leaderboard:', error);
            regionalList.innerHTML = '<li class="error">Failed to load regional leaderboard.</li>';
        });
});
