require('dotenv').config(); // Load environment variables
const jwt = require('jsonwebtoken');
const WebSocket = require('ws');
const mongoose = require('mongoose'); // Mongoose for schema creation

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
            return null;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
        return decoded._id;
    } catch {
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

        // Handle incoming messages from the client
        ws.on('message', (message) => {
            // Optionally process messages from the client
        });

        ws.on('close', () => {
            clients.delete(userId);
        });

        ws.on('error', () => {
            // Optionally handle WebSocket errors
        });
    });

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

    const broadcastMessage = (userIds, message) => {
        userIds.forEach((userId) => {
            const client = clients.get(userId);
            if (client && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    };

    return { wss, broadcastMessage };
};

// Training Module Schema
const moduleSchema = new mongoose.Schema(
    {
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
    },
    {
        timestamps: true,
    }
);

// Methods
moduleSchema.methods.getSummary = function () {
    return `${this.name} (${this.category}) - ${this.description}`;
};

moduleSchema.methods.generateAIContent = async function (prompt) {
    try {
        const response = await openai.chat.completions.create({
            model: 'text-davinci-003',
            messages: [{ role: 'user', content: `Generate a detailed explanation for the module: ${prompt}` }],
        });
        return response.choices[0].message.content.trim();
    } catch {
        throw new Error('Failed to generate AI content');
    }
};

// Export Middleware and Functions
module.exports = {
    authenticate,
    requireRole,
    authenticateWebSocket,
    setupWebSocketServer,
};
