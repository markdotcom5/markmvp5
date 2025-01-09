const { OpenAI } = require('openai');

// Initialize OpenAI Client with your API Key
const openai = new OpenAI({
    apiKey: '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',
});

(async () => {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4', // Replace with your desired model
            messages: [{ role: 'user', content: 'Hello, OpenAI!' }],
        });
        console.log('OpenAI Response:', response.choices[0].message.content);
    } catch (error) {
        console.error('OpenAI Test Error:', error.message);
    }
})();

