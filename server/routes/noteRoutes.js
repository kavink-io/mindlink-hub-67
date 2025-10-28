// server/routes/noteRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Core Node.js module
const mongoose = require('mongoose'); 
const Note = require('../models/Note');
const { protect, teacherOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// --- Multer Configuration ---

// Define storage settings
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure 'uploads' directory exists
        const dir = 'uploads/';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        cb(null, dir); 
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter (Allow PDF, DOCX, PPTX)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /pdf|docx|pptx|application\/pdf|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/vnd\.openxmlformats-officedocument\.presentationml\.presentation/;
    
    // Check both mimetype and file extension
    const isAllowed = allowedTypes.test(file.mimetype) || allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (isAllowed) {
        return cb(null, true);
    } else {
        // Pass a custom Error object for file type rejection
        cb(new Error('InvalidFileType: File upload only supports PDF, DOCX, PPTX formats!'), false);
    }
};

// Initialize multer upload middleware (but do not call .single() yet)
const uploadMiddleware = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter
}).single('noteFile'); // 'noteFile' matches the frontend FormData key


// --- Note Routes ---

// @desc    Upload a new note (file + details)
// @route   POST /api/notes/upload
// @access  Private (Teachers/Admins only)
router.post(
    '/upload',
    protect,          // 1. Check if logged in
    teacherOnly,      // 2. Check if user is teacher or admin
    (req, res, next) => { // 3. NEW: Multer wrapper for custom error handling
        uploadMiddleware(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                // Multer error (e.g., file size limit)
                return res.status(400).json({ message: 'Upload Failed: File is too large (Max 10MB).' });
            } else if (err && err.message.startsWith('InvalidFileType:')) {
                // Custom file filter error
                return res.status(400).json({ message: err.message });
            } else if (err) {
                // An unknown upload error
                return res.status(500).json({ message: 'An unknown upload error occurred.' });
            }
            // Everything fine, proceed to next handler
            next();
        });
    },
    async (req, res) => { // 4. Final route handler
        const { title, description } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Note title and file are required.' });
        }
        
        if (!title) {
            // Delete file if metadata is missing
            try { fs.unlinkSync(req.file.path); } catch (e) { console.error("Error deleting file:", e); }
            return res.status(400).json({ message: 'Note title is required.' });
        }


        try {
            const note = new Note({
                title,
                description: description || '',
                filePath: req.file.path, 
                fileName: req.file.originalname,
                fileType: req.file.mimetype,
                uploadedBy: req.user._id,
            });

            const createdNote = await note.save();
            res.status(201).json(createdNote);
        } catch (error) {
             // If DB save fails, delete the uploaded file
             try { fs.unlinkSync(req.file.path); } catch (e) { console.error("Error deleting file after DB error:", e); }
            console.error("Error creating note entry:", error);
            res.status(500).json({ message: 'Server error saving note details.' });
        }
    }
);


// @desc    Get all notes
// @route   GET /api/notes
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        // Find all notes, sort by newest, and populate the 'name' of the uploader
        const notes = await Note.find({})
            .populate('uploadedBy', 'name')
            .sort({ createdAt: -1 });
        res.json(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ message: 'Server error while fetching notes.' });
    }
});

// @desc    Download a specific note file
// @route   GET /api/notes/download/:id
// @access  Private
router.get('/download/:id', protect, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid Note ID.' });
        }
        
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ message: 'Note not found.' });
        }

        // Check if file exists before attempting to send
        if (!fs.existsSync(note.filePath)) {
            console.error(`File not found at path: ${note.filePath}`);
            return res.status(404).json({ message: 'File not found on server. It may have been deleted.' });
        }

        // Send the file for download, using original name
        res.download(note.filePath, note.fileName, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                // Headers might already be sent, so just log error
            }
        });

    } catch (error) {
        console.error('Error downloading note:', error);
        res.status(500).json({ message: 'Server error while downloading note.' });
    }
});

// @desc    Delete a note and its associated file
// @route   DELETE /api/notes/:id
// @access  Private (Teachers/Admins)
router.delete('/:id', protect, teacherOnly, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid Note ID.' });
        }

        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ message: 'Note not found.' });
        }

        // --- Delete the file from the filesystem ---
        // Check if file exists before trying to delete
        if (fs.existsSync(note.filePath)) {
            fs.unlink(note.filePath, (err) => {
                if (err) {
                    // Log the error but proceed to delete DB entry anyway
                    console.error('Error deleting file from disk:', err);
                } else {
                    console.log(`Successfully deleted file: ${note.filePath}`);
                }
            });
        } else {
             console.warn(`File not found for deletion, removing DB entry: ${note.filePath}`);
        }

        // --- Delete the note from the database ---
        await note.deleteOne(); // Use deleteOne() on the document instance

        res.json({ message: 'Note removed successfully.' });

    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ message: 'Server error while deleting note.' });
    }
});


module.exports = router;