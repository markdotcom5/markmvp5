// Load environment variables
require('dotenv').config();
const jwt = require('jsonwebtoken');
const WebSocket = require('ws');
const mongoose = require('mongoose');

// Middleware: Authenticate HTTP Requests
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        console.log('Auth header received:', authHeader); // Debug log

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('Invalid auth header format');
            return res.status(401).json({ error: 'Authentication token must be Bearer token' });
        }

        const token = authHeader.replace('Bearer ', '').trim();
        console.log('Token extracted:', token); // Debug log

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded:', decoded); // Debug log

        req.user = { 
            _id: decoded._id || decoded.userId, // Handle both formats
            role: decoded.role || 'user'
        };
        
        console.log('User set in request:', req.user); // Debug log
        next();
    } catch (error) {
        console.error('Authentication error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

// Middleware: Check User Role
const requireRole = (roles = []) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({
            error: 'Access denied',
            message: `This resource requires one of the following roles: ${roles.join(', ')}`,
        });
    }
    next();
};

// WebSocket Authentication Function
const authenticateWebSocket = (request) => {
    try {
        const extractToken = (request) => {
            const url = new URL(request.url, `http://${request.headers.host}`);
            return url.searchParams.get('token') || request.headers['authorization']?.split(' ')[1];
        };

        const token = extractToken(request);
        if (!token) {
            console.warn('WebSocket authentication failed: No token provided.');
            return null;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
        console.log('WebSocket authenticated successfully for user:', decoded._id);
        return { userId: decoded._id, role: decoded.role || 'user' };
    } catch (error) {
        console.error('WebSocket authentication error:', error.message);
        return null;
    }
};

// WebSocket Server Setup
const setupWebSocketServer = (server) => {
    const wss = new WebSocket.Server({ noServer: true });
    const clients = new Map(); // Map userId to WebSocket instance

    const heartbeat = (ws) => {
        ws.isAlive = true;
    };

    wss.on('connection', (ws, req) => {
        const { userId } = req;
        clients.set(userId, ws);

        ws.isAlive = true;
        ws.on('pong', () => heartbeat(ws));

        ws.on('message', (message) => {
            console.log(`Message from ${userId}: ${message}`);
        });

        ws.on('close', () => {
            clients.delete(userId);
            console.log(`Connection closed for user ${userId}`);
        });

        ws.on('error', (error) => {
            console.error(`WebSocket error for user ${userId}:`, error);
        });
    });

    setInterval(() => {
        wss.clients.forEach((ws) => {
            if (!ws.isAlive) {
                console.warn('Terminating dead WebSocket connection.');
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000); // Check every 30 seconds

    server.on('upgrade', (request, socket, head) => {
        const authData = authenticateWebSocket(request);
        if (!authData) {
            socket.destroy();
            return;
        }

        request.userId = authData.userId;
        request.userRole = authData.role;

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
            enum: [
                'Physical',
                'Mental',
                'Psychological',
                'Spiritual',
                'Technical',
                'Social',
                'Exploration',
                'Creative',
            ],
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
    { timestamps: true }
);

// Schema Methods
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
    } catch (error) {
        console.error('Error generating AI content:', error);
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
