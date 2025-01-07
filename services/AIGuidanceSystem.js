// services/AIGuidanceSystem.js
const OpenAI = require('openai');
const User = require('../models/User');
const TrainingSession = require('../models/TrainingSession');

class AIGuidanceSystem {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.defaultModel = 'gpt-4-turbo-preview';
        
        // Preserve original mode settings
        this.guidanceModes = {
            MANUAL: 'manual',
            FSD: 'fsd'  // Simplified to just manual and FSD
        };

        // Keep performance tracking
        this.performanceMetrics = {
            trainingModulesCompleted: 0,
            skillProgressTracking: {},
            userEngagementScore: 0
        };
    }

    async initializeUserGuidance(userId, selectedMode) {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            // Initialize AI guidance preferences (preserving original fields)
            user.aiGuidance = {
                mode: selectedMode,
                activatedAt: new Date(),
                lastInteraction: new Date(),
                personalizedSettings: {
                    learningStyle: null,
                    pacePreference: null,
                    focusAreas: [],
                    adaptiveUI: true
                },
                performanceMetrics: this.performanceMetrics
            };

            // Create initial guidance context
            const guidanceContext = {
                userId: user._id,
                currentPhase: 'onboarding',
                nextActions: [],
                progressMetrics: {},
                activeModules: [],
                recentAchievements: []
            };

            await this.updateGuidanceContext(userId, guidanceContext);
            await user.save();

            // Generate initial guidance steps
            const nextSteps = await this.generateInitialGuidance(user);

            return {
                initialized: true,
                mode: selectedMode,
                settings: user.aiGuidance.personalizedSettings,
                nextSteps
            };
        } catch (error) {
            console.error('Error initializing AI guidance:', error);
            throw error;
        }
    }

    async updateGuidanceContext(userId, newContext) {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            user.aiGuidance.context = {
                ...user.aiGuidance.context,
                ...newContext,
                lastUpdated: new Date()
            };

            await user.save();
            return user.aiGuidance.context;
        } catch (error) {
            console.error('Error updating guidance context:', error);
            throw error;
        }
    }

    async processUserAction(userId, action, context) {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            // Only process actions in FSD mode
            if (user.aiGuidance.mode !== this.guidanceModes.FSD) {
                return null;
            }

            const completion = await this.openai.chat.completions.create({
                model: this.defaultModel,
                messages: [{
                    role: "system",
                    content: "As StelTrek's AI guide, process user action and provide guidance."
                }, {
                    role: "user",
                    content: `Process action: ${JSON.stringify(action)}
                             Context: ${JSON.stringify(context)}
                             User Progress: ${JSON.stringify(user.trainingProgress)}`
                }]
            });

            const guidance = completion.choices[0].message.content;

            // Update metrics
            this.updatePerformanceMetrics(user, action);

            return {
                guidance,
                updatedContext: await this.updateGuidanceContext(userId, {
                    lastAction: action,
                    lastGuidance: guidance,
                    timestamp: new Date()
                }),
                metrics: this.performanceMetrics
            };
        } catch (error) {
            console.error('Error processing user action:', error);
            throw error;
        }
    }

    async determineNextBestActions(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            const completion = await this.openai.chat.completions.create({
                model: this.defaultModel,
                messages: [{
                    role: "system",
                    content: "Determine optimal next actions for space training."
                }, {
                    role: "user",
                    content: `Current state:
                             Progress: ${JSON.stringify(user.trainingProgress)}
                             Metrics: ${JSON.stringify(this.performanceMetrics)}
                             Context: ${JSON.stringify(user.aiGuidance.context)}`
                }]
            });

            return {
                actions: JSON.parse(completion.choices[0].message.content),
                timestamp: new Date()
            };
        } catch (error) {
            console.error('Error determining next actions:', error);
            throw error;
        }
    }

    async getGuidanceVisualization(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            return {
                mode: user.aiGuidance.mode,
                currentFocus: user.aiGuidance.context?.currentPhase,
                activePath: user.aiGuidance.context?.activeModules,
                progressMetrics: this.performanceMetrics,
                nextMilestones: user.aiGuidance.context?.nextActions,
                lastUpdated: user.aiGuidance.lastInteraction
            };
        } catch (error) {
            console.error('Error generating visualization:', error);
            throw error;
        }
    }

    // Helper methods
    updatePerformanceMetrics(user, action) {
        // Update performance tracking
        if (action.type === 'module_completion') {
            this.performanceMetrics.trainingModulesCompleted++;
        }
        
        // Update skill tracking
        if (action.skillProgress) {
            this.performanceMetrics.skillProgressTracking[action.skill] = 
                (this.performanceMetrics.skillProgressTracking[action.skill] || 0) + 
                action.skillProgress;
        }

        // Update engagement score
        this.performanceMetrics.userEngagementScore += 1;
    }
}

module.exports = new AIGuidanceSystem();