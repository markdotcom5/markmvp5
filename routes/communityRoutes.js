// routes/communityRoutes.js
const express = require('express');
const router = express.Router();
const WebSocket = require('ws');
const { authenticate } = require('../middleware/authenticate');
const CommunityHub = require('../services/CommunityHub');
const Joi = require('joi');

// WebSocket setup
const wss = new WebSocket.Server({ noServer: true });
const clients = new Map();

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
    const userId = req.userId;
    clients.set(userId, ws);

    ws.on('close', () => {
        clients.delete(userId);
    });
});

// Listen for Community Hub events
CommunityHub.on('groupCreated', ({ groupId, group }) => {
    notifyGroupMembers(group.members, {
        type: 'GROUP_CREATED',
        group
    });
});

CommunityHub.on('sessionStarted', ({ sessionId, session }) => {
    notifySessionParticipants(session.participants, {
        type: 'SESSION_STARTED',
        session
    });
});

// Helper function to notify users
function notifyUsers(userIds, data) {
    userIds.forEach(userId => {
        const ws = clients.get(userId.toString());
        if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    });
}

// Validation Schemas
const studyGroupSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string(),
    type: Joi.string().valid('training', 'certification', 'mission', 'general').required(),
    capacity: Joi.number().min(2).max(50)
});

const sessionSchema = Joi.object({
    type: Joi.string().valid('study', 'practice', 'assessment', 'mission').required(),
    module: Joi.string().required(),
    scheduledStart: Joi.date().required()
});

// Study Group Routes
router.post('/groups', authenticate, async (req, res) => {
    try {
        const { error } = studyGroupSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const group = await CommunityHub.createStudyGroup(req.user._id, req.body);
        res.json({ success: true, group });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/groups/:groupId', authenticate, async (req, res) => {
    try {
        const group = await StudyGroup.findById(req.params.groupId)
            .populate('members.user', 'name avatar level');
        if (!group) return res.status(404).json({ error: 'Group not found' });
        res.json(group);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Training Session Routes
router.post('/sessions', authenticate, async (req, res) => {
    try {
        const { error } = sessionSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const session = await CommunityHub.startTrainingSession(req.body.groupId, req.body);
        res.json({ success: true, session });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Challenge Routes
router.post('/challenges', authenticate, async (req, res) => {
    try {
        const challenge = await CommunityHub.createChallenge(req.user._id, req.body);
        res.json({ success: true, challenge });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Peer Matching Routes
router.get('/peers/matches', authenticate, async (req, res) => {
    try {
        const matches = await CommunityHub.findPeerMatches(req.user._id);
        res.json({ success: true, matches });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Discussion Routes
router.post('/discussions', authenticate, async (req, res) => {
    try {
        const discussion = await CommunityHub.createDiscussion(req.user._id, req.body);
        res.json({ success: true, discussion });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Progress Routes
router.post('/groups/:groupId/progress', authenticate, async (req, res) => {
    try {
        const group = await CommunityHub.updateGroupProgress(req.params.groupId, req.body);
        res.json({ success: true, group });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// WebSocket upgrade handler
const upgradeConnection = (server) => {
    server.on('upgrade', (request, socket, head) => {
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

module.exports = { router, upgradeConnection };