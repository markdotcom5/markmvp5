const express = require('express');
const router = express.Router();
const AIGuidanceSystem = require('../services/AIGuidanceSystem');
const AISpaceCoach = require('../services/AISpaceCoach');
const aiGuidance = require('../services/aiGuidance');
const aiAssistant = require('../services/aiAssistant');
const { authenticate, validateModuleLevel } = require('../middleware/authenticate');
const User = require('../models/User');
const Certification = require('../models/Certification');
const Leaderboard = require('../models/Leaderboard');
const Joi = require('joi');

// Centralized error handler
function handleError(res, error, message = 'An error occurred') {
    console.error(`${message}:`, error.message);
    res.status(500).json({
        error: message,
        message: error.message,
    });
}

// =======================
// FSD Guidance Endpoint
// =======================
const guidanceSchema = Joi.object({
    activityType: Joi.string().required(),
    currentModule: Joi.string().required(),
    progress: Joi.number().min(0).max(100).required(),
});

router.post('/fsd/guidance', authenticate, async (req, res) => {
    const { error } = guidanceSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        const guidance = await aiGuidance.processRealTimeAction(req.user._id, req.body);
        res.json({
            success: true,
            data: guidance,
        });
    } catch (err) {
        handleError(res, err, 'Failed to generate real-time guidance');
    }
});

// =======================
// Certification Progress Tracking
// =======================
router.get('/certification-progress', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('certifications');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const certificationProgress = await aiAssistant.analyzeCertificationProgress(user.certifications);
        const recommendedNextSteps = await aiAssistant.recommendCertificationPath(user.certifications);

        res.json({
            success: true,
            data: {
                progress: certificationProgress,
                recommendedNextSteps,
            },
        });
    } catch (err) {
        handleError(res, err, 'Failed to retrieve certification progress');
    }
});

// =======================
// Leaderboard Optimization
// =======================
router.get('/leaderboard-insights', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const leaderboardData = await Leaderboard.findOne({ userId: req.user._id });
        if (!leaderboardData) {
            return res.status(404).json({ error: 'Leaderboard data not found' });
        }

        const insights = await aiAssistant.generateLeaderboardStrategy(user, leaderboardData);
        const recommendedActions = await aiAssistant.recommendLeaderboardImprovement(user, leaderboardData);

        res.json({
            success: true,
            data: {
                currentRanking: leaderboardData,
                strategicInsights: insights,
                recommendedActions,
            },
        });
    } catch (err) {
        handleError(res, err, 'Failed to generate leaderboard insights');
    }
});

// =======================
// Achievement System Recommendations
// =======================
router.get('/achievement-recommendations', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('achievements');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const achievementAnalysis = await aiAssistant.analyzeAchievementProgress(user.achievements);
        const suggestedAchievements = await aiAssistant.recommendNextAchievements(user);

        res.json({
            success: true,
            data: {
                currentAchievements: user.achievements,
                progressAnalysis: achievementAnalysis,
                suggestedAchievements,
            },
        });
    } catch (err) {
        handleError(res, err, 'Failed to generate achievement recommendations');
    }
});

// =======================
// Generate Training Content
// =======================
const contentSchema = Joi.object({
    module: Joi.string().required(),
    level: Joi.number().min(1).required(),
});

router.post('/generate-content', authenticate, validateModuleLevel, async (req, res) => {
    const { error } = contentSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        const content = await AISpaceCoach.generateTrainingContent(req.body.module, req.body.level);
        res.json({ success: true, data: content });
    } catch (err) {
        handleError(res, err, 'Failed to generate training content');
    }
});

// =======================
// Problem-Solving Scenarios
// =======================
router.post('/problem-solving', authenticate, validateModuleLevel, async (req, res) => {
    const { module } = req.body;

    try {
        const scenario = await AISpaceCoach.provideProblemSolvingScenario(module);
        res.json({ success: true, data: scenario });
    } catch (err) {
        handleError(res, err, 'Failed to generate problem-solving scenario');
    }
});

module.exports = router;
