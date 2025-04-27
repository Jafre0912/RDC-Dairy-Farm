const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { protect } = require("../middlewares/auth");
const User = require("../models/userSchema");
const router = express.Router();
const jwt = require("jsonwebtoken");

/**
 * Authentication Routes
 */

// Register new user
router.post(
  "/register",
  [
    body("name")
      .trim()
      .not()
      .isEmpty()
      .withMessage("Name is required")
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters"),
    body("email")
      .isEmail()
      .withMessage("Please provide a valid email address")
      .normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/\d/)
      .withMessage("Password must contain a number")
      .matches(/[A-Z]/)
      .withMessage("Password must contain an uppercase letter"),
    body("role").optional().isIn(["admin", "manager", "worker", "farmer", "distributor", "retailer"]),
  ],
  authController.register
);

// Login user
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please provide a valid email address")
      .normalizeEmail(),
    body("password").not().isEmpty().withMessage("Password is required"),
  ],
  authController.login
);

// Logout user
router.get("/logout", authController.logout);

// Password reset flow
router.post(
  "/forgot-password",
  [
    body("email")
      .isEmail()
      .withMessage("Please provide a valid email address")
      .normalizeEmail(),
  ],
  authController.forgotPassword
);

router.patch(
  "/reset-password/:token",
  [
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/\d/)
      .withMessage("Password must contain a number")
      .matches(/[A-Z]/)
      .withMessage("Password must contain an uppercase letter"),
    body("passwordConfirm").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password confirmation does not match password");
      }
      return true;
    }),
  ],
  authController.resetPassword
);

// Protected routes - require authentication
router.use(protect);

// Get current user profile
router.get("/me", authController.getMe);

// Update user profile
router.put(
  "/update-me",
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters"),
    body("email")
      .optional()
      .isEmail()
      .withMessage("Please provide a valid email address")
      .normalizeEmail(),
  ],
  authController.updateMe
);

// Change password
router.put(
  "/change-password",
  [
    body("currentPassword")
      .not()
      .isEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/\d/)
      .withMessage("Password must contain a number")
      .matches(/[A-Z]/)
      .withMessage("Password must contain an uppercase letter"),
    body("passwordConfirm").custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Password confirmation does not match new password");
      }
      return true;
    }),
  ],
  authController.changePassword
);

// Delete/deactivate user account
router.delete("/delete-me", authController.deleteMe);

// TEMPORARY ROUTE - REMOVE IN PRODUCTION
router.get('/make-admin/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'User not found' 
      });
    }
    
    // Update user role to admin
    user.role = 'admin';
    await user.save();
    
    return res.status(200).json({ 
      status: 'success', 
      message: `User ${email} has been promoted to admin role`,
      data: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Server error' 
    });
  }
});

// Add this route to check current user role
router.get('/check-role', async (req, res) => {
  try {
    // Check for authentication token
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authenticated',
        isAdmin: false
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('name email role');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
        isAdmin: false
      });
    }

    // Return user role information
    return res.status(200).json({
      status: 'success',
      message: 'User role information',
      data: {
        name: user.name,
        email: user.email, 
        role: user.role,
        isAdmin: user.role === 'admin'
      }
    });
  } catch (error) {
    console.error('Error checking role:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error checking user role',
      error: error.message
    });
  }
});

module.exports = router;
