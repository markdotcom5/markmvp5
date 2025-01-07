const { generateTrainingContent, provideProblemSolvingScenario } = require('./services/aiAssistant');

async function testFunctions() {
    try {
        console.log('Testing generateTrainingContent...');
        const trainingContent = await generateTrainingContent('Astronaut Training', 'Beginner');
        console.log('Generated Training Content:', trainingContent);

        console.log('\nTesting provideProblemSolvingScenario...');
        const problemScenario = await provideProblemSolvingScenario('Space Navigation');
        console.log('Generated Problem-Solving Scenario:', problemScenario);

    } catch (error) {
        console.error('Error while testing AI functions:', error.message);
    }
}

// Run Tests
testFunctions();
