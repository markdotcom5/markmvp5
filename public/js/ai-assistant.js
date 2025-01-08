// Open and Close Chat
function openChat() {
    document.getElementById('chat-window').classList.remove('hidden');
}

function closeChat() {
    document.getElementById('chat-window').classList.add('hidden');
}

// Send Message to Backend
function sendMessage() {
    const userInput = document.getElementById('user-input').value;
    if (!userInput.trim()) return;

    // Display user message
    const chatMessages = document.querySelector('.chat-messages');
    chatMessages.innerHTML += `<div class="user-msg"><strong>You:</strong> ${userInput}</div>`;
    document.getElementById('user-input').value = '';

    // Call backend to get AI response
    fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput })
    })
    .then(response => response.json())
    .then(data => {
        // Display AI response
        chatMessages.innerHTML += `<div class="ai-msg"><strong>AI:</strong> ${data.reply}</div>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    })
    .catch(err => {
        console.error('Error:', err);
        chatMessages.innerHTML += `<div class="error-msg">Sorry, something went wrong. Please try again later.</div>`;
    });
}

