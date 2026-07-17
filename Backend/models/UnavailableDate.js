import mongoose from "mongoose";

const unavailableDateSchema = new mongoose.Schema(
  {
    therapistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
    },
    date: { type: Date, required: true }, // Full day blocked (e.g. YYYY-MM-DD at 00:00:00)
  },
  { timestamps: true }
);

// Compound index so a therapist cannot block the same date twice
unavailableDateSchema.index({ therapistId: 1, date: 1 }, { unique: true });

const UnavailableDate = mongoose.model("UnavailableDate", unavailableDateSchema);
export default UnavailableDate;
