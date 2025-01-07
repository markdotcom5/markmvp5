// services/AISpaceCoach.js
const OpenAI = require('openai');

class AISpaceCoach {
    constructor() {
        // Initialize OpenAI with enhanced configuration
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // Enhanced default settings
        this.defaultModel = 'gpt-4-turbo';
        this.defaultTemperature = 0.7;
        this.defaultMaxTokens = 500;

        // AI Guidance Mode Constants - Preserving original modes
        this.AI_MODES = {
            MANUAL: 'manual',
            ASSIST: 'assist',
            FULL_GUIDANCE: 'full_guidance',
        };

        // Performance Tracking
        this.performanceMetrics = {
            trainingModulesCompleted: 0,
            skillProgressTracking: {},
            userEngagementScore: 0,
        };
    }

    // Helper: Create OpenAI Completion - Preserving original helper
    async createCompletion(messages, options = {}) {
        try {
            if (!process.env.OPENAI_API_KEY) {
                throw new Error('OpenAI API Key is missing. Check environment variables.');
            }

            const response = await this.openai.chat.completions.create({
                model: options.model || this.defaultModel,
                messages,
                temperature: options.temperature || this.defaultTemperature,
                max_tokens: options.maxTokens || this.defaultMaxTokens,
                top_p: options.topP || 1.0,
                frequency_penalty: options.frequencyPenalty || 0,
                presence_penalty: options.presencePenalty || 0,
            });

            const result = response.choices[0]?.message?.content?.trim();
            if (!result) {
                throw new Error('OpenAI API returned no content.');
            }

            return result;
        } catch (error) {
            console.error('OpenAI API Error:', error.message);
            throw new Error(`Failed to process AI request: ${error.message}`);
        }
    }

    // Generate Training Content
    async generateTrainingContent(module, level, userProfile = {}) {
        if (!module || !level) {
            throw new Error('Module and level are required to generate training content.');
        }

        const messages = [
            {
                role: 'system',
                content: 'You are an expert space training coach creating personalized training content.',
            },
            {
                role: 'user',
                content: `Generate advanced training content for the ${module} module at the ${level} level.
                          Consider user profile details: ${JSON.stringify(userProfile)}`,
            },
        ];

        return this.createCompletion(messages, {
            maxTokens: 700,
            temperature: 0.8,
        });
    }

    // Provide Problem-Solving Scenario
    async provideProblemSolvingScenario(module, userSkillLevel) {
        if (!module) {
            throw new Error('Module is required to generate problem-solving scenarios.');
        }

        const messages = [
            {
                role: 'system',
                content: 'Create a dynamic, challenging problem-solving scenario for space training.',
            },
            {
                role: 'user',
                content: `Generate a problem-solving scenario for the ${module} module. 
                          Adjust complexity based on user skill level: ${userSkillLevel}`,
            },
        ];

        return this.createCompletion(messages, {
            maxTokens: 600,
            temperature: 0.7,
        });
    }

    // Generate Coaching Suggestions
    async generateCoachingSuggestions(userProfile) {
        if (!userProfile) {
            throw new Error('User profile is required to generate coaching suggestions.');
        }

        const messages = [
            {
                role: 'system',
                content: `Provide comprehensive, multi-dimensional coaching suggestions 
                          that address physical, mental, and technical space training aspects.`,
            },
            {
                role: 'user',
                content: `Analyze and generate personalized coaching suggestions based on: 
                          ${JSON.stringify(userProfile)}`,
            },
        ];

        return this.createCompletion(messages, {
            maxTokens: 700,
            temperature: 0.7,
        });
    }

    // Recommend Plan Upgrade
    async recommendPlanUpgrade(userProgress, currentPlan) {
        if (!userProgress || !currentPlan) {
            throw new Error('User progress and current plan are required to recommend upgrades.');
        }

        const messages = [
            {
                role: 'system',
                content: `Provide strategic recommendations for subscription plan upgrades, 
                          considering user's progress, goals, and potential space travel opportunities.`,
            },
            {
                role: 'user',
                content: `Evaluate plan upgrade potential. Current plan: ${currentPlan}, 
                          Progress details: ${JSON.stringify(userProgress)}`,
            },
        ];

        return this.createCompletion(messages, {
            maxTokens: 500,
            temperature: 0.6,
        });
    }

    // Analyze Progress
    async analyzeProgress(trainingData) {
        if (!trainingData) {
            throw new Error('Training data is required for progress analysis.');
        }

        const messages = [
            {
                role: 'system',
                content: `Perform comprehensive progress analysis with predictive insights, 
                          identifying strengths, improvement areas, and future potential.`,
            },
            {
                role: 'user',
                content: `Analyze training progression: ${JSON.stringify(trainingData)}`,
            },
        ];

        return this.createCompletion(messages, {
            maxTokens: 600,
            temperature: 0.7,
        });
    }

    // Generate Daily Motivational Tip
    async generateDailyTip(userProfile) {
        if (!userProfile) {
            throw new Error('User profile is required for generating a daily tip.');
        }

        const messages = [
            {
                role: 'system',
                content: `Generate highly personalized, motivational tips that 
                          inspire and guide the user's space training journey.`,
            },
            {
                role: 'user',
                content: `Create a motivational tip tailored to: ${JSON.stringify(userProfile)}`,
            },
        ];

        return this.createCompletion(messages, {
            maxTokens: 200,
            temperature: 0.8,
        });
    }

    // Recommend Next Module
    async recommendNextModule(trainingData) {
        if (!trainingData) {
            throw new Error('Training data is required to recommend the next module.');
        }

        const messages = [
            {
                role: 'system',
                content: `Intelligently recommend the optimal next training module 
                          based on the user's current skills, progress, and space readiness goals.`,
            },
            {
                role: 'user',
                content: `Analyze training data and suggest next module: ${JSON.stringify(trainingData)}`,
            },
        ];

        return this.createCompletion(messages, {
            maxTokens: 300,
            temperature: 0.7,
        });
    }

    // Calculate Space Readiness
    async calculateSpaceReadiness(trainingData) {
        if (!trainingData) {
            throw new Error('Training data is required to calculate space readiness.');
        }

        const messages = [
            {
                role: 'system',
                content: `Calculate a holistic space readiness score, considering 
                          physical, mental, technical, and psychological preparedness.`,
            },
            {
                role: 'user',
                content: `Compute space readiness score from: ${JSON.stringify(trainingData)}`,
            },
        ];

        return this.createCompletion(messages, {
            maxTokens: 400,
            temperature: 0.6,
        });
    }

    // Select AI Mode
    async selectAIMode(userPreferences) {
        const modeSelectionContext = {
            availableModes: Object.values(this.AI_MODES),
            userPreferences,
        };

        const messages = [
            {
                role: 'system',
                content: 'Intelligently recommend the most appropriate AI guidance mode.',
            },
            {
                role: 'user',
                content: `Analyze and select optimal AI mode: ${JSON.stringify(modeSelectionContext)}`,
            },
        ];

        const recommendedMode = await this.createCompletion(messages, {
            maxTokens: 100,
            temperature: 0.5,
        });

        return Object.values(this.AI_MODES).includes(recommendedMode.toLowerCase())
            ? recommendedMode.toLowerCase()
            : this.AI_MODES.ASSIST;
    }
}

const aiCoachInstance = new AISpaceCoach();
module.exports = aiCoachInstance;