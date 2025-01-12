const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config(); // Load environment variables from .env

// Configure OpenAI Client
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY, // Load API key from .env
});
const openai = new OpenAIApi(configuration);

(async () => {
    try {
        const response = await openai.createChatCompletion({
            model: 'gpt-4', // Specify the desired model
            messages: [{ role: 'user', content: 'Hello, OpenAI!' }],
        });
        console.log('✅ OpenAI Response:', response.data.choices[0].message.content);
    } catch (error) {
        console.error('❌ OpenAI Error:', error.response?.data || error.message);
    }
})();



