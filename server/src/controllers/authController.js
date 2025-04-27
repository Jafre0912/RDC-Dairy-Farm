const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { User } = require("../models/index");

// Helper function to create and send token
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
      version: user.tokenVersion, // Add token version for invalidation
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "30d" }
  );

  // Cookie options
  const cookieOptions = {
    expires: new Date(
      Date.now() +
        (parseInt(process.env.JWT_COOKIE_EXPIRE) || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  // Set cookie
  res.cookie("token", token, cookieOptions);

  // Return response
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

//-----------------//
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists via email
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      role: role || "farmer", // Default role is now farmer instead of user
    });

    // Hash password via pre-save middleware
    await user.save();

    // Send token response
    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error("Error in register:", error);
    res.status(500).json({ error: "Server error" });
  }
};

//-----------------//
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Please provide email and password" });
    }

    // Check if user exists
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if user is active
    if (user.active === false) {
      return res
        .status(401)
        .json({ error: "This account has been deactivated" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Send token response
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ error: "Server error" });
  }
};

//-----------------//
// @desc    Logout user
// @route   GET /api/auth/logout
// @access  Public
exports.logout = async (req, res) => {
  try {
    // Clear the cookie
    res.cookie("token", "", {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logout:", error);
    res.status(500).json({ error: "Server error" });
  }
};

//-----------------//
// @desc    Forgot password - Generate reset token
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate password reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send reset token via email (implement email service here)
    console.log(`Password reset token: ${resetToken}`);

    res.status(200).json({
      success: true,
      message: "Password reset token sent to email",
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Reset password
// @route   PATCH /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash the token to compare with stored token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user by reset token and check expiration
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Update password and clear reset token
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // Increment token version to invalidate existing JWTs
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    await user.save();

    // Send token response
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Get current user's profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error in getMe:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Update current user's profile
// @route   PUT /api/auth/update-me
// @access  Private
exports.updateMe = async (req, res) => {
  try {
    const { name, email } = req.body;

    // Fields to update
    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (email) fieldsToUpdate.email = email;

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error in updateMe:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Please provide current password and new password",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword;

    // Increment token version to invalidate existing JWTs
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    await user.save();

    // Send new token
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error("Error in changePassword:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Delete current user's account
// @route   DELETE /api/auth/delete-me
// @access  Private
exports.deleteMe = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { active: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Increment token version to invalidate existing JWTs
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    // Clear cookie
    res.cookie("token", "", {
      expires: new Date(0),
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (error) {
    console.error("Error in deleteMe:", error);
    res.status(500).json({ error: "Server error" });
  }
};
