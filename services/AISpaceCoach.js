const OpenAI = require('openai');
const EventEmitter = require('events');
const Achievement = require('../models/Achievement');
const UserProgress = require('../models/UserProgress');

class AISpaceCoach extends EventEmitter {
    constructor() {
        super();
        // Initialize OpenAI with enhanced configuration
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // Enhanced default settings
        this.defaultModel = 'gpt-4-turbo';
        this.defaultTemperature = 0.7;
        this.defaultMaxTokens = 500;

        // AI Guidance Mode Constants
        this.AI_MODES = {
            MANUAL: 'manual',
            ASSIST: 'assist',
            FULL_GUIDANCE: 'full_guidance',
        };

        // Enhanced Performance Tracking
        this.performanceMetrics = {
            trainingModulesCompleted: 0,
            skillProgressTracking: {},
            userEngagementScore: 0,
            achievements: new Map(),
            progressHistory: new Map(),
            realTimeMetrics: new Map()
        };
        this.achievementTriggers = {
            SKILL_MASTERY: this.checkSkillMastery,
            PERFORMANCE_STREAK: this.checkPerformanceStreak,
            TIME_MILESTONE: this.checkTimeMilestone,
            DIFFICULTY_BREAKTHROUGH: this.checkDifficultyBreakthrough
        };

        this.initializeAchievementSystem();
    }
    
    // Achievement System
    initializeAchievementSystem() {
        this.achievementTypes = {
            ASSESSMENT_MASTER: {
                id: 'assessment_master',
                threshold: 90,
                description: 'Score 90% or higher on assessments',
                icon: '🎯'
            },
            QUICK_LEARNER: {
                id: 'quick_learner',
                threshold: 5,
                description: 'Complete 5 modules in record time',
                icon: '⚡'
            },
            CONSISTENCY_KING: {
                id: 'consistency_king',
                threshold: 7,
                description: '7-day training streak',
                icon: '👑'
            }
        };
    }

    // Get Initial Assessment
    async getInitialAssessment() {
        try {
            const messages = [
                {
                    role: 'system',
                    content: 'You are an AI assistant that generates assessment questions for space training. Always respond with a valid JSON array of questions.',
                },
                {
                    role: 'user',
                    content: 'Generate 5 initial assessment questions. Return them in a JSON array where each question has "id", "text", and "type" (multiple_choice/open_ended) fields.',
                },
            ];
    
            const response = await this.createCompletion(messages, {
                maxTokens: 800,
                temperature: 0.7,
            });
    
            return this.parseAssessmentResponse(response);
        } catch (error) {
            console.error('Error generating initial assessment:', error);
            return this.getFallbackAssessment();
        }
    }

    // Analyze a Response
    async analyzeResponse(question, answer) {
        try {
            const completion = await this.openai.chat.completions.create({
                model: this.defaultModel,
                messages: [
                    {
                        role: "system",
                        content: "You are an expert evaluator of space training assessments."
                    },
                    {
                        role: "user",
                        content: `Analyze the following response to the question: "${question}". The answer is: "${answer}". Provide a score out of 100, constructive feedback, and immediate guidance.`
                    }
                ],
                temperature: 0.7
            });

            const content = completion.choices[0]?.message?.content;
            const analysis = {
                feedback: content,
                score: this.calculateScore(content),
                immediateGuidance: this.generateImmediateGuidance(content)
            };
            return analysis;
        } catch (error) {
            console.error('Error in analyzeResponse:', error);
            throw error;
        }
    }

    // Generate Training Plan based on assessment responses
    async generateTrainingPlan(responses) {
        try {
            const messages = [
                {
                    role: 'system',
                    content: 'You are an expert space training coach who generates personalized training plans based on assessment responses.'
                },
                {
                    role: 'user',
                    content: `Based on these assessment responses: ${JSON.stringify(responses)}, generate a detailed training plan that includes an overall score, recommended modules, focus areas, timeline, and next steps. Return the result in JSON format.`
                }
            ];
    
            const response = await this.createCompletion(messages, {
                maxTokens: 700,
                temperature: 0.7,
            });
    
            // Try to parse the response as JSON; if it fails, return the raw text
            try {
                const plan = JSON.parse(response);
                return plan;
            } catch (parseError) {
                return { planText: response };
            }
        } catch (error) {
            console.error('Error generating training plan:', error);
            throw error;
        }
    }

