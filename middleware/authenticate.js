const jwt = require('jsonwebtoken');
const User = require('../models/User');

// =======================
// Authentication Middleware
// =======================
const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '').trim();
        if (!token) {
            return res.status(401).json({
                error: 'Authentication token is required.',
                message: 'Please provide a valid token to access this resource.',
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
        const user = await User.findById(decoded._id); // Assuming `_id` is in the payload
        if (!user) {
            return res.status(404).json({
                error: 'User not found.',
                message: 'No user associated with this token exists.',
            });
        }

        req.user = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role || 'user', // Default role: 'user'
        };

        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired',
                message: 'Your session has expired. Please log in again.',
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Invalid authentication token.',
                message: 'The provided token is invalid or malformed.',
            });
        }

        res.status(500).json({
            error: 'Internal server error',
            message: 'An unexpected error occurred during authentication.',
        });
    }
};

// =======================
// Role-Based Authorization Middleware
// =======================
const requireRole = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'Please log in to access this resource.',
            });
        }

        if (roles.length && !roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: `Access denied. This resource requires one of the following roles: ${roles.join(', ')}.`,
            });
        }

        next(); // Proceed to the next middleware or route handler
    };
};

// =======================
// Module and Level Validation Middleware
// =======================
const VALID_MODULES = [
    'physical',
    'technical',
    'mental',
    'spiritual',
    'social',
    'simulation',
    'creative',
];
const VALID_LEVELS = ['beginner', 'intermediate', 'advanced'];

const validateModuleLevel = (req, res, next) => {
    const { module, level } = req.body;

    if (!module || !VALID_MODULES.includes(module.toLowerCase())) {
        return res.status(400).json({
            error: 'Invalid module.',
            message: `Valid modules are: ${VALID_MODULES.join(', ')}.`,
        });
    }

    if (!level || !VALID_LEVELS.includes(level.toLowerCase())) {
        return res.status(400).json({
            error: 'Invalid level.',
            message: `Valid levels are: ${VALID_LEVELS.join(', ')}.`,
        });
    }

    next(); // Proceed to the next middleware or route handler
};

// =======================
// Export All Middlewares
// =======================
module.exports = {
    authenticate,
    requireRole,
    validateModuleLevel,
};
