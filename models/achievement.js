const mongoose = require('mongoose');

// Achievement Schema
const achievementSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Achievement name is required'], 
        trim: true 
    },
    description: { 
        type: String, 
        trim: true 
    },
    points: { 
        type: Number, 
        default: 0, 
        min: [0, 'Points cannot be negative'] 
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    earnedAt: { 
        type: Date, 
        default: Date.now, 
        immutable: true 
    },
    category: { 
        type: String, 
        enum: ['physical', 'mental', 'technical', 'leadership'],
        default: 'physical',
        message: '{VALUE} is not a valid category'
    },
    isHighlighted: { 
        type: Boolean, 
        default: false 
    }, // Whether the achievement is highlighted
}, { 
    timestamps: true 
});

// Virtuals
achievementSchema.virtual('summary').get(function() {
    return `${this.name} - ${this.description || 'No description available'}`;
});

// Methods
achievementSchema.methods.getSummary = function() {
    return {
        name: this.name,
        description: this.description,
        points: this.points,
        earnedAt: this.earnedAt,
        category: this.category,
    };
};

// Statics
achievementSchema.statics.findByUser = function(userId) {
    return this.find({ userId }).sort({ earnedAt: -1 });
};

// Export the Achievement Model
module.exports = mongoose.model('Achievement', achievementSchema);
