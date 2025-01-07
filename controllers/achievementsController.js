exports.getUserData = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('name email subscription');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    } catch (error) {
        console.error('Error fetching user data:', error.message);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
};
