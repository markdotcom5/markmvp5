const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // Relationships
    achievements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Achievement' }],
    trainingModules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }],
    trainingSessions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TrainingSession' }],

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

    // Settings
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
            push: { type: Boolean, default: true }
        }
    },

    // Additional Fields
    leaderboardScore: { type: Number, default: 0, min: 0 },
    credits: { type: Number, default: 0, min: 0 },
    lastLogin: { type: Date },
    loginAttempts: { type: Number, default: 0, min: 0 },
    isBlocked: { type: Boolean, default: false },
    location: {
        coordinates: { type: [Number] }, // No inline index here
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

// Added schema-level index to resolve duplicate warnings
userSchema.index({ 'location.coordinates': '2dsphere' });

// Custom Methods
userSchema.methods.hashPassword = async function(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

userSchema.methods.comparePassword = async function(password) {
    return bcrypt.compare(password, this.password);
};

userSchema.methods.generateAIInsights = async function(prompt) {
    const { Configuration, OpenAIApi } = require("openai");
    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY // Ensure your .env file has the OpenAI API key
    });
    const openai = new OpenAIApi(configuration);

    try {
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: `Provide insights for the user: ${prompt}`,
            max_tokens: 150,
        });
        return response.data.choices[0].text.trim();
    } catch (error) {
        console.error("Error generating AI insights:", error.message);
        throw new Error("Failed to generate AI insights");
    }
};

// Static Methods
userSchema.statics.findByCredentials = async function(email, password) {
    const user = await this.findOne({ email });
    if (!user) throw new Error('Invalid login credentials');
    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new Error('Invalid login credentials');
    return user;
};

// Middleware
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await this.hashPassword(this.password);
    }
    next();
});

module.exports = mongoose.model('User', userSchema);
