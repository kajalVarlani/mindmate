import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  streak: {
  type: Number,
  default: 0
},
lastJournalDate: {
  type: Date
},
}, { timestamps: true });

export default mongoose.model("User", userSchema);
