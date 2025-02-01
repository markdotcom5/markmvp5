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
// 🔹 Signup Route (MongoDB)
router.post("/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        user = new User({
            username,
            email,
            password: hashedPassword
        });

        await user.save();

        // Generate JWT Token
        const payload = { userId: user.id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.json({ success: true, token, user });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
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
router.post('/signup', async (req, res) => {
    try {
        const { email, password, username, spaceReadinessScore, division } = req.body;
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const newUser = new User({
            email,
            password: hashedPassword,
            username,
            spaceReadinessScore,
            division
        });

        await newUser.save();
        
        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ message: 'User created', token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// =======================
// Password Reset Route
// =======================
router.post('/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        console.log('Reset attempt for email:', email); // Debug log

        const user = await User.findOne({ email });
        console.log('User found:', !!user); // Debug log

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        console.log('Password hashed successfully'); // Debug log

        // Use findOneAndUpdate instead of save()
        await User.findOneAndUpdate(
            { email },
            { password: hashedPassword },
            { validateBeforeSave: false }
        );

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Detailed Reset Error:', error); // More detailed error
        res.status(500).json({ 
            error: 'Password reset failed',
            details: error.message  // Adding error details
        });
    }
});


router.post('/join', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            status: 'pending',
            spaceReadinessScore: 0,
            division: 'Cadet'
        });

        await newUser.save();
        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        res.status(201).json({ 
            message: 'Welcome aboard!', 
            token,
            user: { 
                id: newUser._id, 
                username: newUser.username 
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
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

// Test endpoints in your Express routes
router.post('/api/test/progress', (req, res) => {
    const { progress } = req.body;
    wss.clients.forEach(client => {
        client.send(JSON.stringify({
            type: 'progress_update',
            progress
        }));
    });
    res.json({ success: true });
});

router.post('/api/test/achievement', (req, res) => {
    const { achievement } = req.body;
    wss.clients.forEach(client => {
        client.send(JSON.stringify({
            type: 'achievement_unlocked',
            achievement
        }));
    });
    res.json({ success: true });
});

module.exports = router;
