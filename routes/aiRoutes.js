// routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const WebSocket = require('ws');
const ServiceIntegrator = require('../services/ServiceIntegrator');
const AIGuidanceSystem = require('../services/AIGuidanceSystem');
const AISpaceCoach = require('../services/AISpaceCoach');
const aiGuidance = require('../services/aiGuidance');
const aiAssistant = require('../services/aiAssistant');
const { authenticate, validateModuleLevel } = require('../middleware/authenticate');
const User = require('../models/User');
const Certification = require('../models/Certification');
const Leaderboard = require('../models/Leaderboard');
const Joi = require('joi');

// Initialize WebSocket server
const wss = new WebSocket.Server({ noServer: true });
const clients = new Map();

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
    const userId = req.userId;
    clients.set(userId, ws);

    ws.on('close', () => {
        clients.delete(userId);
        ServiceIntegrator.stopMonitoring(userId);
    });
});

// Listen for FSD state changes from ServiceIntegrator
ServiceIntegrator.on('modeChange', ({ userId, mode, state }) => {
    const ws = clients.get(userId);
    if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'MODE_CHANGE',
            mode,
            state
        }));
    }
});

ServiceIntegrator.on('guidanceUpdate', ({ userId, guidance, coaching, nextAction }) => {
    const ws = clients.get(userId);
    if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'GUIDANCE_UPDATE',
            guidance,
            coaching,
            nextAction
        }));
    }
});

ServiceIntegrator.on('actionUpdate', ({ userId, nextAction }) => {
    const ws = clients.get(userId);
    if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'ACTION_UPDATE',
            nextAction
        }));
    }
});

// Keep your existing error handler
function handleError(res, error, message = 'An error occurred') {
    console.error(`${message}:`, error.message);
    res.status(500).json({
        error: message,
        message: error.message,
    });
}

// =======================
// New FSD Mode Endpoints
// =======================

// Initialize FSD session
router.post('/fsd/init', authenticate, async (req, res) => {
    try {
        const session = await ServiceIntegrator.initializeSession(req.user._id);
        res.json({ success: true, session });
    } catch (err) {
        handleError(res, err, 'Failed to initialize FSD session');
    }
});

// Toggle FSD mode
router.post('/fsd/toggle', authenticate, async (req, res) => {
    try {
        const session = await ServiceIntegrator.toggleFSDMode(req.user._id);
        res.json({ success: true, session });
    } catch (err) {
        handleError(res, err, 'Failed to toggle FSD mode');
    }
});

// Get current FSD state
router.get('/fsd/state', authenticate, async (req, res) => {
    try {
        const session = await ServiceIntegrator.getState(req.user._id);
        res.json(session);
    } catch (err) {
        handleError(res, err, 'Failed to get FSD state');
    }
});

// Your existing FSD guidance endpoint - enhanced
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
        const result = await ServiceIntegrator.processUserAction(
            req.user._id, 
            req.body,
            { skillLevel: req.user.skillLevel }
        );
        res.json({
            success: true,
            data: result
        });
    } catch (err) {
        handleError(res, err, 'Failed to generate real-time guidance');
    }
});

// Keep all your existing routes
// =======================
// Certification Progress Tracking
// =======================
router.get('/certification-progress', authenticate, async (req, res) => {
    // Your existing implementation
});

// =======================
// Leaderboard Optimization
// =======================
router.get('/leaderboard-insights', authenticate, async (req, res) => {
    // Your existing implementation
});

// ... rest of your existing routes ...

// WebSocket upgrade handler - export this to be used in app.js
const upgradeConnection = (server) => {
    server.on('upgrade', (request, socket, head) => {
        // Add your authentication here
        const userId = authenticateWebSocket(request);
        if (!userId) {
            socket.destroy();
            return;
        }

        request.userId = userId;
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    });
};

module.exports = router; // Ensure this exports the router
