const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate'); // Middleware for authentication
const User = require('../models/User'); // Import User model for database queries

// GET /api/dashboard (Protected)
router.get('/', authenticate, async (req, res) => {
    try {
        console.log('Authenticated User:', req.user); // Log the authenticated user data

        // Fetch additional user data from the database (if needed)
        const user = await User.findById(req.user._id).select('-password'); // Exclude password field
        if (!user) {
            return res.status(404).json({
                error: 'User not found.',
                message: 'The authenticated user does not exist in the database.',
            });
        }

        // Respond with dashboard data
        res.status(200).json({
            message: 'Welcome to the dashboard!',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role || 'user', // Default role
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error.message);

        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An unexpected error occurred while fetching dashboard data.',
        });
    }
});

module.exports = router;
