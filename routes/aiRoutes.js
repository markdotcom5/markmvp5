// routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const WebSocket = require('ws');
const ServiceIntegrator = require('../services/ServiceIntegrator');
const AIGuidanceSystem = require('../services/AIGuidanceSystem');
const AISpaceCoach = require('../services/AISpaceCoach');
const aiGuidance = require('../services/aiGuidance');
const aiAssistant = require('../services/aiAssistant');
const { authenticate } = require('../middleware/authenticate');
const Leaderboard = require('../models/Leaderboard');
const User = require('../models/User');
const TrainingSession = require('../models/TrainingSession');
const validateRequest = require('../middleware/validateRequest');

async function getModuleDetails(moduleId) {
    const modules = {
        'physical-001': {
            id: 'physical-001',
            name: 'Physical Training',
            description: 'Space readiness physical preparation',
            difficulty: 'beginner',
            duration: '4 weeks',
            prerequisites: [],
            objectives: ['Cardiovascular fitness', 'Strength training', 'Zero-G adaptation'],
            tasks: [
                { id: 'PT001', name: 'Basic Fitness Assessment', duration: '60 minutes' },
                { id: 'PT002', name: 'Strength Training Basics', duration: '90 minutes' },
                { id: 'PT003', name: 'Endurance Building', duration: '120 minutes' }
            ]
        }
    };
    
    return modules[moduleId] || null;
}
// Start Assessment
router.post('/training/start-assessment', 
    authenticate, 
    validateRequest('assessment.start'),
    async (req, res) => {
        try {
            console.log('Starting new assessment session...');
            
            const session = new TrainingSession({
                userId: req.user._id,
                sessionType: 'Assessment',
                dateTime: new Date(),
                status: 'in-progress',
                aiGuidance: {
                    enabled: true,
                    lastGuidance: 'Starting initial assessment'
                },
                assessment: {
                    type: 'initial',
                    responses: [],
                    startedAt: new Date()
                }
            });

            console.log('Getting initial assessment questions...');
            const assessmentQuestions = await AISpaceCoach.getInitialAssessment();
            
            await session.save();
            
            res.json({
                success: true,
                sessionId: session._id,
                questions: assessmentQuestions
            });
        } catch (error) {
            console.error('Complete error object:', error);
            res.status(500).json({ 
                error: 'Failed to start assessment',
                details: error.message 
            });
        }
});

