const express = require('express');
const { authenticate } = require('../middleware/authenticate'); // Correct import
const User = require('../models/User'); // Import User model
const Achievement = require('../models/Achievement'); // Import Achievement model
const mongoose = require('mongoose');
const router = express.Router();

// Debugging Log: Check the type of authenticate middleware
console.log('Authenticate Middleware Type:', typeof authenticate); // Should log "function"

// Validate `userId` Parameter
router.param('userId', (req, res, next, id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid userId format' });
    }
    next();
});

// Route: Get All Achievements for Authenticated User
router.get('/user-achievements', authenticate, async (req, res) => {
    try {
        const achievements = await Achievement.find({ userId: req.user._id });
        res.status(200).json({
            message: 'Achievements retrieved successfully.',
            achievements,
        });
    } catch (error) {
        console.error('Error fetching achievements:', error.message);
        res.status(500).json({ error: 'Failed to fetch achievements.' });
    }
});

// Route: Get Achievements and Stats by userId
router.get('/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;

        // Fetch achievements for the given userId
        const achievements = await Achievement.find({ userId });
        if (!achievements.length) {
            return res.status(404).json({ error: 'No achievements found for this user.' });
        }

        res.status(200).json({
            message: `Achievements for user ${userId} retrieved successfully.`,
            achievements,
        });
    } catch (error) {
        console.error('Error fetching achievements by userId:', error.message);
        res.status(500).json({ error: 'Failed to fetch achievements by userId.' });
    }
});

module.exports = router;
