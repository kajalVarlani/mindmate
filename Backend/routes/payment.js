import express from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import Session from "../models/Session.js";
import Therapist from "../models/Therapist.js";
import User from "../models/User.js";
import { protectUser } from "../middleware/authMiddleware.js";
import { sendBookingConfirmationEmail } from "../utils/sendEmail.js";

const router = express.Router();
router.use(protectUser);

let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// Create Razorpay Order
router.post("/create-order", async (req, res) => {
  const { therapistId, slotDate, slotTime } = req.body;

  if (!therapistId || !slotDate || !slotTime) {
    return res.status(400).json({ error: "Missing required details: therapistId, slotDate, slotTime" });
  }

  try {
    const therapist = await Therapist.findById(therapistId);
    if (!therapist || therapist.status !== "approved") {
      return res.status(404).json({ error: "Therapist profile not found or not approved" });
    }

    const price = therapist.price;
    if (!price || price <= 0) {
      return res.status(400).json({ error: "Therapist has not set up session fees" });
    }

    // Double check availability (ensure slot is not already booked)
    const targetDate = new Date(slotDate);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const alreadyBooked = await Session.findOne({
      therapistId,
      slotTime,
      scheduledAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["pending", "accepted", "active", "completed"] },
    });

    if (alreadyBooked) {
      return res.status(400).json({ error: "This slot is already booked" });
    }

    // Create Razorpay Order or fallback to mock
    if (razorpay) {
      const options = {
        amount: Math.round(price * 100), // amount in paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);
      return res.json({
        orderId: order.id,
        amount: price,
        currency: "INR",
        mock: false,
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    } else {
      // Mock order generation for local development without keys
      const mockOrderId = `order_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      return res.json({
        orderId: mockOrderId,
        amount: price,
        currency: "INR",
        mock: true,
      });
    }
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ error: "Server error creating payment order" });
  }
});

// Verify Signature and Save Booking
router.post("/verify", async (req, res) => {
  const {
    therapistId,
    slotDate,
    slotTime,
    userNote,
    orderId,
    paymentId,
    signature,
    amount,
    mock,
  } = req.body;

  if (!therapistId || !slotDate || !slotTime || !orderId || !paymentId || !amount) {
    return res.status(400).json({ error: "Missing verification parameters" });
  }

  try {
    const therapist = await Therapist.findById(therapistId);
    if (!therapist) {
      return res.status(404).json({ error: "Therapist not found" });
    }

    // If not mock checkout, verify signature using cryptographic helper
    if (!mock && razorpay) {
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(orderId + "|" + paymentId)
        .digest("hex");

      if (generatedSignature !== signature) {
        return res.status(400).json({ error: "Payment verification failed. Signature mismatch." });
      }
    }

    // Calculate Platform Cut (10%) and Therapist Payout (90%)
    const platformCut = Number((amount * 0.1).toFixed(2));
    const therapistPayout = Number((amount * 0.9).toFixed(2));

    const scheduledAt = new Date(slotDate);
    const [hours, minutes] = slotTime.split(":");
    scheduledAt.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    const session = await Session.create({
      userId: req.user.id,
      therapistId,
      status: "pending", // therapist needs to accept
      scheduledAt,
      duration: therapist.sessionDuration || 45,
      slotTime,
      journalShared: false, // consent defaults to false
      paymentId,
      orderId,
      amountPaid: amount,
      platformCut,
      therapistPayout,
      userNote,
    });

    // Send confirmation email
    const user = await User.findById(req.user.id);
    if (user && user.email) {
      await sendBookingConfirmationEmail(
        user.email,
        user.name || "Patient",
        therapist.name,
        slotDate,
        slotTime
      );
    }

    res.status(201).json({
      message: "Session booked successfully",
      session,
    });
  } catch (err) {
    console.error("Payment verification failed:", err);
    res.status(500).json({ error: "Server error confirming session booking" });
  }
});

export default router;
