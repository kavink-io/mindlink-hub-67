// server/server.js

const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const quizRoutes = require('./routes/quizRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
// This route was in your folder but not being used, let's add it
const questionRoutes = require('./routes/questionRoutes'); 
const path = require('path');
const cors = require('cors');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Enable CORS
app.use(cors());

// Enable JSON body parser
app.use(express.json());

// --- API Routes ---
// We load authRoutes first, as it's a common dependency
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/questions', questionRoutes); // Use the questions route

// --- Static File Serving (for file uploads) ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Deployment (Serve frontend build) ---
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist'))); // Adjust if your frontend build is elsewhere

    app.get('*', (req, res) =>
        res.sendFile(path.resolve(__dirname, '../dist', 'index.html'))
    );
} else {
    app.get('/', (req, res) => {
        res.send('API is running...');
    });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});