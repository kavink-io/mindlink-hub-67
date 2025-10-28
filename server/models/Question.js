// server/models/Question.js
// (This is the corrected code to fix the server error)

const mongoose = require('mongoose');
const { Schema } = mongoose;

// This schema matches the data used in 'server/routes/questionRoutes.js'
const QuestionSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Question title is required'],
    },
    body: {
        type: String,
        // Optional
    },
    tags: {
        type: [String], // An array of strings
        default: [],
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // This field can be used later to link answers
    answers: [{
        type: Schema.Types.ObjectId,
        ref: 'Answer',
    }],
}, { timestamps: true }); // Adds createdAt and updatedAt

module.exports = mongoose.model('Question', QuestionSchema);