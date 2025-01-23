const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const rateLimit = require('express-rate-limit'); // Rate limiter
const TrainingSession = require('../models/TrainingSession'); // Mongoose model
const AISpaceCoach = require('../services/AISpaceCoach'); // AI Assistant service
const Joi = require('joi');

// Pagination Schema
const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
});

// Rate Limiter Middleware
const sessionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' },
});

// Validate Input Middleware
const validateSessionInput = (req, res, next) => {
    const { sessionType, dateTime } = req.body;

    if (!sessionType || typeof sessionType !== 'string') {
        return res.status(400).json({ error: 'Invalid or missing session type.' });
    }

    const parsedDate = new Date(dateTime);
    if (isNaN(parsedDate) || parsedDate < new Date()) {
        return res.status(400).json({ error: 'Invalid or past date.' });
    }

    next();
};

// Route: Fetch Training Modules
router.get('/modules', authenticate, async (req, res) => {
    try {
        const modules = [
            { id: 1, name: 'Physical Training', description: 'Improve your physical readiness.' },
            { id: 2, name: 'Mental Training', description: 'Boost your mental strength and focus.' },
            { id: 3, name: 'Space Simulation', description: 'Experience simulated space missions.' },
            { id: 4, name: 'Technical Skills', description: 'Develop technical skills for space exploration.' },
            { id: 5, name: 'Team Dynamics', description: 'Enhance teamwork and leadership skills.' },
        ];

        res.json({ success: true, modules });
    } catch (error) {
        console.error('Error fetching modules:', error.message);
        res.status(500).json({ error: 'Failed to fetch training modules.' });
    }
});

// Protected Route: Create a Training Session
router.post('/sessions', authenticate, validateSessionInput, async (req, res) => {
    const { sessionType, dateTime, participants, points = 0 } = req.body;

    try {
        const session = new TrainingSession({
            userId: req.user._id,
            sessionType,
            dateTime,
            participants,
            points,
            status: 'scheduled',
        });
        await session.save();
        res.status(201).json({ message: 'Session created successfully', session });
    } catch (error) {
        console.error('Error creating session:', error.message);
        res.status(500).json({ error: 'Failed to create session.' });
    }
});

// Analyze Training Progress
router.post('/progress', authenticate, async (req, res) => {
    const { trainingData } = req.body;

    try {
        const analysis = await AISpaceCoach.analyzeProgress(trainingData);
        res.status(200).json({ success: true, analysis });
    } catch (error) {
        console.error('Error analyzing progress:', error.message);
        res.status(500).json({ success: false, error: 'Failed to analyze progress.' });
    }
});

// Update a Training Session
router.patch('/sessions/:sessionId', authenticate, sessionLimiter, async (req, res) => {
    const { progress, status } = req.body;

    try {
        const session = await TrainingSession.findOneAndUpdate(
            { _id: req.params.sessionId, userId: req.user._id },
            { $set: { progress, status } },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ error: 'Session not found.' });
        }

        res.json({ message: 'Session updated successfully', session });
    } catch (error) {
        console.error('Error updating session:', error.message);
        res.status(500).json({ error: 'Failed to update session.' });
    }
});

// Fetch Upcoming Training Sessions with Pagination
router.get('/upcoming', authenticate, async (req, res) => {
    try {
        const { page, limit } = await paginationSchema.validateAsync(req.query);

        const sessions = await TrainingSession.find({
            userId: req.user._id,
            dateTime: { $gt: new Date() },
            status: 'scheduled',
        })
            .sort({ dateTime: 1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const totalSessions = await TrainingSession.countDocuments({
            userId: req.user._id,
            dateTime: { $gt: new Date() },
            status: 'scheduled',
        });

        res.json({
            totalSessions,
            totalPages: Math.ceil(totalSessions / limit),
            currentPage: page,
            hasNextPage: page < Math.ceil(totalSessions / limit),
            hasPrevPage: page > 1,
            sessions,
        });
    } catch (error) {
        console.error('Error fetching upcoming sessions:', error.message);
        res.status(500).json({ error: 'Failed to fetch upcoming sessions.' });
    }
});

// Complete a Training Session
router.patch('/sessions/:sessionId/complete', authenticate, sessionLimiter, async (req, res) => {
    try {
        const session = await TrainingSession.findOneAndUpdate(
            { _id: req.params.sessionId, userId: req.user._id },
            { $set: { status: 'completed', progress: 100 } },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ error: 'Session not found.' });
        }

        res.json({ message: 'Session completed successfully', session });
    } catch (error) {
        console.error('Error completing session:', error.message);
        res.status(500).json({ error: 'Failed to complete session.' });
    }
});

