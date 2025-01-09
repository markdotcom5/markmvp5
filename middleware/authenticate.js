require('dotenv').config(); // Load environment variables
const jwt = require('jsonwebtoken');
const WebSocket = require('ws');
const mongoose = require('mongoose');

// Middleware: Authenticate Requests
const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '').trim();
        if (!token) {
            return res.status(401).json({ error: 'Authentication token is required.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
        req.user = { _id: decoded._id }; // Adjust this to match your JWT payload structure
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token has expired.' });
        }
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

// Middleware: Check User Role
const requireRole = (roles = []) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Access denied',
                message: `This resource requires one of the following roles: ${roles.join(', ')}`,
            });
        }
        next();
    };
};

// WebSocket Authentication
const authenticateWebSocket = (request) => {
    try {
        const extractToken = (request) => {
            const url = new URL(request.url, `http://${request.headers.host}`);
            return url.searchParams.get('token') || request.headers['authorization']?.split(' ')[1];
        };

        const token = extractToken(request);

        if (!token) {
            console.error('No token provided');
            return null;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
        return decoded._id;
    } catch (error) {
        console.error('WebSocket Authentication Error:', error.message);
        return null;
    }
};

// WebSocket Server Setup
const setupWebSocketServer = (server) => {
    const wss = new WebSocket.Server({ noServer: true });
    const clients = new Map();

    wss.on('connection', (ws, req) => {
        const userId = req.userId;
        clients.set(userId, ws);

        console.log(`User ${userId} connected via WebSocket.`);

        ws.on('message', (message) => {
            console.log(`Message from user ${userId}:`, message);
        });

        ws.on('close', () => {
            clients.delete(userId);
            console.log(`WebSocket connection closed for user ${userId}`);
        });

        ws.on('error', (error) => {
            console.error(`WebSocket error for user ${userId}:`, error.message);
        });
    });

    server.on('upgrade', (request, socket, head) => {
        const userId = authenticateWebSocket(request);

        if (!userId) {
            console.error('WebSocket upgrade failed: Authentication failed.');
            socket.destroy();
            return;
        }

        request.userId = userId;

        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    });

    const broadcastMessage = (userIds, message) => {
        userIds.forEach((userId) => {
            const client = clients.get(userId);
            if (client && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            } else {
                console.warn(`WebSocket client for user ${userId} is not open.`);
            }
        });
    };

    return { wss, broadcastMessage };
};
// Training Module Schema
const moduleSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    category: {
        type: String,
        required: true,
        enum: ['Physical', 'Mental', 'Psychological', 'Spiritual', 'Technical', 'Social', 'Exploration', 'Creative'],
    },
    type: { type: String, enum: ['Training', 'Simulation', 'Assessment'], required: true },
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], required: true },
    prerequisites: { type: [String], default: [] },
    description: { type: String, required: true, trim: true },
    structuredContent: { type: String, default: '' },
    aiGuidance: { type: String, default: '' },
    metrics: { type: Object, default: {} },
    groupFeatures: { type: Object, default: {} },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    points: { type: Number, default: 0 },
    videoLinks: { type: [String], default: [] },
    userLinks: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, {
    timestamps: true,
});

// Methods
moduleSchema.methods.getSummary = function () {
    return `${this.name} (${this.category}) - ${this.description}`;
};

moduleSchema.methods.generateAIContent = async function (prompt) {
    try {
        const response = await openai.chat.completions.create({
            model: "text-davinci-003",
            messages: [{ role: 'user', content: `Generate a detailed explanation for the module: ${prompt}` }],
        });
        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error("Error generating AI content:", error.message);
        throw new Error("Failed to generate AI content");
    }
};

moduleSchema.methods.calculateRecommendedPath = function () {
    return `Based on difficulty: ${this.difficulty}, recommended next steps for ${this.name}.`;
};

moduleSchema.methods.updateGroupFeatures = function (newFeatures) {
    this.groupFeatures = { ...this.groupFeatures, ...newFeatures };
    return this.groupFeatures;
};

moduleSchema.methods.trackCompletion = function (userId) {
    return `User ${userId} has completed module: ${this.name}`;
};

moduleSchema.statics.findByCategory = async function (category) {
    return this.find({ category });
};

moduleSchema.methods.getDetailedMetrics = function () {
    return {
        progress: this.progress,
        points: this.points,
        metrics: this.metrics,
    };
};
// Export Middleware and Functions
module.exports = {
    authenticate,
    requireRole,
    authenticateWebSocket,
    setupWebSocketServer,
};