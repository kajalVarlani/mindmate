import express from "express";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import Therapist from "../models/Therapist.js";
import upload from "../middleware/uploadMiddleware.js";
import { uploadFile } from "../utils/cloudinary.js";
import { sendTherapistOnboardingEmail } from "../utils/sendEmail.js";
import mongoose from "mongoose";

const router = express.Router();

/**
 * POST /api/therapist/register
 *
 * Unified registration that:
 *  1. Creates or reuses a User record (credentials stored in users table).
 *  2. Creates a Therapist professional-profile record with _id === user._id
 *     so that all existing routes using Therapist.findById(req.user.id) still work.
 */
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

      // Check if a Therapist entry already exists for this email
      const existingTherapist = await Therapist.findOne({ email });
      if (existingTherapist) {
        return res.status(400).json({ error: "A therapist application with this email already exists" });
      }

      // Upload files to Cloudinary
      const profilePicLocal = req.files["profilePic"][0].path;
      const degreeDocLocal  = req.files["degreeDoc"][0].path;

      const profilePicUrl = await uploadFile(profilePicLocal);
      const degreeDocUrl  = await uploadFile(degreeDocLocal);

      // Parse specializations (handle either array or comma-string from form-data)
      let parsedSpecs = [];
      if (specializations) {
        try {
          parsedSpecs = typeof specializations === "string" ? JSON.parse(specializations) : specializations;
        } catch {
          parsedSpecs = specializations.split(",").map((s) => s.trim());
        }
      }

      // ── Step 1: Upsert the User record ──────────────────────────────────────
      // If a User already exists with this email, reuse their _id (they are
      // an existing user applying to become a therapist).
      // Otherwise create a fresh User record. Either way, credentials live here.
      let user = await User.findOne({ email });
      let userId;

      if (user) {
        // Update password if they supplied a new one
        user.passwordHash = await bcrypt.hash(password, 10);
        // name stays as-is (user already has a name)
        await user.save();
        userId = user._id;
      } else {
        // Brand-new person registering directly as a therapist applicant
        const passwordHash = await bcrypt.hash(password, 10);
        user = await User.create({
          name,
          email,
          passwordHash,
          role: "user", // stays "user" until admin approves
        });
        userId = user._id;
      }

      // ── Step 2: Create Therapist professional-profile with _id === userId ───
      const therapist = await Therapist.create({
        _id: userId,            // ← KEY: same _id as the User document
        name,
        email,
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

export default router;