// Submit Answer
router.post('/training/submit-answer', 
    authenticate,
    validateRequest('assessment.submit'),
    async (req, res) => {
        try {
            const { sessionId, question, answer } = req.body;
            
            console.log('Received request body:', req.body);

            const session = await TrainingSession.findById(sessionId);

            if (!session) {
                console.log('Session not found:', sessionId);
                return res.status(404).json({ error: 'Session not found' });
            }

            console.log('Found session:', session);

            if (!session.assessment) {
                console.log('Creating new assessment');
                session.assessment = {
                    type: 'initial',
                    responses: [],
                    startedAt: new Date()
                };
            }

            if (!session.assessment.responses) {
                console.log('Initializing responses array');
                session.assessment.responses = [];
            }

            const newResponse = {
                question: question,
                answer: answer,
                timestamp: new Date()
            };

            session.assessment.responses.push(newResponse);
            
            console.log('Saving session with new response');
            await session.markModified('assessment.responses');
            await session.save();

            res.json({
                success: true,
                message: 'Answer submitted successfully',
                responseCount: session.assessment.responses.length
            });

        } catch (error) {
            console.error('Error submitting answer:', error);
            res.status(500).json({
                error: 'Failed to submit assessment answer',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
});
// Add this after your submit-answer route and before the WebSocket setup

// Complete Assessment Route
router.post('/training/assessment/:sessionId/complete', authenticate, async (req, res) => {
    try {
        const session = await TrainingSession.findOne({
            _id: req.params.sessionId,
            userId: req.user._id,
            status: 'in-progress'
        });

        if (!session) {
            return res.status(404).json({ error: 'Assessment session not found' });
        }

        // Generate final analysis and training plan
        const finalAnalysis = {
            score: calculateAssessmentScore(session.assessment.responses),
            metrics: {
                physical: calculatePhysicalScore(session.assessment.responses),
                mental: calculateMentalScore(session.assessment.responses),
                technical: calculateTechnicalScore(session.assessment.responses)
            },
            recommendations: {
                suggestedModules: generateSuggestedModules(session.assessment.responses),
                focusAreas: identifyFocusAreas(session.assessment.responses),
                nextSteps: generateNextSteps(session.assessment.responses)
            }
        };
        
        // Update session with results
        session.status = 'completed';
        session.assessment.completedAt = new Date();
        session.assessment.score = finalAnalysis.score;
        session.metrics = {
            physicalReadiness: finalAnalysis.metrics.physical,
            mentalPreparedness: finalAnalysis.metrics.mental,
            technicalProficiency: finalAnalysis.metrics.technical,
            overallScore: finalAnalysis.score
        };
        
        await session.save();

        // Prepare enhanced response
        res.json({
            success: true,
            sessionId: session._id,
            completedAt: session.assessment.completedAt,
            assessmentResults: {
                overall: {
                    score: finalAnalysis.score,
                    status: getAssessmentStatus(finalAnalysis.score),
                    completionTime: calculateCompletionTime(session)
                },
                metrics: finalAnalysis.metrics,
                analysis: {
                    strengths: identifyStrengths(session.assessment.responses),
                    areasForImprovement: identifyWeaknesses(session.assessment.responses),
                    recommendations: finalAnalysis.recommendations
                },
                nextSteps: {
                    immediate: finalAnalysis.recommendations.nextSteps,
                    suggestedModules: finalAnalysis.recommendations.suggestedModules,
                    timeline: generateTrainingTimeline(finalAnalysis)
                }
            },
            certificateUrl: generateCertificateUrl(session._id)
        });
    } catch (error) {
        console.error('Error completing assessment:', error);
        handleError(res, error, 'Failed to complete assessment');
    }
});

// Helper functions (add these before module.exports)
function calculateAssessmentScore(responses) {
    // Implement scoring logic
    return 85; // Placeholder
}

function calculatePhysicalScore(responses) {
    return 80; // Placeholder
}

function calculateMentalScore(responses) {
    return 85; // Placeholder
}

function calculateTechnicalScore(responses) {
    return 90; // Placeholder
}

function generateSuggestedModules(responses) {
    return ['Advanced Navigation', 'Space Physics', 'EVA Training']; // Placeholder
}

function identifyFocusAreas(responses) {
    return ['Zero Gravity Adaptation', 'Emergency Procedures']; // Placeholder
}

function generateNextSteps(responses) {
    return ['Complete Basic Training', 'Start Simulator Sessions']; // Placeholder
}

function getAssessmentStatus(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Satisfactory';
    return 'Needs Improvement';
}

function calculateCompletionTime(session) {
    if (!session.assessment.startedAt) {
        return null;
    }
    const start = new Date(session.assessment.startedAt);
    const end = new Date(session.assessment.completedAt || new Date());
    return Math.round((end - start) / 1000); // Duration in seconds
}

function identifyStrengths(responses) {
    return ['Technical Knowledge', 'Problem Solving']; // Placeholder
}

function identifyWeaknesses(responses) {
    return ['Physical Endurance', 'Emergency Response']; // Placeholder
}

function generateTrainingTimeline(analysis) {
    return {
        immediate: 'Begin Basic Training',
        week1: 'Complete Physical Assessment',
        month1: 'Start Advanced Modules'
    };
}

function generateCertificateUrl(sessionId) {
    return `/api/certificates/assessment/${sessionId}`;
}
// Initialize WebSocket server
const wss = new WebSocket.Server({ noServer: true });
const clients = new Map();

// Keep your existing WebSocket setup...
wss.on('connection', (ws, req) => {
    const userId = req.userId;
    clients.set(userId, ws);

    ws.send(JSON.stringify({
        type: 'CONNECTION_ESTABLISHED',
        timestamp: new Date().toISOString()
    }));

    ws.on('close', () => {
        clients.delete(userId);
        ServiceIntegrator.stopMonitoring(userId);
    });

    ws.on('error', (error) => {
        console.error('WebSocket Error:', error);
        ServiceIntegrator.handleConnectionError(userId, error);
    });
});

// Enhanced error handling
function handleError(res, error, message = 'An error occurred') {
    console.error(`${message}:`, {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        additionalInfo: error.additionalInfo || {}
    });
    res.status(500).json({
        error: message,
        message: error.message,
        timestamp: new Date().toISOString()
    });
}

// New AI Initialization Route
router.post('/initialize', authenticate, async (req, res) => {
        try {
        const { mode } = req.body;
        console.log('Initializing AI for user:', req.user._id, 'Mode:', mode);

        // Initialize AI systems
        const initResult = await AISpaceCoach.selectAIMode({
            userId: req.user._id,
            preferredMode: mode || 'full_guidance'
        });

        // Create or update AI session
        const session = await TrainingSession.findOneAndUpdate(
            { userId: req.user._id, status: 'in-progress' },
            {
                $set: {
                    'aiGuidance.enabled': true,
                    'aiGuidance.mode': mode,
                    'aiGuidance.lastInitialized': new Date()
                }
            },
            { new: true, upsert: true }
        );

        // Notify connected client via WebSocket
        const ws = clients.get(req.user._id);
        if (ws) {
            ws.send(JSON.stringify({
                type: 'AI_INITIALIZED',
                data: { mode, sessionId: session._id }
            }));
        }

        res.json({
            success: true,
            sessionId: session._id,
            aiMode: initResult,
            guidance: await AISpaceCoach.generateInitialGuidance(req.user._id)
        });
    } catch (err) {
        handleError(res, err, 'Failed to initialize AI systems');
    }
});

// Keep your existing routes...
// Update the route in aiRoutes.js
router.post('/training/start-assessment', authenticate, async (req, res) => {
    try {
        console.log('Starting training assessment for user:', req.user._id);
        
        // Get initial assessment with AI-enhanced questions
        const assessmentQuestions = await AISpaceCoach.getInitialAssessment();
        
        // Create new training session with AI tracking
const session = new TrainingSession({
    userId: req.user._id,
    sessionType: 'Assessment',
    dateTime: new Date(), // Make sure this line is present
    aiGuidance: {
        enabled: true,
        mode: 'full_guidance',
        lastInitialized: new Date()
    },
    status: 'in-progress'
});
        await session.save();

        // Rest of your code...
        
        res.json({
            success: true,
            sessionId: session._id,
            questions: assessmentQuestions
        });
    } catch (err) {
        handleError(res, err, 'Failed to start training assessment');
    }
});

// Real-time AI Guidance Route
router.post('/ai-guidance', authenticate, async (req, res) => {
    try {
        const { questionId, currentProgress, context } = req.body;
        
        // Get personalized guidance
        const guidance = await AISpaceCoach.generateCoachingSuggestions({
            userId: req.user._id,
            questionId,
            currentProgress,
            context
        });

        // Record AI interaction
        await TrainingSession.findOneAndUpdate(
            { userId: req.user._id, status: 'in-progress' },
            {
                $push: {
                    aiInteractions: {
                        type: 'guidance',
                        content: {
                            prompt: questionId,
                            response: guidance
                        }
                    }
                }
            }
        );

        res.json({
            success: true,
            guidance
        });
    } catch (err) {
        handleError(res, err, 'Failed to generate AI guidance');
    }
});

// Submit Assessment Answer
// Update this in aiRoutes.js
router.post('/training/submit-answer', authenticate, async (req, res) => {
    try {
        const { sessionId, questionIndex, answer } = req.body;
        
        const session = await TrainingSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ 
                success: false,
                error: 'Training session not found' 
            });
        }

        if (!session.assessment) {
            session.assessment = {
                type: 'initial',
                responses: [],
                startedAt: new Date()
            };
        }

        // Add response directly
        session.assessment.responses.push({
            question: questionIndex.toString(),  // Convert to string to match schema
            answer: answer,
            timestamp: new Date()
        });

        await session.save();

        res.json({
            success: true,
            progress: (session.assessment.responses.length / 5) * 100,
            nextQuestionIndex: questionIndex + 1
        });

    } catch (err) {
        console.error('Submit answer error:', err);
        res.status(500).json({ 
            error: 'Failed to submit assessment answer',
            message: err.message 
        });
    }
});
// Get Available Training Modules
router.get('/training/modules', authenticate, async (req, res) => {
    try {
        const modules = [
            {
                id: 'physical-001',
                name: 'Physical Training',
                description: 'Space readiness physical preparation',
                difficulty: 'beginner',
                duration: '4 weeks',
                prerequisites: [],
                objectives: ['Cardiovascular fitness', 'Strength training', 'Zero-G adaptation']
            },
            {
                id: 'technical-001',
                name: 'Technical Skills',
                description: 'Essential space operations training',
                difficulty: 'intermediate',
                duration: '6 weeks',
                prerequisites: ['physical-001'],
                objectives: ['System operations', 'Emergency procedures', 'Navigation']
            },
            {
                id: 'simulation-001',
                name: 'Space Simulation',
                description: 'Practical space mission simulation',
                difficulty: 'advanced',
                duration: '8 weeks',
                prerequisites: ['physical-001', 'technical-001'],
                objectives: ['Mission planning', 'Team coordination', 'Crisis management']
            }
        ];

        res.json({
            success: true,
            modules,
            userProgress: await calculateUserProgress(req.user._id)
        });
    } catch (error) {
        handleError(res, error, 'Failed to fetch training modules');
    }
});

