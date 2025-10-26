// server/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path'); // <-- Necessary for joining directory paths
const connectDB = require('./config/db');

// --- Import ALL Route Files ---
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const questionRoutes = require('./routes/questionRoutes');
const noteRoutes = require('./routes/noteRoutes'); // FIXED: Ensure this path is correct: ./routes/noteRoutes
const quizRoutes = require('./routes/quizRoutes'); 

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// --- Middleware ---
// Enable CORS for frontend communication
app.use(cors()); 
// Body parser for JSON requests
app.use(express.json()); 

// --- Serve Uploaded Files Statically ---
// Allows files in the 'uploads' folder to be accessible via /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic Route (Test)
app.get('/', (req, res) => {
    res.send('MindLink API is running...');
});

// --- Use API Routes (Mounting) ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/notes', noteRoutes); // Mounted under /api/notes
app.use('/api/quizzes', quizRoutes);

// --- Simple Error Handling Middleware (Optional) ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));