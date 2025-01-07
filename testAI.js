const { generateTrainingContent, provideProblemSolvingScenario } = require('./services/aiAssistant');

(async () => {
    try {
        const trainingContent = await generateTrainingContent('physical', 'beginner');
        console.log('Training Content:', trainingContent);

        const scenario = await provideProblemSolvingScenario('technical');
        console.log('Problem-Solving Scenario:', scenario);
    } catch (error) {
        console.error('Error:', error.message);
    }
})();
