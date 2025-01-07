require('dotenv').config(); // Load environment variables
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

console.log('Testing MongoDB URI:', MONGO_URI);

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB Connection Successful');
        mongoose.connection.close(); // Close the connection after testing
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Failed:', err.message);
    });
