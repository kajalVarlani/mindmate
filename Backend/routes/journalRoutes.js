import express from "express";
import Journal from "../models/Journal.js";
import protect from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// POST /api/journal
router.post("/", protect, async (req, res) => {
  const { mood, content } = req.body;

  if (!mood || !content) {
    return res.status(400).json({ message: "Mood and content required" });
  }

  try {
    const journal = await Journal.create({
      userId: req.user.userId, 
      mood,
      content,
    });

    res.status(201).json({
      message: "Journal saved",
      journal,
    });
    const today = new Date();
today.setHours(0, 0, 0, 0);

const user = await User.findById(req.user.userId);

if (!user.lastJournalDate) {
  user.streak = 1;
} else {
  const last = new Date(user.lastJournalDate);
  last.setHours(0, 0, 0, 0);

  const diffDays = (today - last) / (1000 * 60 * 60 * 24);

  if (diffDays === 1) {
    user.streak += 1;
  } else if (diffDays > 1) {
    user.streak = 1;
  }
}

user.lastJournalDate = today;
await user.save();

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/journal
router.get("/", protect, async (req, res) => {
  try {
    const journals = await Journal.find({
      userId: req.user.userId, // 🔐 only logged-in user's data
    }).sort({ createdAt: -1 }); // latest first

    res.status(200).json(journals);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch journals" });
  }
});
// DELETE /api/journal/:id
router.delete("/:id", protect, async (req, res) => {
  const journalId = req.params.id;

  try {
    const journal = await Journal.findOne({
      _id: journalId,
      userId: req.user.userId, // 🔐 ownership check
    });

    if (!journal) {
      return res.status(404).json({ message: "Journal not found" });
    }

    await Journal.deleteOne({ _id: journalId });

    res.status(200).json({ message: "Journal deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete journal" });
  }
});


export default router;
