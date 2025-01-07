// testOpenAI.js
require('dotenv').config();
const OpenAI = require('openai');

// Initialize OpenAI with your API key
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function testOpenAI() {
    try {
        console.log('Testing OpenAI connection...');
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{
                role: "user",
                content: "Test message for StelTrek Academy: Say hello!"
            }],
            max_tokens: 100
        });

        console.log('Response:', completion.choices[0].message.content);
    } catch (error) {
        console.error('Error details:', error);
    }
}

// Run the test
testOpenAI();