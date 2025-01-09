// models/groupSession.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupSessionSchema = new Schema({
    group: {
        type: Schema.Types.ObjectId,
        ref: 'StudyGroup',
        required: true
    },
    type: {
        type: String,
        enum: ['study', 'practice', 'assessment', 'mission'],
        required: true
    },
    participants: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'completed'],
            default: 'active'
        },
        progress: Number,
        performance: {
            accuracy: Number,
            completionTime: Number,
            score: Number
        }
    }],
    module: {
        type: Schema.Types.ObjectId,
        ref: 'Module',
        required: true
    },
    videos: [{
        type: Schema.Types.ObjectId,
        ref: 'Video'
    }],
    aiGuidance: {
        recommendations: [String],
        adaptations: [String],
        performanceAnalysis: Schema.Types.Mixed
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: Date,
    status: {
        type: String,
        enum: ['scheduled', 'active', 'completed', 'cancelled'],
        default: 'scheduled'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('GroupSession', groupSessionSchema);