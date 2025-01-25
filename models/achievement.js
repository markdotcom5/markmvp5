const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    criteria: {
        type: {
            type: String,
            enum: ['score', 'level', 'activity', 'custom'],
            required: true
        },
        value: Number,
        customLogic: String
    },
    icon: {
        type: String,
        default: '/images/default-achievement.png'
    },
    rarity: {
        type: String,
        enum: ['common', 'rare', 'epic', 'legendary'],
        default: 'common'
    },
    points: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

achievementSchema.index({ name: 1 });
achievementSchema.index({ rarity: 1 });
achievementSchema.index({ points: -1 });

const Achievement = mongoose.model('Achievement', achievementSchema);

module.exports = Achievement;