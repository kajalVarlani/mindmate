import express from "express";
import Session from "../models/Session.js";
import { protectUser } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protectUser);

// GET all sessions for the logged-in user
router.get("/my", async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user.id })
      .populate("therapistId", "name email specializations bio experience profilePicUrl price sessionDuration")
      .sort({ scheduledAt: -1 });
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching user sessions" });
  }
});

// Toggle journal sharing for a specific session
router.put("/:id/share-journal", async (req, res) => {
  const { journalShared } = req.body;

  if (journalShared === undefined) {
    return res.status(400).json({ error: "journalShared field is required" });
  }

  try {
    const session = await Session.findOne({ _id: req.params.id, userId: req.user.id });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.status === "completed" || session.status === "rejected") {
      return res.status(400).json({ error: "Cannot modify consent for ended sessions" });
    }

    session.journalShared = !!journalShared;
    await session.save();

    res.json({ message: "Journal sharing preference updated successfully", session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error toggling journal sharing" });
  }
});

export default router;
