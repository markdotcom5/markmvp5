const express = require('express');
const { authenticate, requireRole, validateModuleLevel } = require('../middleware/authenticate');

const router = express.Router();

// Test authentication middleware
router.get('/test-auth', authenticate, (req, res) => {
    res.json({
        success: true,
        message: 'Authentication successful!',
        user: req.user,
    });
});

// Test role-based authorization middleware
router.get('/test-role', authenticate, requireRole(['admin']), (req, res) => {
    res.json({
        success: true,
        message: 'Role-based authorization successful!',
        user: req.user,
    });
});

// Test module and level validation middleware
router.post('/test-validate', authenticate, validateModuleLevel, (req, res) => {
    res.json({
        success: true,
        message: 'Module and level validated successfully!',
    });
});

module.exports = router;
