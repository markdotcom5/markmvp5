// models/discussion.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const discussionSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        enum: ['general', 'technical', 'mission', 'certification', 'help'],
        required: true
    },
    relatedTo: {
        module: {
            type: Schema.Types.ObjectId,
            ref: 'Module'
        },
        certification: {
            type: Schema.Types.ObjectId,
            ref: 'Certification'
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: 'Video'
        }
    },
    tags: [String],
    likes: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        date: {
            type: Date,
            default: Date.now
        }
    }],
    replies: [{
        author: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        content: String,
        likes: Number,
        isPinned: Boolean,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    aiModeration: {
        topicAnalysis: Schema.Types.Mixed,
        suggestedExperts: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }],
        relatedResources: [String]
    },
    status: {
        type: String,
        enum: ['active', 'closed', 'archived'],
        default: 'active'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Discussion', discussionSchema);