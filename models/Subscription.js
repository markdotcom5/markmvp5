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
   stripeCustomerId: String,
   stripeSubscriptionId: String,
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
   targetDate: Date,
   credits: {
       type: Number,
       default: 0
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
        enum: ['credit_card', 'paypal', 'stripe', 'bank_transfer'],
        default: 'stripe'
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

subscriptionSchema.virtual('duration').get(function() {
   return this.endDate
       ? Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24))
       : null;
});

subscriptionSchema.methods.isActive = function() {
   return this.status === 'active' && 
          (!this.endDate || this.endDate > new Date());
};

subscriptionSchema.statics.findActiveSubscriptions = function() {
   return this.find({
       status: 'active',
       endDate: { $gt: new Date() }
   });
};

subscriptionSchema.pre('save', function(next) {
   const now = new Date();
   if (this.endDate && this.endDate < now) {
       this.status = 'expired';
   }
   
   // Calculate target date based on plan
   if (this.plan && !this.targetDate) {
       const baselineDate = new Date('2039-01-01');
       const accelerationRates = {
           individual: 0.25,
           family: 0.40,
           galactic: 0.80
       };
       const rate = accelerationRates[this.plan] || 0;
       const timeReduction = (baselineDate - now) * rate;
       this.targetDate = new Date(baselineDate - timeReduction);
   }
   
   next();
});

module.exports = mongoose.model('Subscription', subscriptionSchema);