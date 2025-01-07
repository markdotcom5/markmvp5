const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    score: {
        type: Number,
        default: 0,
        min: [0, 'Score cannot be negative'],
        index: -1
    },
    rank: {
        type: Number,
        min: 1,
        index: true
    },
    category: {
        type: String,
        enum: ['global', 'local', 'training'],
        default: 'global',
        index: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    achievements: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Achievement'
    }],
    seasonId: {
        type: String,
        required: true,
        default: () => new Date().getFullYear() + '-' + Math.ceil((new Date().getMonth() + 1) / 3)
    }
}, {
    timestamps: true
});

// Compound indexes
leaderboardSchema.index({ category: 1, score: -1 });
leaderboardSchema.index({ userId: 1, category: 1 }, { unique: true });

// Pre-save middleware to update lastUpdated
leaderboardSchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

// Static method to update ranks
leaderboardSchema.statics.updateRanks = async function(category = 'global') {
    const records = await this.find({ category })
        .sort({ score: -1 });
    
    const bulkOps = records.map((record, index) => ({
        updateOne: {
            filter: { _id: record._id },
            update: { $set: { rank: index + 1 } }
        }
    }));

    if (bulkOps.length > 0) {
        await this.bulkWrite(bulkOps);
    }
};

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

module.exports = Leaderboard;