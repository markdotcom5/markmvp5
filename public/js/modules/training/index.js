console.log('File loaded:', 'training.js');  // Add to training.js

// public/js/training.js - Add to your existing TrainingHandler class

class TrainingHandler {
    // ... keep your existing constructor and methods ...

    async initializeAIExperience() {
        try {
            const overlay = document.createElement('div');
            overlay.className = 'ai-experience-overlay fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50';
            
            overlay.innerHTML = `
                <div class="ai-initialization w-full max-w-2xl p-8 text-white">
                    <div class="ai-welcome mb-8">
                        <h2 class="text-3xl font-bold mb-4 text-cyan-400">
                            Initializing Your Personal AI Space Coach
                        </h2>
                        <p class="text-lg text-gray-300">
                            Your journey to space begins with personalized AI guidance
                        </p>
                    </div>

                    <div class="initialization-steps space-y-6">
                        <div class="step flex items-center opacity-0 transform translate-y-4 transition-all duration-500">
                            <div class="step-icon w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center mr-4">
                                <i class="fas fa-brain text-xl"></i>
                            </div>
                            <div class="step-content">
                                <h3 class="text-xl font-semibold">Neural Network Activation</h3>
                                <p class="text-gray-400">Initializing advanced AI coaching systems</p>
                            </div>
                        </div>

                        <div class="step flex items-center opacity-0 transform translate-y-4 transition-all duration-500">
                            <div class="step-icon w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                                <i class="fas fa-user-astronaut text-xl"></i>
                            </div>
                            <div class="step-content">
                                <h3 class="text-xl font-semibold">Profile Analysis</h3>
                                <p class="text-gray-400">Building your personalized space training profile</p>
                            </div>
                        </div>

                        <div class="step flex items-center opacity-0 transform translate-y-4 transition-all duration-500">
                            <div class="step-icon w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mr-4">
                                <i class="fas fa-route text-xl"></i>
                            </div>
                            <div class="step-content">
                                <h3 class="text-xl font-semibold">Path Optimization</h3>
                                <p class="text-gray-400">Creating your optimal training journey</p>
                            </div>
                        </div>
                    </div>

                    <div class="ai-status mt-8 text-center hidden">
                        <div class="inline-flex items-center px-4 py-2 bg-cyan-500 bg-opacity-20 rounded-full">
                            <div class="pulse-dot w-3 h-3 bg-cyan-400 rounded-full mr-3"></div>
                            <span class="text-cyan-400">AI Coach Active</span>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Animate initialization steps
            const steps = overlay.querySelectorAll('.step');
            for (let i = 0; i < steps.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                steps[i].classList.add('opacity-100', 'translate-y-0');
            }

            // Show AI status
            await new Promise(resolve => setTimeout(resolve, 1000));
            overlay.querySelector('.ai-status').classList.remove('hidden');

            // Initialize AI systems
            await this.initializeAISystems();

            // Start assessment after initialization
            await new Promise(resolve => setTimeout(resolve, 1500));
            await this.startAIGuidedAssessment();

        } catch (error) {
            console.error('Error initializing AI experience:', error);
            this.handleAIInitializationError(error);
        }
    }

    async initializeAISystems() {
        try {
            const response = await fetch('/api/training/ai/initialize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    mode: 'full_guidance'
                })
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to initialize AI systems');
            }

            return data;
        } catch (error) {
            throw new Error('AI initialization failed: ' + error.message);
        }
    }

    async startAIGuidedAssessment() {
        try {
            // Remove initialization overlay with fade effect
            const overlay = document.querySelector('.ai-experience-overlay');
            overlay.style.opacity = '0';
            await new Promise(resolve => setTimeout(resolve, 500));
            overlay.remove();

            // Start the assessment with AI guidance
            const response = await fetch('/api/training/assessment/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    mode: 'full_guidance'
                })
            });

            const data = await response.json();
            if (data.success) {
                this.currentSession = data.sessionId;
                await this.showAIGuidedQuestion(data.questions[0]);
            } else {
                throw new Error(data.error || 'Failed to start assessment');
            }
        } catch (error) {
            console.error('Error starting AI-guided assessment:', error);
            this.handleAIInitializationError(error);
        }
    }

    async showAIGuidedQuestion(question) {
        const container = document.querySelector('.assessment-container');
        if (!container) return;

        container.innerHTML = `
            <div class="question-interface p-6 bg-white rounded-lg shadow-lg relative overflow-hidden">
                <div class="ai-indicator absolute top-4 right-4 flex items-center">
                    <div class="pulse-dot w-2 h-2 bg-cyan-500 rounded-full mr-2"></div>
                    <span class="text-sm text-cyan-600">AI Coach Active</span>
                </div>

                <div class="question-content mb-8">
                    <h3 class="text-2xl font-bold mb-4">${question.question}</h3>
                    <p class="text-gray-600 mb-6">Select the option that best describes your situation</p>
                    
                    <div class="options-grid grid gap-4">
                        ${question.options.map((option, index) => `
                            <button 
                                class="option-btn p-4 bg-gray-50 hover:bg-blue-50 rounded-lg transition-all transform hover:scale-[1.02] flex items-center"
                                data-index="${index}"
                            >
                                <span class="option-text flex-grow text-left">${option}</span>
                                <i class="fas fa-chevron-right text-gray-400"></i>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="ai-guidance mt-8 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg">
                    <div class="flex items-center mb-3">
                        <i class="fas fa-robot text-cyan-500 mr-3"></i>
                        <h4 class="font-semibold text-gray-800">AI Coach Insights</h4>
                    </div>
                    <p class="text-gray-600" id="ai-guidance-text">
                        I'm analyzing your profile and previous responses to provide personalized guidance...
                    </p>
                </div>
            </div>
        `;

        // Add event listeners to options
        container.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleAIGuidedAnswer(btn));
        });

        // Request AI guidance for this question
        await this.requestAIGuidance(question);
    }

