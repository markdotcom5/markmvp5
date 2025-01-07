// services/ServiceIntegrator.js
const AISpaceCoach = require('./AISpaceCoach');
const AIGuidanceSystem = require('./AIGuidanceSystem');
const aiGuidance = require('./aiGuidance');
const aiAssistant = require('./aiAssistant');

class ServiceIntegrator {
    constructor() {
        this.services = {
            coach: AISpaceCoach,
            guidance: AIGuidanceSystem,
            realTime: aiGuidance,
            assistant: aiAssistant
        };
    }

    async processUserAction(userId, action, context) {
        try {
            // Get current guidance mode
            const guidanceStatus = await this.services.guidance.getGuidanceStatus(userId);
            
            // Handle based on mode
            if (guidanceStatus.mode === 'fsd') {
                // Full FSD mode
                const [guidance, coaching] = await Promise.all([
                    this.services.realTime.processRealTimeAction(userId, action),
                    this.services.coach.generateCoachingSuggestions(context)
                ]);

                return {
                    guidance,
                    coaching,
                    mode: 'fsd'
                };
            } else if (guidanceStatus.mode === 'manual') {
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
            console.error('Service Integration Error:', error);
            throw error;
        }
    }

    async generateTrainingPlan(userId) {
        try {
            const guidanceStatus = await this.services.guidance.getGuidanceStatus(userId);
            
            // Get certifications and achievements
            const [certProgress, achievements] = await Promise.all([
                this.services.assistant.analyzeCertificationProgress(certifications),
                this.services.assistant.analyzeAchievementProgress(achievements)
            ]);

            // Generate comprehensive plan
            const plan = await this.services.coach.generateTrainingContent(
                certProgress.recommendedModule,
                achievements.currentLevel,
                {
                    certifications: certProgress,
                    achievements,
                    guidanceMode: guidanceStatus.mode
                }
            );

            return {
                plan,
                certProgress,
                achievements,
                guidanceMode: guidanceStatus.mode
            };
        } catch (error) {
            console.error('Training Plan Generation Error:', error);
            throw error;
        }
    }

    async updateUserProgress(userId, progressData) {
        try {
            // Update all relevant services
            const [readinessScore, leaderboardUpdate, achievementUpdate] = await Promise.all([
                this.services.coach.calculateSpaceReadiness(progressData),
                this.services.assistant.generateLeaderboardStrategy(userId, progressData),
                this.services.assistant.recommendNextAchievements(userId)
            ]);

            // Get guidance recommendations if in FSD mode
            const guidanceStatus = await this.services.guidance.getGuidanceStatus(userId);
            let guidanceUpdate = null;
            if (guidanceStatus.mode === 'fsd') {
                guidanceUpdate = await this.services.guidance.processUserAction(
                    userId,
                    { type: 'progress_update', data: progressData },
                    { readinessScore }
                );
            }

            return {
                readinessScore,
                leaderboardUpdate,
                achievementUpdate,
                guidanceUpdate
            };
        } catch (error) {
            console.error('Progress Update Error:', error);
            throw error;
        }
    }

    async getDailyRecommendations(userId) {
        try {
            const [tip, plan] = await Promise.all([
                this.services.coach.generateDailyTip(userId),
                this.services.realTime.generateDailyPlan(userId)
            ]);

            return {
                dailyTip: tip,
                trainingPlan: plan,
                timestamp: new Date()
            };
        } catch (error) {
            console.error('Daily Recommendations Error:', error);
            throw error;
        }
    }
}

module.exports = new ServiceIntegrator();