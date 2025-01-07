const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import User model
const router = express.Router();

// =======================
// Authenticate Middleware
// =======================
const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        req.user = user; // Attach the user object to the request
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            console.error('Token Expired:', error.message);
            return res.status(401).json({
                error: 'Token expired',
                message: 'Your session has expired. Please log in again.',
            });
        }
        console.error('Authentication failed:', error.message);
        res.status(401).json({ error: 'Authentication failed' });
    }
};

// =======================
// Login Route
// =======================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Looking for user with email:', email);
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({
            message: 'Login successful',
            token,
            user: { id: user._id, email: user.email, name: user.name },
        });
    } catch (error) {
        console.error('Login Error:', error.message);
        res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
    }
});

// =======================
// Logout Route
// =======================
router.post('/logout', (req, res) => {
    res.status(200).json({ message: 'Logout successful' }); // Placeholder for client-side logout
});

// =======================
// Password Reset Route
// =======================
router.post('/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Password Reset Error:', error.message);
        res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
    }
});

// =======================
// Admin Creation Route
// =======================
router.post('/create-admin', async (req, res) => {
    try {
        const { adminSecret } = req.body;

        if (adminSecret !== process.env.ADMIN_SECRET) {
            return res.status(403).json({ error: 'Invalid admin secret' });
        }

        const existingAdmin = await User.findOne({ email: 'admin@steltrek.com' });
        if (existingAdmin) {
            return res.status(400).json({
                error: 'Admin already exists',
                message: 'Use the login route with this email to get an auth token',
            });
        }

        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
        const adminUser = new User({
            email: 'admin@steltrek.com',
            password: hashedPassword,
            roles: ['admin', 'user'],
            settings: {
                language: 'en',
                theme: 'light',
                notifications: {
                    email: true,
                    push: true,
                    aiSuggestions: true,
                },
            },
            aiGuidance: {
                mode: 'manual',
                activatedAt: new Date(),
                personalizedSettings: {
                    learningStyle: null,
                    pacePreference: 'balanced',
                    focusAreas: [],
                    adaptiveUI: true,
                },
            },
        });

        await adminUser.save();

        const token = jwt.sign({ userId: adminUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            message: 'Admin created successfully',
            token,
            credentials: {
                email: 'admin@steltrek.com',
                password: process.env.ADMIN_PASSWORD, // For development; replace or mask in production
            },
        });
    } catch (error) {
        console.error('Admin Creation Error:', error.message);
        res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
    }
});

module.exports = router;
