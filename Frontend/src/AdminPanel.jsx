import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { getImageUrl } from "./services/api";
import { useAuth } from "./Context/AuthContext";
import { useToast } from "./components/Toast";
import ConfirmModal from "./components/ConfirmModal";
import "./AdminPanel.css";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("applications"); // "applications" | "users" | "stats"
  const [therapists, setTherapists] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);

  // Modal states
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { logout } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTherapists();
    fetchUsers();
    fetchStats();
  }, []);

  const fetchTherapists = async () => {
    try {
      const res = await api.get("/api/admin/therapists");
      setTherapists(res.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        showToast("Session expired. Please log in again.", "error");
        logout();
        navigate("/login");
      } else {
        showToast("Failed to load therapist applications.", "error");
      }
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/api/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get("/api/admin/stats");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Therapist Approval Flow
  const triggerApprove = (id) => {
    setSelectedEntityId(id);
    setApproveModalOpen(true);
  };

  const handleApprove = async () => {
    setApproveModalOpen(false);
    try {
      await api.put(`/api/admin/therapist/${selectedEntityId}/approve`);
      showToast("Therapist approved successfully and notified via email.", "success");
      fetchTherapists();
      fetchStats();
    } catch {
      showToast("Failed to approve application.", "error");
    } finally {
      setSelectedEntityId(null);
    }
  };

  // Therapist Rejection Flow
  const triggerReject = (id) => {
    setSelectedEntityId(id);
    setRejectModalOpen(true);
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      showToast("Please enter a reason for rejection.", "warning");
      return;
    }

    setRejectModalOpen(false);
    try {
      await api.put(`/api/admin/therapist/${selectedEntityId}/reject`, {
        reason: rejectionReason,
      });
      showToast("Therapist declined successfully.", "info");
      fetchTherapists();
      setRejectionReason("");
    } catch {
      showToast("Failed to reject application.", "error");
    } finally {
      setSelectedEntityId(null);
    }
  };

  // User Deactivation Flow
  const triggerDeactivate = (id) => {
    setSelectedEntityId(id);
    setDeactivateModalOpen(true);
  };

  const handleDeactivate = async () => {
    setDeactivateModalOpen(false);
    try {
      const res = await api.put(`/api/admin/user/${selectedEntityId}/deactivate`);
      showToast(res.data.message, "success");
      fetchUsers();
      fetchStats();
    } catch {
      showToast("Failed to change user status.", "error");
    } finally {
      setSelectedEntityId(null);
    }
  };

  const handleLogout = () => {
    logout();
    showToast("Logged out from admin session.", "info");
    navigate("/");
  };

  const pendingApps = therapists.filter((t) => t.status === "pending");
  const verifiedTherapists = therapists.filter((t) => t.status === "approved" || t.status === "rejected");

  return (
    <div className="ap-layout">
      {/* Sidebar navigation */}
      <aside className="ap-sidebar">
        <div className="ap-logo">
          <i className="fa-solid fa-shield-halved" style={{fontSize: '22px', color: 'var(--accent)'}}></i>
          <h2>Admin Control</h2>
        </div>

        <nav className="ap-nav">
          <button className={activeTab === "applications" ? "active" : ""} onClick={() => setActiveTab("applications")}>
            <i className="fa-regular fa-envelope"></i> Applications ({pendingApps.length})
          </button>
          <button className={activeTab === "users" ? "active" : ""} onClick={() => setActiveTab("users")}>
            <i className="fa-solid fa-users"></i> User Management ({users.length})
          </button>
          <button className={activeTab === "stats" ? "active" : ""} onClick={() => setActiveTab("stats")}>
            <i className="fa-solid fa-chart-bar"></i> System Analytics
          </button>
        </nav>

        <button className="ap-logout-btn" onClick={handleLogout}>
          <i className="fa-solid fa-right-from-bracket"></i> Exit Portal
        </button>
      </aside>

      {/* Main content grid */}
      <main className="ap-main">
        {/* Modals */}
        <ConfirmModal
          isOpen={approveModalOpen}
          title="Approve Therapist Application?"
          message="This will notify the therapist of their approval and activate their account."
          confirmText="Approve"
          cancelText="Cancel"
          variant="info"
          onConfirm={handleApprove}
          onCancel={() => setApproveModalOpen(false)}
        />

        <ConfirmModal
          isOpen={deactivateModalOpen}
          title="Modify User Active Status?"
          message="This toggles the user's ability to log in and access MindMate."
          confirmText="Toggle"
          cancelText="Cancel"
          variant="danger"
          onConfirm={handleDeactivate}
          onCancel={() => setDeactivateModalOpen(false)}
        />

        {rejectModalOpen && (
          <div className="ap-modal-overlay">
            <div className="ap-modal-card">
              <h3>Decline Therapist Application</h3>
              <p>State the reason for declining this application (this will be emailed to the applicant).</p>
              <form onSubmit={handleReject}>
                <textarea
                  placeholder="e.g. Invalid license credentials / documents unclear..."
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
                    Decline Applicant
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <header className="ap-header">
          <h1>
            {activeTab === "applications" && "Therapist Registration Requests"}
            {activeTab === "users" && "Platform User Accounts"}
            {activeTab === "stats" && "Control Panel Dashboard"}
          </h1>
        </header>

        <div className="ap-content">
          {activeTab === "applications" && (
            <div className="ap-applications-section">
              <h3>Pending Verification</h3>
              {pendingApps.length === 0 ? (
                <div className="ap-empty">No pending therapist applications at this time.</div>
              ) : (
                <div className="ap-apps-list">
                  {pendingApps.map((t) => (
                    <div key={t._id} className="app-card">
                      <div className="app-card-top">
                        <img src={getImageUrl(t.profilePicUrl)} alt="pic" />
                        <div className="info">
                          <h4>Dr. {t.name}</h4>
                          <p>{t.email}</p>
                        </div>
                      </div>

                      <div className="app-card-details">
                        <p><i className="fa-solid fa-briefcase"></i> <strong>Experience:</strong> {t.experience} Years</p>
                        <p><i className="fa-solid fa-id-card"></i> <strong>License:</strong> {t.licenseNumber}</p>
                        <p><i className="fa-solid fa-tags"></i> <strong>Specializations:</strong> {t.specializations?.join(", ")}</p>
                        {t.bio && <p className="bio"><i className="fa-regular fa-file-lines"></i> <i>"{t.bio}"</i></p>}
                      </div>

                      <div className="app-card-actions">
                        <a
                          href={getImageUrl(t.degreeDocUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="view-doc-btn"
                        >
                          <i className="fa-regular fa-file-pdf"></i> View Degree Doc
                        </a>
                        <div className="decide-btns">
                          <button className="btn-approve" onClick={() => triggerApprove(t._id)}>
                            Approve
                          </button>
                          <button className="btn-reject" onClick={() => triggerReject(t._id)}>
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <h3 className="section-divider">Verification History</h3>
              {verifiedTherapists.length === 0 ? (
                <div className="ap-empty">No historic application decisions recorded.</div>
              ) : (
                <div className="ap-table-wrapper">
                  <table className="ap-table">
                    <thead>
                      <tr>
                        <th>Therapist Name</th>
                        <th>Email</th>
                        <th>License</th>
                        <th>Status</th>
                        <th>Notes / Rejection Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verifiedTherapists.map((t) => (
                        <tr key={t._id}>
                          <td><strong>Dr. {t.name}</strong></td>
                          <td>{t.email}</td>
                          <td>{t.licenseNumber}</td>
                          <td>
                            <span className={`status-pill ${t.status}`}>{t.status}</span>
                          </td>
                          <td>
                            {t.status === "rejected" ? (
                              <span className="rejected-reason">"{t.rejectionReason}"</span>
                            ) : (
                              <span className="approved-note">Approved for system consulting</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "users" && (
            <div className="ap-users-section">
              {users.length === 0 ? (
                <div className="ap-empty">No users registered on the platform.</div>
              ) : (
                <div className="ap-table-wrapper">
                  <table className="ap-table">
                    <thead>
                      <tr>
                        <th>Patient Name</th>
                        <th>Email Address</th>
                        <th>Current Streak</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u._id}>
                          <td><strong>{u.name}</strong></td>
                          <td>{u.email}</td>
                          <td><i className="fa-solid fa-fire" style={{color:'#f97316', marginRight:4}}></i>{u.streak} Days</td>
                          <td>
                            <span className={`status-pill ${u.isActive !== false ? "approved" : "rejected"}`}>
                              {u.isActive !== false ? "Active" : "Deactivated"}
                            </span>
                          </td>
                          <td>
                            <button
                              className={`action-toggle-btn ${u.isActive !== false ? "deactivate" : "activate"}`}
                              onClick={() => triggerDeactivate(u._id)}
                            >
                              {u.isActive !== false ? <><i className="fa-solid fa-ban"></i> Deactivate</> : <><i className="fa-solid fa-rotate-right"></i> Reactivate</>}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "stats" && stats && (
            <div className="ap-stats-section">
              <div className="stats-grid">
                <div className="stats-card">
                  <span className="stat-icon"><i className="fa-solid fa-users"></i></span>
                  <div className="stat-info">
                    <span className="stat-label">Total Users</span>
                    <span className="stat-val">{stats.totalUsers}</span>
                  </div>
                </div>

                <div className="stats-card">
                  <span className="stat-icon"><i className="fa-solid fa-user-doctor"></i></span>
                  <div className="stat-info">
                    <span className="stat-label">Approved Therapists</span>
                    <span className="stat-val">{stats.totalTherapists}</span>
                  </div>
                </div>

                <div className="stats-card">
                  <span className="stat-icon"><i className="fa-regular fa-calendar-check"></i></span>
                  <div className="stat-info">
                    <span className="stat-label">Completed Sessions</span>
                    <span className="stat-val">{stats.totalSessions}</span>
                  </div>
                </div>

                <div className="stats-card">
                  <span className="stat-icon"><i className="fa-solid fa-indian-rupee-sign"></i></span>
                  <div className="stat-info">
                    <span className="stat-label">Platform Cut Revenue (10%)</span>
                    <span className="stat-val">₹{stats.totalRevenue}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
