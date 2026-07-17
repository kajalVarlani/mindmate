import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { getImageUrl } from "./services/api";
import { useToast } from "./components/Toast";
import "./MyTherapist.css";

export default function MyTherapist() {
  const [sessions, setSessions] = useState([]);
  const [activeTab, setActiveTab] = useState("scheduled"); // "pending" | "scheduled" | "history"
  const [loading, setLoading] = useState(true);

  const showToast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get("/api/session/my");
      setSessions(res.data);
    } catch {
      showToast("Could not load your session history.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConsentToggle = async (sessionId, currentConsent) => {
    try {
      await api.put(`/api/session/${sessionId}/share-journal`, {
        journalShared: !currentConsent,
      });
      showToast(`Journal sharing consent ${!currentConsent ? "enabled" : "disabled"}.`, "success");
      
      // Update local state instantly
      setSessions((prev) =>
        prev.map((s) => (s._id === sessionId ? { ...s, journalShared: !currentConsent } : s))
      );
    } catch {
      showToast("Failed to update journal sharing preference.", "error");
    }
  };

  const pendingList = sessions.filter((s) => s.status === "pending");
  const scheduledList = sessions.filter((s) => s.status === "accepted" || s.status === "active");
  const historyList = sessions.filter((s) => s.status === "completed" || s.status === "rejected");

  return (
    <div className="mt-page">
      <header className="mt-header">
        <Link to="/" className="mt-back-link">← Back to Home</Link>
        <h1>My Therapist Sessions</h1>
        <p className="mt-subtitle">View and manage your appointments, consent settings, and active chats.</p>

        <div className="mt-nav-actions">
          <Link to="/therapists" className="mt-book-new-btn">
            ➕ Schedule a New Session
          </Link>
        </div>
      </header>

      {/* Tabs */}
      <div className="mt-tabs">
        <button className={activeTab === "scheduled" ? "active" : ""} onClick={() => setActiveTab("scheduled")}>
          📅 Confirmed Sessions ({scheduledList.length})
        </button>
        <button className={activeTab === "pending" ? "active" : ""} onClick={() => setActiveTab("pending")}>
          ⏳ Awaiting Confirmation ({pendingList.length})
        </button>
        <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}>
          📋 Past History ({historyList.length})
        </button>
      </div>

      {/* Tab contents */}
      <div className="mt-content">
        {loading ? (
          <div className="mt-loader">
            <span className="mt-spinner" />
            <p>Loading your appointments...</p>
          </div>
        ) : (
          <div className="mt-grid">
            {activeTab === "scheduled" && (
              scheduledList.length === 0 ? (
                <div className="mt-empty">
                  <p>You have no upcoming confirmed appointments.</p>
                  <Link to="/therapists" className="btn-link">Find a therapist</Link>
                </div>
              ) : (
                scheduledList.map((session) => (
                  <div key={session._id} className="mt-card scheduled">
                    <div className="mt-card-top">
                      <img src={getImageUrl(session.therapistId?.profilePicUrl)} alt="profile" />
                      <div className="therapist-info">
                        <h3>Dr. {session.therapistId?.name}</h3>
                        <p className="spec">{session.therapistId?.specializations?.join(", ")}</p>
                      </div>
                    </div>

                    <div className="mt-card-details">
                      <p>📅 <strong>Date:</strong> {new Date(session.scheduledAt).toLocaleDateString()}</p>
                      <p>⏱️ <strong>Slot Time:</strong> {session.slotTime}</p>
                      <p>⏳ <strong>Length:</strong> {session.duration} minutes</p>
                    </div>

                    <div className="mt-consent-toggle-box">
                      <label className="mt-toggle-container">
                        <input
                          type="checkbox"
                          checked={session.journalShared}
                          onChange={() => handleConsentToggle(session._id, session.journalShared)}
                        />
                        <span className="mt-toggle-checkmark" />
                        Share my wellness journals for this session
                      </label>
                    </div>

                    <button
                      className="mt-action-btn mt-join-chat-btn"
                      onClick={() => navigate(`/session/${session._id}`)}
                    >
                      💬 Join Session Room
                    </button>
                  </div>
                ))
              )
            )}

            {activeTab === "pending" && (
              pendingList.length === 0 ? (
                <div className="mt-empty">You have no requests awaiting therapist approval.</div>
              ) : (
                pendingList.map((session) => (
                  <div key={session._id} className="mt-card pending-card">
                    <div className="mt-card-top">
                      <img src={getImageUrl(session.therapistId?.profilePicUrl)} alt="profile" />
                      <div className="therapist-info">
                        <h3>Dr. {session.therapistId?.name}</h3>
                        <p className="spec">{session.therapistId?.specializations?.join(", ")}</p>
                      </div>
                    </div>

                    <div className="mt-card-details">
                      <p>📅 <strong>Requested Date:</strong> {new Date(session.scheduledAt).toLocaleDateString()}</p>
                      <p>⏱️ <strong>Slot Time:</strong> {session.slotTime}</p>
                      <span className="status-badge pending">Awaiting Approval</span>
                    </div>

                    <div className="mt-consent-toggle-box">
                      <label className="mt-toggle-container">
                        <input
                          type="checkbox"
                          checked={session.journalShared}
                          onChange={() => handleConsentToggle(session._id, session.journalShared)}
                        />
                        <span className="mt-toggle-checkmark" />
                        Share my wellness journals for this session
                      </label>
                    </div>
                  </div>
                ))
              )
            )}

            {activeTab === "history" && (
              historyList.length === 0 ? (
                <div className="mt-empty">You have no past sessions recorded.</div>
              ) : (
                historyList.map((session) => (
                  <div key={session._id} className="mt-card history-card">
                    <div className="mt-card-top">
                      <img src={getImageUrl(session.therapistId?.profilePicUrl)} alt="profile" />
                      <div className="therapist-info">
                        <h3>Dr. {session.therapistId?.name}</h3>
                        <span className={`status-badge ${session.status}`}>{session.status}</span>
                      </div>
                    </div>

                    <div className="mt-card-details">
                      <p>📅 <strong>Date:</strong> {new Date(session.scheduledAt).toLocaleDateString()}</p>
                      <p>⏱️ <strong>Slot Time:</strong> {session.slotTime}</p>
                      <p>💳 <strong>Amount Paid:</strong> ₹{session.amountPaid}</p>
                      {session.status === "rejected" && (
                        <p className="rejection-info">❌ Rejected. Refunded. Reason: <i>"{session.rejectionReason || "Unavailable"}"</i></p>
                      )}
                    </div>

                    {session.status === "completed" && (
                      <button
                        className="mt-action-btn mt-history-chat-btn"
                        onClick={() => navigate(`/session/${session._id}`)}
                      >
                        📂 View Session Chat Logs
                      </button>
                    )}
                  </div>
                ))
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
