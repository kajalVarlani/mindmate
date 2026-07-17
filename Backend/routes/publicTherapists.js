import express from "express";
import Therapist from "../models/Therapist.js";
import Session from "../models/Session.js";
import UnavailableDate from "../models/UnavailableDate.js";

const router = express.Router();

// GET all approved therapists (with filter by specialization)
router.get("/therapists", async (req, res) => {
  const { specialization } = req.query;

  try {
    const filter = { status: "approved" };
    if (specialization) {
      filter.specializations = { $in: [specialization] };
    }

    const therapists = await Therapist.find(filter).select(
      "name email specializations bio experience profilePicUrl rating reviewCount price sessionDuration"
    );

    res.json(therapists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET specific therapist profile
router.get("/therapists/:id", async (req, res) => {
  try {
    const therapist = await Therapist.findOne({ _id: req.params.id, status: "approved" }).select(
      "name email specializations bio experience profilePicUrl rating reviewCount price sessionDuration weeklySchedule"
    );

    if (!therapist) {
      return res.status(404).json({ error: "Therapist profile not found" });
    }

    res.json(therapist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET therapist availability calendar for a month (YYYY-MM)
router.get("/therapists/:id/availability", async (req, res) => {
  const therapistId = req.params.id;
  const { month } = req.query; // Expecting YYYY-MM

  if (!month) {
    return res.status(400).json({ error: "Month parameter (YYYY-MM) is required" });
  }

  try {
    const therapist = await Therapist.findById(therapistId);
    if (!therapist || therapist.status !== "approved") {
      return res.status(404).json({ error: "Therapist not found" });
    }

    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1; // 0-indexed month

    if (isNaN(year) || isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
      return res.status(400).json({ error: "Invalid month format. Use YYYY-MM." });
    }

    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

    // Fetch booked sessions for the therapist during this month
    const bookedSessions = await Session.find({
      therapistId,
      scheduledAt: { $gte: startDate, $lte: endDate },
      status: { $in: ["pending", "accepted", "active", "completed"] },
    });

    // Map booked slots by date string YYYY-MM-DD
    const bookedSlotsMap = {};
    bookedSessions.forEach((session) => {
      const dateStr = session.scheduledAt.toISOString().split("T")[0];
      if (!bookedSlotsMap[dateStr]) {
        bookedSlotsMap[dateStr] = [];
      }
      bookedSlotsMap[dateStr].push(session.slotTime);
    });

    // Fetch unavailable/blocked dates for this therapist
    const blockedDates = await UnavailableDate.find({
      therapistId,
      date: { $gte: startDate, $lte: endDate },
    });

    const blockedDatesSet = new Set(blockedDates.map((b) => b.date.toISOString().split("T")[0]));

    const daysInMonth = endDate.getDate();
    const calendar = [];

    // Loop through each day of the month
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, monthIndex, day);
      const dateStr = currentDate.toISOString().split("T")[0];

      // If date is in the past, return empty available slots
      if (currentDate < today) {
        calendar.push({ date: dateStr, availableSlots: [] });
        continue;
      }

      // If date is blocked
      if (blockedDatesSet.has(dateStr)) {
        calendar.push({ date: dateStr, availableSlots: [] });
        continue;
      }

      // Check weekly schedule configuration
      const dayOfWeek = currentDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
      const scheduleForDay = therapist.weeklySchedule.find((s) => s.day === dayOfWeek);

      if (!scheduleForDay || !scheduleForDay.slots || scheduleForDay.slots.length === 0) {
        calendar.push({ date: dateStr, availableSlots: [] });
        continue;
      }

      const bookedSlots = bookedSlotsMap[dateStr] || [];
      let availableSlots = scheduleForDay.slots.filter((slot) => !bookedSlots.includes(slot));

      // If the date is today, filter out past time slots
      const todayStr = today.toISOString().split("T")[0];
      if (dateStr === todayStr) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        availableSlots = availableSlots.filter((slot) => {
          const [slotHourStr, slotMinuteStr] = slot.split(":");
          const slotHour = parseInt(slotHourStr, 10);
          const slotMinute = parseInt(slotMinuteStr, 10);

          if (slotHour > currentHour) return true;
          if (slotHour === currentHour && slotMinute > currentMinute) return true;
          return false;
        });
      }

      calendar.push({
        date: dateStr,
        availableSlots,
      });
    }

    res.json(calendar);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching availability" });
  }
});

export default router;
