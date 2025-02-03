// public/js/ai-companion.js

class AICompanion {
    constructor() {
        this.currentModule = null;
        this.isTyping = false;
        this.messageQueue = [];
        this.initialize();
    }

    initialize() {
        this.createCompanionElement();
        this.initializeEventListeners();
    }

    createCompanionElement() {
        const companion = document.createElement('div');
        companion.className = 'ai-companion';
        companion.innerHTML = `
            <div class="ai-avatar" id="aiAvatar">
                <div class="ai-status"></div>
                <div class="core">
                    <i class="ai-icon">🚀</i>
                </div>
            </div>
            <div class="ai-message" id="aiMessage">
                <div class="message-content"></div>
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        document.body.appendChild(companion);

        this.avatar = document.getElementById('aiAvatar');
        this.messageBox = document.getElementById('aiMessage');
        this.messageContent = this.messageBox.querySelector('.message-content');
        this.typingIndicator = this.messageBox.querySelector('.typing-indicator');
    }

    async showMessage(message, duration = 5000) {
        this.messageQueue.push({ message, duration });
        if (!this.isTyping) {
            this.processMessageQueue();
        }
    }

    async processMessageQueue() {
        if (this.messageQueue.length === 0) {
            this.isTyping = false;
            this.messageBox.classList.remove('active');
            return;
        }

        this.isTyping = true;
        const { message, duration } = this.messageQueue.shift();

        // Show message box and typing indicator
        this.messageBox.classList.add('active');
        this.typingIndicator.style.display = 'flex';
        this.messageContent.textContent = '';

        // Simulate typing
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.typingIndicator.style.display = 'none';

        // Type out message
        for (let char of message) {
            this.messageContent.textContent += char;
            await new Promise(resolve => setTimeout(resolve, 30));
        }

        // Keep message visible
        await new Promise(resolve => setTimeout(resolve, duration));

        // Process next message
        this.messageBox.classList.remove('active');
        await new Promise(resolve => setTimeout(resolve, 500));
        this.processMessageQueue();
    }

    async provideGuidance(moduleType, action) {
        // Get guidance from AISpaceCoach
        const guidance = await fetch('/api/ai/guidance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                moduleType,
                action
            })
        }).then(res => res.json());

        // Show guidance
        await this.showMessage(guidance.message);

        // If there are next steps, show them
        if (guidance.nextSteps) {
            await this.showMessage("Here's what to focus on next:", 3000);
            for (let step of guidance.nextSteps) {
                await this.showMessage(`• ${step}`, 4000);
            }
        }

        return guidance;
    }

    async celebrateProgress(achievement) {
        const celebration = await fetch('/api/ai/celebrate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ achievement })
        }).then(res => res.json());

        await this.showMessage(`🎉 ${celebration.message}`, 5000);
        if (celebration.nextMilestone) {
            await this.showMessage(`Next milestone: ${celebration.nextMilestone}`, 4000);
        }
    }

    async showModuleIntroduction(moduleType) {
        const introMessages = {
            physical: [
                "Welcome to Physical Training! 🏋️‍♂️",
                "We'll focus on building your space-ready physique.",
                "Let's start with the basics of zero-G movement."
            ],
            technical: [
                "Welcome to Technical Training! 🛠️",
                "We'll master spacecraft systems together.",
                "Safety protocols are our first priority."
            ],
            simulation: [
                "Welcome to Space Simulation! 🚀",
                "Time to put your skills to the test.",
                "Let's begin with basic mission scenarios."
            ]
        };

        for (let message of introMessages[moduleType]) {
            await this.showMessage(message, 4000);
        }
    }
}

// Initialize the AI companion
window.aiCompanion = new AICompanion();