// models/Certification.js
const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema({
    // Keep existing base fields
    name: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        required: false 
    },
    level: { 
        type: String, 
        required: true,
        enum: ['beginner', 'intermediate', 'advanced', 'expert']
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },

    // Add new fields for enhanced functionality
    type: {
        type: String,
        enum: ['individual', 'group', 'mission', 'specialization'],
        default: 'individual'
    },
    requirements: [{
        module: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Module'
        },
        minimumScore: Number,
        completed: {
            type: Boolean,
            default: false
        }
    }],
    progress: {
        currentScore: {
            type: Number,
            default: 0
        },
        completedModules: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Module'
        }],
        requiredModules: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Module'
        }],
        percentageComplete: {
            type: Number,
            default: 0
        }
    },
    achievement: {
        badge: String,
        points: {
            type: Number,
            default: 0
        },
        unlocks: [{
            type: String,
            description: String
        }]
    },
    validity: {
        startDate: Date,
        expiryDate: Date,
        isActive: {
            type: Boolean,
            default: true
        }
    },
    groupData: {
        teamMembers: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            role: String,
            contributionScore: Number
        }],
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StudyGroup'
        }
    },
    celebrations: [{
        type: {
            type: String,
            enum: ['milestone', 'completion', 'excellence'],
        },
        date: Date,
        description: String,
        participants: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    }],
    aiMetrics: {
        predictedCompletion: Date,
        recommendedPath: [String],
        strengthAreas: [String],
        improvementAreas: [String],
        nextMilestone: {
            description: String,
            estimatedDate: Date
        }
    },
    status: {
        type: String,
        enum: ['in_progress', 'completed', 'expired', 'revoked'],
        default: 'in_progress'
    },
    achievedAt: { 
        type: Date, 
        required: false 
    }
}, {
    timestamps: true
});

// Methods for certification management
certificationSchema.methods.updateProgress = async function(moduleId, score) {
    try {
        const module = await mongoose.model('Module').findById(moduleId);
        if (!module) throw new Error('Module not found');

        // Update completed modules
        if (!this.progress.completedModules.includes(moduleId)) {
            this.progress.completedModules.push(moduleId);
        }

        // Update overall progress
        const totalModules = this.requirements.length;
        const completedModules = this.progress.completedModules.length;
        this.progress.percentageComplete = (completedModules / totalModules) * 100;

        // Update current score
        this.progress.currentScore = score;

        // Check if certification is completed
        if (this.progress.percentageComplete === 100 && score >= this.requirements.minimumScore) {
            this.status = 'completed';
            this.achievedAt = new Date();
        }

        await this.save();
        return this.progress;
    } catch (error) {
        console.error('Error updating certification progress:', error);
        throw error;
    }
};

certificationSchema.methods.calculateAIMetrics = async function() {
    try {
        // Calculate predicted completion based on current progress
        const remainingPercentage = 100 - this.progress.percentageComplete;
        const daysPerPercent = (new Date() - this.createdAt) / this.progress.percentageComplete;
        const predictedDays = remainingPercentage * daysPerPercent;
        
        this.aiMetrics.predictedCompletion = new Date(Date.now() + predictedDays);
        await this.save();
        
        return this.aiMetrics;
    } catch (error) {
        console.error('Error calculating AI metrics:', error);
        throw error;
    }
};

certificationSchema.methods.addCelebration = async function(type, description) {
    try {
        this.celebrations.push({
            type,
            date: new Date(),
            description,
            participants: [this.userId]
        });

        if (this.groupData.teamMembers.length > 0) {
            this.celebrations[this.celebrations.length - 1].participants = 
                this.groupData.teamMembers.map(member => member.userId);
        }

        await this.save();
        return this.celebrations[this.celebrations.length - 1];
    } catch (error) {
        console.error('Error adding celebration:', error);
        throw error;
    }
};

module.exports = mongoose.model('Certification', certificationSchema);