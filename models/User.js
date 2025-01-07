const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const OpenAI = require('openai'); // Moved OpenAI import to the top for consistency

const userSchema = new mongoose.Schema({
    // Relationships
    achievements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Achievement' }],
    trainingModules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }],
    trainingSessions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TrainingSession' }],

    // AI Guidance System Fields
    aiGuidance: {
        mode: {
            type: String,
            enum: ['manual', 'assist', 'full_guidance'],
            default: 'manual'
        },
        activatedAt: Date,
        lastInteraction: Date,
        personalizedSettings: {
            learningStyle: {
                type: String,
                enum: ['visual', 'auditory', 'kinesthetic', 'reading_writing'],
                default: null
            },
            pacePreference: {
                type: String,
                enum: ['accelerated', 'balanced', 'thorough'],
                default: 'balanced'
            },
            focusAreas: [String],
            adaptiveUI: { type: Boolean, default: true }
        },
        context: {
            currentPhase: String,
            nextActions: [{
                type: String,
                priority: Number,
                suggestedAt: Date
            }],
            progressMetrics: mongoose.Schema.Types.Mixed,
            activeModules: [String],
            recentDecisions: [{
                decision: String,
                reasoning: String,
                timestamp: Date
            }],
            lastUpdated: Date
        }
    },

    // User Details
    email: { 
        type: String, 
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    password: { 
        type: String, 
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long']
    },
    subscription: {
        type: String,
        enum: ["free", "basic", "premium", "enterprise"],
        default: "free"
    },
    roles: {
        type: [String],
        default: ["user"],
        validate: {
            validator: function(v) {
                return v.every(role => ["user", "admin", "moderator"].includes(role));
            },
            message: 'Invalid role specified'
        }
    },

    // User Settings
    settings: {
        language: { 
            type: String, 
            default: "en",
            enum: ["en", "es", "zh", "ko"]
        },
        theme: { 
            type: String, 
            default: "light",
            enum: ["light", "dark"]
        },
        notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: true },
            aiSuggestions: { type: Boolean, default: true }
        },
        aiPreferences: {
            automationLevel: {
                type: String,
                enum: ['minimal', 'moderate', 'maximum'],
                default: 'moderate'
            },
            interactionStyle: {
                type: String,
                enum: ['proactive', 'reactive'],
                default: 'reactive'
            },
            dataCollection: {
                type: String,
                enum: ['essential', 'enhanced', 'comprehensive'],
                default: 'enhanced'
            }
        }
    },

    // User Stats and Metadata
    leaderboardScore: { type: Number, default: 0, min: 0 },
    credits: { type: Number, default: 0, min: 0 },
    lastLogin: { type: Date },
    loginAttempts: { type: Number, default: 0, min: 0 },
    isBlocked: { type: Boolean, default: false },
    location: {
        coordinates: { type: [Number] }, // [longitude, latitude]
        state: String,
        country: String
    },
    badges: [{ 
        name: { type: String, required: true },
        earnedAt: { type: Date, default: Date.now },
        description: String
    }],
    certifications: [{
        title: { type: String, required: true },
        issuer: String,
        issuedAt: { type: Date, default: Date.now },
        validUntil: Date
    }]
}, {
    timestamps: true,
    versionKey: false
});

// Indexes
userSchema.index({ 'location.coordinates': '2dsphere' }); // Geospatial indexing

// =======================
// Instance Methods
// =======================
userSchema.methods.hashPassword = async function(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

userSchema.methods.comparePassword = async function(password) {
    return bcrypt.compare(password, this.password);
};

userSchema.methods.updateAIGuidance = async function(newMode) {
    this.aiGuidance.mode = newMode;
    this.aiGuidance.activatedAt = new Date();
    this.aiGuidance.lastInteraction = new Date();
    await this.save();
    return this.aiGuidance;
};

userSchema.methods.updateAIContext = async function(newContext) {
    this.aiGuidance.context = {
        ...this.aiGuidance.context,
        ...newContext,
        lastUpdated: new Date()
    };
    await this.save();
    return this.aiGuidance.context;
};

userSchema.methods.generateAIInsights = async function(prompt) {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [{
                role: "system",
                content: "You are an AI assistant for StelTrek, a space training platform."
            }, {
                role: "user",
                content: prompt
            }]
        });
        return completion.choices[0].message.content;
    } catch (error) {
        console.error("Error generating AI insights:", error.message);
        throw new Error("Failed to generate AI insights");
    }
};

// =======================
// Static Methods
// =======================
userSchema.statics.findByCredentials = async function(email, password) {
    const user = await this.findOne({ email });
    if (!user) throw new Error('Invalid login credentials');
    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new Error('Invalid login credentials');
    return user;
};

// =======================
// Middleware
// =======================
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await this.hashPassword(this.password);
    }
    next();
});

module.exports = mongoose.model('User', userSchema);
