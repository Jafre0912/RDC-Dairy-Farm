const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 5, // 5 attempts
  message: {
    status: "error",
    message: "Too many login attempts, please try again after 15 minutes",
  },
});

module.exports = { authLimiter };
