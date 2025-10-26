// server/routes/userRoutes.js
const express = require('express');
const { protect, adminOnly } = require('../middleware/authMiddleware'); // Import protect & adminOnly
const User = require('../models/User'); // Import User model
const UserStats = require('../models/UserStats'); // <-- Import UserStats

const router = express.Router();

// --- Get or Create UserStats Helper ---
// (Could be moved to a separate utility file)
const getOrCreateUserStats = async (userId) => {
    let stats = await UserStats.findOne({ user: userId });
    if (!stats) {
        console.log(`Creating UserStats for user: ${userId}`);
        stats = new UserStats({ user: userId });
        await stats.save();
    }
    return stats;
};

// --- Existing Routes ---

// GET /api/users/profile - Get current logged-in user's profile
router.get('/profile', protect, (req, res) => {
     if (req.user) {
        res.json({
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            approved: req.user.approved,
        });
    } else {
        // This case should technically be handled by 'protect' sending 401
        res.status(404).json({ message: 'User not found' });
    }
});

// GET /api/users/all - Admin-only route to get all users
router.get('/all', protect, adminOnly, async (req, res) => {
     try {
        const users = await User.find({}).select('-password'); // Exclude passwords
        res.json(users);
    } catch (error) {
         console.error("Error fetching all users:", error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// GET /api/users/pending - Admin-only route to get users needing approval
router.get('/pending', protect, adminOnly, async (req, res) => {
    try {
        // Find users where approved is false, exclude password
        const pendingUsers = await User.find({ approved: false }).select('-password');
        res.json(pendingUsers);
    } catch (error) {
        console.error("Error fetching pending users:", error);
        res.status(500).json({ message: 'Server error fetching pending users.' });
    }
});

// PATCH /api/users/:id/approve - Admin-only route to approve a user
router.patch('/:id/approve', protect, adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Don't allow re-approving already approved users via this route unnecessarily
        if (user.approved) {
             return res.status(400).json({ message: 'User is already approved' });
        }

        user.approved = true;
        const updatedUser = await user.save();

        // Also ensure stats document exists upon approval
        await getOrCreateUserStats(updatedUser._id);

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            approved: updatedUser.approved,
            message: `User ${updatedUser.name} approved successfully.`
        });

    } catch (error) {
        console.error("Error approving user:", error);
         if (error.kind === 'ObjectId') {
             return res.status(404).json({ message: 'User not found (invalid ID format)' });
        }
        res.status(500).json({ message: 'Server error approving user.' });
    }
});

// DELETE /api/users/:id - Admin-only route to delete/reject a user
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Also delete associated UserStats if the user is fully deleted
        await UserStats.deleteOne({ user: req.params.id });
        await User.deleteOne({ _id: req.params.id });

        res.json({ message: `User ${user.name} removed successfully.` });

    } catch (error) {
        console.error("Error removing user:", error);
        if (error.kind === 'ObjectId') {
             return res.status(404).json({ message: 'User not found (invalid ID format)' });
        }
        res.status(500).json({ message: 'Server error removing user.' });
    }
});

// --- New Route for User Stats ---

// @desc    Get stats for the logged-in user
// @route   GET /api/users/stats/me
// @access  Private
router.get('/stats/me', protect, async (req, res) => {
    try {
        // Use our helper to ensure stats doc exists
        const stats = await getOrCreateUserStats(req.user._id);

        // Optionally call updateActivityAndStreak on fetch if login counts as activity
        // Be careful: this could increment streak just by viewing dashboard
        // await stats.updateActivityAndStreak();

        res.json({
            _id: stats._id, // Include stats ID if needed
            user: stats.user,
            questionsAsked: stats.questionsAsked,
            answersGiven: stats.answersGiven,
            earnedBadges: stats.earnedBadges,
            currentStreak: stats.currentStreak,
            longestStreak: stats.longestStreak,
            lastActivityDate: stats.lastActivityDate,
            // points: stats.points, // If using points
        });
    } catch (error) {
        console.error("Error fetching user stats:", error);
        res.status(500).json({ message: 'Server error fetching user stats.' });
    }
});


module.exports = router;