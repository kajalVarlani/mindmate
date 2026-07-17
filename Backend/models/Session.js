import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    therapistId: { type: mongoose.Schema.Types.ObjectId, ref: "Therapist", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "active", "completed"],
      default: "pending",
    },
    scheduledAt: { type: Date, required: true }, // exact date and start time
    duration: { type: Number, required: true }, // duration in minutes
    slotTime: { type: String, required: true }, // display string like "10:00 AM"
    journalShared: { type: Boolean, default: false }, // consent toggle
    messages: [
      {
        role: { type: String, enum: ["user", "therapist", "system"], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    paymentId: { type: String }, // Razorpay Payment ID
    orderId: { type: String }, // Razorpay Order ID
    amountPaid: { type: Number },
    platformCut: { type: Number }, // 10%
    therapistPayout: { type: Number }, // 90%
    payoutId: { type: String }, // Razorpay Payout ID
    payoutStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    userNote: { type: String },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

const Session = mongoose.model("Session", sessionSchema);
export default Session;
