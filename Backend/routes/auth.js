import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Therapist from "../models/Therapist.js";
import Admin from "../models/Admin.js";
import OTP from "../models/OTP.js";
import { sendOTP, sendPasswordResetOTP } from "../utils/sendEmail.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Increased for development/testing
  message: { error: "Too many OTP requests from this IP, please try again after 15 minutes." }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Increased for development/testing
  message: { error: "Too many login attempts from this IP, please try again after 15 minutes." }
});

/* SEND OTP */
router.post("/send-otp", otpLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email || !email.endsWith("@gmail.com")) {
    return res.status(400).json({ error: "Only @gmail.com emails are allowed" });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ error: "Email already exists" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await OTP.findOneAndDelete({ email });
  await OTP.create({ email, otp });

  const emailSent = await sendOTP(email, otp);
  if (!emailSent) {
    return res.status(500).json({ error: "Failed to send OTP email. Please try again later." });
  }

  res.json({ message: "OTP sent successfully" });
});

/* SIGNUP */
router.post("/signup", async (req, res) => {
  const { name, email, password, otp } = req.body;

  if (!email || !email.endsWith("@gmail.com")) {
    return res.status(400).json({ error: "Only @gmail.com emails are allowed" });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ error: "Email already exists" });
  }

  const otpRecord = await OTP.findOne({ email });
  if (!otpRecord || otpRecord.otp !== otp) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  const hash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    passwordHash: hash,
    role: "user",
  });

  await OTP.findOneAndDelete({ email });

  const token = jwt.sign(
    { userId: user._id, name: user.name, role: "user" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: { name: user.name, role: "user" }
  });
});

/**
 * UNIFIED LOGIN
 *
 * Lookup order:
 *  1. User table (covers regular users AND therapists — both have credentials here)
 *     - If user.role === "therapist", also verify the Therapist document status.
 *  2. Admin table (separate collection, separate login credentials)
 */
router.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // ── 1. Check the users table first ─────────────────────────────────────────
    const user = await User.findOne({ email });

    if (user) {
      if (user.isActive === false) {
        return res.status(403).json({ error: "Your account has been deactivated." });
      }

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(400).json({ error: "Invalid credentials" });

      // If this user is a therapist, verify their application status
      if (user.role === "therapist") {
        const therapist = await Therapist.findById(user._id);
        if (therapist) {
          if (therapist.status === "pending") {
            return res.status(403).json({
              error: "Your therapist application is still under review. We will notify you via email once approved.",
            });
          }
          if (therapist.status === "rejected") {
            return res.status(403).json({
              error: `Your therapist application has been declined. Reason: ${therapist.rejectionReason || "Credentials validation failed"}`,
            });
          }
        }
      }

      const token = jwt.sign(
        { userId: user._id, name: user.name, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        token,
        user: { name: user.name, role: user.role }
      });
    }

    // ── 2. Check the admin table ────────────────────────────────────────────────
    const admin = await Admin.findOne({ email });
    if (admin) {
      const ok = await bcrypt.compare(password, admin.passwordHash);
      if (!ok) return res.status(400).json({ error: "Invalid credentials" });

      const token = jwt.sign(
        { userId: admin._id, email: admin.email, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        token,
        user: { name: "Administrator", role: "admin" }
      });
    }

    // No match found in either table
    return res.status(400).json({ error: "Invalid credentials" });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error during login" });
  }
});

/* FORGOT PASSWORD */
router.post("/forgot-password", otpLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: "Email is required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: "No account found with this email" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await OTP.findOneAndDelete({ email });
  await OTP.create({ email, otp });

  const sent = await sendPasswordResetOTP(email, otp);
  if (!sent) return res.status(500).json({ error: "Failed to send reset email. Please try again." });

  res.json({ message: "Password reset OTP sent to your email" });
});

/* RESET PASSWORD */
router.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: "Email, OTP, and new password are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const otpRecord = await OTP.findOne({ email });
  if (!otpRecord || otpRecord.otp !== otp) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  const hash = await bcrypt.hash(newPassword, 10);

  await User.findOneAndUpdate({ email }, { passwordHash: hash });
  await OTP.findOneAndDelete({ email });

  res.json({ message: "Password reset successfully. You can now log in." });
});

export default router;
