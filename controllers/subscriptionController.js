const Subscription = require('../models/Subscription');

exports.createSubscription = async (req, res) => {
    const { userId, plan, credits } = req.body;

    if (!userId || !plan) {
        return res.status(400).json({ error: 'User ID and subscription plan are required' });
    }

    try {
        // Check for existing active subscription
        const existingSubscription = await Subscription.findOne({ userId, status: 'active' });
        if (existingSubscription) {
            return res.status(400).json({ error: 'User already has an active subscription' });
        }

        // Calculate price based on the plan
        const planPricing = {
            individual: 49.99,
            family: 89.99,
            galactic: 2048,
        };
        const price = planPricing[plan] || 0;

        // Create subscription
        const subscription = new Subscription({
            userId,
            plan,
            price,
            credits,
            features: {
                maxVRHours: plan === 'galactic' ? 0 : plan === 'family' ? 50 : 10,
                aiCoach: true,
                spaceCredits: plan === 'galactic' ? 1000 : plan === 'family' ? 250 : 100,
                memberAccess: plan === 'family' ? 4 : 1,
                privateFacility: plan === 'galactic',
                priorityAccess: plan === 'galactic',
            },
            renewalInfo: {
                nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days later
            },
        });

        await subscription.save();
        res.status(201).json({ message: 'Subscription created successfully', subscription });
    } catch (error) {
        console.error('Error creating subscription:', error.message);
        res.status(500).json({ error: 'Failed to create subscription' });
    }
};

exports.updatePaymentStatus = async (req, res) => {
    const { subscriptionId, paymentStatus, transactionId, amount } = req.body;

    if (!subscriptionId || !paymentStatus) {
        return res.status(400).json({ error: 'Subscription ID and payment status are required' });
    }

    try {
        const subscription = await Subscription.findById(subscriptionId);
        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        // Add payment history
        subscription.paymentHistory.push({
            amount,
            method: 'stripe', // Adjust if using multiple payment methods
            transactionId,
        });

        // Update subscription status
        if (paymentStatus === 'success') {
            subscription.status = 'active';
            subscription.renewalInfo.nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Extend 30 days
        } else {
            subscription.status = 'paused';
        }

        await subscription.save();
        res.status(200).json({ message: 'Payment status updated successfully', subscription });
    } catch (error) {
        console.error('Error updating payment status:', error.message);
        res.status(500).json({ error: 'Failed to update payment status' });
    }
};

exports.getSubscriptionStatus = async (req, res) => {
    try {
        const subscription = await Subscription.findOne({ userId: req.user.id, status: 'active' });
        if (!subscription) {
            return res.status(404).json({ error: 'No active subscription found' });
        }
        res.status(200).json(subscription);
    } catch (error) {
        console.error('Error fetching subscription status:', error.message);
        res.status(500).json({ error: 'Failed to fetch subscription status' });
    }
};

exports.getAllSubscriptions = async (req, res) => {
    try {
        const subscriptions = await Subscription.find().populate('userId', 'email roles');
        res.status(200).json(subscriptions);
    } catch (error) {
        console.error('Error fetching all subscriptions:', error.message);
        res.status(500).json({ error: 'Failed to fetch all subscriptions' });
    }
};

exports.cancelSubscription = async (req, res) => {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
        return res.status(400).json({ error: 'Subscription ID is required' });
    }

    try {
        const subscription = await Subscription.findById(subscriptionId);
        if (!subscription || subscription.status !== 'active') {
            return res.status(400).json({ error: 'No active subscription found to cancel' });
        }

        subscription.status = 'cancelled';
        subscription.endDate = new Date();
        await subscription.save();

        res.status(200).json({ message: 'Subscription cancelled successfully', subscription });
    } catch (error) {
        console.error('Error cancelling subscription:', error.message);
        res.status(500).json({ error: 'Failed to cancel subscription' });
    }
};

exports.renewSubscription = async (req, res) => {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
        return res.status(400).json({ error: 'Subscription ID is required' });
    }

    try {
        const subscription = await Subscription.findById(subscriptionId);
        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        subscription.status = 'active';
        subscription.startDate = new Date();
        subscription.renewalInfo.nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Extend by 30 days
        await subscription.save();

        res.status(200).json({ message: 'Subscription renewed successfully', subscription });
    } catch (error) {
        console.error('Error renewing subscription:', error.message);
        res.status(500).json({ error: 'Failed to renew subscription' });
    }
};
