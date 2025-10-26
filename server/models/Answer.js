// server/models/Answer.js
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    body: {
        type: String,
        required: true,
        trim: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    question: { // Link back to the Question this answers
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Question',
    },
    isAccepted: { // If you implement a feature for the question author to accept an answer
        type: Boolean,
        default: false,
    },
    // You could add fields for upvotes/downvotes later
    // upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, {
    timestamps: true,
});

// Optional: Add an index on the question field for faster answer lookups
answerSchema.index({ question: 1 });

const Answer = mongoose.model('Answer', answerSchema);

module.exports = Answer;