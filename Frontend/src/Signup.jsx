import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Signup.css";
import { useAuth } from "./Context/AuthContext";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [greeting, setGreeting] = useState("");
  const [affirmation, setAffirmation] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    // Greeting logic
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    // Signup specific affirmations
    const affirmations = [
      "The first step towards change is the most powerful.",
      "Growth begins the moment you decide to prioritize yourself.",
      "You are creating a safe space for your thoughts to bloom.",
      "Every journey starts with a single, mindful breath.",
      "Investing in your mental wellness is the best gift you can give yourself."
    ];
    setAffirmation(affirmations[new Date().getDate() % affirmations.length]);
  }, []);

const handleSignup = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:8080/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (data.token) {
      login(data.token, data.user.name);
      navigate("/journal");
    } else {
      alert(data.message || "Signup failed");
    }
  };



  return (
    <div className="auth-page-wrapper">
      <div className="auth-content-container">
        
        {/* Left Side: Affirmation Panel (Glassmorphic) */}
        <div className="affirmation-section">
          <div className="affirmation-card">
            <div className="quote-icon">“</div>
            <p className="affirmation-text">{affirmation}</p>
            <div className="breathe-box">
              <div className="breathe-dot"></div>
              <span>Take a moment to center yourself...</span>
            </div>
          </div>
        </div>

        {/* Right Side: Signup Form */}
        <div className="signup-section">
          <form className="signup-form" onSubmit={handleSignup}>
            <div className="form-top-note">
              {greeting}, start your journey.
            </div>
            <h2>Create Account</h2>
            <p className="form-subtitle">Begin your private mental wellness journal.</p>
            
            <div className="input-group">
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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
                placeholder="Choose Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="primary-btn signup-btn">Get Started</button>

            <div className="auth-footer-links">
              <p>Already have a sanctuary? <Link to="/login">Sign in here</Link></p>
              <Link to="/" className="back-home">← Back to Home</Link>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}

export default Signup;