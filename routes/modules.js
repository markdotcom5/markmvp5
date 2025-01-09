// routes/modules.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticate } = require('../middleware/authenticate');
const User = require('../models/User');
const Module = require('../models/Module');
const TrainingSession = require('../models/TrainingSession');
const { generateTrainingContent, provideProblemSolvingScenario } = require('../services/AISpaceCoach');

// Debugging Log
console.log('Authenticate Middleware:', typeof authenticate);

// Middleware for validating ObjectId
router.param('sessionId', (req, res, next, id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid sessionId format' });
    }
    next();
});

// Route: Get All Modules with filtering and sorting
router.get('/all', authenticate, async (req, res) => {
    try {
        const { category, difficulty, type, sort = 'name' } = req.query;
        
        // Build query
        let query = {};
        if (category) query.category = category;
        if (difficulty) query.difficulty = difficulty;
        if (type) query.type = type;

        const modules = await Module.find(query)
            .sort(sort)
            .populate('prerequisites.module', 'name category')
            .populate('content.theory.videoId');

        // Get user progress
        const userProgress = await TrainingSession.find({ 
            userId: req.user._id,
            module: { $in: modules.map(m => m._id) }
        });

        const enhancedModules = modules.map(module => ({
            ...module.toObject(),
            userProgress: {
                completed: userProgress.some(p => 
                    p.module.equals(module._id) && p.status === 'completed'
                ),
                lastAttempt: userProgress.find(p => 
                    p.module.equals(module._id)
                )?.updatedAt
            }
        }));

        res.status(200).json({ 
            success: true,
            count: enhancedModules.length,
            modules: enhancedModules 
        });
    } catch (error) {
        console.error('Error fetching modules:', error.message);
        res.status(500).json({ error: 'Failed to fetch modules.' });
    }
});

// Route: Get All Sessions
router.get('/sessions', authenticate, async (req, res) => {
    try {
        const sessions = await TrainingSession.find({ userId: req.user._id })
            .sort({ dateTime: -1 });
        res.status(200).json(sessions);
    } catch (error) {
        console.error('Error fetching sessions:', error.message);
        res.status(500).json({ error: 'Failed to fetch sessions.' });
    }
});

// Route: Create a Session
router.post('/sessions', authenticate, async (req, res) => {
    const { sessionType, dateTime, participants, points = 0 } = req.body;

    if (!sessionType || !dateTime) {
        return res.status(400).json({ error: 'sessionType and dateTime are required.' });
    }

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
        res.status(201).json(session);
    } catch (error) {
        console.error('Error creating session:', error.message);
        res.status(500).json({ error: 'Failed to create session.' });
    }
});

// Route: Update a Session
router.patch('/sessions/:sessionId', authenticate, async (req, res) => {
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
        res.status(200).json(session);
    } catch (error) {
        console.error('Error updating session:', error.message);
        res.status(500).json({ error: 'Failed to update session.' });
    }
});

// Route: AI-Generated Session Insights
router.post('/sessions/:sessionId/insights', authenticate, async (req, res) => {
    try {
        const session = await TrainingSession.findOne({ 
            _id: req.params.sessionId, 
            userId: req.user._id 
        });
        
        if (!session) {
            return res.status(404).json({ error: 'Session not found.' });
        }

        const insights = await generateTrainingContent(
            `Type: ${session.sessionType}, Participants: ${session.participants?.length || 0}, Points: ${session.points}.`,
            'summary'
        );

        res.status(200).json({ insights });
    } catch (error) {
        console.error('Error generating AI insights:', error.message);
        res.status(500).json({ error: 'Failed to generate AI insights.' });
    }
});

// Route: Mark a Session as Completed
router.post('/sessions/:sessionId/complete', authenticate, async (req, res) => {
    try {
        const session = await TrainingSession.findOneAndUpdate(
            { _id: req.params.sessionId, userId: req.user._id },
            {
                $set: {
                    status: 'completed',
                    completedAt: new Date(),
                },
            },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ error: 'Session not found.' });
        }

        await User.findByIdAndUpdate(req.user._id, {
            $inc: {
                progress: 1,
                leaderboardScore: session.points || 0,
            },
        });

        res.status(200).json(session);
    } catch (error) {
        console.error('Error completing session:', error.message);
        res.status(500).json({ error: 'Failed to complete session.' });
    }
});

// Route: Get Upcoming Sessions
router.get('/upcoming', authenticate, async (req, res) => {
    try {
        const sessions = await TrainingSession.find({
            userId: req.user._id,
            dateTime: { $gt: new Date() },
            status: 'scheduled',
        }).sort({ dateTime: 1 });
        res.status(200).json(sessions);
    } catch (error) {
        console.error('Error fetching upcoming sessions:', error.message);
        res.status(500).json({ error: 'Failed to fetch upcoming sessions.' });
    }
});

// Route: Get Module Recommendations
router.get('/recommendations', authenticate, async (req, res) => {
    try {
        const completedSessions = await TrainingSession.find({
            userId: req.user._id,
            status: 'completed'
        }).distinct('module');

        const availableModules = await Module.find({
            _id: { $nin: completedSessions }
        }).limit(5);

        const recommendations = await Promise.all(
            availableModules.map(async module => {
                const content = await generateTrainingContent(
                    module.name,
                    req.user.skillLevel || 'beginner'
                );
                return {
                    module,
                    recommendation: content
                };
            })
        );

        res.status(200).json({
            success: true,
            recommendations
        });
    } catch (error) {
        console.error('Error getting recommendations:', error.message);
        res.status(500).json({ error: 'Failed to get recommendations.' });
    }
});

module.exports = router;