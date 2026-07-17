import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import OTP from "../models/OTP.js";
import { sendOTP, sendPasswordResetOTP } from "../utils/sendEmail.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 OTP requests per window
  message: { error: "Too many OTP requests from this IP, please try again after 15 minutes." }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per window
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
  });

  await OTP.findOneAndDelete({ email });

  const token = jwt.sign(
    { userId: user._id, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ 
  token, 
  user: { name: user.name } 
});
});

/* LOGIN */
router.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "Invalid credentials" });
  if (user.isActive === false) return res.status(403).json({ error: "Your account has been deactivated." });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ error: "Invalid credentials" });

const token = jwt.sign(
  { userId: user._id, name: user.name },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

res.json({ 
  token, 
  user: { name: user.name }
});
});

/* FORGOT PASSWORD — send OTP to registered email */
router.post("/forgot-password", otpLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: "Email is required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: "No account found with this email" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Reuse OTP collection (delete any existing OTP for this email first)
  await OTP.findOneAndDelete({ email });
  await OTP.create({ email, otp });

  const sent = await sendPasswordResetOTP(email, otp);
  if (!sent) return res.status(500).json({ error: "Failed to send reset email. Please try again." });

  res.json({ message: "Password reset OTP sent to your email" });
});

/* RESET PASSWORD — verify OTP + set new password */
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
  await OTP.findOneAndDelete({ email }); // Clean up used OTP

  res.json({ message: "Password reset successfully. You can now log in." });
});

export default router;
