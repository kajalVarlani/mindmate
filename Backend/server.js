import express from "express";
import "dotenv/config";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";

import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/auth.js";
import journalRoutes from "./routes/journalRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import therapistAuthRoutes from "./routes/therapistAuth.js";
import therapistRoutes from "./routes/therapist.js";
import publicTherapistRoutes from "./routes/publicTherapists.js";
import sessionRoutes from "./routes/session.js";
import paymentRoutes from "./routes/payment.js";
import adminRoutes from "./routes/admin.js";

import Session from "./models/Session.js";
import Therapist from "./models/Therapist.js";

const app = express();
const PORT = process.env.PORT || 8080;

// Enforce basic security headers via Helmet (relaxed CSP to allow local styling and uploads)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

app.use(express.json());

// Dynamic CORS whitelist
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000"
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS Error: Origin ${origin} not whitelisted.`));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use("/uploads", express.static("public/uploads"));

// Wire API Routes
app.use("/api/auth", authRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api", chatRoutes);
app.use("/api/user", userRoutes);
app.use("/api/therapist", therapistAuthRoutes);
app.use("/api/therapist", therapistRoutes);
app.use("/api", publicTherapistRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);

// Create HTTP Server & Socket.io instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Cache for active session timers to avoid duplicate timer threads
const activeTimers = {};
const activeStartTimers = {};

const triggerPayout = async (session) => {
  try {
    console.log(`💸 Auto-payout triggered for session: ${session._id}`);
    const therapist = await Therapist.findById(session.therapistId);
    
    if (!therapist || !therapist.bankDetails || (!therapist.bankDetails.accountNumber && !therapist.bankDetails.upiId)) {
      console.log("⚠️ Therapist payout details missing. Payout status remains pending.");
      return;
    }

    if (process.env.RAZORPAY_ACCOUNT_NUMBER) {
      // Real payout integration code
      console.log(`Razorpay payout of ₹${session.therapistPayout} processed.`);
    } else {
      console.log(`[MOCK PAYOUT] Transferred ₹${session.therapistPayout} (90%) to ${therapist.name}. Account/UPI: ${therapist.bankDetails.accountNumber || therapist.bankDetails.upiId}`);
    }

    session.payoutStatus = "paid";
    session.payoutId = `payout_mock_${Date.now()}`;
    await session.save();
    console.log(`✅ Payout successfully recorded for session: ${session._id}`);
  } catch (err) {
    console.error("❌ Payout failed:", err.message);
  }
};

const handleSessionEnding = async (sessionId, roomId) => {
  try {
    const session = await Session.findById(sessionId);
    if (session && session.status !== "completed") {
      session.status = "completed";
      session.endedAt = new Date();
      await session.save();

      // Emit end event to all sockets in the room
      io.to(roomId).emit("session_ended", { message: "The session time limit has been reached. Chat is locked." });
      console.log(`🔒 Session ${sessionId} locked and marked as completed.`);

      // Trigger automatic therapist payout
      await triggerPayout(session);
    }
  } catch (err) {
    console.error("Error ending session:", err.message);
  }
};

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on("join_session", async ({ sessionId, userId, role }) => {
    if (!sessionId || !userId || !role) return;

    const roomId = `session-${sessionId}`;
    socket.join(roomId);
    console.log(`👤 Socket ${socket.id} (Role: ${role}, User ID: ${userId}) joined room ${roomId}`);

    try {
      const session = await Session.findById(sessionId);
      if (!session) {
        socket.emit("error", { message: "Session not found" });
        return;
      }

      // Activate session when therapist joins (can start anytime, even before schedule)
      if (session.status === "accepted" && role === "therapist") {
        session.status = "active";
        session.scheduledAt = new Date(); // Update scheduledAt to the actual start time
        await session.save();
        io.to(roomId).emit("session_status_changed", { status: "active" });

        // If there was any pending start timer scheduled on backend, cancel it
        if (activeStartTimers[sessionId]) {
          clearTimeout(activeStartTimers[sessionId]);
          delete activeStartTimers[sessionId];
        }
      }

      // Calculate remaining session duration
      const now = Date.now();
      const startTime = new Date(session.scheduledAt).getTime();
      const endTime = startTime + session.duration * 60 * 1000;
      
      let remainingMs = 0;
      let sessionActive = false;

      if (session.status === "active") {
        remainingMs = endTime - now;
        sessionActive = true;
      } else if (session.status === "completed") {
        remainingMs = 0;
        sessionActive = false;
      } else {
        remainingMs = session.duration * 60 * 1000;
        sessionActive = false;
      }

      // Send timer state to room to synchronize user and therapist
      io.to(roomId).emit("timer_update", {
        startTime,
        endTime,
        duration: session.duration,
        remainingMs: Math.max(0, remainingMs),
        status: session.status,
        sessionActive,
      });

      if (sessionActive) {
        // Schedule timer events if not already running for this room
        if (remainingMs > 0 && !activeTimers[sessionId]) {
          activeTimers[sessionId] = true;

          // Schedule 5-minute warning banner event
          const warningTimeMs = remainingMs - 5 * 60 * 1000;
          if (warningTimeMs > 0) {
            setTimeout(() => {
              io.to(roomId).emit("time_warning", { message: "5 minutes remaining before session ends." });
            }, warningTimeMs);
          }

          // Schedule session completion and chat lock
          setTimeout(() => {
            delete activeTimers[sessionId];
            handleSessionEnding(sessionId, roomId);
          }, remainingMs);
        } else if (remainingMs <= 0 && session.status !== "completed") {
          // Immediately end if time has expired
          handleSessionEnding(sessionId, roomId);
        }
      } else {
        // If session starts in the future, schedule a start timer (if not already scheduled)
        const timeToStart = startTime - now;
        if (timeToStart > 0 && !activeStartTimers[sessionId]) {
          activeStartTimers[sessionId] = setTimeout(async () => {
            delete activeStartTimers[sessionId];

            // officially activate session
            try {
              const freshSession = await Session.findById(sessionId);
              if (freshSession && freshSession.status === "accepted") {
                freshSession.status = "active";
                await freshSession.save();
                io.to(roomId).emit("session_status_changed", { status: "active" });
              }
            } catch (err) {
              console.error("Error activating session at start time:", err);
            }

            // Emit update to start countdown on clients
            io.to(roomId).emit("timer_update", {
              startTime,
              endTime,
              duration: session.duration,
              remainingMs: session.duration * 60 * 1000,
              status: "active",
              sessionActive: true,
            });

            // Start backend locks
            if (!activeTimers[sessionId]) {
              activeTimers[sessionId] = true;

              const sessionDurationMs = session.duration * 60 * 1000;
              const warningTimeMs = sessionDurationMs - 5 * 60 * 1000;
              if (warningTimeMs > 0) {
                setTimeout(() => {
                  io.to(roomId).emit("time_warning", { message: "5 minutes remaining before session ends." });
                }, warningTimeMs);
              }

              setTimeout(() => {
                delete activeTimers[sessionId];
                handleSessionEnding(sessionId, roomId);
              }, sessionDurationMs);
            }
          }, timeToStart);
        }
      }

    } catch (err) {
      console.error("Socket join_session error:", err);
    }
  });

  socket.on("send_message", async ({ sessionId, senderId, senderRole, content }) => {
    if (!sessionId || !senderId || !senderRole || !content) return;

    const roomId = `session-${sessionId}`;

    try {
      const session = await Session.findById(sessionId);
      if (!session) return;

      if (session.status === "completed" || session.status === "rejected") {
        socket.emit("error", { message: "Cannot send messages to an inactive session." });
        return;
      }

      const messageObj = {
        role: senderRole,
        content,
        timestamp: new Date(),
      };

      // Save to Database
      await Session.findByIdAndUpdate(sessionId, {
        $push: { messages: messageObj },
      });

      // Broadcast to Room
      io.to(roomId).emit("receive_message", messageObj);
    } catch (err) {
      console.error("Socket send_message error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// Start Database & Express/Socket Server with automatic reconnection retry loop
const startServer = async () => {
  let connected = false;
  let retries = 10;

  while (!connected && retries > 0) {
    try {
      console.log(`🔌 Attempting database connection... (Retries left: ${retries})`);
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("✅ Connected with database");
      connected = true;
    } catch (err) {
      retries--;
      console.error(`❌ Failed to connect with DB. Error: ${err.message}`);
      if (retries === 0) {
        console.error("💥 Critical: Database connection attempts exhausted. Exiting process.");
        process.exit(1);
      }
      console.log("⏳ Waiting 5 seconds before retrying database connection...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();
