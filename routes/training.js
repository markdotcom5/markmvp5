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

// Debugging Logs
console.log('authenticate middleware:', typeof authenticate);
console.log('sessionLimiter:', typeof sessionLimiter);
console.log('TrainingSession Model:', TrainingSession);
console.log('validateSessionInput middleware:', typeof validateSessionInput);

// Protected Route: Create a Training Session
router.post('/sessions', authenticate, async (req, res) => {
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

module.exports = router;
