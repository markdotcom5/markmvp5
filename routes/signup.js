const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// User Signup endpoint
router.post('/join-now', async (req, res) => {
    console.log('Signup endpoint hit');
    try {
        const { name, email, password } = req.body;
        
        // Minimal validation
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                error: 'Name, email, and password are required to sign up.'
            });
        }

        // Check for existing user
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'This email is already registered. Ready to continue your journey to space?'
            });
        }

        // Create new user with AI guidance enabled by default
        const newUser = new User({
            name,
            email: email.toLowerCase(),
            password,
            aiGuidance: {
                mode: 'full_guidance',
                activatedAt: new Date(),
                personalizedSettings: {
                    pacePreference: 'balanced',
                    adaptiveUI: true
                },
                context: {
                    currentPhase: 'onboarding',
                    nextActions: ['complete_profile']
                }
            },
            settings: {
                notifications: {
                    aiSuggestions: true
                },
                aiPreferences: {
                    automationLevel: 'maximum',
                    interactionStyle: 'proactive',
                    dataCollection: 'comprehensive'
                }
            }
        });

        await newUser.save();

        // Generate JWT
const token = jwt.sign(
    {
        userId: newUser._id,
        email: newUser.email,
        aiGuidance: newUser.aiGuidance.mode
    },
    process.env.JWT_SECRET || 'default_secret_key',
    { expiresIn: '7d' }
);

res.status(201).json({
    success: true,
    message: 'Welcome aboard! Your AI guide is ready to start your journey to space.',
    data: {
        user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            aiGuidanceMode: newUser.aiGuidance.mode
        },
        token
    }
});

    } catch (error) {
        console.error('Signup Error Details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(500).json({
            success: false,
            error: 'Houston, we have a problem. Please try again.'
        });
    }
});  // Close the router.post function

module.exports = router;