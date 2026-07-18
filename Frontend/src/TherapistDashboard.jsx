import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { getImageUrl } from "./services/api";
import { useAuth } from "./Context/AuthContext";
import { useToast } from "./components/Toast";
import ConfirmModal from "./components/ConfirmModal";
import "./TherapistDashboard.css";

export default function TherapistDashboard() {
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "active" | "completed" | "schedule"
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  
  // Schedule blocker state
  const [blockDateInput, setBlockDateInput] = useState("");
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Modals state
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { logout } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    fetchSessions();
    fetchBlockedDates();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/api/therapist/me");
      setProfile(res.data);
      
      // If therapist has not set up price or schedule yet, redirect to setup
      if (!res.data.price || !res.data.weeklySchedule || res.data.weeklySchedule.length === 0) {
        showToast("Welcome! Please complete your profile setup.", "info", 5000);
        navigate("/therapist/setup");
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        showToast("Session expired. Please log in again.", "error");
        logout();
        navigate("/login");
      } else {
        showToast("Failed to load profile. Please refresh.", "error");
      }
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await api.get("/api/therapist/sessions");
      setSessions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBlockedDates = async () => {
    try {
      const res = await api.get("/api/therapist/unavailable");
      setBlockedDates(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Accept booking flow
  const triggerAccept = (id) => {
    setSelectedSessionId(id);
    setAcceptModalOpen(true);
  };

  const handleAccept = async () => {
    setAcceptModalOpen(false);
    try {
      await api.put(`/api/therapist/session/${selectedSessionId}/accept`);
      showToast("Booking accepted successfully!", "success");
      fetchSessions();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to accept booking", "error");
    } finally {
      setSelectedSessionId(null);
    }
  };

  // Reject booking flow
  const triggerReject = (id) => {
    setSelectedSessionId(id);
    setRejectModalOpen(true);
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      showToast("Please provide a reason for rejection.", "warning");
      return;
    }

    setRejectModalOpen(false);
    try {
      await api.put(`/api/therapist/session/${selectedSessionId}/reject`, {
        reason: rejectionReason,
      });
      showToast("Booking rejected and refund processed.", "info");
      fetchSessions();
      setRejectionReason("");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to reject booking", "error");
    } finally {
      setSelectedSessionId(null);
    }
  };

  // Block date flow
  const handleBlockDate = async (e) => {
    e.preventDefault();
    if (!blockDateInput) return;

    setScheduleLoading(true);
    try {
      await api.post("/api/therapist/unavailable", { date: blockDateInput });
      showToast("Date blocked successfully.", "success");
      setBlockDateInput("");
      fetchBlockedDates();
    } catch (err) {
      showToast(err.response?.data?.error || "Cannot block this date.", "error");
    } finally {
      setScheduleLoading(false);
    }
  };

  // Unblock date flow
  const handleUnblockDate = async (date) => {
    try {
      await api.delete(`/api/therapist/unavailable/${date}`);
      showToast("Date unblocked successfully.", "success");
      fetchBlockedDates();
    } catch (err) {
      showToast("Failed to unblock date.", "error");
    }
  };

  const handleLogout = () => {
    logout();
    showToast("Logged out successfully.", "info");
    navigate("/");
  };

  const pendingList = sessions.filter((s) => s.status === "pending");
  const activeList = sessions.filter((s) => s.status === "accepted" || s.status === "active");
  const completedList = sessions.filter((s) => s.status === "completed" || s.status === "rejected");

  return (
    <div className="td-layout">
      {/* Sidebar Navigation */}
      <aside className="td-sidebar">
        <div className="td-logo">
          <i className="fa-solid fa-brain td-logo-icon"></i>
          <div className="td-logo-text">
            <h2>MindMate</h2>
            <span className="logo-badge">Therapist</span>
          </div>
        </div>

        {profile && (
          <div className="td-profile-summary">
            <img src={getImageUrl(profile.profilePicUrl)} alt="profile" />
            <h3>Dr. {profile.name}</h3>
            <p>
              {profile.reviewCount > 0 ? (
                <><i className="fa-solid fa-star" style={{color: '#f59e0b', marginRight: 4}}></i>{profile.rating.toFixed(1)} ({profile.reviewCount} reviews)</>
              ) : (
                "New Therapist (No reviews yet)"
              )}
            </p>
          </div>
        )}

        <nav className="td-nav">
          <button className={activeTab === "pending" ? "active" : ""} onClick={() => setActiveTab("pending")}>
            <i className="fa-regular fa-envelope"></i> Pending Requests ({pendingList.length})
          </button>
          <button className={activeTab === "active" ? "active" : ""} onClick={() => setActiveTab("active")}>
            <i className="fa-regular fa-calendar-check"></i> Scheduled Sessions ({activeList.length})
          </button>
          <button className={activeTab === "completed" ? "active" : ""} onClick={() => setActiveTab("completed")}>
            <i className="fa-solid fa-check-double"></i> History &amp; Earnings ({completedList.length})
          </button>
          <button className={activeTab === "schedule" ? "active" : ""} onClick={() => setActiveTab("schedule")}>
            <i className="fa-solid fa-gear"></i> Block Schedule Dates
          </button>
        </nav>

        <button className="td-logout-btn" onClick={handleLogout}>
          <i className="fa-solid fa-right-from-bracket"></i> Log Out
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="td-main">
        {/* Modals */}
        <ConfirmModal
          isOpen={acceptModalOpen}
          title="Accept Booking Request?"
          message="This will lock the appointment into your schedule."
          confirmText="Accept"
          cancelText="Cancel"
          variant="info"
          onConfirm={handleAccept}
          onCancel={() => setAcceptModalOpen(false)}
        />

        {rejectModalOpen && (
          <div className="custom-modal-overlay">
            <div className="custom-modal-card">
              <h3>Decline Appointment Booking</h3>
              <p>Please enter the reason for rejection (this will be emailed to the patient and refunds will be auto-processed).</p>
              <form onSubmit={handleReject}>
                <textarea
                  placeholder="e.g. Schedule conflict / emergency leave..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                  autoFocus
                />
                <div className="modal-actions">
                  <button type="button" className="m-cancel" onClick={() => setRejectModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="m-confirm danger">
                    Confirm Reject &amp; Refund
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <header className="td-header">
          <h1>
            {activeTab === "pending" && "Pending Bookings"}
            {activeTab === "active" && "Upcoming Appointments"}
            {activeTab === "completed" && "Completed History & Payouts"}
            {activeTab === "schedule" && "Calendar Date Blocking"}
          </h1>
          {profile && (
            <div className="td-header-info">
              <span>Price per Session: <strong>₹{profile.price}</strong></span>
              <span>Session Length: <strong>{profile.sessionDuration} mins</strong></span>
            </div>
          )}
        </header>

        {/* Tab contents */}
        <div className="td-content">
          {activeTab === "pending" && (
            <div className="td-sessions-grid">
              {pendingList.length === 0 ? (
                <div className="td-empty">No pending requests found.</div>
              ) : (
                pendingList.map((session) => (
                  <div key={session._id} className="session-item-card">
                    <div className="card-top">
                      <span className="badge pending">Pending</span>
                      <span className="date">{new Date(session.scheduledAt).toLocaleDateString()}</span>
                    </div>
                    <h4>Patient: {session.userId?.name}</h4>
                    <p className="time"><i className="fa-regular fa-clock"></i> Time slot: {session.slotTime}</p>
                    {session.userNote && (
                      <p className="note"><i className="fa-regular fa-comment"></i> Note: "{session.userNote}"</p>
                    )}
                    <div className="card-actions-row">
                      <button className="btn btn-accept" onClick={() => triggerAccept(session._id)}>
                        Accept
                      </button>
                      <button className="btn btn-reject" onClick={() => triggerReject(session._id)}>
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "active" && (
            <div className="td-sessions-grid">
              {activeList.length === 0 ? (
                <div className="td-empty">No scheduled sessions found.</div>
              ) : (
                activeList.map((session) => (
                  <div key={session._id} className="session-item-card active-card">
                    <div className="card-top">
                      <span className={`badge ${session.status}`}>{session.status}</span>
                      <span className="date">{new Date(session.scheduledAt).toLocaleDateString()}</span>
                    </div>
                    <h4>Patient: {session.userId?.name}</h4>
                    <p className="time"><i className="fa-regular fa-clock"></i> Slot Time: {session.slotTime}</p>
                    
                    <button
                      className="btn btn-chat-link"
                      onClick={() => navigate(`/session/${session._id}`)}
                    >
                      <i className="fa-regular fa-comments"></i> Open Session Room
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "completed" && (
            <div className="td-sessions-grid">
              {completedList.length === 0 ? (
                <div className="td-empty">No historic records found.</div>
              ) : (
                completedList.map((session) => (
                  <div key={session._id} className="session-item-card completed-card">
                    <div className="card-top">
                      <span className={`badge ${session.status}`}>{session.status}</span>
                      <span className="date">{new Date(session.scheduledAt).toLocaleDateString()}</span>
                    </div>
                    <h4>Patient: {session.userId?.name}</h4>
                    <p className="time"><i className="fa-regular fa-clock"></i> Slot Time: {session.slotTime}</p>
                    
                    <div className="earnings-section">
                      <p>Consultation Fee: <strong>₹{session.amountPaid}</strong></p>
                      {session.status === "completed" ? (
                        <>
                          <p>Commission (10%): <span className="red">-₹{session.platformCut}</span></p>
                          <p className="final-pay">Your Payout: <strong className="green">₹{session.therapistPayout}</strong></p>
                          <p className="payout-badge">Status: <strong className={session.payoutStatus}>{session.payoutStatus.toUpperCase()}</strong></p>
                        </>
                      ) : (
                        <p className="rejection-note">Rejection Reason: <i>"{session.rejectionReason || "Declined"}"</i></p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "schedule" && (
            <div className="td-schedule-panel">
              <div className="block-date-form-box">
                <h3>Block a Full Day</h3>
                <p>Prevent users from booking any appointments on a specific day. You can only block dates with no scheduled appointments.</p>
                
                <form onSubmit={handleBlockDate} className="block-form">
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={blockDateInput}
                    onChange={(e) => setBlockDateInput(e.target.value)}
                    required
                  />
                  <button type="submit" disabled={scheduleLoading}>
                    {scheduleLoading ? "Blocking..." : <><i className="fa-solid fa-ban"></i> Block This Date</>}
                  </button>
                </form>
              </div>

              <div className="blocked-dates-list-box">
                <h3>Currently Blocked Dates</h3>
                {blockedDates.length === 0 ? (
                  <p className="no-blocked">No dates are currently blocked.</p>
                ) : (
                  <div className="blocked-list">
                    {blockedDates.map((date) => (
                      <div key={date} className="blocked-date-tag">
                        <span><i className="fa-regular fa-calendar-xmark"></i> {new Date(date).toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" })}</span>
                        <button type="button" onClick={() => handleUnblockDate(date)}>
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
