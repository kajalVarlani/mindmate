import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Therapist from "../models/Therapist.js";
import User from "../models/User.js";
import Session from "../models/Session.js";
import Admin from "../models/Admin.js";
import { protectAdmin } from "../middleware/authMiddleware.js";
import { sendTherapistApprovalEmail, sendTherapistRejectionEmail } from "../utils/sendEmail.js";

const router = express.Router();

// Admin Login Route (No auth needed to login)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ error: "Invalid admin credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid admin credentials" });
    }

    const token = jwt.sign(
      { userId: admin._id, email: admin.email, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, admin: { email: admin.email } });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

// Protect all following routes with admin auth
router.use(protectAdmin);

// GET all therapists (with status filter)
router.get("/therapists", async (req, res) => {
  const { status } = req.query;

  try {
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const therapists = await Therapist.find(filter).sort({ createdAt: -1 });
    res.json(therapists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching therapists" });
  }
});

// Approve a therapist
router.put("/therapist/:id/approve", async (req, res) => {
  try {
    const therapist = await Therapist.findById(req.params.id);
    if (!therapist) {
      return res.status(404).json({ error: "Therapist application not found" });
    }

    therapist.status = "approved";
    therapist.rejectionReason = undefined;
    await therapist.save();

    // Promote the linked User record to role="therapist"
    // therapist._id === user._id by design
    await User.findByIdAndUpdate(therapist._id, { role: "therapist" });

    // Send email
    await sendTherapistApprovalEmail(therapist.email, therapist.name);

    res.json({ message: "Therapist approved successfully", therapist });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during approval" });
  }
});

// Reject a therapist
router.put("/therapist/:id/reject", async (req, res) => {
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: "Rejection reason is required" });
  }

  try {
    const therapist = await Therapist.findById(req.params.id);
    if (!therapist) {
      return res.status(404).json({ error: "Therapist application not found" });
    }

    therapist.status = "rejected";
    therapist.rejectionReason = reason;
    await therapist.save();

    // Demote the linked User record back to role="user"
    await User.findByIdAndUpdate(therapist._id, { role: "user" });

    // Send email
    await sendTherapistRejectionEmail(therapist.email, therapist.name, reason);

    res.json({ message: "Therapist application rejected", therapist });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during rejection" });
  }
});

// GET all users (users + therapists — all share the same users table)
router.get("/users", async (req, res) => {
  try {
    // Return all users including those who are therapists.
    // The "role" field differentiates them.
    const users = await User.find({}).select("-passwordHash").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching users" });
  }
});

// Toggle User Deactivation Status
router.put("/user/:id/deactivate", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User account has been ${user.isActive ? "activated" : "deactivated"} successfully`,
      isActive: user.isActive,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during user status modification" });
  }
});

// GET platform stats
router.get("/stats", async (req, res) => {
  try {
    // Count only regular users (not therapists) for the "users" stat
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalTherapists = await Therapist.countDocuments({ status: "approved" });
    const totalSessions = await Session.countDocuments({ status: "completed" });

    // Aggregate total platform revenue
    const completedSessions = await Session.find({ status: "completed" });
    const totalRevenue = completedSessions.reduce((acc, s) => acc + (s.platformCut || 0), 0);

    res.json({
      totalUsers,
      totalTherapists,
      totalSessions,
      totalRevenue: Number(totalRevenue.toFixed(2)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching stats" });
  }
});

export default router;
