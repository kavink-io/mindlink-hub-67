// server/routes/quizRoutes.js
const express = require('express');
const mongoose = require('mongoose'); // Needed for ObjectId validation and Session
const Quiz = require('../models/Quiz');
const QuizQuestion = require('../models/QuizQuestion');
const QuizResult = require('../models/QuizResult'); // Import QuizResult model

// Import the entire object instead of destructuring
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// @desc    Create a new quiz with questions
// @route   POST /api/quizzes
// @access  Private (Teachers/Admins only)
router.post('/', authMiddleware.protect, authMiddleware.teacherOnly, async (req, res) => {
    const { title, description, questions } = req.body; // Expect questions as an array

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: 'Quiz title and at least one question are required.' });
    }

    // --- Basic validation for incoming questions ---
    for (const q of questions) {
        if (!q.questionText || !q.options || !Array.isArray(q.options) || q.options.length < 2 || !q.options.some(opt => opt.isCorrect)) {
             return res.status(400).json({ message: 'Each question must have text, at least 2 options, and one correct answer.' });
        }
        for (const opt of q.options) {
            if (typeof opt.text !== 'string' || opt.text.trim() === '' || typeof opt.isCorrect !== 'boolean') {
                return res.status(400).json({ message: 'Invalid option format within a question (text missing or isCorrect is not boolean).' });
            }
        }
    }
    // --- End Basic Validation ---


    const session = await mongoose.startSession(); // Use transaction for multi-document creation
    session.startTransaction();

    try {
        // 1. Create the Quiz document
        const quiz = new Quiz({
            title,
            description: description || '',
            createdBy: req.user._id,
        });
        const createdQuiz = await quiz.save({ session });

        // 2. Prepare QuizQuestion documents, linking them to the created Quiz
        const questionDocs = questions.map(q => ({
            quiz: createdQuiz._id, // Link to the new quiz
            questionText: q.questionText,
            options: q.options.map(opt => ({ text: opt.text, isCorrect: opt.isCorrect })),
        }));

        // 3. Insert all QuizQuestion documents
        const createdQuestions = await QuizQuestion.insertMany(questionDocs, { session });

        // If all operations succeed, commit the transaction
        await session.commitTransaction();

        res.status(201).json({ quiz: createdQuiz, questions: createdQuestions });

    } catch (error) {
        // If any operation fails, abort the transaction
        await session.abortTransaction();
        console.error("Error creating quiz:", error);
        if (error.name === 'ValidationError') {
             return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error creating quiz.' });
    } finally {
         // End the session
        session.endSession();
    }
});


// @desc    Get all quizzes (without questions, just titles/metadata)
// @route   GET /api/quizzes
// @access  Private (Adjust as needed - e.g., all logged-in users)
router.get('/', authMiddleware.protect, async (req, res) => {
    try {
        const quizzes = await Quiz.find({})
            .populate('createdBy', 'name') // Populate creator's name
            .sort({ createdAt: -1 });
        res.json(quizzes);
    } catch (error) {
        console.error("Error fetching quizzes:", error);
        res.status(500).json({ message: 'Server error fetching quizzes.' });
    }
});

// @desc    Get a single quiz details (metadata only)
// @route   GET /api/quizzes/:id
// @access  Private (Adjust as needed)
router.get('/:id', authMiddleware.protect, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Quiz not found (invalid ID format)' });
        }

        // --- Fetch Quiz Metadata ---
        const quiz = await Quiz.findById(req.params.id)
             .populate('createdBy', 'name') // Keep populating creator name
             .lean(); // Use lean for faster plain JS object

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // --- Fetch Associated Questions (excluding correct answer info) ---
        const questions = await QuizQuestion.find({ quiz: req.params.id })
            .select('-quiz -options.isCorrect') // Exclude quiz ID and correct answer flag
            .lean(); // Use lean

        // --- Combine quiz metadata and questions ---
        const quizDataWithQuestions = {
            ...quiz,
            questions: questions // Attach the fetched questions array
        };

        res.json(quizDataWithQuestions); // Send the combined object

    } catch (error) {
        // ... (keep existing catch block)
         console.error("Error fetching quiz details:", error);
         if (error.kind === 'ObjectId') {
             return res.status(404).json({ message: 'Quiz not found (invalid ID format)' });
         }
         res.status(500).json({ message: 'Server error fetching quiz details.' });
    }
});

// @desc    Get questions for a specific quiz
// @route   GET /api/quizzes/:id/questions
// @access  Private (Adjust as needed - e.g., only creator or enrolled students?)
router.get('/:id/questions', authMiddleware.protect, async (req, res) => {
     try {
         if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
             return res.status(404).json({ message: 'Quiz not found (invalid ID format)' });
         }
         // Optional: Check if quiz exists first
         const quizExists = await Quiz.findById(req.params.id);
         if (!quizExists) {
            return res.status(404).json({ message: 'Quiz not found' });
         }

        // --- Determine if user is creator ---
         const isCreator = quizExists.createdBy.toString() === req.user._id.toString();

        // Find questions linked to this quiz ID
        let questionsQuery = QuizQuestion.find({ quiz: req.params.id });

        // Exclude correct answer details ONLY if the user is NOT the creator
         if (!isCreator) {
             questionsQuery = questionsQuery.select('-quiz -options.isCorrect');
         } else {
              questionsQuery = questionsQuery.select('-quiz');
         }

        const questions = await questionsQuery;

        res.json(questions);

    // --- THIS IS THE FIX ---
    // Added the missing '{' brace
    } catch (error) {
        console.error("Error fetching quiz questions:", error);
         if (error.kind === 'ObjectId') {
             return res.status(404).json({ message: 'Quiz not found (invalid ID format)' });
        }
        res.status(500).json({ message: 'Server error fetching quiz questions.' });
    }
});

