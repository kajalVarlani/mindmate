import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Therapist from "../models/Therapist.js";
import upload from "../middleware/uploadMiddleware.js";
import { uploadFile } from "../utils/cloudinary.js";
import { sendTherapistOnboardingEmail } from "../utils/sendEmail.js";

const router = express.Router();

// Therapist Registration Route
router.post(
  "/register",
  upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "degreeDoc", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { name, email, password, specializations, bio, experience, licenseNumber } = req.body;

      if (!name || !email || !password || !licenseNumber) {
        return res.status(400).json({ error: "Missing required registration details" });
      }

      if (!req.files || !req.files["profilePic"] || !req.files["degreeDoc"]) {
        return res.status(400).json({ error: "Both profile photo and degree document are required" });
      }

      const existingTherapist = await Therapist.findOne({ email });
      if (existingTherapist) {
        return res.status(400).json({ error: "An account with this email already exists" });
      }

      // Upload files
      const profilePicLocal = req.files["profilePic"][0].path;
      const degreeDocLocal = req.files["degreeDoc"][0].path;

      const profilePicUrl = await uploadFile(profilePicLocal);
      const degreeDocUrl = await uploadFile(degreeDocLocal);

      const passwordHash = await bcrypt.hash(password, 10);

      // Parse specializations (handle either array or string format from form-data)
      let parsedSpecs = [];
      if (specializations) {
        try {
          parsedSpecs = typeof specializations === "string" ? JSON.parse(specializations) : specializations;
        } catch {
          parsedSpecs = specializations.split(",").map((s) => s.trim());
        }
      }

      const therapist = await Therapist.create({
        name,
        email,
        passwordHash,
        specializations: parsedSpecs,
        bio,
        experience: Number(experience) || 0,
        profilePicUrl,
        degreeDocUrl,
        licenseNumber,
        status: "pending",
      });

      // Send confirmation email
      await sendTherapistOnboardingEmail(email, name);

      res.status(201).json({
        message: "Application submitted successfully and is under review",
        therapistId: therapist._id,
      });
    } catch (err) {
      console.error("Therapist registration error:", err);
      res.status(500).json({ error: "Server error during registration" });
    }
  }
);

// Therapist Login Route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const therapist = await Therapist.findOne({ email });
    if (!therapist) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, therapist.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

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

    const token = jwt.sign(
      { userId: therapist._id, name: therapist.name, role: "therapist" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      therapist: {
        name: therapist.name,
        email: therapist.email,
        status: therapist.status,
      },
    });
  } catch (err) {
    console.error("Therapist login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

export default router;
