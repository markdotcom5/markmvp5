const mongoose = require('mongoose');
const User = require('./User'); // Ensure this points to your User model

// MongoDB Connection
mongoose.connect('mongodb+srv://Sophis7152567:S3EmtfBGRC3V1nGR@cluster0.20bhg.mongodb.net/StelTrek_MVP5', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('✅ Connected to MongoDB Atlas.');

    try {
        // Create and save a test user
        const testUser = new User({
            email: 'testuser@example.com',
            password: 'hashedpassword', // Replace with a hashed password if necessary
            roles: ['user'],           // Add additional fields as needed
        });

        await testUser.save(); // Save the user to the database
        console.log('✅ Test User Created:', testUser);

    } catch (err) {
        console.error('❌ Error creating test user:', err.message);
    } finally {
        mongoose.connection.close(); // Close connection after testing
        console.log('✅ MongoDB connection closed.');
    }
}).catch(err => console.error('❌ Database connection error:', err.message));
