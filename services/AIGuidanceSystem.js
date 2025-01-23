// services/AIGuidanceSystem.js
const OpenAI = require('openai');
const User = require('../models/User');
const TrainingSession = require('../models/TrainingSession');

// services/AIGuidanceSystem.js - Add these creative features

class AIGuidanceSystem {
    constructor() {
        // Keep existing constructor code...
        
        // Add new simulation scenarios
        this.simulationScenarios = {
            emergencyResponses: [
                'oxygen_system_failure',
                'micrometeoroid_impact',
                'solar_flare_warning',
                'communication_loss',
                'pressure_leak'
            ],
            spaceOperations: [
                'docking_procedure',
                'spacewalk_preparation',
                'equipment_maintenance',
                'navigation_challenge',
                'resource_management'
            ]
        };

        // Add personality traits for AI coach
        this.aiPersonality = {
            name: 'STELLA', // Space Training Enhanced Learning Liaison Assistant
            traits: ['encouraging', 'detail-oriented', 'safety-conscious'],
            experienceLevel: 'veteran astronaut',
            specialties: ['crisis management', 'psychological support', 'technical guidance']
        };
    }

    // Add these new methods

    async generateSpaceScenario(userId) {
        try {
            const user = await User.findById(userId);
            const userLevel = this.calculateUserLevel(user.trainingProgress);

            const completion = await this.openai.chat.completions.create({
                model: this.defaultModel,
                messages: [{
                    role: "system",
                    content: `You are STELLA, an AI space training coach with ${this.aiPersonality.experienceLevel} experience. 
                             Create an immersive space scenario that tests the user's current skills.`
                }, {
                    role: "user",
                    content: `Generate a realistic space scenario for a ${userLevel} trainee.
                             Include:
                             - Situation description
                             - Environmental conditions
                             - Critical decisions needed
                             - Success criteria
                             - Learning objectives
                             User's current progress: ${JSON.stringify(user.trainingProgress)}`
                }]
            });

            return JSON.parse(completion.choices[0]?.message?.content || '{}');
        } catch (error) {
            console.error('Error generating space scenario:', error);
            throw error;
        }
    }

    async simulateEmergencyResponse(userId, scenarioType) {
        try {
            const scenario = this.simulationScenarios.emergencyResponses
                .includes(scenarioType) ? scenarioType : 'oxygen_system_failure';

            const completion = await this.openai.chat.completions.create({
                model: this.defaultModel,
                messages: [{
                    role: "system",
                    content: "Simulate a critical space emergency scenario requiring immediate response."
                }, {
                    role: "user",
                    content: `Create emergency scenario: ${scenario}
                             Include:
                             - Initial warning signs
                             - System readings
                             - Crew status
                             - Available resources
                             - Time constraints`
                }]
            });

            return {
                scenario: JSON.parse(completion.choices[0]?.message?.content || '{}'),
                timeLimit: 300, // 5 minutes for response
                criticalPoints: ['immediate_actions', 'crew_safety', 'system_stabilization']
            };
        } catch (error) {
            console.error('Error simulating emergency:', error);
            throw error;
        }
    }

    async provideVirtualMentoring(userId) {
        try {
            const user = await User.findById(userId);
            const sessions = await TrainingSession.find({ userId });
            const recentChallenges = sessions[0]?.aiGuidance?.challenges || [];

            const completion = await this.openai.chat.completions.create({
                model: this.defaultModel,
                messages: [{
                    role: "system",
                    content: `As STELLA, provide personalized mentoring combining ${this.aiPersonality.traits.join(', ')} traits.`
                }, {
                    role: "user",
                    content: `Create a mentoring session addressing:
                             Recent Challenges: ${JSON.stringify(recentChallenges)}
                             Progress: ${JSON.stringify(user.trainingProgress)}
                             Include:
                             - Personal insights
                             - Real astronaut experiences
                             - Psychological support
                             - Technical advice`
                }]
            });

            return {
                mentoring: JSON.parse(completion.choices[0]?.message?.content || '{}'),
                nextSession: new Date(Date.now() + 86400000) // Next day
            };
        } catch (error) {
            console.error('Error providing virtual mentoring:', error);
            throw error;
        }
    }

    async generateMissionSimulation(userId) {
        try {
            const user = await User.findById(userId);
            const missionType = this.determineMissionType(user.trainingProgress);

            const completion = await this.openai.chat.completions.create({
                model: this.defaultModel,
                messages: [{
                    role: "system",
                    content: "Generate a complete space mission simulation with multiple phases and decision points."
                }, {
                    role: "user",
                    content: `Create ${missionType} mission simulation.
                             Include:
                             - Pre-launch procedures
                             - Launch sequence
                             - In-flight operations
                             - Mission objectives
                             - Potential complications
                             - Success criteria`
                }]
            });

            const simulation = JSON.parse(completion.choices[0]?.message?.content || '{}');
            
            // Store mission data
            await TrainingSession.findOneAndUpdate(
                { userId, status: 'in-progress' },
                {
                    $push: {
                        'missions': {
                            type: missionType,
                            simulation: simulation,
                            startedAt: new Date()
                        }
                    }
                }
            );

            return simulation;
        } catch (error) {
            console.error('Error generating mission simulation:', error);
            throw error;
        }
    }

    async providePsychologicalSupport(userId) {
        try {
            const user = await User.findById(userId);
            const recentSessions = await TrainingSession.find({ userId }).sort({ createdAt: -1 }).limit(5);
            const stressIndicators = this.analyzeStressIndicators(recentSessions);

            const completion = await this.openai.chat.completions.create({
                model: this.defaultModel,
                messages: [{
                    role: "system",
                    content: "Provide space psychology support focusing on mental resilience and emotional well-being."
                }, {
                    role: "user",
                    content: `Generate psychological support response.
                             Stress Indicators: ${JSON.stringify(stressIndicators)}
                             Recent Performance: ${JSON.stringify(user.trainingProgress)}
                             Include:
                             - Coping strategies
                             - Mindfulness exercises
                             - Performance optimization
                             - Stress management`
                }]
            });

            return JSON.parse(completion.choices[0]?.message?.content || '{}');
        } catch (error) {
            console.error('Error providing psychological support:', error);
            throw error;
        }
    }

    determineMissionType(progress) {
        const missionTypes = [
            'orbital_insertion',
            'lunar_landing',
            'mars_approach',
            'deep_space_exploration',
            'space_station_docking'
        ];
        
        // Logic to determine appropriate mission type based on progress
        const progressLevel = Math.floor((progress.overallScore || 0) / 20);
        return missionTypes[progressLevel] || missionTypes[0];
    }

    analyzeStressIndicators(sessions) {
        // Analyze recent sessions for stress indicators
        return sessions.map(session => ({
            date: session.createdAt,
            performanceVariation: session.metrics?.performanceVariation || 0,
            responseTime: session.metrics?.averageResponseTime || 0,
            errorRate: session.metrics?.errorRate || 0
        }));
    }

    calculateUserLevel(progress) {
        const levels = ['rookie', 'intermediate', 'advanced', 'expert', 'mission-ready'];
        const overallProgress = progress.overallScore || 0;
        return levels[Math.floor(overallProgress / 20)] || levels[0];
    }
}

module.exports = new AIGuidanceSystem();