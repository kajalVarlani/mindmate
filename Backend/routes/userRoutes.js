import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// GET /api/user/me
router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.user.userId).select("streak");
  res.json({ streak: user.streak || 0 });
});

export default router;
