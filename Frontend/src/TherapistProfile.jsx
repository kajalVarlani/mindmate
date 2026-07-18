import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api, { getImageUrl } from "./services/api";
import { useToast } from "./components/Toast";
import "./TherapistProfile.css";

export default function TherapistProfile() {
  const { id } = useParams();
  const [therapist, setTherapist] = useState(null);
  const [calendar, setCalendar] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(""); // YYYY-MM
  const [selectedDate, setSelectedDate] = useState(""); // YYYY-MM-DD
  const [selectedSlot, setSelectedSlot] = useState("");
  const [journalShared, setJournalShared] = useState(false);
  const [userNote, setUserNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  const showToast = useToast();
  const navigate = useNavigate();

  // Set default month to current month on mount (format YYYY-MM)
  useEffect(() => {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(currentMonthStr);
    fetchProfile();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchAvailability();
    }
  }, [selectedMonth]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/api/therapists/${id}`);
      setTherapist(res.data);
    } catch {
      showToast("Failed to load therapist profile.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      const res = await api.get(`/api/therapists/${id}/availability?month=${selectedMonth}`);
      setCalendar(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadRazorpaySDK = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedSlot) {
      showToast("Please choose a date and time slot first.", "warning");
      return;
    }

    setBookingLoading(true);
    try {
      // 1. Create order on Backend
      const orderRes = await api.post("/api/payment/create-order", {
        therapistId: id,
        slotDate: selectedDate,
        slotTime: selectedSlot,
      });

      const { orderId, amount, currency, mock } = orderRes.data;

      // 2. Handle payment checkout (Real vs Mock)
      if (mock) {
        showToast("[Sandbox Mode] Simulating payment verification...", "info");
        
        // Directly hit verification endpoint simulating payment success
        await api.post("/api/payment/verify", {
          therapistId: id,
          slotDate: selectedDate,
          slotTime: selectedSlot,
          userNote,
          orderId,
          paymentId: `pay_mock_${Date.now()}`,
          amount,
          mock: true,
        });

        showToast("Session booked successfully!", "success");
        navigate("/my-therapist");
      } else {
        // Load Razorpay checkout dialog
        const sdkLoaded = await loadRazorpaySDK();
        if (!sdkLoaded) {
          showToast("Razorpay SDK failed to load. Please try again.", "error");
          setBookingLoading(false);
          return;
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_placeholder",
          amount: amount * 100,
          currency,
          name: "MindMate",
          description: `Wellness booking with Dr. ${therapist.name}`,
          order_id: orderId,
          handler: async function (response) {
            try {
              await api.post("/api/payment/verify", {
                therapistId: id,
                slotDate: selectedDate,
                slotTime: selectedSlot,
                userNote,
                orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                amount,
                mock: false,
              });

              showToast("Session booked successfully!", "success");
              navigate("/my-therapist");
            } catch (err) {
              showToast(err.response?.data?.error || "Payment verification failed", "error");
            }
          },
          prefill: {
            name: localStorage.getItem("uName") || "",
          },
          theme: {
            color: "#6abf8f",
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      showToast(err.response?.data?.error || "Order creation failed", "error");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
    setSelectedDate("");
    setSelectedSlot("");
  };

  if (loading) {
    return <div className="tp-loading">Loading Profile...</div>;
  }

  if (!therapist) {
    return (
      <div className="tp-error">
        <h3>Therapist not found.</h3>
        <Link to="/therapists">Back to directory</Link>
      </div>
    );
  }

  // Get active day available slots list
  const activeDayCalendar = calendar.find((c) => c.date === selectedDate);
  const slotsList = activeDayCalendar ? activeDayCalendar.availableSlots : [];

  return (
    <div className="tp-page">
      <header className="tp-header-nav">
        <Link to="/therapists" className="tp-back-link">
          ← Back to Therapists
        </Link>
      </header>

      <div className="tp-container">
        {/* Left Side — Profile Info Card */}
        <div className="tp-info-section">
          <div className="tp-profile-card">
            <img src={getImageUrl(therapist.profilePicUrl)} alt={therapist.name} />
            <h2>Dr. {therapist.name}</h2>
            <div className="rating">
              {therapist.reviewCount > 0 ? (
                <><i className="fa-solid fa-star" style={{color: '#f59e0b', marginRight: 4}}></i>{therapist.rating.toFixed(1)} ({therapist.reviewCount} reviews)</>
              ) : (
                <span className="rating-new" style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent)', background: 'rgba(106, 191, 143, 0.1)', padding: '2px 10px', borderRadius: '12px' }}>New Therapist</span>
              )}
            </div>
            <p className="exp"><i className="fa-solid fa-briefcase" style={{marginRight: 5}}></i>{therapist.experience} Years Experience</p>

            <div className="specs">
              {therapist.specializations.map((spec) => (
                <span key={spec} className="spec-badge">{spec}</span>
              ))}
            </div>

            <div className="bio-block">
              <h3>About Dr. {therapist.name}</h3>
              <p>{therapist.bio || "No biography provided."}</p>
            </div>

            <div className="fee-card">
              <span className="label">Session Fee:</span>
              <span className="value">₹{therapist.price} <span>/ {therapist.sessionDuration} mins</span></span>
            </div>
          </div>
        </div>

        {/* Right Side — Calendar Booking Area */}
        <div className="tp-booking-section">
          <div className="booking-card">
            <h3>Schedule a Session</h3>
            <p className="desc">Choose a date and select from the available time slots below.</p>

            {/* Month Picker */}
            <div className="month-picker-row">
              <label>Select Month:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={handleMonthChange}
                min={new Date().toISOString().slice(0, 7)}
              />
            </div>

            {/* Calendar Slots Grid */}
            <div className="calendar-grid">
              {calendar.length === 0 ? (
                <div className="calendar-empty">No slots available for this month.</div>
              ) : (
                calendar.map((dayObj) => {
                  const dayNum = parseInt(dayObj.date.split("-")[2], 10);
                  const isAvailable = dayObj.availableSlots.length > 0;
                  const isSelected = selectedDate === dayObj.date;

                  return (
                    <button
                      key={dayObj.date}
                      className={`calendar-day-btn ${isAvailable ? "available" : ""} ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        if (isAvailable) {
                          setSelectedDate(dayObj.date);
                          setSelectedSlot("");
                        }
                      }}
                      disabled={!isAvailable}
                    >
                      <span className="day-number">{dayNum}</span>
                      <span className="slots-count">{dayObj.availableSlots.length} slots</span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Time Slot Picker Drawer */}
            {selectedDate && (
              <div className="slots-drawer animate-fade">
                <h4>Available Times for {new Date(selectedDate).toDateString()}</h4>
                <div className="slots-flex">
                  {slotsList.map((slot) => (
                    <button
                      key={slot}
                      className={`slot-time-btn ${selectedSlot === slot ? "active" : ""}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      ⏰ {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Note & Consent Section */}
            {selectedDate && selectedSlot && (
              <div className="booking-details-inputs animate-fade">
                <div className="input-group">
                  <label>Add a note for the therapist (Optional)</label>
                  <textarea
                    placeholder="Briefly state what issues you want to address..."
                    value={userNote}
                    onChange={(e) => setUserNote(e.target.value)}
                  />
                </div>

                <div className="consent-checkbox-row">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={journalShared}
                      onChange={(e) => setJournalShared(e.target.checked)}
                    />
                    <span className="checkmark" />
                    Share my MindMate journal reflections with this therapist to assist during my session.
                  </label>
                </div>

                <button
                  className="confirm-booking-btn"
                  onClick={handleBooking}
                  disabled={bookingLoading}
                >
                  {bookingLoading ? <span className="tp-spinner" /> : `Book & Pay ₹${therapist.price}`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
