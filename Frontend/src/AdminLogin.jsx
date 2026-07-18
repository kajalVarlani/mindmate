import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "./services/api";
import { useAuth } from "./Context/AuthContext";
import { useToast } from "./components/Toast";
import "./AdminLogin.css";

export default function AdminLogin() {
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
      const res = await api.post("/api/admin/login", { email, password });
      showToast("Access granted. Welcome to the Control Panel.", "success");
      
      login(res.data.token, "Administrator", "admin");
      
      setTimeout(() => navigate("/admin"), 500);
    } catch (err) {
      const msg = err.response?.data?.error || "Invalid admin credentials.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="al-wrapper">
      <div className="al-card">
        <div className="al-icon"><i className="fa-solid fa-shield-halved"></i></div>
        <h2 className="al-title">MindMate Control</h2>
        <p className="al-subtitle">Admin authentication is required to access system settings and approvals.</p>

        <form onSubmit={handleSubmit} className="al-form">
          <div className="al-input-group">
            <label>Admin Email</label>
            <input
              type="email"
              placeholder="admin@mindmate.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="al-input-group">
            <label>Master Password</label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="al-btn" disabled={loading}>
            {loading ? <span className="al-spinner" /> : "Authenticate"}
          </button>
        </form>

        <div className="al-footer">
          <Link to="/" className="al-back-home">← Return to MindMate Home</Link>
        </div>
      </div>
    </div>
  );
}
