document.addEventListener("DOMContentLoaded", () => {
    const modulesContainer = document.getElementById('academy-modules');

    // Fetch academy modules
    fetch('/api/academy')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch academy modules.');
            }
            return response.json();
        })
        .then(modules => {
            modulesContainer.innerHTML = ''; // Clear any placeholders
            modules.forEach(module => {
                const moduleItem = document.createElement('li');
                moduleItem.classList.add('module-item');
                moduleItem.innerHTML = `
                    <h3>${module.title}</h3>
                    <p>${module.description}</p>
                `;
                modulesContainer.appendChild(moduleItem);
            });
        })
        .catch(error => {
            console.error('Error loading academy modules:', error);
            modulesContainer.innerHTML = '<li class="error">Failed to load academy modules. Please try again later.</li>';
        });
});
