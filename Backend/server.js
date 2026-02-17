import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/auth.js";
import journalRoutes from "./routes/journalRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api", chatRoutes);
app.use("/api/user", userRoutes);


// ✅ START SERVER ONLY AFTER DB CONNECTS
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected with database");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("❌ Failed to connect with DB:", err.message);
    process.exit(1); // stop server if DB fails
  }
};

startServer();
