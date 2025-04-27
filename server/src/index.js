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
require("dotenv").config();

const app = express();
// Connect to MongoDB
connectDB()
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Security middleware
app.use(helmet());
app.use(
  cors({
    // Specify your client's origin instead of wildcard
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    // Allow credentials (cookies, authorization headers)
    credentials: true,
    // Allow these methods
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    // Allow these headers
    allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
  })
);
app.use(sanitizeMongo);
app.use(sanitizeInput);
app.use(cookieParser());
app.use(express.json({ limit: "10kb" })); // Limit payload size
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 24 * 60 * 60, // 24 hours
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  })
);

// Apply rate limiting to auth routes
app.use("/api/auth", authLimiter);

// Use routes from the central router
app.use("/api", routes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
