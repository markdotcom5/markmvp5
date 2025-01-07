const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust path if necessary

mongoose.connect('mongodb+srv://Sophis7152567:S3EmtfBGRC3V1nGR@cluster0.20bhg.mongodb.net/StelTrek_MVP5', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to MongoDB Atlas!');

    const update = {
        location: {
            coordinates: [-73.935242, 40.73061], // Example coordinates (longitude, latitude)
            state: 'New York',
            country: 'USA'
        },
        trainingCohort: {
            startDate: '2024-12-01',
            programType: 'Astronaut Training'
        }
    };

    const result = await User.updateOne({ name: 'mark' }, { $set: update });

    if (result.modifiedCount > 0) {
        console.log('User "mark" updated successfully!');
    } else {
        console.log('No updates applied. Check if the user "mark" exists.');
    }

    mongoose.connection.close();
}).catch(err => {
    console.error('Error connecting to MongoDB:', err);
});
