import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./services/api";
import { useToast } from "./components/Toast";
import "./TherapistSetup.css";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TherapistSetup() {
  const [step, setStep] = useState(1);
  const [price, setPrice] = useState("");
  const [sessionDuration, setSessionDuration] = useState(45);
  
  // Weekly Schedule State
  const [activeDays, setActiveDays] = useState([]); // Array of day indices: 0..6
  const [daySlots, setDaySlots] = useState({
    0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
  });
  const [newSlotInput, setNewSlotInput] = useState("");

  // Bank details State
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [upiId, setUpiId] = useState("");

  const [loading, setLoading] = useState(false);
  const showToast = useToast();
  const navigate = useNavigate();

  const handleDayToggle = (dayIndex) => {
    setActiveDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const addSlot = (dayIndex) => {
    if (!newSlotInput) return;
    
    // Simple time regex to validate HH:MM
    const timeRegex = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(newSlotInput)) {
      showToast("Please enter a valid 24h time format (e.g. 09:00, 14:30)", "warning");
      return;
    }

    // Ensure slot format is strictly HH:MM (padding single digit hour)
    let formattedSlot = newSlotInput;
    if (newSlotInput.length === 4) {
      formattedSlot = "0" + newSlotInput;
    }

    if (daySlots[dayIndex].includes(formattedSlot)) {
      showToast("This slot is already added.", "warning");
      return;
    }

    setDaySlots((prev) => ({
      ...prev,
      [dayIndex]: [...prev[dayIndex], formattedSlot].sort(),
    }));
    setNewSlotInput("");
  };

  const removeSlot = (dayIndex, slot) => {
    setDaySlots((prev) => ({
      ...prev,
      [dayIndex]: prev[dayIndex].filter((s) => s !== slot),
    }));
  };

  const handleSaveSetup = async () => {
    if (!accountHolder || !accountNumber || !ifsc) {
      showToast("Please complete your bank details.", "warning");
      return;
    }

    setLoading(true);

    // Format weeklySchedule matching therapist model
    const weeklySchedule = activeDays.map((dayIndex) => ({
      day: dayIndex,
      slots: daySlots[dayIndex],
    }));

    const setupPayload = {
      price: Number(price),
      sessionDuration: Number(sessionDuration),
      weeklySchedule,
      bankDetails: {
        accountHolder,
        accountNumber,
        ifsc,
        upiId,
      },
    };

    try {
      await api.put("/api/therapist/setup", setupPayload);
      showToast("Portal setup complete! Welcome to your dashboard.", "success");
      setTimeout(() => navigate("/therapist/dashboard"), 1500);
    } catch (err) {
      const msg = err.response?.data?.error || "Setup submission failed. Please try again.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ts-wrapper">
      <div className="ts-card">
        <h2 className="ts-title">Therapist Profile Setup</h2>
        <p className="ts-subtitle">Configure your therapeutic schedule, fee, and payout details.</p>

        {/* Stepper progress indicator */}
        <div className="ts-steps">
          <div className={`ts-step ${step >= 1 ? "active" : ""}`}>1. Fees & Duration</div>
          <div className="ts-step-line" />
          <div className={`ts-step ${step >= 2 ? "active" : ""}`}>2. Availability</div>
          <div className="ts-step-line" />
          <div className={`ts-step ${step >= 3 ? "active" : ""}`}>3. Payout Details</div>
        </div>

        {step === 1 && (
          <div className="ts-form-step animate-fade">
            <h3>Step 1 — Set Fees & Session Duration</h3>
            <div className="ts-input-group">
              <label>Per Session Consultation Fee (INR)</label>
              <input
                type="number"
                placeholder="e.g. 800"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="100"
                required
              />
              <span className="ts-input-tip">Note: Platform takes a standard 10% commission per booking.</span>
            </div>

            <div className="ts-input-group">
              <label>Session Duration (Minutes)</label>
              <select value={sessionDuration} onChange={(e) => setSessionDuration(e.target.value)}>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>

            <div className="ts-actions">
              <button
                type="button"
                className="ts-btn ts-btn--primary"
                onClick={() => {
                  if (!price || price <= 0) {
                    showToast("Please enter a valid session fee.", "warning");
                    return;
                  }
                  setStep(2);
                }}
              >
                Next Step: Availability →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="ts-form-step animate-fade">
            <h3>Step 2 — Define Your Weekly Availability</h3>
            <p className="step-desc">Select the days you are available and add time slots for each day.</p>

            <div className="ts-days-select">
              {DAYS_OF_WEEK.map((day, idx) => (
                <button
                  type="button"
                  key={day}
                  className={`ts-day-btn ${activeDays.includes(idx) ? "active" : ""}`}
                  onClick={() => handleDayToggle(idx)}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>

            <div className="ts-slots-management">
              {activeDays.length === 0 ? (
                <p className="no-days">Select at least one day from above to add time slots.</p>
              ) : (
                activeDays.map((dayIdx) => (
                  <div key={dayIdx} className="ts-day-slot-card">
                    <h4>{DAYS_OF_WEEK[dayIdx]} Slots</h4>
                    
                    <div className="ts-slot-adder">
                      <input
                        type="text"
                        placeholder="HH:MM (e.g. 09:00)"
                        value={newSlotInput}
                        onChange={(e) => setNewSlotInput(e.target.value)}
                      />
                      <button type="button" onClick={() => addSlot(dayIdx)}>
                        + Add Slot
                      </button>
                    </div>

                    <div className="ts-active-slots">
                      {daySlots[dayIdx].length === 0 ? (
                        <span className="no-slots">No slots added yet</span>
                      ) : (
                        daySlots[dayIdx].map((slot) => (
                          <span key={slot} className="ts-slot-tag">
                            {slot}
                            <button type="button" onClick={() => removeSlot(dayIdx, slot)}>
                              ×
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="ts-actions">
              <button type="button" className="ts-btn ts-btn--ghost" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button
                type="button"
                className="ts-btn ts-btn--primary"
                onClick={() => {
                  if (activeDays.length === 0) {
                    showToast("Please choose at least one day of availability.", "warning");
                    return;
                  }
                  setStep(3);
                }}
              >
                Next Step: Bank Info →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="ts-form-step animate-fade">
            <h3>Step 3 — Banking & UPI Details (For Auto-Payouts)</h3>
            <p className="step-desc">All payout credits are auto-transferred upon session completion.</p>

            <div className="ts-input-group">
              <label>Account Holder Name</label>
              <input
                type="text"
                placeholder="Dr Sarah Jenkins"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                required
              />
            </div>

            <div className="ts-input-group">
              <label>Account Number</label>
              <input
                type="text"
                placeholder="987654321012"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
              />
            </div>

            <div className="ts-input-group">
              <label>Bank IFSC Code</label>
              <input
                type="text"
                placeholder="SBIN0001234"
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value)}
                required
              />
            </div>

            <div className="ts-input-group">
              <label>UPI ID (Optional)</label>
              <input
                type="text"
                placeholder="sarah@okhdfcbank"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
            </div>

            <div className="ts-actions">
              <button type="button" className="ts-btn ts-btn--ghost" onClick={() => setStep(2)}>
                ← Back
              </button>
              <button
                type="button"
                className="ts-btn ts-btn--primary"
                onClick={handleSaveSetup}
                disabled={loading}
              >
                {loading ? <span className="ts-spinner" /> : "Complete Setup"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
