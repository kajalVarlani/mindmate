import mongoose from "mongoose";

const therapistSchema = new mongoose.Schema(
  {
    // _id is explicitly set to match the linked User's _id — so Therapist.findById(userId) works directly
    _id: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
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
    price: { type: Number },
    sessionDuration: { type: Number, default: 45 },
    weeklySchedule: [
      {
        day: { type: Number, required: true },
        slots: [{ type: String }],
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
