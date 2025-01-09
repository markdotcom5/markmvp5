// models/challenge.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const challengeSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    type: {
        type: String,
        enum: ['individual', 'team', 'global'],
        required: true
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        required: true
    },
    participants: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        team: {
            type: Schema.Types.ObjectId,
            ref: 'StudyGroup'
        },
        progress: Number,
        score: Number,
        completedAt: Date
    }],
    modules: [{
        type: Schema.Types.ObjectId,
        ref: 'Module'
    }],
    objectives: [{
        description: String,
        points: Number,
        type: String
    }],
    rewards: [{
        type: {
            type: String,
            enum: ['achievement', 'certification', 'points'],
        },
        points: Number,
        achievementId: {
            type: Schema.Types.ObjectId,
            ref: 'Achievement'
        },
        certificationId: {
            type: Schema.Types.ObjectId,
            ref: 'Certification'
        },
        description: String
    }],
    leaderboard: {
        type: Schema.Types.ObjectId,
        ref: 'Leaderboard'
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['upcoming', 'active', 'completed'],
        default: 'upcoming'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Challenge', challengeSchema);