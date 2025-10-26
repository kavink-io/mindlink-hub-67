// server/models/Note.js
const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: { // Optional description
        type: String,
        trim: true,
    },
    filePath: { // Path where the file is stored (relative or absolute, depending on setup)
        type: String,
        required: true,
    },
    fileName: { // Original name of the uploaded file
        type: String,
        required: true,
    },
    fileType: { // Mime type (e.g., 'application/pdf')
        type: String,
        required: true,
    },
    uploadedBy: { // Link to the teacher/admin who uploaded it
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    // Optional: Link to specific class/subject if needed
    // classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' }
}, {
    timestamps: true, // Adds createdAt and updatedAt
});

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;