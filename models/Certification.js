const mongoose = require('mongoose');

// Define the Certification schema
const certificationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: false },
    level: { type: String, required: true },
    achievedAt: { type: Date, required: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

// Create the Certification model
const Certification = mongoose.model('Certification', certificationSchema);

module.exports = Certification;
