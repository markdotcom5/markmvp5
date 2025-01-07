const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User'); // Correct model import
const RankingService = require('../services/rankingService'); // Import ranking service

// Authentication middleware
const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: 'Authentication required' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) throw new Error();

        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication failed:', error.message);
        res.status(401).json({ error: 'Authentication failed' });
    }
};

// Global Rankings with Pagination
router.get('/global', authenticate, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1); // Default to page 1
        const limit = Math.max(1, parseInt(req.query.limit) || 10); // Default to 10 items per page
        const rankings = await RankingService.getRankings('global', { page, limit });
        const totalUsers = await User.countDocuments();

        res.json({
            rankings,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalUsers / limit),
                totalUsers,
            },
        });
    } catch (error) {
        console.error('Error fetching global leaderboard:', error.message);
        res.status(500).json({ error: 'Failed to fetch global leaderboard' });
    }
});

// Local Rankings
router.get('/local', authenticate, async (req, res) => {
    try {
        const { latitude, longitude, radius = 50 } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({ error: 'Location coordinates required' });
        }

        const localRankings = await RankingService.calculateLocalRanking(req.user, parseFloat(radius), {
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
        });

        res.json(localRankings);
    } catch (error) {
        console.error('Error fetching local leaderboard:', error.message);
        res.status(500).json({ error: 'Failed to fetch local leaderboard' });
    }
});

// State Rankings
router.get('/state/:stateCode', authenticate, async (req, res) => {
    try {
        const { stateCode } = req.params;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 10);

        const stateRankings = await RankingService.getRankings('state', {
            page,
            limit,
            state: stateCode.toUpperCase(),
        });

        res.json({ rankings: stateRankings });
    } catch (error) {
        console.error('Error fetching state leaderboard:', error.message);
        res.status(500).json({ error: 'Failed to fetch state leaderboard' });
    }
});

// User Stats
router.get('/user-stats', authenticate, async (req, res) => {
    try {
        const [globalRank, stateRank, localRank] = await Promise.all([
            RankingService.calculateGlobalRanking(req.user),
            RankingService.calculateStateRanking(req.user),
            RankingService.calculateLocalRanking(req.user),
        ]);

        res.json({ globalRank, stateRank, localRank });
    } catch (error) {
        console.error('Error fetching user stats:', error.message);
        res.status(500).json({ error: 'Failed to fetch user stats' });
    }
});

module.exports = router;
