const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticate } = require('../middleware/authenticate');
const TrainingSession = require('../models/TrainingSession');
const WebSocket = require('ws');

const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', async (ws, req) => {
    // Send initial stats on connection
    try {
        const stats = await getStats(req.user._id);
        ws.send(JSON.stringify({ type: 'stats', stats }));
    } catch (error) {
        console.error('WebSocket initial stats error:', error);
    }

    // Listen for progress updates from database and send to client
    TrainingSession.watch().on('change', async (change) => {
        try {
            if (change.operationType === 'update' || change.operationType === 'insert') {
                const stats = await getStats(req.user._id);
                ws.send(JSON.stringify({ type: 'stats', stats }));
            }
        } catch (error) {
            console.error('WebSocket change stream error:', error);
        }
    });
});

async function getStats(userId) {
    const stats = await TrainingSession.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                totalPoints: { $sum: "$points" },
                avgScore: { $avg: "$metrics.overallScore" },
                activeSessions: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", "in-progress"] },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]);

    return {
        points: stats[0]?.totalPoints || 0,
        successRate: stats[0]?.avgScore || 0,
        activeMissions: stats[0]?.activeSessions || 0
    };
}

router.get("/stats", authenticate, async (req, res) => {
    try {
        const stats = await getStats(req.user._id);
        res.json(stats);
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});
router.get("/mission", authenticate, async (req, res) => {
    try {
        const mission = await TrainingSession.findOne({ 
            userId: req.user._id,
            status: 'in-progress'
        }).sort('-dateTime');
        
        if (!mission) {
            return res.status(404).json({ message: "No active mission found" });
        }
        
        res.json(mission);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get("/charts", authenticate, async (req, res) => {
    try {
        const progressData = await TrainingSession.find({
            userId: req.user._id,
            status: { $in: ['in-progress', 'completed'] }
        })
        .sort('-dateTime')
        .limit(10)
        .select('progress metrics sessionType completedTasks dateTime');

        const chartData = {
            progress: {
                labels: progressData.map(p => new Date(p.dateTime).toLocaleDateString()),
                data: progressData.map(p => p.progress)
            },
            achievements: {
                labels: progressData.map(p => p.sessionType),
                data: progressData.map(p => p.metrics.overallScore)
            }
        };

        res.json(chartData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// routes/dashboard.js
router.post("/mission", authenticate, async (req, res) => {
    try {
        const mission = new TrainingSession({
            userId: req.user._id,
            sessionType: req.body.type,
            moduleId: `MISSION-${Date.now()}`,
            status: req.body.status,
            points: 0,
            metrics: {
                overallScore: 0
            }
        });
        
        await mission.save();
        res.json(mission);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.patch("/mission/:id", authenticate, async (req, res) => {
    try {
        const mission = await TrainingSession.findByIdAndUpdate(
            req.params.id,
            { 
                $set: {
                    progress: req.body.progress,
                    'metrics.overallScore': req.body.metrics.overallScore,
                    lastUpdated: new Date()
                }
            },
            { new: true }
        );
        
        if (!mission) {
            return res.status(404).json({ error: "Mission not found" });
        }
        
        res.json(mission);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
module.exports = { router, wss };