import mongoose from "mongoose";

const therapistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    specializations: [{ type: String }],
    bio: { type: String },
    experience: { type: Number },
    profilePicUrl: { type: String },
    degreeDocUrl: { type: String },
    licenseNumber: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    price: { type: Number }, // Per-session fee
    sessionDuration: { type: Number, default: 45 }, // Minutes: 30 / 45 / 60
    weeklySchedule: [
      {
        day: { type: Number, required: true }, // 0=Sun, 1=Mon, ..., 6=Sat
        slots: [{ type: String }], // e.g. ["09:00", "10:00", "11:00"]
      },
    ],
    bankDetails: {
      accountHolder: { type: String },
      accountNumber: { type: String },
      ifsc: { type: String },
      upiId: { type: String },
    },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

const Therapist = mongoose.model("Therapist", therapistSchema);
export default Therapist;
