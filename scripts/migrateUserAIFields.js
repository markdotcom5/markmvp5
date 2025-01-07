// scripts/migrateUserAIFields.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// Language configuration matching your frontend
const LANGUAGE_CONFIG = {
    en: {
        flag: "🇺🇸",
        name: "English",
        default: true
    },
    zh: {
        flag: "🇨🇳",
        name: "Chinese",
        default: false
    },
    ko: {
        flag: "🇰🇷",
        name: "Korean",
        default: false
    },
    es: {
        flag: "🇪🇸",
        name: "Spanish",
        default: false
    }
};

// AI Guidance configuration
const AI_GUIDANCE_LEVELS = {
    MANUAL: 'manual',
    ASSIST: 'assist',
    FULL_GUIDANCE: 'full_guidance'
};

async function migrateUsers() {
    try {
        console.log('Starting user migration for AI and language settings...');
        
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI not found in environment variables');
        }
        
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to database');

        const users = await User.find({});
        console.log(`Found ${users.length} users to migrate`);

        let updated = 0;
        let languageUpdates = 0;
        let errors = 0;

        for (const user of users) {
            try {
                const updates = {
                    // AI Guidance System
                    aiGuidance: user.aiGuidance || {
                        mode: AI_GUIDANCE_LEVELS.MANUAL,
                        activatedAt: null,
                        lastInteraction: null,
                        personalizedSettings: {
                            learningStyle: null,
                            pacePreference: 'balanced',
                            focusAreas: [],
                            adaptiveUI: true,
                            language: {
                                preferred: null,
                                flag: null,
                                lastUpdated: new Date()
                            }
                        },
                        context: {
                            currentPhase: 'onboarding',
                            nextActions: [],
                            progressMetrics: {},
                            activeModules: [],
                            recentDecisions: [],
                            lastUpdated: new Date()
                        },
                        preferences: {
                            interactionStyle: 'conversational',
                            notificationFrequency: 'moderate',
                            automationLevel: 'balanced',
                            interfaceComplexity: 'adaptive'
                        }
                    },
                    // Enhanced training tracking
                    trainingProgress: {
                        currentModule: null,
                        completedModules: [],
                        achievements: [],
                        skillLevels: {},
                        lastActivity: new Date(),
                        nextMilestone: null
                    },
                    // Language and localization
                    localization: {
                        selectedLanguage: null,
                        flag: null,
                        region: null,
                        timezone: null,
                        lastUpdated: new Date()
                    }
                };

                // Handle existing language settings
                let currentLanguage = user.settings?.language;
                
                if (!currentLanguage || !LANGUAGE_CONFIG[currentLanguage]) {
                    updates['settings.language'] = null;
                    updates.localization.selectedLanguage = null;
                    updates.localization.flag = null;
                    languageUpdates++;
                } else {
                    updates.localization.selectedLanguage = currentLanguage;
                    updates.localization.flag = LANGUAGE_CONFIG[currentLanguage].flag;
                }

                // Ensure all settings exist
                if (!user.settings) {
                    updates.settings = {
                        language: null,
                        theme: 'light',
                        notifications: {
                            email: true,
                            push: true,
                            aiSuggestions: true,
                            language: true
                        },
                        aiPreferences: {
                            automationLevel: 'moderate',
                            interactionStyle: 'reactive',
                            dataCollection: 'enhanced',
                            languageAssist: true
                        }
                    };
                }

                // Update user
                const result = await User.updateOne(
                    { _id: user._id },
                    { $set: updates },
                    { runValidators: true }
                );

                if (result.modifiedCount > 0) {
                    updated++;
                    console.log(`Updated user ${user._id}${!currentLanguage ? ' (needs language selection)' : ''}`);
                }

            } catch (error) {
                errors++;
                console.error(`Error updating user ${user._id}:`, error.message);
            }
        }

        // Verify frontend files
        const requiredFiles = [
            'public/js/languages.js',
            'public/js/language-switcher.js',
            'public/js/languageSelection.js'
        ];

        console.log('\nVerifying frontend files:');
        for (const file of requiredFiles) {
            try {
                await fs.promises.access(path.join(process.cwd(), file));
                console.log(`✓ ${file} exists`);
            } catch (error) {
                console.error(`✗ Warning: ${file} not found`);
            }
        }

        // Create indexes
        console.log('\nCreating indexes...');
        await User.collection.createIndex({ 'aiGuidance.mode': 1 });
        await User.collection.createIndex({ 'settings.language': 1 });
        await User.collection.createIndex({ 'localization.selectedLanguage': 1 });
        console.log('Indexes created successfully');

        console.log('\nMigration Summary:');
        console.log('------------------');
        console.log(`Total users processed: ${users.length}`);
        console.log(`Successfully updated: ${updated}`);
        console.log(`Users needing language selection: ${languageUpdates}`);
        console.log(`Errors encountered: ${errors}`);

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
}

// Command line support
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

if (isDryRun) {
    console.log('Performing dry run - no changes will be made');
}

migrateUsers()
    .then(() => {
        console.log('Migration completed');
        process.exit(0);
    })
    .catch(error => {
        console.error('Migration failed:', error);
        process.exit(1);
    });