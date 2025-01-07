const AIAssistant = require('../services/aiAssistant'); // Import AI service

// Generate training content
const aiActionHandler = async (req, res) => {
    try {
        const { module } = req.params;
        const userLevel = req.user?.trainingLevel || 'beginner'; // Default to 'beginner'

        if (!module) {
            return res.status(400).json({ error: 'Module parameter is required' });
        }

        // Generate training content using AI
        let trainingContent = await AIAssistant.generateTrainingContent(module, userLevel);

        // Fallback if AI fails
        if (!trainingContent) {
            trainingContent = await AIAssistant.getFallbackContent(module);
        }

        res.json({
            module,
            content: trainingContent,
            difficulty: userLevel,
        });
    } catch (error) {
        console.error('Error generating training content:', error.message);
        res.status(500).json({ error: 'Failed to generate training content', details: error.message });
    }
};

// Generate problem-solving scenario
const provideProblemSolvingScenario = async (module) => {
    try {
        const scenario = await AIAssistant.provideProblemSolvingScenario(module);
        return scenario || 'Standard problem-solving scenario';
    } catch (error) {
        console.error('Error generating problem-solving scenario:', error.message);
        throw new Error('Failed to generate problem-solving scenario');
    }
};

// Ensure both functions are exported
module.exports = { aiActionHandler, provideProblemSolvingScenario };
