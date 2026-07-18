import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "./services/api";
import { useAuth } from "./Context/AuthContext";
import { useToast } from "./components/Toast";
import "./TherapistLogin.css";

export default function TherapistLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const showToast = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/api/therapist/login", { email, password });
      showToast("Login successful! Welcome to your dashboard.", "success");
      
      login(res.data.token, res.data.therapist.name, "therapist");
      
      // Redirect to therapist dashboard
      setTimeout(() => navigate("/therapist/dashboard"), 500);
    } catch (err) {
      const msg = err.response?.data?.error || "Login failed. Please check your credentials.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tl-wrapper">
      <div className="tl-card">
        <div className="tl-icon"><i className="fa-solid fa-user-doctor"></i></div>
        <h2 className="tl-title">Therapist Portal</h2>
        <p className="tl-subtitle">Log in to manage your bookings, schedule, and patient sessions.</p>

        <form onSubmit={handleSubmit} className="tl-form">
          <div className="tl-input-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="sarah@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="tl-input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="tl-btn" disabled={loading}>
            {loading ? <span className="tl-spinner" /> : "Log In"}
          </button>
        </form>

        <div className="tl-footer">
          <p>Interested in joining? <Link to="/therapist/register">Apply here</Link></p>
          <Link to="/" className="tl-back-home">← Back to MindMate Home</Link>
        </div>
      </div>
    </div>
  );
}
