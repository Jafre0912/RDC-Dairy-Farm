const jwt = require("jsonwebtoken");
const User = require("../models/userSchema");

const protect = async (req, res, next) => {
  try {
    console.log('Auth middleware triggered');
    let token;

    // Get token from Authorization header (Bearer token)
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      console.log('Found Bearer token in Authorization header');
      token = req.headers.authorization.split(' ')[1];
    } 
    // Check for token in cookies (alternative method)
    else if (req.cookies && req.cookies.token) {
      console.log('Found token in cookies');
      token = req.cookies.token;
    }

    // Check if no token
    if (!token) {
      console.log('No token found, returning 401');
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to access this route'
      });
    }

    // Verify token
    try {
      console.log('Verifying token...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token verified, decoded user ID:', decoded.id);

      // Get user from the token
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        console.log('User not found with decoded ID');
        return res.status(401).json({
          status: 'error',
          message: 'User not found'
        });
      }

      // Log user info for debugging
      console.log(`Auth successful - User: ${user.name}, Email: ${user.email}, Role: ${user.role || 'none'}`);

      // Add user to request
      req.user = user;
      console.log('Auth successful, user added to request');
      next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized, invalid token'
      });
    }
  } catch (error) {
    console.error('Error in auth middleware:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error in authentication'
    });
  }
};

// Middleware to restrict access to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array ['admin', 'farmer', etc]
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
};

const csrfProtection = async (req, res, next) => {
  const token = req.headers["x-csrf-token"];

  if (!token || token !== req.session.csrfToken) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }

  next();
};

// Middleware specifically for admin access
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'User not authenticated'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Admin access required for this resource'
    });
  }

  next();
};

module.exports = { protect, restrictTo, csrfProtection, isAdmin };
