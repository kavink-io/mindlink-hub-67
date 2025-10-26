// server/models/QuizQuestion.js
const mongoose = require('mongoose');

// Sub-schema for answer options
const optionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
    },
    isCorrect: {
        type: Boolean,
        required: true,
        default: false,
    },
}, { _id: false }); // Don't create separate IDs for options within a question

const quizQuestionSchema = new mongoose.Schema({
    quiz: { // Link back to the parent Quiz
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Quiz',
    },
    questionText: {
        type: String,
        required: true,
        trim: true,
    },
    options: {
        type: [optionSchema], // Array of options
        required: true,
        validate: [
            // Ensure there's at least one correct answer and typically 2-4 options
            (options) => options.length >= 2 && options.some(opt => opt.isCorrect),
            'Must have at least 2 options and at least one correct answer.'
        ]
    },
    // Optional: Add question type (multiple choice, true/false) if needed later
    // questionType: { type: String, enum: ['multiple-choice', 'true-false'], default: 'multiple-choice' }
}, {
    timestamps: true,
});

// Index for faster lookup of questions by quiz ID
quizQuestionSchema.index({ quiz: 1 });

const QuizQuestion = mongoose.model('QuizQuestion', quizQuestionSchema);

module.exports = QuizQuestion;