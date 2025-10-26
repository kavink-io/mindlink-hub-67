// server/models/Quiz.js
const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    createdBy: { // Link to the teacher/admin who created it
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    // Optional: Link to class/subject
    // classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' }

    // We won't embed questions directly to keep the Quiz document smaller,
    // especially if quizzes can have many questions. We'll query QuizQuestions separately.

}, {
    timestamps: true,
});

// If a quiz is deleted, we might want to delete its associated questions too.
// This can be handled via middleware or application logic.
// Example using middleware (add carefully, consider implications):
/*
quizSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    console.log(`Deleting questions for quiz: ${this._id}`);
    try {
        await mongoose.model('QuizQuestion').deleteMany({ quiz: this._id });
        next();
    } catch (error) {
        console.error("Error deleting associated quiz questions:", error);
        next(error); // Pass error to stop deletion if needed
    }
});
*/

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;