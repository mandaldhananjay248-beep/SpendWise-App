import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import mongoose from "mongoose";

import { connectDB } from "./config/db.js";

import authRoutes from "./routes/auth.js";
import expenseRoutes from "./routes/expenses.js";
import reportRoutes from "./routes/reports.js";
import budgetRoutes from "./routes/budgets.js";

import { auth } from "./middleware/auth.js";
import User from "./models/User.js";

dotenv.config();

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5050/api/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase();
      let user = await User.findOne({ googleId: profile.id });
      if (!user && email) user = await User.findOne({ email });
      if (!user) user = await User.create({ name: profile.displayName || "SpendWise User", email, googleId: profile.id, avatar: profile.photos?.[0]?.value });
      else if (!user.googleId) { user.googleId = profile.id; await user.save(); }
      done(null, user);
    } catch (error) {
      done(error);
    }
  }));
}

const app = express();


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",

    credentials: true
  })
);

app.use(
  express.json()
);

app.use(
  express.urlencoded({
    extended: true
  })
);

app.use(passport.initialize());

// ==========================================
// HEALTH CHECK (NO AUTH REQUIRED)
// ==========================================

app.get("/", (req, res) => {

  res.json({

    message:
      "SpendWise API is running",

    status:
      "success",
    
    routes: {
      auth: "/api/auth",
      expenses: "/api/expenses",
      reports: "/api/reports",
      budgets: "/api/budgets"
    }

  });

});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// ==========================================
// AUTH ROUTES (NO DB CHECK REQUIRED)
// ==========================================

app.use(
  "/api/auth",
  authRoutes
);

console.log("✅ Auth routes registered at /api/auth");

// ==========================================
// DATABASE HEALTH CHECK MIDDLEWARE
// ==========================================

app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: "Database unavailable. Check the MongoDB connection and Atlas IP allowlist."
    });
  }

  next();
});


// ==========================================
// PROTECTED EXPENSE ROUTES
// ==========================================

app.use(
  "/api/expenses",
  auth,
  expenseRoutes
);


// ==========================================
// PROTECTED REPORT ROUTES
// ==========================================

app.use(
  "/api/reports",
  auth,
  reportRoutes
);


// ==========================================
// PROTECTED BUDGET ROUTES
// ==========================================

app.use(
  "/api/budgets",
  auth,
  budgetRoutes
);


// ==========================================
// ERROR HANDLER
// ==========================================

app.use(
  (err, req, res, next) => {

    console.error(err);

    res.status(500).json({

      message:
        "Something went wrong on the server."

    });

  }
);


// ==========================================
// START SERVER
// ==========================================

const PORT =
  process.env.PORT || 5000;


async function startServer() {

  try {

    await connectDB();

    app.listen(
      PORT,
      () => {

        console.log(
          `SpendWise API running on http://localhost:${PORT}`
        );

      }
    );

  } catch (error) {

    console.error(
      "Failed to start server:",
      error
    );

    app.listen(PORT, () => {
      console.log(`SpendWise API running on http://localhost:${PORT} (database unavailable)`);
    });

  }

}

startServer();