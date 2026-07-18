import express from "express";
import Therapist from "../models/Therapist.js";
import Session from "../models/Session.js";
import Journal from "../models/Journal.js";
import UnavailableDate from "../models/UnavailableDate.js";
import User from "../models/User.js";
import { protectTherapist } from "../middleware/authMiddleware.js";
import Razorpay from "razorpay";
import { sendRefundEmail } from "../utils/sendEmail.js";

const router = express.Router();
router.use(protectTherapist);

let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// GET own profile info
router.get("/me", async (req, res) => {
  try {
    const therapist = await Therapist.findById(req.user.id);
    if (!therapist) {
      return res.status(404).json({ error: "Therapist profile not found" });
    }
    res.json(therapist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Setup schedule, fee details, and banking details
router.put("/setup", async (req, res) => {
  const { price, sessionDuration, weeklySchedule, bankDetails } = req.body;

  try {
    const therapist = await Therapist.findById(req.user.id);
    if (!therapist) {
      return res.status(404).json({ error: "Therapist profile not found" });
    }

    if (price !== undefined) therapist.price = price;
    if (sessionDuration !== undefined) therapist.sessionDuration = sessionDuration;
    if (weeklySchedule !== undefined) therapist.weeklySchedule = weeklySchedule;
    if (bankDetails !== undefined) therapist.bankDetails = bankDetails;

    await therapist.save();
    res.json({ message: "Dashboard setup completed successfully", therapist });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during setup" });
  }
});

// GET all sessions for this therapist
router.get("/sessions", async (req, res) => {
  try {
    const sessions = await Session.find({ therapistId: req.user.id })
      .populate("userId", "name email")
      .sort({ scheduledAt: -1 });
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching sessions" });
  }
});

// Accept a pending booking request
router.put("/session/:id/accept", async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, therapistId: req.user.id });
    if (!session) {
      return res.status(404).json({ error: "Session booking not found" });
    }

    if (session.status !== "pending") {
      return res.status(400).json({ error: "Only pending bookings can be accepted" });
    }

    session.status = "accepted";
    await session.save();

    res.json({ message: "Booking accepted successfully", session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during acceptance" });
  }
});

// Reject a booking request (trigger refund + status updated to rejected)
router.put("/session/:id/reject", async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, therapistId: req.user.id }).populate("userId", "name email");
    if (!session) {
      return res.status(404).json({ error: "Session booking not found" });
    }

    if (session.status !== "pending" && session.status !== "accepted") {
      return res.status(400).json({ error: "This session cannot be rejected" });
    }

    // Process refund if paymentId exists
    if (session.paymentId) {
      try {
        if (razorpay) {
          await razorpay.payments.refund(session.paymentId, {
            amount: session.amountPaid * 100, // paise
          });
          console.log(`Razorpay refund initiated for payment: ${session.paymentId}`);
        } else {
          console.log(`Mocking refund of ₹${session.amountPaid} for payment: ${session.paymentId}`);
        }
      } catch (refundErr) {
        console.error("Refund transaction failed:", refundErr.message);
        return res.status(500).json({ error: "Failed to process refund. Rejection cancelled." });
      }
    }

    session.status = "rejected";
    await session.save();

    // Notify user of refund
    if (session.userId && session.userId.email) {
      await sendRefundEmail(session.userId.email, session.userId.name, session.amountPaid);
    }

    res.json({ message: "Booking rejected and refund initiated", session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during rejection" });
  }
});

// GET patient's journals (Only allowed if user consented via journalShared: true)
router.get("/session/:id/journal", async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, therapistId: req.user.id });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (!session.journalShared) {
      return res.status(403).json({ error: "Patient has not shared their journals for this session" });
    }

    const journals = await Journal.find({ userId: session.userId }).sort({ createdAt: -1 });
    res.json(journals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching journals" });
  }
});

// Block a date
router.post("/unavailable", async (req, res) => {
  const { date } = req.body;

  if (!date) {
    return res.status(400).json({ error: "Date is required" });
  }

  try {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Ensure no sessions are booked on this date before blocking
    const startOfDay = new Date(targetDate);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const hasBookings = await Session.findOne({
      therapistId: req.user.id,
      scheduledAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["pending", "accepted", "active"] },
    });

    if (hasBookings) {
      return res.status(400).json({ error: "Cannot block date with active bookings" });
    }

    const block = await UnavailableDate.create({
      therapistId: req.user.id,
      date: targetDate,
    });

    res.status(201).json({ message: "Date blocked successfully", block });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Date is already blocked" });
    }
    console.error(err);
    res.status(500).json({ error: "Server error blocking date" });
  }
});

// Unblock a date
router.delete("/unavailable/:date", async (req, res) => {
  try {
    const targetDate = new Date(req.params.date);
    targetDate.setHours(0, 0, 0, 0);

    const deleted = await UnavailableDate.findOneAndDelete({
      therapistId: req.user.id,
      date: targetDate,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Blocked date not found" });
    }

    res.json({ message: "Date unblocked successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error unblocking date" });
  }
});

// List blocked dates
router.get("/unavailable", async (req, res) => {
  try {
    const blockedDates = await UnavailableDate.find({ therapistId: req.user.id }).select("date");
    res.json(blockedDates.map((b) => b.date));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching blocked dates" });
  }
});

export default router;
