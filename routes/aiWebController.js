const express = require('express');
const router = express.Router();
const AIWebController = require('../services/AIWebController');

// Route to trigger AIWebController's `takeControl` method
router.post('/take-control', async (req, res) => {
    const { userId } = req.body;

    try {
        await AIWebController.takeControl(userId);
        res.status(200).json({ success: true, message: 'AI has taken control successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
