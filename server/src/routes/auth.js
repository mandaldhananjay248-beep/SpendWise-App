import express from "express";
import passport from "passport";
import mongoose from "mongoose";
import User from "../models/User.js";
import { signToken } from "../utils/token.js";

const router = express.Router();

// Temporary OTP storage
// For production, use Redis or another persistent store.
const otpStore = new Map();


// ==========================================
// GOOGLE / GMAIL LOGIN
// ==========================================

router.get("/google", (req, res, next) => {
  console.log("[Google Auth] Route accessed");
  console.log("[Google Auth] Client ID:", !!process.env.GOOGLE_CLIENT_ID);
  console.log("[Google Auth] Client Secret:", !!process.env.GOOGLE_CLIENT_SECRET);

  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET
  ) {
    console.error("[Google Auth] Missing credentials");
    return res.redirect(`${process.env.CLIENT_URL}/?error=google_not_configured`);
  }

  console.log("[Google Auth] Authenticating with Passport...");
  passport.authenticate("google", {
    scope: ["profile", "email"]
  })(req, res, next);
});


// ==========================================
// GOOGLE CALLBACK
// ==========================================

router.get(
  "/google/callback",

  passport.authenticate("google", {
    session: false,
    failureRedirect:
      `${process.env.CLIENT_URL}/login?error=google`
  }),

  (req, res) => {

    const token = signToken(
      req.user._id.toString()
    );

    res.redirect(
      `${process.env.CLIENT_URL}/auth/callback?token=${encodeURIComponent(token)}`
    );
  }
);


// ==========================================
// SEND MOBILE OTP
// ==========================================

router.post("/send-otp", async (req, res) => {

  const { phone } = req.body;

  if (
    !phone ||
    !/^\+?[1-9]\d{9,14}$/.test(phone)
  ) {

    return res.status(400).json({
      message:
        "Enter a valid phone number with country code. Example: +919876543210"
    });

  }

  try {

    // Generate 6-digit OTP

    const otp = String(
      Math.floor(
        100000 + Math.random() * 900000
      )
    );

    otpStore.set(phone, {
      otp,
      expires: Date.now() + 5 * 60 * 1000
    });


    // ======================================
    // TWILIO
    // ======================================

    if (
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
    ) {

      const twilio =
        (await import("twilio")).default(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );

      await twilio.messages.create({

        body:
          `Your SpendWise verification code is ${otp}. ` +
          `It expires in 5 minutes.`,

        from:
          process.env.TWILIO_PHONE_NUMBER,

        to: phone

      });

      return res.json({
        message: "OTP sent successfully."
      });

    }


    return res.status(503).json({

      message:
        "Phone login is not configured. Add the Twilio credentials to the server environment."

    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({

      message:
        "Unable to send OTP."

    });

  }

});


// ==========================================
// VERIFY OTP
// ==========================================

router.post("/verify-otp", async (req, res) => {

  const {
    phone,
    otp,
    name = "SpendWise User"
  } = req.body;

  const record =
    otpStore.get(phone);

  if (
    !record ||
    record.expires < Date.now() ||
    record.otp !== String(otp)
  ) {

    return res.status(400).json({

      message:
        "Invalid or expired OTP."

    });

  }

  try {

    otpStore.delete(phone);


    let user =
      await User.findOne({ phone });


    if (!user) {

      user =
        await User.create({

          name,

          phone

        });

    }


    const token =
      signToken(
        user._id.toString()
      );


    res.json({

      token,

      user

    });

  } catch (error) {

    console.error(error);

    res.status(500).json({

      message:
        "Unable to verify OTP."

    });

  }

});


// ==========================================
// GET CURRENT USER
// ==========================================

router.get("/me", async (req, res) => {

  try {

    const authHeader =
      req.headers.authorization || "";

    const token =
      authHeader.replace(
        "Bearer ",
        ""
      );

    const jwt =
      (await import("jsonwebtoken")).default;

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    const user =
      await User.findById(
        decoded.userId
      );

    if (!user) {

      return res.status(404).json({

        message:
          "User not found."

      });

    }

    res.json({
      user
    });

  } catch (error) {

    res.status(401).json({

      message:
        "Invalid or expired token."

    });

  }

});


export default router;