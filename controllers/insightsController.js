const Insight = require('../models/Insight');

const insightsController = {
    getAllInsights: async (req, res) => {
        try {
            const insights = await Insight.find().sort({ publishDate: -1 });
            res.json(insights);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getInsightById: async (req, res) => {
        try {
            const insight = await Insight.findById(req.params.id);
            if (!insight) {
                return res.status(404).json({ error: 'Insight not found' });
            }
            res.json(insight);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = insightsController;