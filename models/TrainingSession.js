const mongoose = require('mongoose');

// Sub-schemas
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

const certificationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    issuedDate: { type: Date, required: true },
    validUntil: Date,
    certificationId: { type: String, required: true, unique: true },
    issuer: String,
    criteria: [String]
});

// Define the schema
const trainingSessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionType: { type: String, required: true },
    dateTime: { type: Date, required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    points: { type: Number, default: 0 },
    status: { type: String, default: 'scheduled' },
}, { timestamps: true });

// Indexes for Query Optimization
trainingSessionSchema.index({ "location.coordinates": "2dsphere" });
trainingSessionSchema.index({ "schedule.startDate": 1 });
trainingSessionSchema.index({ sessionType: 1, status: 1 });
trainingSessionSchema.index({ "participants.userId": 1 });

// Methods
trainingSessionSchema.methods.isFullyBooked = function() {
    return this.participants.length >= this.capacity.max;
};

trainingSessionSchema.methods.calculateProgress = function(userId) {
    const participant = this.participants.find(p => p.userId.toString() === userId);
    return participant ? participant.progress || 0 : 0;
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

module.exports = mongoose.model('TrainingSession', trainingSessionSchema);