    // Process an Assessment Answer (used elsewhere)
    async processAssessmentAnswer(userId, questionIndex, answer) {
        try {
            const completion = await this.openai.chat.completions.create({
                model: this.defaultModel,
                messages: [{
                    role: "system",
                    content: "You are an expert space training evaluator. Analyze the trainee's answer and provide constructive feedback."
                }, {
                    role: "user",
                    content: `Question Index: ${questionIndex}\nAnswer: ${answer}\nEvaluate this response for accuracy, completeness, and understanding.`
                }],
                temperature: 0.7
            });

            const analysis = {
                feedback: completion.choices[0]?.message?.content,
                score: this.calculateScore(completion.choices[0]?.message?.content),
                guidance: this.generateImmediateGuidance(completion.choices[0]?.message?.content)
            };

            await this.trackProgress(userId, {
                type: 'ASSESSMENT',
                score: analysis.score,
                questionIndex
            });

            return {
                success: true,
                analysis,
                nextQuestionIndex: questionIndex + 1
            };
        } catch (error) {
            console.error('Error processing assessment answer:', error);
            throw error;
        }
    }

    // Helper: Create OpenAI Completion
    async createCompletion(messages, options = {}) {
        try {
            if (!process.env.OPENAI_API_KEY) {
                throw new Error('OpenAI API Key is missing');
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
                throw new Error('OpenAI API returned no content');
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
            throw new Error('Module and level are required');
        }

        const messages = [
            {
                role: 'system',
                content: 'You are an expert space training coach creating personalized training content.',
            },
            {
                role: 'user',
                content: `Generate advanced training content for the ${module} module at ${level} level. Consider user profile: ${JSON.stringify(userProfile)}`,
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
                content: `Generate a problem-solving scenario for the ${module} module. Adjust complexity based on user skill level: ${userSkillLevel}`,
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
                content: 'Provide comprehensive, multi-dimensional coaching suggestions that address physical, mental, and technical space training aspects.',
            },
            {
                role: 'user',
                content: `Analyze and generate personalized coaching suggestions based on: ${JSON.stringify(userProfile)}`,
            },
        ];

        return this.createCompletion(messages, {
            maxTokens: 700,
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
                content: 'Calculate a holistic space readiness score, considering physical, mental, technical, and psychological preparedness.',
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

    async checkAchievements(userId) {
        try {
            const userProgress = await UserProgress.findOne({ userId }).populate('achievements.achievementId');
    
            for (const [triggerType, checker] of Object.entries(this.achievementTriggers)) {
                const newAchievements = await checker(userProgress);
                if (newAchievements.length > 0) {
                    await this.grantAchievements(userId, newAchievements);
                }
            }
        } catch (error) {
            console.error('Achievement check error:', error);
            throw error;
        }
    }
    
    // Progress Tracking
    async trackProgress(userId, data) {
        try {
            const userMetrics = this.performanceMetrics.realTimeMetrics.get(userId) || {
                moduleProgress: {},
                skillLevels: {},
                achievements: []
            };
    
            userMetrics.lastUpdate = new Date();
            userMetrics.currentProgress = data;
    
            // ✅ Check for achievements
            await this.checkAchievements(userId);
    
            this.performanceMetrics.realTimeMetrics.set(userId, userMetrics);
            this.emit('progress-update', { userId, progress: data, timestamp: new Date() });
    
            return userMetrics;
        } catch (error) {
            console.error('Progress tracking error:', error);
            throw error;
        }
    }
    
    // Achievement Tracking
    async trackAchievements(userId, action) {
        try {
            const userMetrics = this.performanceMetrics.realTimeMetrics.get(userId);
            if (!userMetrics) return;

            const unlockedAchievements = [];

            for (const [type, criteria] of Object.entries(this.achievementTypes)) {
                if (this.hasMetCriteria(userMetrics, criteria, action)) {
                    const achievement = await this.unlockAchievement(userId, type);
                    if (achievement) {
                        unlockedAchievements.push(achievement);
                    }
                }
            }

            if (unlockedAchievements.length > 0) {
                this.emit('achievements-unlocked', {
                    userId,
                    achievements: unlockedAchievements
                });
            }

            return unlockedAchievements;
        } catch (error) {
            console.error('Achievement tracking error:', error);
        }
    }
    
    async grantAchievements(userId, achievements) {
        try {
            const userProgress = await UserProgress.findOne({ userId });
    
            for (const achievement of achievements) {
                userProgress.achievements.push({
                    achievementId: achievement._id,
                    unlockedAt: new Date(),
                    currentTier: achievement.tier
                });
    
                // Emit achievement event for frontend
                this.emit('achievement-unlocked', {
                    userId,
                    achievement: {
                        title: achievement.details.title,
                        description: achievement.details.description,
                        icon: achievement.details.icon,
                        tier: achievement.tier
                    }
                });
            }
    
            await userProgress.save();
        } catch (error) {
            console.error('Achievement grant error:', error);
            throw error;
        }
    }
    
    async checkSkillMastery(userProgress) {
        return userProgress?.trainingScore >= 95 ? [await Achievement.findOne({ type: 'SKILL_MASTERY' })] : [];
    }
    
    async checkPerformanceStreak(userProgress) {
        return userProgress?.trainingDays >= 10 ? [await Achievement.findOne({ type: 'PERFORMANCE_STREAK' })] : [];
    }
    
    async checkTimeMilestone(userProgress) {
        return userProgress?.totalTrainingTime >= 100 ? [await Achievement.findOne({ type: 'TIME_MILESTONE' })] : [];
    }
    
    async checkDifficultyBreakthrough(userProgress) {
        return userProgress?.completedHardModules >= 3 ? [await Achievement.findOne({ type: 'DIFFICULTY_BREAKTHROUGH' })] : [];
    }
    
    // Helper Methods
    calculateScore(feedback) {
        try {
            const scoreMatch = feedback.match(/(\d+)/);
            return scoreMatch ? Math.min(parseInt(scoreMatch[1]), 100) : 70;
        } catch (error) {
            return 70;
        }
    }

    generateImmediateGuidance(feedback) {
        try {
            const sentences = feedback.split('.');
            return sentences.length > 1 ? sentences[1].trim() : feedback;
        } catch (error) {
            return 'Continue to the next question.';
        }
    }

    parseAssessmentResponse(response) {
        try {
            const parsedQuestions = JSON.parse(response);
            return {
                questions: parsedQuestions,
                timestamp: new Date(),
                assessmentType: 'initial'
            };
        } catch (error) {
            return this.getFallbackAssessment();
        }
    }

    getFallbackAssessment() {
        return {
            questions: [
                {
                    id: 1,
                    text: "What is your current fitness level?",
                    type: "multiple_choice"
                },
                {
                    id: 2,
                    text: "Do you have any previous space training experience?",
                    type: "multiple_choice"
                },
                {
                    id: 3,
                    text: "What are your primary goals for space training?",
                    type: "open_ended"
                }
            ],
            timestamp: new Date(),
            assessmentType: 'initial'
        };
    }

    hasMetCriteria(userMetrics, criteria, action) {
        switch (criteria.id) {
            case 'assessment_master':
                return action.type === 'ASSESSMENT' && action.score >= criteria.threshold;
            case 'quick_learner':
                return userMetrics.moduleProgress >= criteria.threshold;
            case 'consistency_king':
                return this.checkConsistencyStreak(userMetrics) >= criteria.threshold;
            default:
                return false;
        }
    }

    async unlockAchievement(userId, achievementType) {
        const achievement = this.achievementTypes[achievementType];
        if (!achievement) return null;

        const userAchievements = this.performanceMetrics.achievements.get(userId) || new Set();
        
        if (!userAchievements.has(achievementType)) {
            userAchievements.add(achievementType);
            this.performanceMetrics.achievements.set(userId, userAchievements);
            
            return {
                ...achievement,
                unlockedAt: new Date(),
                userId
            };
        }

        return null;
    }

    async handleProgressUpdate(userId, progressData) {
        try {
            const metrics = this.performanceMetrics.realTimeMetrics.get(userId) || {};
            metrics.lastUpdate = new Date();
            metrics.currentProgress = progressData;

            await this.trackAchievements(userId, {
                type: 'PROGRESS_UPDATE',
                data: progressData
            });

            this.emit('progress-update', {
                userId,
                progress: progressData,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Progress update handling error:', error);
        }
    }
}

// Export the singleton instance
const aiCoachInstance = new AISpaceCoach();
module.exports = aiCoachInstance;
