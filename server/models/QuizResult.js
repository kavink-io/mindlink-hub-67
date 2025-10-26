// server/models/QuizResult.js
const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema({
    quiz: { // Link to the Quiz
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Quiz',
    },
    user: { // Link to the User who took the quiz
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    score: { // Number of correct answers
        type: Number,
        required: true,
    },
    totalQuestions: { // Total questions in the quiz at the time of submission
        type: Number,
        required: true,
    },
    // Store the user's answers for review purposes
    // Format: { questionId: selectedOptionId }
    answers: {
        type: Map,
        of: String, // Mongoose Map stores key-value pairs
        required: true,
    },
    // Optional: Store percentage, grade, etc.
    // percentage: { type: Number }
}, {
    timestamps: true, // Records when the quiz was submitted
});

// Index for faster lookup of results by user or quiz
quizResultSchema.index({ user: 1 });
quizResultSchema.index({ quiz: 1 });
// Compound index if needed often
quizResultSchema.index({ quiz: 1, user: 1 });

const QuizResult = mongoose.model('QuizResult', quizResultSchema);

module.exports = QuizResult;