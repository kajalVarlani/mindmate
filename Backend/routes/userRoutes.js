import express from "express";
import protect from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// GET /api/user/me
router.get("/me", protect, async (req, res) => {

  const user = await User.findById(req.user.id).select("streak");

  if (!user) {
    return res.status(404).json({ streak: 0 });
  }

  res.json({ streak: user.streak || 0 });

});

export default router;