    async handleAIGuidedAnswer(button) {
        try {
            const answer = button.querySelector('.option-text').textContent.trim();
            
            // Show selection effect
            button.classList.add('bg-blue-100');
            
            const response = await fetch(`/api/training/assessment/${this.currentSession}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    answer,
                    questionIndex: this.currentQuestion
                })
            });

            const data = await response.json();
            if (data.success) {
                if (data.isComplete) {
                    await this.showAIGeneratedPlan(data.trainingPlan);
                } else {
                    this.currentQuestion++;
                    await this.showAIGuidedQuestion(data.nextQuestion);
                }
            }
        } catch (error) {
            console.error('Error handling answer:', error);
            this.showError('Failed to process your answer');
        }
    }

    async requestAIGuidance(question) {
        try {
            const response = await fetch('/api/training/ai-guidance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    questionId: question.id,
                    currentProgress: this.currentQuestion
                })
            });

            const data = await response.json();
            if (data.success) {
                const guidanceText = document.getElementById('ai-guidance-text');
                if (guidanceText) {
                    guidanceText.textContent = data.guidance;
                }
            }
        } catch (error) {
            console.error('Error getting AI guidance:', error);
        }
    }

    async showAIGeneratedPlan(plan) {
        const container = document.querySelector('.assessment-container');
        if (!container) return;

        container.innerHTML = `
            <div class="training-plan p-6 bg-white rounded-lg shadow-lg">
                <div class="header mb-8">
                    <h2 class="text-3xl font-bold mb-4">Your AI-Optimized Training Plan</h2>
                    <p class="text-gray-600">Customized based on your assessment results and goals</p>
                </div>

                <div class="plan-sections space-y-8">
                    <div class="section">
                        <h3 class="text-xl font-semibold mb-4">Recommended Focus Areas</h3>
                        <div class="grid gap-4">
                            ${plan.focusAreas.map(area => `
                                <div class="focus-area p-4 bg-gray-50 rounded-lg">
                                    <h4 class="font-medium">${area.name}</h4>
                                    <p class="text-gray-600">${area.description}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="section">
                        <h3 class="text-xl font-semibold mb-4">Training Timeline</h3>
                        <div class="timeline p-4 bg-blue-50 rounded-lg">
                            <p class="text-gray-800">${plan.timeline}</p>
                        </div>
                    </div>

                    <div class="section">
                        <h3 class="text-xl font-semibold mb-4">Next Steps</h3>
                        <div class="steps grid gap-4">
                            ${plan.nextSteps.map((step, index) => `
                                <div class="step p-4 bg-gray-50 rounded-lg flex items-center">
                                    <div class="step-number w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                                        <span class="font-medium">${index + 1}</span>
                                    </div>
                                    <p class="text-gray-800">${step}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="actions mt-8">
                    <button class="begin-training-btn w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-[1.02]">
                        Begin Your Space Training Journey
                    </button>
                </div>
            </div>
        `;

        // Add event listener to start button
        container.querySelector('.begin-training-btn').addEventListener('click', () => {
            window.location.href = '/training/modules';
        });
    }

    handleAIInitializationError(error) {
        const errorOverlay = document.createElement('div');
        errorOverlay.className = 'error-overlay fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50';
        
        errorOverlay.innerHTML = `
            <div class="error-content text-white text-center p-8">
                <div class="error-icon mb-4">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-500"></i>
                </div>
                <h3 class="text-xl font-bold mb-4">AI Initialization Error</h3>
                <p class="text-gray-300 mb-6">${error.message}</p>
                <button class="retry-btn px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    Retry Initialization
                </button>
            </div>
        `;

        document.body.appendChild(errorOverlay);

        // Add retry functionality
        errorOverlay.querySelector('.retry-btn').addEventListener('click', () => {
            errorOverlay.remove();
            this.initializeAIExperience();
        });
    }
}
// Initialize when document loads
document.addEventListener('DOMContentLoaded', () => {
    const aiButton = document.querySelector('.toggle-option.ai');
    const manualButton = document.querySelector('.toggle-option.manual');

    if (!aiButton || !manualButton) {
        console.warn("AI or Manual button not found");
        return;
    }

    // Add event listeners
    aiButton.addEventListener('click', () => {
        console.log("AI Mode Selected");
        // Add AI-specific functionality here
        aiButton.classList.add('active');
        manualButton.classList.remove('active');
    });

    manualButton.addEventListener('click', () => {
        console.log("Manual Mode Selected");
        // Add manual-specific functionality here
        manualButton.classList.add('active');
        aiButton.classList.remove('active');
    });
});

