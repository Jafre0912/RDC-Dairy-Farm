const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const connectDB = require("./config/db");
const { authLimiter } = require("./security/rateLimit");
const { sanitizeInput, sanitizeMongo } = require("./security/sanitize");
const routes = require("./routes/index");
require("dotenv").config(); // Make sure dotenv is loaded

const app = express();

// MongoDB Connection Setup
connectDB()
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173", // Client URL from environment
    credentials: true, // Allow cookies
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Allow necessary methods
    allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"], // Allow required headers
  })
);
app.use(sanitizeMongo); // MongoDB sanitation
app.use(sanitizeInput); // Input sanitation
app.use(cookieParser());
app.use(express.json({ limit: "10kb" })); // Limit payload size to avoid overload
app.use(express.urlencoded({ extended: true }));

// Session Configuration with MongoDB Store
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Ensure you have a session secret in .env
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI, // Use Mongo URI from .env
      ttl: 24 * 60 * 60, // 24 hours session expiration
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production", // Secure cookies in production
      httpOnly: true, // Prevent JS access to cookies
      sameSite: "strict", // Prevent CSRF attacks
      maxAge: 1000 * 60 * 60 * 24, // 24 hours cookie expiration
    },
  })
);

// Rate Limiting for Authentication Routes
app.use("/api/auth", authLimiter);

// Central Router for API Routes
app.use("/api", routes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error:
      process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
});

// Server Setup
const PORT = process.env.PORT || 5000; // Default port or environment port
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
