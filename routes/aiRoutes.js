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

// =======================
// FSD Guidance Endpoint
// =======================
router.post('/fsd/guidance', authenticate, async (req, res) => {
    try {
        const { activityType, currentModule, progress } = req.body;

        const guidance = await aiGuidance.processRealTimeAction(
            req.user._id,
            {
                type: activityType,
                module: currentModule,
                progress,
            }
        );

        res.json({
            success: true,
            guidance,
        });
    } catch (error) {
        console.error('Real-time Guidance Error:', error.message);
        res.status(500).json({
            error: 'Failed to generate real-time guidance',
            message: error.message,
        });
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
            progress: certificationProgress,
            recommendedNextSteps,
        });
    } catch (error) {
        console.error('Certification Progress Error:', error.message);
        res.status(500).json({
            error: 'Failed to retrieve certification progress',
            message: error.message,
        });
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
            currentRanking: leaderboardData,
            strategicInsights: insights,
            recommendedActions,
        });
    } catch (error) {
        console.error('Leaderboard Insights Error:', error.message);
        res.status(500).json({
            error: 'Failed to generate leaderboard insights',
            message: error.message,
        });
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
            currentAchievements: user.achievements,
            progressAnalysis: achievementAnalysis,
            suggestedAchievements,
        });
    } catch (error) {
        console.error('Achievement Recommendations Error:', error.message);
        res.status(500).json({
            error: 'Failed to generate achievement recommendations',
            message: error.message,
        });
    }
});

// =======================
// Generate Training Content
// =======================
router.post('/generate-content', authenticate, validateModuleLevel, async (req, res) => {
    const { module, level } = req.body;

    try {
        console.log(`Handling /generate-content for module: ${module}, level: ${level}`);
        const content = await AISpaceCoach.generateTrainingContent(module, level);
        res.json({ success: true, content });
    } catch (error) {
        console.error('Error in /generate-content:', error.message);
        res.status(500).json({
            error: 'Failed to generate training content',
            message: error.message,
        });
    }
});

// =======================
// Problem-Solving Scenarios
// =======================
router.post('/problem-solving', authenticate, validateModuleLevel, async (req, res) => {
    const { module } = req.body;

    try {
        console.log(`Handling /problem-solving for module: ${module}`);
        const scenario = await AISpaceCoach.provideProblemSolvingScenario(module);
        res.json({ success: true, scenario });
    } catch (error) {
        console.error('Error in /problem-solving:', error.message);
        res.status(500).json({
            error: 'Failed to generate problem-solving scenario',
            message: error.message,
        });
    }
});

module.exports = router;
