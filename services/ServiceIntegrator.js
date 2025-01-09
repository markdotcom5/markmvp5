// services/ServiceIntegrator.js
const EventEmitter = require('events');
const AISpaceCoach = require('./AISpaceCoach');
const AIGuidanceSystem = require('./AIGuidanceSystem');
const aiGuidance = require('./aiGuidance');
const aiAssistant = require('./aiAssistant');

class ServiceIntegrator extends EventEmitter {
    constructor() {
        super();
        this.services = {
            coach: AISpaceCoach,
            guidance: AIGuidanceSystem,
            realTime: aiGuidance,
            assistant: aiAssistant
        };

        // Simplified to just two modes like early Tesla FSD
        this.MODES = {
            MANUAL: 'manual',     // User drives their own learning
            FSD: 'fsd'           // AI takes the wheel
        };

        // Track active guidance sessions
        this.activeSessions = new Map();
    }

    async initializeSession(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            const sessionState = {
                userId,
                mode: this.MODES.MANUAL,  // Start in manual by default
                currentPath: null,
                confidence: 0,
                nextAction: null,
                visualState: {
                    highlightedElements: [],
                    nextSteps: [],
                    currentFocus: null
                },
                lastUpdate: new Date()
            };

            this.activeSessions.set(userId, sessionState);
            return sessionState;
        } catch (error) {
            console.error('Session Initialization Error:', error);
            throw error;
        }
    }

    async toggleFSDMode(userId) {
        try {
            const session = this.activeSessions.get(userId);
            if (!session) throw new Error('No active session found');

            // Toggle between Manual and FSD
            const newMode = session.mode === this.MODES.MANUAL ? 
                this.MODES.FSD : this.MODES.MANUAL;

            // Update session state
            session.mode = newMode;
            await User.findByIdAndUpdate(userId, {
                'aiGuidance.mode': newMode,
                'aiGuidance.lastModeChange': new Date()
            });

            // If entering FSD mode, start active guidance
            if (newMode === this.MODES.FSD) {
                const guidance = await this.calculateNextAction(userId);
                session.nextAction = guidance.nextAction;
                session.confidence = guidance.confidence;
                this.startMonitoring(userId);
            } else {
                this.stopMonitoring(userId);
            }

            // Emit state change for real-time updates
            this.emit('modeChange', {
                userId,
                mode: newMode,
                state: session
            });

            return session;
        } catch (error) {
            console.error('Mode Toggle Error:', error);
            throw error;
        }
    }

    async processUserAction(userId, action, context) {
        try {
            const session = this.activeSessions.get(userId);
            if (!session) throw new Error('No active session found');

            // Handle based on mode
            if (session.mode === this.MODES.FSD) {
                // Full FSD mode - AI takes control
                const [guidance, coaching] = await Promise.all([
                    this.services.realTime.processRealTimeAction(userId, action),
                    this.services.coach.generateCoachingSuggestions(context)
                ]);

                // Calculate next actions and confidence
                const nextAction = await this.calculateNextAction(userId);
                
                // Update session state
                session.nextAction = nextAction.action;
                session.confidence = nextAction.confidence;
                session.lastUpdate = new Date();

                // Emit update for real-time guidance
                this.emit('guidanceUpdate', {
                    userId,
                    guidance,
                    coaching,
                    nextAction
                });

                return {
                    guidance,
                    coaching,
                    nextAction,
                    mode: 'fsd'
                };
            } else {
                // Manual mode with basic assistance
                const coaching = await this.services.coach.provideProblemSolvingScenario(
                    action.module,
                    context.skillLevel
                );

                return {
                    coaching,
                    mode: 'manual'
                };
            }
        } catch (error) {
            console.error('Action Processing Error:', error);
            throw error;
        }
    }

    async calculateNextAction(userId) {
        try {
            const user = await User.findById(userId)
                .select('trainingProgress aiGuidance certifications achievements');

            // Get comprehensive analysis from all services
            const [certProgress, achievements] = await Promise.all([
                this.services.assistant.analyzeCertificationProgress(user.certifications),
                this.services.assistant.analyzeAchievementProgress(user.achievements)
            ]);

            // Generate optimal next action and confidence score
            const guidance = await this.services.realTime.processRealTimeAction(userId, {
                type: 'next_action_calculation',
                progress: user.trainingProgress,
                certifications: certProgress,
                achievements
            });

            return {
                action: guidance.nextSteps[0],
                confidence: this.calculateConfidence(guidance, certProgress, achievements),
                fullPath: guidance.nextSteps
            };
        } catch (error) {
            console.error('Next Action Calculation Error:', error);
            throw error;
        }
    }

    calculateConfidence(guidance, certProgress, achievements) {
        // Implement confidence scoring logic here
        return 95; // Example return
    }

    startMonitoring(userId) {
        const session = this.activeSessions.get(userId);
        if (!session) return;

        // Update every 3 seconds in FSD mode
        const interval = setInterval(async () => {
            if (session.mode === this.MODES.FSD) {
                const nextAction = await this.calculateNextAction(userId);
                
                // Emit update if action changed
                if (nextAction.action !== session.nextAction) {
                    session.nextAction = nextAction.action;
                    session.confidence = nextAction.confidence;
                    
                    this.emit('actionUpdate', {
                        userId,
                        nextAction
                    });
                }
            }
        }, 3000);

        session.monitoringInterval = interval;
    }

    stopMonitoring(userId) {
        const session = this.activeSessions.get(userId);
        if (session?.monitoringInterval) {
            clearInterval(session.monitoringInterval);
            session.monitoringInterval = null;
        }
    }

    // Keep your existing methods
    async generateTrainingPlan(userId) {
        // Your existing implementation
    }

    async updateUserProgress(userId, progressData) {
        // Your existing implementation
    }

    async getDailyRecommendations(userId) {
        // Your existing implementation
    }
}

module.exports = new ServiceIntegrator();