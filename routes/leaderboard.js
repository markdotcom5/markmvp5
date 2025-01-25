const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticate } = require('../middleware/auth');
const Leaderboard = require('../models/Leaderboard');
const User = require('../models/User');

// State Rankings
router.get('/state/:stateCode', authenticate, async (req, res) => {
    try {
        const { stateCode } = req.params;
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 10), 50);

        // Validate state code
        if (!stateCode || stateCode.length !== 2) {
            return res.status(400).json({ error: 'Invalid or missing state code. It must be a two-character code.' });
        }

        // Fetch state rankings
        const stateRankings = await Leaderboard.find({ 
            state: stateCode.toUpperCase(),
            category: 'state',
        })
        .sort({ score: -1 })
        .populate('userId', 'username avatar level')
        .skip((page - 1) * limit)
        .limit(limit);

        // Total count for pagination
        const totalCount = await Leaderboard.countDocuments({ 
            state: stateCode.toUpperCase(), 
            category: 'state' 
        });

        res.json({
            rankings: stateRankings,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalEntries: totalCount,
                entriesPerPage: limit,
            },
        });
    } catch (error) {
        console.error(`Error fetching state leaderboard for ${stateCode}:`, error.message);
        res.status(500).json({ error: 'Failed to fetch state leaderboard.' });
    }
});

// Local Rankings
router.get('/local', authenticate, async (req, res) => {
    try {
        const { latitude, longitude, radius = 50 } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({ error: 'Latitude and longitude are required for local rankings.' });
        }

        const parsedLatitude = parseFloat(latitude);
        const parsedLongitude = parseFloat(longitude);

        if (isNaN(parsedLatitude) || isNaN(parsedLongitude)) {
            return res.status(400).json({ error: 'Invalid latitude or longitude format. Must be valid numbers.' });
        }

        // Find users within the specified radius
        const users = await User.find({
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [parsedLongitude, parsedLatitude] },
                    $maxDistance: radius * 1000, // Convert radius to meters
                },
            },
        }).select('_id');

        if (!users.length) {
            return res.json({ rankings: [], message: 'No users found within the specified radius.' });
        }

        const userIds = users.map(user => user._id);

        // Fetch leaderboard rankings for local users
        const rankings = await Leaderboard.find({
            userId: { $in: userIds },
            category: 'global',
        })
        .sort({ score: -1 })
        .populate('userId', 'username avatar level')
        .limit(100);

        res.json({ rankings });
    } catch (error) {
        console.error('Error fetching local rankings:', error.message);
        res.status(500).json({ error: 'Failed to fetch local rankings.' });
    }
});

// Global Rankings
router.get('/global', authenticate, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 10), 50);
        const filter = req.query.filter || 'global';
        const timeRange = req.query.timeRange || 'allTime';
        const search = req.query.search?.trim();

        // Base query
        let query = { category: filter };

        // Time range filtering
        if (timeRange !== 'allTime') {
            const ranges = { today: 1, thisWeek: 7, thisMonth: 30 };
            const days = ranges[timeRange] || 0;
            if (days) {
                query.lastUpdated = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
            }
        }

        // Search functionality
        if (search) {
            const userIds = await User.find({ username: { $regex: search, $options: 'i' } }).distinct('_id');
            query.userId = { $in: userIds };
        }

        // Fetch rankings and count documents
        const [rankings, totalCount] = await Promise.all([
            Leaderboard.aggregate([
                { $match: query },
                { $sort: { score: -1 } },
                { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
                { $unwind: '$user' },
                { $skip: (page - 1) * limit },
                { $limit: limit },
            ]),
            Leaderboard.countDocuments(query),
        ]);

        res.json({
            rankings,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalEntries: totalCount,
                entriesPerPage: limit,
            },
        });
    } catch (error) {
        console.error(`Error fetching global rankings:`, error.message);
        res.status(500).json({ error: 'Failed to fetch global rankings.' });
    }
});
// Quick Stats
router.get('/user-stats', async (req, res) => {
    try {
        const stats = {
            activeUsers: 120,
            totalCredits: 985432,
            totalAchievements: 230,
            averageLevel: 32
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching quick stats:', error.message);
        res.status(500).json({ error: 'Failed to fetch quick stats' });
    }
});

module.exports = router;
