const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subscriptionSchema = new Schema({
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: [true, 'User ID is required for subscription']
    },
    plan: { 
        type: String, 
        required: true, 
        enum: {
            values: ['free', 'individual', 'family', 'galactic'],
            message: '{VALUE} is not a valid subscription plan'
        }
    },
    startDate: { 
        type: Date, 
        default: Date.now 
    },
    endDate: { 
        type: Date,
        validate: {
            validator: function(v) {
                return !this.endDate || v > this.startDate;
            },
            message: 'End date must be after start date'
        }
    },
    status: { 
        type: String, 
        default: 'active', 
        enum: ['active', 'cancelled', 'expired', 'pending']
    },
    paymentHistory: [{
        date: { type: Date, default: Date.now },
        amount: { 
            type: Number, 
            required: true,
            min: [0, 'Payment amount cannot be negative']
        },
        transactionId: String,
        method: {
            type: String,
            enum: ['credit_card', 'paypal', 'stripe', 'bank_transfer']
        }
    }],
    features: {
        maxModules: Number,
        aiAssistance: {
            type: String,
            enum: ['basic', 'advanced', 'full']
        },
        communityAccess: Boolean,
        certificationEligibility: Boolean
    },
    renewalInfo: {
        autoRenew: {
            type: Boolean,
            default: true
        },
        nextBillingDate: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for subscription duration
subscriptionSchema.virtual('duration').get(function() {
    return this.endDate 
        ? Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24)) 
        : null;
});

// Method to check if subscription is active
subscriptionSchema.methods.isActive = function() {
    return this.status === 'active' && 
           (!this.endDate || this.endDate > new Date());
};

// Static method to find active subscriptions
subscriptionSchema.statics.findActiveSubscriptions = function() {
    return this.find({
        status: 'active',
        endDate: { $gt: new Date() }
    });
};

// Middleware to update status
subscriptionSchema.pre('save', function(next) {
    const now = new Date();
    
    if (this.endDate && this.endDate < now) {
        this.status = 'expired';
    }
    
    next();
});

module.exports = mongoose.model('Subscription', subscriptionSchema);