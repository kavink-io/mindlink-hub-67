// server/routes/reportRoutes.js
const express = require('express');
const Report = require('../models/Report');
const Question = require('../models/Question'); // Needed for content deletion maybe
const Answer = require('../models/Answer');   // Needed for content deletion maybe
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// @desc    Create a new content report
// @route   POST /api/reports
// @access  Private (Logged-in users)
router.post('/', protect, async (req, res) => {
    const { contentType, contentId, reason } = req.body;

    // Validation
    if (!contentType || !contentId || !reason) {
        return res.status(400).json({ message: 'Content type, content ID, and reason are required.' });
    }
    if (!['question', 'answer'].includes(contentType)) {
         return res.status(400).json({ message: 'Invalid content type.' });
    }
    if (reason.length > 500) {
         return res.status(400).json({ message: 'Reason cannot exceed 500 characters.' });
    }

    try {
        // Optional: Check if the content actually exists before creating a report
        // let contentExists = null;
        // if (contentType === 'question') contentExists = await Question.findById(contentId);
        // else if (contentType === 'answer') contentExists = await Answer.findById(contentId);
        // if (!contentExists) return res.status(404).json({ message: 'Content to report not found.' });

        // Optional: Prevent duplicate reports by the same user for the same content?
        const existingReport = await Report.findOne({
            contentType,
            contentId,
            reportedBy: req.user._id,
            status: 'pending' // Only check pending reports
        });
        if (existingReport) {
            return res.status(400).json({ message: 'You have already reported this content.' });
        }


        const report = new Report({
            contentType,
            contentId,
            reason,
            reportedBy: req.user._id,
            // Add contentSnippet here if needed by fetching content
        });

        const createdReport = await report.save();
        res.status(201).json(createdReport);
    } catch (error) {
        console.error("Error creating report:", error);
         if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid content ID format.' });
        }
        res.status(500).json({ message: 'Server error creating report.' });
    }
});

// @desc    Get pending reports (for Admin)
// @route   GET /api/reports/pending
// @access  Private (Admins only)
router.get('/pending', protect, adminOnly, async (req, res) => {
    try {
        const pendingReports = await Report.find({ status: 'pending' })
            .populate('reportedBy', 'name email') // Show who reported it
            // We don't populate contentId here as it could be Question or Answer.
            // Fetch content details on the frontend if needed when viewing a specific report.
            .sort({ createdAt: 'asc' }); // Oldest first

        res.json(pendingReports);
    } catch (error) {
        console.error("Error fetching pending reports:", error);
        res.status(500).json({ message: 'Server error fetching pending reports.' });
    }
});

// @desc    Review/Update a report status (for Admin)
// @route   PATCH /api/reports/:id/review
// @access  Private (Admins only)
router.patch('/:id/review', protect, adminOnly, async (req, res) => {
    const { status, adminNotes } = req.body; // Expect 'reviewed_dismissed' or 'reviewed_action_taken'

    if (!status || !['reviewed_dismissed', 'reviewed_action_taken'].includes(status)) {
        return res.status(400).json({ message: 'Valid review status is required.' });
    }

    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ message: 'Report not found.' });
        }
         if (report.status !== 'pending') {
            return res.status(400).json({ message: 'Report has already been reviewed.' });
        }


        report.status = status;
        report.reviewedBy = req.user._id;
        report.reviewedAt = new Date();
        report.adminNotes = adminNotes || '';

        const updatedReport = await report.save();

         // **IMPORTANT**: If status is 'reviewed_action_taken', the admin should manually
         // delete the offending content (Question/Answer) via separate API calls
         // or this route could be extended to do that, but requires care.
         // Example (add with caution):
         /*
         if (updatedReport.status === 'reviewed_action_taken') {
             try {
                 if (updatedReport.contentType === 'question') {
                     await Question.findByIdAndDelete(updatedReport.contentId);
                 } else if (updatedReport.contentType === 'answer') {
                     await Answer.findByIdAndDelete(updatedReport.contentId);
                 }
                 console.log(`Action Taken: Deleted content ${updatedReport.contentType} ID ${updatedReport.contentId}`);
             } catch (deleteError) {
                 console.error("Failed to delete content after review:", deleteError);
                 // Decide if you should revert the report status or just log the error
             }
         }
         */

        res.json(updatedReport);

    } catch (error) {
        console.error("Error reviewing report:", error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Report not found (invalid ID format).' });
        }
        res.status(500).json({ message: 'Server error reviewing report.' });
    }
});


module.exports = router;