const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Configuration, OpenAIApi } = require('openai');
const authenticate = require('../middleware/authenticate'); // Correct path
const User = require('../models/User');
const TrainingSession = require('../models/TrainingSession');

// OpenAI Configuration
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in your .env file
});

const openai = new OpenAIApi(configuration);

// Debugging OpenAI
console.log('OpenAI API Key:', process.env.OPENAI_API_KEY);
console.log('OpenAI Initialized:', openai);

// Training Module Schema
const moduleSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Module name is required'], 
        trim: true 
    },
    category: { 
        type: String, 
        required: true, 
        enum: ['Physical', 'Mental', 'Psychological', 'Spiritual', 'Technical', 'Social', 'Exploration', 'Creative'] 
    },
    description: { 
        type: String, 
        required: true, 
        trim: true 
    },
    progress: { 
        type: Number, 
        default: 0, 
        min: 0, 
        max: 100 
    },
    points: { 
        type: Number, 
        default: 0 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
}, { 
    timestamps: true 
});

// Methods
moduleSchema.methods.getSummary = function() {
    return `${this.name} (${this.category}) - ${this.description}`;
};

// AI-Enhanced Functionality
moduleSchema.methods.generateAIContent = async function(prompt) {
    try {
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: `Generate a summary for the module: ${prompt}`,
            max_tokens: 150,
        });
        return response.data.choices[0].text.trim();
    } catch (error) {
        console.error("Error generating AI content:", error.message);
        throw new Error("Failed to generate AI content");
    }
};

// Export the Module Model
module.exports = mongoose.model('Module', moduleSchema);
