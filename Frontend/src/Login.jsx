import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";
import { useAuth } from "./Context/AuthContext";

function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [greeting, setGreeting] = useState("");
  const [affirmation, setAffirmation] = useState("");
  const [loading, setLoading] = useState(false);   // ⭐ NEW

  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {

    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    const affirmations = [
      "You are worthy of peace and a clear mind.",
      "Your mental health is a priority. Be kind to yourself today.",
      "One step at a time. One breath at a time.",
      "You have the power to navigate through your thoughts.",
      "It is okay to slow down and breathe."
    ];

    setAffirmation(affirmations[new Date().getDate() % affirmations.length]);

  }, []);

  const handleLogin = async (e) => {

    e.preventDefault();
    setLoading(true);   // ⭐ SHOW SCREEN IMMEDIATELY

    try {

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {

        login(data.token, data.user?.name);

        // small delay makes transition smoother
        setTimeout(() => navigate("/"), 400);

      } else {
        alert(data.message || "Invalid credentials");
        setLoading(false);
      }

    } catch (err) {

      console.error(err);
      alert("Server error. Please try again.");
      setLoading(false);

    }
  };

  return (

    <div className="auth-page-wrapper">

      {/* ⭐ FULL SCREEN LOGIN OVERLAY */}
      {loading && (
        <div className="login-overlay">
          <div className="login-overlay-content">
            <div className="spinner"></div>
            <h2>Logging you in...</h2>
            <p>Preparing your safe space ✨</p>
          </div>
        </div>
      )}

      <div className="auth-content-container">

        {/* LEFT PANEL */}
        <div className="affirmation-section">
          <div className="affirmation-card">
            <div className="quote-icon">“</div>
            <p className="affirmation-text">{affirmation}</p>
            <div className="breathe-box">
              <div className="breathe-dot"></div>
              <span>Take a moment to breathe...</span>
            </div>
          </div>
        </div>

        {/* LOGIN FORM */}
        <div className="login-section">
          <form className="login-form" onSubmit={handleLogin}>

            <div className="form-top-note">{greeting}</div>

            <h2>Welcome Back</h2>
            <p className="form-subtitle">Enter your private sanctuary.</p>

            <div className="input-group">
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="primary-btn login-btn"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <div className="auth-footer-links">
              <p>New here? <Link to="/signup">Start your journey</Link></p>
              <Link to="/" className="back-home">← Back to Home</Link>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}

export default Login;
