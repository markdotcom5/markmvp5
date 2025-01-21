const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authenticate");
const User = require("../models/User"); // User model
const Dashboard = require("../models/Dashboard"); // Optional Dashboard model (if applicable)

// Route for rendering the dynamically generated dashboard
router.get("/", authenticate, async (req, res) => {
    try {
        // Fetch user data from the database
        const user = await User.findById(req.user.id).lean();

        if (!user) {
            return res.status(404).send("User not found");
        }

        // Prepare data to render in the view
        const dashboardData = {
            name: user.name || "Explorer",
            rank: user.rank || "Unranked",
            score: user.score || 0,
            missions: user.missionsCompleted || 0,
            achievements: user.achievements || [],
            nextMission: user.nextMission || "No mission assigned",
        };

        // Render the dashboard view and pass the user data
        res.render("dashboard", dashboardData);
    } catch (error) {
        console.error("Error fetching dashboard data:", error.message);

        // Return a detailed error page or message to the user
        res.status(500).render("error", {
            message: "An error occurred while loading your dashboard. Please try again later.",
            error: error.message,
        });
    }
});

module.exports = router;
