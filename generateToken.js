const jwt = require('jsonwebtoken');

// Payload for the token
const payload = {
    userId: "12345", // Replace with your actual user ID
    email: "user@example.com" // Replace with your actual email
};

// Secret key from your .env file or hardcoded for testing
const secret = "ad20b7a1e8d4c5e6f7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w"; // Match your JWT_SECRET

// Generate a token with a 6-month expiration (15552000 seconds)
const token = jwt.sign(payload, secret, { expiresIn: 15552000 });

console.log("Generated Token:", token);
