// Create a Training Session
router.post(
    '/sessions',
    authenticate,
    sessionLimiter,
    validateSessionInput,
    async (req, res) => {
        const { sessionType, dateTime, participants, points = 0 } = req.body;

        try {
            const session = new TrainingSession({
                userId: req.user._id,
                sessionType,
                dateTime,
                participants,
                points,
                status: 'scheduled',
            });
            await session.save();
            res.status(201).json({ message: 'Session created successfully', session });
        } catch (error) {
            console.error('Error creating session:', error.message);
            res.status(500).json({ error: 'Failed to create session.' });
        }
    }
);

// Analyze Training Progress
router.post('/progress', authenticate, async (req, res) => {
    const { trainingData } = req.body;

    try {
        const analysis = await AISpaceCoach.analyzeProgress(trainingData);
        res.status(200).json({ success: true, analysis });
    } catch (error) {
        console.error('Error analyzing progress:', error.message);
        res.status(500).json({ success: false, error: 'Failed to analyze progress.' });
    }
});

// Update a Training Session
router.patch(
    '/sessions/:sessionId',
    authenticate,
    sessionLimiter,
    async (req, res) => {
        const { progress, status } = req.body;

        try {
            const session = await TrainingSession.findOneAndUpdate(
                { _id: req.params.sessionId, userId: req.user._id },
                { $set: { progress, status } },
                { new: true }
            );

            if (!session) {
                return res.status(404).json({ error: 'Session not found.' });
            }

            res.json({ message: 'Session updated successfully', session });
        } catch (error) {
            console.error('Error updating session:', error.message);
            res.status(500).json({ error: 'Failed to update session.' });
        }
    }
);
