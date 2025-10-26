// server/routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import the User model

const router = express.Router();

// --- Signup Route ---
router.post('/signup', async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user (password hashing happens via pre-save hook in model)
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'student', // Default to student if no role provided
            approved: role === 'admin' ? false : true, // Example: Auto-approve students/teachers, admins need manual
        });

        if (user) {
            // Respond without token, user needs approval/email confirmation first
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                approved: user.approved,
                message: user.approved
                    ? "Signup successful!"
                    : "Signup successful! Account requires admin approval."
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: 'Server error during signup' });
    }
});

// --- Login Route ---
router.post('/login', async (req, res) => {
    const { email, password, role: requestedRole } = req.body; // 'role' might be passed from frontend dropdown

    try {
        const user = await User.findOne({ email });

        if (!user) {
             return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
             return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if approved (implement your approval logic)
        if (!user.approved) {
            return res.status(403).json({ message: 'Account not yet approved by admin.' });
        }

         // Check if the role matches the one selected during login (optional but good practice)
         // You might skip this if you trust the fetched role solely.
         if (requestedRole && user.role !== requestedRole) {
             console.warn(`Role mismatch during login for ${email}. Selected: ${requestedRole}, Actual: ${user.role}`);
             // Decide how to handle: deny login or proceed with actual role?
             // For now, let's deny to match the initial UI intent.
             return res.status(401).json({ message: `Login failed. Role mismatch.` });
         }


        // Generate JWT Token
        const token = jwt.sign(
            { id: user._id, role: user.role }, // Payload
            process.env.JWT_SECRET,             // Secret
            { expiresIn: '1d' }                 // Options (e.g., expires in 1 day)
        );

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: token, // Send the token to the client
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// --- Add Logout Route (Optional Server-Side Handling) ---
// Often, logout is handled purely on the client by deleting the token.
// router.post('/logout', (req, res) => {
//   // If using server-side sessions or refresh tokens, invalidate them here.
//   res.json({ message: 'Logout successful' });
// });


module.exports = router;