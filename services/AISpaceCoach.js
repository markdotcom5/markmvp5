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
// Add this after the constructor in AISpaceCoach.js
async generateInitialGuidance(userId) {
    try {
        const messages = [
            {
                role: 'system',
                content: 'You are an expert space training coach providing initial guidance for new trainees.',
            },
            {
                role: 'user',
                content: `Generate initial training guidance for user ${userId}. Include welcome message, initial steps, and recommendations.`
            }
        ];

        const response = await this.createCompletion(messages, {
            maxTokens: 500,
            temperature: 0.7
        });

        // Parse the AI response or provide a structured fallback
        try {
            return JSON.parse(response);
        } catch (parseError) {
            return {
                welcome: "Welcome to your space training program",
                initialSteps: [
                    "Review your module objectives",
                    "Complete the initial assessment",
                    "Follow the guided exercises"
                ],
                recommendations: {
                    pace: "Take each step at your own pace",
                    focus: "Focus on understanding core concepts"
                }
            };
        }
    } catch (error) {
        console.error('Error generating initial guidance:', error);
        throw error;
    }
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
    
            try {
                // Attempt to parse the response
                const parsedQuestions = JSON.parse(response);
                return {
                    questions: parsedQuestions,
                    timestamp: new Date(),
                    assessmentType: 'initial',
                };
            } catch (parseError) {
                console.error('Failed to parse OpenAI response:', response);
                // Return a fallback set of questions if parsing fails
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
                    assessmentType: 'initial',
                };
            }
        } catch (error) {
            console.error('Error generating initial assessment:', error);
            throw new Error('Failed to generate initial assessment questions');
        }
    }

    // In services/AISpaceCoach.js - Add this method

async processAssessmentAnswer(userId, questionIndex, answer) {
    try {
        const completion = await this.openai.chat.completions.create({
            model: this.defaultModel,
            messages: [{
                role: "system",
                content: "You are an expert space training evaluator. Analyze the trainee's answer and provide constructive feedback."
            }, {
                role: "user",
                content: `Question Index: ${questionIndex}
                         Answer: ${answer}
                         Evaluate this response for accuracy, completeness, and understanding.
                         Provide:
                         1. Score (0-100)
                         2. Feedback
                         3. Areas for improvement`
            }],
            temperature: 0.7
        });

        const analysis = {
            feedback: completion.choices[0]?.message?.content,
            score: this.calculateScore(completion.choices[0]?.message?.content),
            immediateGuidance: this.generateImmediateGuidance(completion.choices[0]?.message?.content)
        };

        return {
            success: true,
            analysis,
            nextQuestionIndex: questionIndex + 1
        };
    } catch (error) {
        console.error('Error processing assessment answer:', error);
        throw new Error('Failed to process assessment answer');
    }
}

// Helper method to extract a numerical score from AI feedback
calculateScore(feedback) {
    try {
        // Simple score extraction - you can make this more sophisticated
        const scoreMatch = feedback.match(/(\d+)/);
        return scoreMatch ? Math.min(parseInt(scoreMatch[1]), 100) : 70;
    } catch (error) {
        return 70; // Default score if parsing fails
    }
}

generateImmediateGuidance(feedback) {
    try {
        // Extract key points for immediate guidance
        const sentences = feedback.split('.');
        return sentences.length > 1 ? sentences[1].trim() : feedback;
    } catch (error) {
        return 'Continue to the next question.';
    }
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