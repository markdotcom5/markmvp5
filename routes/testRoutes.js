const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/authenticate');

// Test route for role-based access
router.get('/test-role', authenticate, requireRole(['admin']), (req, res) => {
    res.status(200).json({ message: 'Welcome, admin!' });
});

module.exports = router;
