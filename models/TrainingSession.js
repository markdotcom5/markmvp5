const mongoose = require('mongoose');

// All sub-schemas defined first
const participantSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
        type: String,
        enum: ["Registered", "Attended", "Completed", "Cancelled", "No-Show"],
        default: "Registered"
    },
    joinedAt: Date,
    completedAt: Date,
    feedback: {
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        submittedAt: Date
    }
});

const aiInteractionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['guidance', 'assessment', 'recommendation', 'feedback'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    content: {
        prompt: String,
        response: String,
        context: Object
    },
    metrics: {
        userEngagement: Number,
        effectiveness: Number,
        relevance: Number
    }
});

const aiGuidanceSchema = new mongoose.Schema({
    enabled: {
        type: Boolean,
        default: true
    },
    mode: {
        type: String,
        enum: ['manual', 'assist', 'full_guidance'],
        default: 'assist'
    },
    lastInitialized: Date,
    currentFocus: String,
    adaptivePathAdjustments: [{
        reason: String,
        adjustment: String,
        timestamp: { type: Date, default: Date.now }
    }],
    personalizedTips: [{
        content: String,
        timestamp: { type: Date, default: Date.now },
        acknowledged: Boolean
    }]
});

const certificationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    issuedDate: { type: Date, required: true },
    validUntil: Date,
    certificationId: { type: String, required: true },
    issuer: String,
    criteria: [String]
});

const rankingSchema = new mongoose.Schema({
    globalRank: { type: Number, default: 999999 },
    points: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    lastCalculated: Date
});

const achievementSchema = new mongoose.Schema({
    name: String,
    description: String,
    earnedAt: { type: Date, default: Date.now },
    points: Number
});

const assessmentSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['initial', 'module', 'certification'],
        required: true
    },
    responses: [{
        question: String,
        answer: String,
        timestamp: { type: Date, default: Date.now }
    }],
    score: Number,
    aiRecommendations: {
        focusAreas: [String],
        suggestedModules: [String],
        personalizedFeedback: String,
        nextSteps: [String]
    },
    completedAt: Date,
    startedAt: { type: Date, default: Date.now }
});

const adaptiveLearningSchema = new mongoose.Schema({
    currentPath: String,
    adjustments: [{
        fromPath: String,
        toPath: String,
        reason: String,
        timestamp: { type: Date, default: Date.now }
    }],
    effectiveness: {
        type: Number,
        default: 0
    }
});

// Main Training Session Schema
const trainingSessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionType: { 
        type: String, 
        required: true,
        enum: ['Training', 'Assessment', 'Physical', 'Mental', 'Technical', 'Simulation', 'Certification']
    },
    moduleId: {
        type: String,
        required: function() { 
            return ['Training', 'Technical'].includes(this.sessionType);
        }
    },
    dateTime: { type: Date, required: true, default: Date.now },
    participants: [participantSchema],
    points: { type: Number, default: 0 },
    status: { 
        type: String, 
        enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
        default: 'in-progress' 
    },
    assessment: assessmentSchema,
    progress: { type: Number, default: 0, min: 0, max: 100 },
    aiGuidance: aiGuidanceSchema,
    aiInteractions: [aiInteractionSchema],
    adaptiveLearning: adaptiveLearningSchema,
    metrics: {
        physicalReadiness: { type: Number, min: 0, max: 100 },
        mentalPreparedness: { type: Number, min: 0, max: 100 },
        technicalProficiency: { type: Number, min: 0, max: 100 },
        overallScore: { type: Number, min: 0, max: 100 }
    },
    completedTasks: [{
        taskId: String,
        name: String,
        score: Number,
        completedAt: { type: Date, default: Date.now }
    }],
    certifications: [certificationSchema],
    ranking: rankingSchema,
    achievements: [achievementSchema],
    lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes
trainingSessionSchema.index({ userId: 1, status: 1 });
trainingSessionSchema.index({ sessionType: 1, status: 1 });
trainingSessionSchema.index({ "participants.userId": 1 });
trainingSessionSchema.index({ "aiGuidance.enabled": 1, "metrics.overallScore": -1 });

// Methods
trainingSessionSchema.methods.calculateProgress = function(userId) {
    if (userId) {
        const participant = this.participants.find(p => p.userId.toString() === userId);
        return participant ? participant.progress || 0 : 0;
    }
    return this.progress || 0;
};

trainingSessionSchema.methods.updateFeedbackStats = function() {
    const ratings = this.participants
        .filter(p => p.feedback && p.feedback.rating)
        .map(p => p.feedback.rating);
    
    if (ratings.length > 0) {
        this.feedback.averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        this.feedback.totalRatings = ratings.length;
    } else {
        this.feedback.averageRating = 0;
        this.feedback.totalRatings = 0;
    }
};

trainingSessionSchema.methods.startAssessment = function(type) {
    this.assessment = {
        type,
        responses: [],
        startedAt: new Date()
    };
};

trainingSessionSchema.methods.submitAssessmentResponse = function(question, answer) {
    if (!this.assessment) {
        this.assessment = {
            type: 'initial',
            responses: [],
            startedAt: new Date()
        };
    }
    
    this.assessment.responses.push({
        question,
        answer,
        timestamp: new Date()
    });
};

trainingSessionSchema.methods.completeAssessment = function(score, aiRecommendations) {
    if (!this.assessment) {
        throw new Error('No active assessment found');
    }
    
    this.assessment.score = score;
    this.assessment.aiRecommendations = aiRecommendations;
    this.assessment.completedAt = new Date();
};

// Pre-save middleware
trainingSessionSchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

module.exports = mongoose.model('TrainingSession', trainingSessionSchema);