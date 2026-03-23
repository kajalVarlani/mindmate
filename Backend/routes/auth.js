import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import OTP from "../models/OTP.js";
import { sendOTP } from "../utils/sendEmail.js";
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

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ error: "Invalid credentials" });

const token = jwt.sign(
  { userId: user._id, name: user.name }, // 👈 Token ke andar bhi name daal dein
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

res.json({ 
  token, 
  user: { name: user.name } // 👈 Frontend ko direct bhejne ke liye
});
});

export default router;
