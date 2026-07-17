import mongoose from "mongoose";
import bcrypt from "bcrypt";
import "dotenv/config";
import Admin from "../models/Admin.js";

const seedAdmin = async () => {
  const email = "admin@mindmate.com";
  const password = "AdminPassword123";

  try {
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI not found in environment.");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to database for seeding");

    await Admin.deleteMany({ email });
    const passwordHash = await bcrypt.hash(password, 8);
    await Admin.create({ email, passwordHash });
    console.log(`🎉 Admin user created successfully!`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
};

seedAdmin();
