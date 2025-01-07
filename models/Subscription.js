const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: String, required: true, enum: ['free', 'basic', 'premium', 'enterprise'] },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    status: { type: String, default: 'active', enum: ['active', 'cancelled', 'expired'] },
    paymentHistory: [{ date: Date, amount: Number }],
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
