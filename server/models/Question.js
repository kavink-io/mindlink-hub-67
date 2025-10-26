// server/models/Question.js
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true, // Remove leading/trailing whitespace
    },
    body: { // Optional longer description for the question
        type: String,
        required: false,
        trim: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId, // Link to the User model
        required: true,
        ref: 'User', // Reference the 'User' model
    },
    // We might store the author's display name at the time of posting
    // to avoid extra lookups later, especially if usernames can change.
    // For simplicity now, we'll just use the author ID.
    // authorDisplayName: {
    //     type: String,
    //     required: true,
    // }
    tags: [{ // Optional tags/keywords
        type: String,
        trim: true,
        lowercase: true,
    }],
    isAnswered: { // Flag to quickly see if a question has accepted answers (if implementing accepted answers)
        type: Boolean,
        default: false,
    },
    // You could add fields for upvotes/downvotes later
    // upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, {
    timestamps: true, // Adds createdAt and updatedAt
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;