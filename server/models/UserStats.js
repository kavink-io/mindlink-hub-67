// server/models/UserStats.js
const mongoose = require('mongoose');

// Define possible badge types (can be expanded)
const badgeEnum = ['first_question', 'first_answer', 'helpful_answer_10', 'streak_3_days', 'streak_7_days'];

const userStatsSchema = new mongoose.Schema({
    user: { // Link to the User model
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        unique: true, // Each user should have only one stats document
    },
    questionsAsked: {
        type: Number,
        default: 0,
    },
    answersGiven: {
        type: Number,
        default: 0,
    },
    // For simplicity, we'll store badges as an array of strings.
    // A more complex system might use ObjectIds linking to a separate 'Badges' collection.
    earnedBadges: {
        type: [String],
        enum: badgeEnum, // Ensure badges are from the defined list
        default: [],
    },
    currentStreak: { // Number of consecutive days with activity
        type: Number,
        default: 0,
    },
    longestStreak: {
        type: Number,
        default: 0,
    },
    lastActivityDate: { // To calculate streaks
        type: Date,
    },
    // Optional: Points system
    // points: {
    //     type: Number,
    //     default: 0,
    // }
}, {
    timestamps: true, // Adds createdAt and updatedAt
});

// Helper method to add a badge if not already present
userStatsSchema.methods.addBadge = function (badgeName) {
    if (badgeEnum.includes(badgeName) && !this.earnedBadges.includes(badgeName)) {
        this.earnedBadges.push(badgeName);
        console.log(`User ${this.user}: Earned badge - ${badgeName}`);
        // Consider saving immediately or let the calling function save
        // await this.save(); // Uncomment if you want this method to auto-save
        return true; // Indicate badge was added
    }
    return false; // Badge not added (already exists or invalid)
};

// Method to update streak (simplified example)
// Call this whenever a user performs a significant action (login, post, etc.)
userStatsSchema.methods.updateActivityAndStreak = async function () {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to the beginning of the day

    if (this.lastActivityDate) {
        const lastActivity = new Date(this.lastActivityDate);
        lastActivity.setHours(0, 0, 0, 0); // Normalize last activity date

        const timeDiff = today.getTime() - lastActivity.getTime();
        const diffDays = Math.round(timeDiff / (1000 * 3600 * 24));

        if (diffDays === 1) {
            // Consecutive day
            this.currentStreak += 1;
        } else if (diffDays > 1) {
            // Streak broken
            this.currentStreak = 1; // Start new streak
        }
        // If diffDays === 0, activity is on the same day, do nothing to streak
    } else {
        // First activity
        this.currentStreak = 1;
    }

    // Update longest streak if current is greater
    if (this.currentStreak > this.longestStreak) {
        this.longestStreak = this.currentStreak;
    }

    this.lastActivityDate = new Date(); // Update last activity to now

    // Check for streak badges (Example)
    if (this.currentStreak >= 3) this.addBadge('streak_3_days');
    if (this.currentStreak >= 7) this.addBadge('streak_7_days');

    await this.save(); // Save changes
};


// Ensure user field is indexed for quick lookups
userStatsSchema.index({ user: 1 });

const UserStats = mongoose.model('UserStats', userStatsSchema);

module.exports = UserStats;