// server/models/Report.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    contentType: { // Type of content being reported
        type: String,
        required: true,
        enum: ['question', 'answer'],
    },
    contentId: { // ID of the specific question or answer
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        // We can't directly use 'ref' here easily as it could be 'Question' or 'Answer'
        // We'll handle population based on contentType in the route if needed
    },
    reportedBy: { // User who submitted the report
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    reason: { // Reason provided by the reporter
        type: String,
        required: true,
        trim: true,
        maxlength: 500, // Limit reason length
    },
    // Optional: Store a snippet of the reported content for admin quick view
    // contentSnippet: {
    //     type: String,
    //     maxlength: 200,
    // },
    status: { // Status of the report
        type: String,
        required: true,
        enum: ['pending', 'reviewed_dismissed', 'reviewed_action_taken'],
        default: 'pending',
    },
    reviewedBy: { // Admin who reviewed the report
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    reviewedAt: {
        type: Date,
    },
    adminNotes: { // Optional notes from the admin during review
        type: String,
        trim: true,
    },
}, {
    timestamps: true, // Adds createdAt (when reported) and updatedAt
});

// Indexes for efficient querying
reportSchema.index({ status: 1, createdAt: -1 }); // For fetching pending reports
reportSchema.index({ contentId: 1, contentType: 1 }); // For finding reports related to specific content


const Report = mongoose.model('Report', reportSchema);

module.exports = Report;