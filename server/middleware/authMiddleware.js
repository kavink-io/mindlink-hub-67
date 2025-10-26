// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import User model to potentially fetch fresh user data
require('dotenv').config(); // Ensure JWT_SECRET is loaded

const protect = async (req, res, next) => {
    let token;

    // Check if the Authorization header exists and starts with 'Bearer'
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header (split 'Bearer TOKEN' and take the token part)
            token = req.headers.authorization.split(' ')[1];

            // Verify token using the secret
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch user details from DB using the ID from the token payload
            // Exclude the password field from being attached to the request
            // This ensures req.user has up-to-date info (e.g., if role/approval changed)
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                 // Handle case where user associated with token no longer exists
                 return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next(); // Proceed to the next middleware or route handler

        } catch (error) {
            console.error('Token verification failed:', error);
            // Handle specific errors like expired token
             if (error.name === 'TokenExpiredError') {
                 return res.status(401).json({ message: 'Not authorized, token expired' });
             }
             return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Optional Middleware: Restrict access to specific roles (e.g., admin)
// This should be used *after* the 'protect' middleware in the route definition
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next(); // User is admin, proceed
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' }); // Forbidden
    }
};

const teacherOnly = (req, res, next) => {
    if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) { // Admins can also do teacher actions
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as a teacher or admin' });
    }
};


module.exports = { protect, adminOnly, teacherOnly };