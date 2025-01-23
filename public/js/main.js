class UIHandler {
    constructor() {
        console.log('Initializing UI Handler');
        this.initializeAuthToken();
        this.initializeToggleButtons();
        this.initializeMenuControls();
        this.currentAssessmentQuestion = 0;
        this.assessmentAnswers = [];
        this.isShowingAI = false; // Prevent multiple AI windows
    }

    initializeAuthToken() {
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NSIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTczNjIxMjcwNSwiZXhwIjoxNzUxNzY0NzA1fQ.PbmVxu6wMiuM7FWQcGpKDp5Y8UzSWAqqJsAI3-j0u1U';
        if (!localStorage.getItem('authToken')) {
            localStorage.setItem('authToken', token);
        }
        console.log('Auth token initialized:', localStorage.getItem('authToken'));
    }

    initializeMenuControls() {
        // Menu elements
        const menuTrigger = document.querySelector('.menu-trigger');
        const menuOverlay = document.getElementById('menuOverlay');
        const closeButton = document.querySelector('.close-button');

        if (menuTrigger && menuOverlay && closeButton) {
            menuTrigger.addEventListener('click', () => {
                menuOverlay.classList.remove('hidden');
                menuOverlay.classList.add('visible');
                document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
            });

            closeButton.addEventListener('click', () => {
                menuOverlay.classList.remove('visible');
                menuOverlay.classList.add('hidden');
                document.body.style.overflow = ''; // Restore scrolling
            });

            // Close menu on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && menuOverlay.classList.contains('visible')) {
                    closeButton.click();
                }
            });
        }

        // Language selector with improved handling
        const languageButtons = document.querySelectorAll('.language-option');
        const savedLanguage = localStorage.getItem('selectedLanguage') || 'en';

        languageButtons.forEach(button => {
            // Set initial active state
            if (button.dataset.lang === savedLanguage) {
                button.classList.add('active');
            }

            button.addEventListener('click', (event) => {
                languageButtons.forEach(btn => btn.classList.remove('active'));
                event.target.classList.add('active');
                
                const selectedLanguage = event.target.dataset.lang;
                localStorage.setItem('selectedLanguage', selectedLanguage);
                this.handleLanguageChange(selectedLanguage);
            });
        });

        // Header background on scroll
        const header = document.querySelector('.header');
        let lastScroll = 0;
        
        window.addEventListener('scroll', () => {
            const currentScroll = window.scrollY;
            
            if (currentScroll > 50) {
                header.style.background = 'rgba(0, 0, 0, 0.8)';
                if (currentScroll > lastScroll) {
                    // Scrolling down
                    header.style.transform = 'translateY(-100%)';
                } else {
                    // Scrolling up
                    header.style.transform = 'translateY(0)';
                }
            } else {
                header.style.background = 'transparent';
                header.style.transform = 'translateY(0)';
            }
            
            lastScroll = currentScroll;
        });
    }

    handleLanguageChange(language) {
        console.log(`Changing language to: ${language}`);
        // Implement language change logic here
    }

    initializeToggleButtons() {
        console.log('Initializing toggle buttons');
        const selfPacedButton = document.querySelector('.toggle-option.manual');
        const aiCoachButton = document.querySelector('.toggle-option.ai');
    
        if (!selfPacedButton || !aiCoachButton) {
            console.warn('Toggle buttons not found in DOM');
            return;
        }
    
        selfPacedButton.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent navigation
            e.stopPropagation(); // Stop event bubbling
            if (selfPacedButton.classList.contains('active')) return;
            console.log('Self-paced clicked');
            this.handleSelfPacedMode(selfPacedButton, aiCoachButton);
        });
    
        aiCoachButton.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent navigation
            e.stopPropagation(); // Stop event bubbling
            if (aiCoachButton.classList.contains('active')) return;
            console.log('AI coach clicked');
            this.handleAICoachMode(selfPacedButton, aiCoachButton);
        });
    }
    
    async showAIWelcomeExperience() {
        try {
            console.log('Initializing AI Welcome Experience...');
            
            // Create modal overlay
            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'ai-modal-overlay';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'ai-modal-content';
            
            modalContent.innerHTML = `
                <div class="ai-welcome-steps">
                    <h2>Initializing Your AI Personal Coach</h2>
                    <div class="ai-initialization-steps">
                        <div class="step">
                            <div class="step-icon">⚡</div>
                            <p>Connecting to AI Training Systems</p>
                        </div>
                        <div class="step">
                            <div class="step-icon">🔍</div>
                            <p>Building Your Personal Training Profile</p>
                        </div>
                        <div class="step">
                            <div class="step-icon">🎯</div>
                            <p>Preparing Customized Training Path</p>
                        </div>
                    </div>
                </div>
            `;
            
            modalOverlay.appendChild(modalContent);
            document.body.appendChild(modalOverlay);
    
            // Animate initialization steps
            const steps = modalOverlay.querySelectorAll('.step');
            for (let i = 0; i < steps.length; i++) {
                steps[i].classList.add('active');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
    
            // Wait a moment after last step
            await new Promise(resolve => setTimeout(resolve, 500));
    
            // Transition to assessment
            const assessmentQuestions = [
                {
                    question: "What is your primary motivation for space training?",
                    options: [
                        "Space Tourism",
                        "Professional Development",
                        "Research & Science",
                        "Space Colonization"
                    ]
                }
            ];
    
            // Fade out initialization content
            modalContent.style.opacity = '0';
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Show first question
            this.showAssessmentQuestion(modalContent, assessmentQuestions[0]);
            modalContent.style.opacity = '1';
    
        } catch (error) {
            console.error('Error in AI Welcome Experience:', error);
            this.handleAIInitializationError(error.message);
        }
    }
    
    async showAssessmentQuestion(modalContent, questionData) {
        modalContent.innerHTML = `
            <div class="assessment-interface">
                <h2>Space Training Assessment</h2>
                <div class="assessment-section">
                    <h3>Question ${this.currentAssessmentQuestion + 1} of 3</h3>
                    <p>${questionData.question}</p>
                    <div class="options">
                        ${questionData.options.map(option => 
                            `<button class="option-btn" type="button">${option}</button>`
                        ).join('')}
                    </div>
                </div>
                <div class="assessment-progress">
                    <div class="progress-bar">
                        <div class="progress" style="width: ${(this.currentAssessmentQuestion / 3) * 100}%"></div>
                    </div>
                </div>
            </div>
        `;
    
        // Add click handlers to option buttons
        const optionButtons = modalContent.querySelectorAll('.option-btn');
        optionButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.handleAssessmentAnswer(button.textContent, modalContent);
            });
        });
    }
    async animateInitializationSteps(overlay) {
        const steps = overlay.querySelectorAll('.step');
        for (let i = 0; i < steps.length; i++) {
            steps[i].style.opacity = '0';
            steps[i].style.transform = 'translateY(20px)';
            await new Promise(resolve => setTimeout(resolve, 500));
            steps[i].style.opacity = '1';
            steps[i].style.transform = 'translateY(0)';
            steps[i].classList.add('active');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    async startAssessment() {
        console.log('Starting assessment...');
        const overlay = document.querySelector('.mode-overlay');
        
        const assessmentQuestions = [
            {
                question: "What is your primary motivation for space training?",
                options: [
                    "Space Tourism",
                    "Professional Development",
                    "Research & Science",
                    "Space Colonization"
                ]
            },
            {
                question: "What's your current fitness level?",
                options: [
                    "Beginner",
                    "Intermediate",
                    "Advanced",
                    "Professional Athlete"
                ]
            },
            {
                question: "What's your background in space-related studies?",
                options: [
                    "No Prior Experience",
                    "Self-Taught Enthusiast",
                    "Academic Background",
                    "Industry Professional"
                ]
            }
        ];

        this.showAssessmentQuestion(overlay, assessmentQuestions[0]);
    }

    async showAssessmentQuestion(modalContent, questionData) {
        // Fade out current content
        await this.fadeContent(modalContent);
        
        modalContent.innerHTML = `
            <div class="assessment-interface">
                <h2>Space Training Assessment</h2>
                <div class="assessment-section">
                    <h3>Question ${this.currentAssessmentQuestion + 1} of 3</h3>
                    <p>${questionData.question}</p>
                    <div class="options">
                        ${questionData.options.map(option => 
                            `<button class="option-btn">${option}</button>`
                        ).join('')}
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress" style="width: ${(this.currentAssessmentQuestion / 3) * 100}%"></div>
                </div>
            </div>
        `;
    
        // Fade in new content
        await this.fadeContent(modalContent, 'in');
    }
    
    async fadeContent(element, direction = 'out') {
        element.style.opacity = direction === 'out' ? '0' : '1';
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    async animateTransition(element, direction = 'out') {
        return new Promise(resolve => {
            element.style.opacity = direction === 'out' ? '0' : '1';
            element.style.transition = 'opacity 0.3s ease';
            setTimeout(resolve, 300);
        });
    }

    getNextQuestion() {
        const questions = [
            "What's your current fitness level?",
            "What's your background in space-related studies?",
            "What's your availability for training per week?"
        ];
        return questions[this.currentAssessmentQuestion - 1];
    }

    getOptionsForQuestion(questionIndex) {
        const allOptions = [
            ["Beginner", "Intermediate", "Advanced", "Professional Athlete"],
            ["No Experience", "Self-Taught", "Academic Background", "Professional"],
            ["5-10 hours", "10-15 hours", "15-20 hours", "20+ hours"]
        ];
        return allOptions[questionIndex - 1];
    }

    async handleAssessmentAnswer(answer) {
        this.assessmentAnswers.push(answer);
        this.currentAssessmentQuestion++;

        const overlay = document.querySelector('.mode-overlay');
        
        if (this.currentAssessmentQuestion >= 3) {
            await this.animateTransition(overlay);
            this.showTrainingPlan();
        } else {
            const nextQuestion = {
                question: this.getNextQuestion(),
                options: this.getOptionsForQuestion(this.currentAssessmentQuestion)
            };
            await this.animateTransition(overlay);
            this.showAssessmentQuestion(overlay, nextQuestion);
        }
    }

    async animateTransition(element) {
        element.style.opacity = '0';
        await new Promise(resolve => setTimeout(resolve, 300));
        element.style.opacity = '1';
    }

    async showTrainingPlan() {
        const overlay = document.querySelector('.mode-overlay');
        overlay.innerHTML = `
            <div class="training-plan">
                <h2>Your Customized Training Plan</h2>
                <div class="plan-sections">
                    <div class="plan-section">
                        <h3>Core Training Modules</h3>
                        <ul>
                            <li>Basic Space Science</li>
                            <li>Physical Conditioning</li>
                            <li>Space Safety Protocols</li>
                        </ul>
                    </div>
                    <div class="plan-section">
                        <h3>Specialized Focus</h3>
                        <p>Based on your interests in ${this.assessmentAnswers[0]}</p>
                    </div>
                    <div class="plan-section">
                        <h3>Weekly Schedule</h3>
                        <p>Recommended: ${this.assessmentAnswers[2] || '10 hours/week'}</p>
                    </div>
                </div>
                <button class="begin-training-btn">Begin Your Training</button>
            </div>
        `;

        const beginButton = overlay.querySelector('.begin-training-btn');
        beginButton.addEventListener('click', () => {
            this.beginTrainingJourney();
        });
    }

    async beginTrainingJourney() {
        console.log('Beginning training journey...');
        const overlay = document.querySelector('.mode-overlay');
        overlay.innerHTML = `
            <div class="training-interface">
                <h2>Module 1: Introduction to Space</h2>
                <div class="training-content">
                    <div class="lesson-progress">
                        <div class="progress-bar">
                            <div class="progress" style="width: 0%"></div>
                        </div>
                        <p>Progress: 0/5 Lessons Complete</p>
                    </div>
                    <div class="current-lesson">
                        <h3>Lesson 1: Basic Space Concepts</h3>
                        <div class="lesson-content">
                            <p>Let's start with fundamental concepts about space...</p>
                            <button class="next-lesson-btn">Start Lesson</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const nextLessonBtn = overlay.querySelector('.next-lesson-btn');
        nextLessonBtn.addEventListener('click', () => {
            this.startLesson(1);
        });
    }

    async startLesson(lessonNumber) {
        const lessons = {
            1: {
                title: "Basic Space Concepts",
                sections: [
                    {
                        type: "intro",
                        content: "Welcome to your first space training lesson. Today we'll cover fundamental concepts about space and space travel."
                    },
                    {
                        type: "content",
                        title: "What is Space?",
                        content: "Space begins at the Kármán line, approximately 100 kilometers (62 miles) above Earth's surface. This is where Earth's atmosphere becomes too thin for conventional aircraft to maintain lift."
                    },
                    {
                        type: "interactive",
                        question: "At what height does space begin?",
                        options: [
                            "50 kilometers",
                            "100 kilometers (Kármán line)",
                            "150 kilometers",
                            "200 kilometers"
                        ],
                        correct: 1
                    },
                    {
                        type: "video_placeholder",
                        description: "Space Environment Visualization",
                        content: "This simulation shows the transition from Earth's atmosphere to space."
                    },
                    {
                        type: "summary",
                        content: "You've learned about the basic definition of space and where it begins. In the next lesson, we'll explore the challenges of surviving in this environment."
                    }
                ],
                duration: "20 minutes",
                nextLesson: "Space Environment Challenges"
            }
        };

        const overlay = document.querySelector('.mode-overlay');
        const lesson = lessons[lessonNumber];
        
        if (!lesson) {
            console.error('Lesson not found');
            return;
        }

        overlay.innerHTML = `
            <div class="lesson-interface">
                <div class="lesson-header">
                    <h2>${lesson.title}</h2>
                    <div class="lesson-info">
                        <span>Duration: ${lesson.duration}</span>
                        <span>Progress: 0/${lesson.sections.length}</span>
                    </div>
                </div>
                <div class="lesson-content">
                    <div class="section active">
                        ${this.renderSection(lesson.sections[0])}
                    </div>
                    <div class="lesson-navigation">
                        <button class="prev-btn" disabled>Previous</button>
                        <button class="next-btn">Next</button>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress" style="width: 0%"></div>
                </div>
            </div>
        `;

        this.initializeLessonControls(lesson);
    }

    renderSection(section) {
        switch(section.type) {
            case 'intro':
                return `
                    <div class="intro-section">
                        <p>${section.content}</p>
                    </div>
                `;
            case 'content':
                return `
                    <div class="content-section">
                        <h3>${section.title}</h3>
                        <p>${section.content}</p>
                    </div>
                `;
            case 'interactive':
                return `
                    <div class="interactive-section">
                        <h3>Quick Check</h3>
                        <p>${section.question}</p>
                        <div class="options">
                            ${section.options.map((option, index) => `
                                <button class="option-btn" data-index="${index}">${option}</button>
                            `).join('')}
                        </div>
                    </div>
                `;
            case 'video_placeholder':
                return `
                    <div class="video-section">
                        <h3>${section.description}</h3>
                        <div class="video-placeholder">
                            <p>${section.content}</p>
                        </div>
                    </div>
                `;
            case 'summary':
                return `
                    <div class="summary-section">
                        <h3>Summary</h3>
                        <p>${section.content}</p>
                    </div>
                `;
            default:
                return '<p>Section content not available</p>';
        }
    }

    initializeLessonControls(lesson) {
        let currentSectionIndex = 0;
        const nextBtn = document.querySelector('.next-btn');
        const prevBtn = document.querySelector('.prev-btn');
        const progressBar = document.querySelector('.progress');

        const updateButtons = () => {
            prevBtn.disabled = currentSectionIndex === 0;
            nextBtn.textContent = currentSectionIndex === lesson.sections.length - 1 ? 'Complete Lesson' : 'Next';
        };

        nextBtn.addEventListener('click', () => {
            if (currentSectionIndex < lesson.sections.length - 1) {
                currentSectionIndex++;
                this.updateSection(lesson.sections[currentSectionIndex], currentSectionIndex, lesson.sections.length);
                updateButtons();
            } else {
                this.completeLessonAndShowNext(lesson);
            }
        });

        prevBtn.addEventListener('click', () => {
            if (currentSectionIndex > 0) {
                currentSectionIndex--;
                this.updateSection(lesson.sections[currentSectionIndex], currentSectionIndex, lesson.sections.length);
                updateButtons();
            }
        });
    }

    updateSection(section, currentIndex, totalSections) {
        const contentArea = document.querySelector('.lesson-content .section');
        contentArea.innerHTML = this.renderSection(section);

        const progress = ((currentIndex + 1) / totalSections) * 100;
        document.querySelector('.progress').style.width = `${progress}%`;
        document.querySelector('.lesson-info span:last-child').textContent = 
            `Progress: ${currentIndex + 1}/${totalSections}`;
    }

    async completeLessonAndShowNext(lesson) {
        const overlay = document.querySelector('.mode-overlay');
        overlay.innerHTML = `
            <div class="lesson-complete">
                <h2>Congratulations!</h2>
                <p>You've completed: ${lesson.title}</p>
                <div class="completion-stats">
                    <div class="stat">
                        <span class="label">Time Spent</span>
                        <span class="value">${lesson.duration}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Next Topic</span>
                        <span class="value">${lesson.nextLesson}</span>
                    </div>
                </div>
                <button class="next-lesson-btn">Continue to Next Lesson</button>
            </div>
        `;

        const nextLessonBtn = overlay.querySelector('.next-lesson-btn');
        nextLessonBtn.addEventListener('click', () => {
            const nextLessonId = lesson.nextLessonId || 2;
            this.startLesson(nextLessonId);
        });
    }

    handleAIInitializationError(message) {
        console.error('AI Initialization Error:', message);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'ai-error-message';
        errorMessage.innerHTML = `
            <div class="error-content">
                <h3>Error</h3>
                <p>${message}</p>
                <button class="retry-button">Retry</button>
            </div>
        `;
        document.body.appendChild(errorMessage);

        const retryButton = errorMessage.querySelector('.retry-button');
        retryButton.addEventListener('click', () => {
            errorMessage.remove();
            this.showAIWelcomeExperience();
        });
    }

    showSelfPacedWelcome() {
        console.log('Showing self-paced welcome');
        const overlay = document.createElement('div');
        overlay.className = 'mode-overlay';

        overlay.innerHTML = `
            <div class="welcome-content">
                <h2>Welcome to Self-Paced Training</h2>
                <div class="training-introduction">
                    <div class="step active">
                        <div class="step-icon">📚</div>
                        <p>Access structured learning modules at your own pace</p>
                    </div>
                    <div class="step active">
                        <div class="step-icon">🎯</div>
                        <p>Track your progress through comprehensive training materials</p>
                    </div>
                    <div class="step active">
                        <div class="step-icon">🚀</div>
                        <p>Complete training milestones on your schedule</p>
                    </div>
                </div>
                <button class="begin-training-btn">Start Training</button>
            </div>
        `;

        document.body.appendChild(overlay);

        const beginButton = overlay.querySelector('.begin-training-btn');
        if (beginButton) {
            beginButton.addEventListener('click', () => {
                overlay.remove();
                this.beginTrainingJourney();
            });
        }
    }

    handleAICoachMode(selfPacedButton, aiCoachButton) {
        if (!this.isShowingAI) {
            this.isShowingAI = true;
            this.showAIWelcomeExperience().then(() => {
                this.isShowingAI = false;
            }).catch(error => {
                this.isShowingAI = false;
                this.handleAIInitializationError('Failed to initialize AI experience');
            });
        }
    }

    handleSelfPacedMode(selfPacedButton, aiCoachButton) {
        this.showSelfPacedWelcome();
    }
}

// Initialize the UI Handler when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const uiHandler = new UIHandler();
});