// Start AI Assessment
router.post('/assessment/start', authenticate, sessionLimiter, async (req, res) => {
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
            assessment: {  // Add this explicit assessment initialization
                type: 'initial',
                responses: [],
                startedAt: new Date(),
                aiRecommendations: {
                    focusAreas: [],
                    suggestedModules: [],
                    personalizedFeedback: '',
                    nextSteps: []
                }
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

// Submit Assessment Answer
router.post('/assessment/:sessionId/submit', authenticate, sessionLimiter, async (req, res) => {
    try {
        const { question, answer } = req.body;
        const session = await TrainingSession.findOne({
            _id: req.params.sessionId,
            userId: req.user._id,
            status: 'in-progress'
        });

        if (!session) {
            return res.status(404).json({ error: 'Assessment session not found' });
        }

        // Record the response
        session.submitAssessmentResponse(question, answer);

        // Get AI analysis of the answer
        const aiAnalysis = await AISpaceCoach.analyzeResponse(question, answer);
        
        // Update session with AI recommendations
        if (aiAnalysis.recommendations) {
            session.assessment.aiRecommendations = {
                ...session.assessment.aiRecommendations,
                ...aiAnalysis.recommendations
            };
        }

        await session.save();

        // Check if this was the last question
        const isComplete = session.assessment.responses.length >= aiAnalysis.totalQuestions;

        res.json({
            success: true,
            isComplete,
            nextQuestion: isComplete ? null : aiAnalysis.nextQuestion,
            immediateGuidance: aiAnalysis.immediateGuidance
        });
    } catch (error) {
        console.error('Error submitting assessment answer:', error);
        res.status(500).json({ error: 'Failed to submit answer' });
    }
});

// Complete Assessment and Generate Training Plan
router.post('/assessment/:sessionId/complete', authenticate, sessionLimiter, async (req, res) => {
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
        const finalAnalysis = await AISpaceCoach.generateTrainingPlan(session.assessment.responses);
        
        // Update session with results
        session.completeAssessment(finalAnalysis.score, finalAnalysis.recommendations);
        session.status = 'completed';
        session.metrics = {
            physicalReadiness: finalAnalysis.metrics.physical,
            mentalPreparedness: finalAnalysis.metrics.mental,
            technicalProficiency: finalAnalysis.metrics.technical,
            overallScore: finalAnalysis.metrics.overall
        };

        await session.save();

        res.json({
            success: true,
            trainingPlan: {
                recommendedModules: finalAnalysis.recommendations.suggestedModules,
                focusAreas: finalAnalysis.recommendations.focusAreas,
                timeline: finalAnalysis.recommendations.timeline,
                nextSteps: finalAnalysis.recommendations.nextSteps
            },
            metrics: session.metrics
        });
    } catch (error) {
        console.error('Error completing assessment:', error);
        res.status(500).json({ error: 'Failed to complete assessment' });
    }
});

// Toggle AI Guidance
router.post('/ai-guidance/toggle', authenticate, async (req, res) => {
    try {
        const { enabled } = req.body;
        const session = await TrainingSession.findOne({
            userId: req.user._id,
            status: 'in-progress'
        });

        if (session) {
            session.aiGuidance.enabled = enabled;
            await session.save();
        }

        res.json({
            success: true,
            aiGuidanceEnabled: enabled
        });
    } catch (error) {
        console.error('Error toggling AI guidance:', error);
        res.status(500).json({ error: 'Failed to toggle AI guidance' });
    }
});

// Get AI Recommendations
router.get('/ai-recommendations', authenticate, async (req, res) => {
    try {
        const latestSession = await TrainingSession.findOne({
            userId: req.user._id
        }).sort({ createdAt: -1 });

        if (!latestSession) {
            return res.status(404).json({ error: 'No training sessions found' });
        }

        const recommendations = await AISpaceCoach.getPersonalizedRecommendations(
            req.user._id,
            latestSession.metrics
        );

        res.json({
            success: true,
            recommendations
        });
    } catch (error) {
        console.error('Error getting AI recommendations:', error);
        res.status(500).json({ error: 'Failed to get recommendations' });
    }
});
module.exports = router;