// Start Training Module
router.post('/training/modules/:moduleId/start', authenticate, async (req, res) => {
    try {
        const { moduleId } = req.params;
        const session = new TrainingSession({
            userId: req.user._id,
            sessionType: 'Training',
            moduleId,
            dateTime: new Date(),
            status: 'in-progress',
            progress: 0,
            metrics: {
                physicalReadiness: 0,
                mentalPreparedness: 0,
                technicalProficiency: 0,
                overallScore: 0
            }
        });

        await session.save();

        res.json({
            success: true,
            sessionId: session._id,
            module: await getModuleDetails(moduleId),
            initialGuidance: await AISpaceCoach.generateInitialGuidance(req.user._id)
        });
    } catch (error) {
        handleError(res, error, 'Failed to start training module');
    }
});

// In your progress update route
router.post('/training/modules/:moduleId/progress', authenticate, async (req, res) => {
    try {
        const { progress, completedTasks } = req.body;
        const session = await TrainingSession.findOneAndUpdate(
            { 
                moduleId: req.params.moduleId,
                userId: req.user._id,
                status: 'in-progress'
            },
            {
                $set: {
                    progress,
                    'metrics.technicalProficiency': completedTasks.length * 33.33,
                    lastUpdated: new Date()
                },
                $push: {
                    completedTasks: {
                        $each: completedTasks
                    }
                }
            },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ error: 'Active session not found' });
        }

        // Update points and ranking
        session.ranking.points = session.calculatePoints();
        await session.save();
        await TrainingSession.updateGlobalRanks();

        const nextMilestone = await calculateNextMilestone(session);

        res.json({
            success: true,
            currentProgress: progress,
            ranking: {
                globalRank: session.ranking.globalRank,
                points: session.ranking.points,
                level: session.ranking.level
            },
            nextMilestone,
            achievements: session.achievements
        });
    } catch (error) {
        handleError(res, error, 'Failed to update progress');
    }
});
// Keep the rest of your routes...

module.exports = { 
    router, 
    upgradeConnection: (server) => {
        server.on('upgrade', async (request, socket, head) => {
            try {
                const userId = await authenticateWebSocket(request);
                if (!userId) {
                    socket.destroy();
                    return;
                }

                request.userId = userId;
                wss.handleUpgrade(request, socket, head, (ws) => {
                    wss.emit('connection', ws, request);
                });
            } catch (error) {
                console.error('WebSocket upgrade error:', error);
                socket.destroy();
            }
        });
    },
    wss
};