// @desc    Submit answers for a quiz and get results
// @route   POST /api/quizzes/:id/submit
// @access  Private (Logged-in users)
router.post('/:id/submit', authMiddleware.protect, async (req, res) => {
    const quizId = req.params.id;
    const userAnswers = req.body.answers || {};
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
        return res.status(400).json({ message: 'Invalid Quiz ID format.' });
    }
    if (typeof userAnswers !== 'object' || userAnswers === null || Object.keys(userAnswers).length === 0) {
         return res.status(400).json({ message: 'Invalid or empty answers format submitted.' });
    }


    try {
        // 1. Fetch the quiz questions with correct answers (needed for scoring)
        const questions = await QuizQuestion.find({ quiz: quizId }).select('options');

        if (!questions || questions.length === 0) {
            return res.status(404).json({ message: 'Quiz not found or has no questions.' });
        }

        // 2. Calculate the score
        let score = 0;
        const correctAnswersMap = {};

        questions.forEach(q => {
            const correctAnswer = q.options.find(opt => opt.isCorrect);
            if (correctAnswer && correctAnswer._id) {
                const correctOptionId = correctAnswer._id.toString();
                correctAnswersMap[q._id.toString()] = correctOptionId;

                const userAnswerOptionId = userAnswers[q._id.toString()];
                if (userAnswerOptionId && userAnswerOptionId === correctOptionId) {
                    score++;
                }
            } else {
                 console.warn(`Question ${q._id} in quiz ${quizId} has no correct answer marked or option lacks _id.`);
            }
        });

        // 3. Save the result to the database
        const totalQuestions = questions.length;
        const result = await QuizResult.findOneAndUpdate(
            { quiz: quizId, user: userId },
            { 
                 score,
                 totalQuestions,
                 answers: userAnswers,
                 $setOnInsert: { quiz: quizId, user: userId }
            },
            { new: true, upsert: true, runValidators: true }
        );

        // 4. Return the results
        res.json({
            quizId,
            userId,
            score,
            totalQuestions,
            submittedAnswers: userAnswers,
            correctAnswers: correctAnswersMap,
            resultId: result._id
        });

    } catch (error) {
        console.error(`Error submitting quiz ${quizId} for user ${userId}:`, error);
        res.status(500).json({ message: 'Server error processing quiz submission.' });
    }
});


// --- NEW: Delete Quiz Route ---
// @desc    Delete a quiz and all associated data (Questions and Results)
// @route   DELETE /api/quizzes/:id
// @access  Private (Teachers/Admins only)
router.delete('/:id', authMiddleware.protect, authMiddleware.teacherOnly, async (req, res) => {
    const quizId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
        return res.status(400).json({ message: 'Invalid Quiz ID format.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const quiz = await Quiz.findById(quizId).session(session);

        if (!quiz) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Quiz not found.' });
        }

        // 1. Delete associated Quiz Questions
        await QuizQuestion.deleteMany({ quiz: quizId }).session(session);

        // 2. Delete associated Quiz Results
        await QuizResult.deleteMany({ quiz: quizId }).session(session);

        // 3. Delete the Quiz document itself
        await Quiz.deleteOne({ _id: quizId }).session(session);

        await session.commitTransaction();
        session.endSession();

        res.json({ message: 'Quiz and all associated data deleted successfully.' });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error deleting quiz:", error);
        res.status(500).json({ message: 'Server error deleting quiz.' });
    }
});

// @desc    Get all quizzes by a teacher AND all results for each quiz
// @route   GET /api/quizzes/my-quizzes-with-results
// @access  Private (Teacher)
router.get('/my-quizzes-with-results', authMiddleware.protect, authMiddleware.teacherOnly, async (req, res) => {
    try {
        const teacherId = req.user._id;

        // 1. Find all quizzes created by this teacher
        const quizzes = await Quiz.find({ createdBy: teacherId })
                                  .sort({ createdAt: -1 })
                                  .lean(); // Use .lean() for plain JS objects

        if (!quizzes.length) {
            return res.json([]);
        }

        // 2. For each quiz, find all results and populate student names
        const quizzesWithResults = await Promise.all(quizzes.map(async (quiz) => {
            const results = await QuizResult.find({ quiz: quiz._id })
                .populate('student', 'name') // Populate student's name
                .sort({ score: -1 }) // Show highest scores first
                .lean();

            return {
                ...quiz,
                results,
                participantCount: results.length
            };
        }));

        res.json(quizzesWithResults);

    } catch (error) {
        console.error('Error fetching teacher quizzes with results:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;