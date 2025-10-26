// server/routes/questionRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const UserStats = require('../models/UserStats');
const Report = require('../models/Report'); // Import Report model
const { protect, adminOnly } = require('../middleware/authMiddleware'); // Import authentication and admin middleware

const router = express.Router();

// --- Get or Create UserStats Helper ---
// Ensures a UserStats document exists for the given user ID.
const getOrCreateUserStats = async (userId) => {
    let stats = await UserStats.findOne({ user: userId });
    if (!stats) {
        console.log(`Creating UserStats for user: ${userId}`);
        stats = new UserStats({ user: userId });
        await stats.save();
    }
    return stats;
};

// --- Question Routes ---

// @desc    Create a new question
// @route   POST /api/questions
// @access  Private (requires login)
router.post('/', protect, async (req, res) => {
    const { title, body, tags } = req.body;

    if (!title) {
        return res.status(400).json({ message: 'Question title is required.' });
    }

    try {
        const question = new Question({
            title,
            body,
            tags: tags || [],
            author: req.user._id,
        });

        const createdQuestion = await question.save();

        // --- Update User Stats ---
        const stats = await getOrCreateUserStats(req.user._id);
        stats.questionsAsked += 1;
        stats.addBadge('first_question'); // Award badge
        await stats.updateActivityAndStreak(); // Update streak

        res.status(201).json(createdQuestion);
    } catch (error) {
        console.error("Error creating question:", error);
        res.status(500).json({ message: 'Server error creating question.' });
    }
});

// @desc    Get questions with pagination and search
// @route   GET /api/questions
// @access  Public (or Private)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search; // Get search term
        const skip = (page - 1) * limit;

        // Build query object for Mongoose
        let query = {};
        if (search) {
            // Case-insensitive search across title and body fields
            const regex = new RegExp(search, 'i');
            query = {
                $or: [
                    { title: { $regex: regex } },
                    { body: { $regex: regex } }
                ]
            };
        }

        // Get total count of documents matching the search filter
        const totalQuestions = await Question.countDocuments(query);
        const totalPages = Math.ceil(totalQuestions / limit);

        // Find questions for the current page
        const questions = await Question.find(query)
            .populate('author', 'name email role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            questions,
            currentPage: page,
            totalPages,
            totalQuestions,
        });
    } catch (error) {
        console.error("Error fetching questions:", error);
        res.status(500).json({ message: 'Server error fetching questions.' });
    }
});


// @desc    Get a single question by ID
// @route   GET /api/questions/:id
// @access  Public (or Private)
router.get('/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
             return res.status(404).json({ message: 'Question not found (invalid ID format)' });
        }
        const question = await Question.findById(req.params.id)
            .populate('author', 'name email role');

        if (question) {
            res.json(question);
        } else {
            res.status(404).json({ message: 'Question not found' });
        }
    } catch (error) {
        console.error("Error fetching question:", error);
        res.status(500).json({ message: 'Server error fetching question.' });
    }
});

// --- Answer Routes ---

// @desc    Create an answer for a specific question
// @route   POST /api/questions/:id/answers
// @access  Private
router.post('/:id/answers', protect, async (req, res) => {
    const { body } = req.body;
    const questionId = req.params.id;

    if (!body) {
        return res.status(400).json({ message: 'Answer body is required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
        return res.status(400).json({ message: 'Invalid Question ID format.' });
    }


    try {
        const questionExists = await Question.findById(questionId);
        if (!questionExists) {
            return res.status(404).json({ message: 'Question not found' });
        }

        const answer = new Answer({
            body,
            author: req.user._id,
            question: questionId,
        });

        const createdAnswer = await answer.save();

        // --- Update User Stats ---
        const stats = await getOrCreateUserStats(req.user._id);
        stats.answersGiven += 1;
        stats.addBadge('first_answer');
        if (stats.answersGiven >= 10) stats.addBadge('helpful_answer_10');
        await stats.updateActivityAndStreak();

        res.status(201).json(createdAnswer);

    } catch (error) {
        console.error("Error creating answer:", error);
        res.status(500).json({ message: 'Server error creating answer.' });
    }
});

// @desc    Get all answers for a specific question
// @route   GET /api/questions/:id/answers
// @access  Public (or Private)
router.get('/:id/answers', async (req, res) => {
    const questionId = req.params.id;
     if (!mongoose.Types.ObjectId.isValid(questionId)) {
        return res.status(400).json({ message: 'Invalid Question ID format.' });
    }
    try {
        const questionExists = await Question.findById(questionId);
        if (!questionExists) {
            return res.status(404).json({ message: 'Question not found' });
        }

        const answers = await Answer.find({ question: questionId })
            .populate('author', 'name email role')
            .sort({ createdAt: 'asc' });

        res.json(answers);
    } catch (error) {
        console.error("Error fetching answers:", error);
        res.status(500).json({ message: 'Server error fetching answers.' });
    }
});


// --- Admin Deletion Route for Questions ---
// @desc    Delete a question (Admin only)
// @route   DELETE /api/questions/:id
// @access  Private (Admins only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
    const questionId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
        return res.status(400).json({ message: 'Invalid Question ID format.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const question = await Question.findById(questionId).session(session);
        if (!question) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Question not found.' });
        }

        // 1. Delete associated answers
        await Answer.deleteMany({ question: questionId }).session(session);

        // 2. Delete associated reports
        await Report.deleteMany({ contentId: questionId, contentType: 'question' }).session(session);

        // 3. Delete the question itself
        await Question.deleteOne({ _id: questionId }).session(session);

        await session.commitTransaction();
        session.endSession();

        res.json({ message: 'Question and associated items deleted successfully.' });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error deleting question:", error);
        res.status(500).json({ message: 'Server error deleting question.' });
    }
});


// --- Admin Deletion Route for Answers ---
// @desc    Delete an answer (Admin only)
// @route   DELETE /api/questions/answers/:answerId
// @access  Private (Admins only)
router.delete('/answers/:answerId', protect, adminOnly, async (req, res) => {
    const answerId = req.params.answerId;

     if (!mongoose.Types.ObjectId.isValid(answerId)) {
        return res.status(400).json({ message: 'Invalid Answer ID format.' });
    }

     const session = await mongoose.startSession();
     session.startTransaction();

    try {
        const answer = await Answer.findById(answerId).session(session);
        if (!answer) {
             await session.abortTransaction();
             session.endSession();
            return res.status(404).json({ message: 'Answer not found.' });
        }

        // 1. Delete associated reports
         await Report.deleteMany({ contentId: answerId, contentType: 'answer' }).session(session);

        // 2. Delete the answer
        await Answer.deleteOne({ _id: answerId }).session(session);

        await session.commitTransaction();
        session.endSession();

        res.json({ message: 'Answer and associated reports deleted successfully.' });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error deleting answer:", error);
        res.status(500).json({ message: 'Server error deleting answer.' });
    }
});


module.exports = router;