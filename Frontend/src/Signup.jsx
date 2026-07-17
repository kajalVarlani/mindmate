import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Signup.css";
import { useAuth } from "./Context/AuthContext";
import api from "./services/api";
import { useToast } from "./components/Toast";

function Signup() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [affirmation, setAffirmation] = useState("");
  
  const navigate = useNavigate();
  const { login } = useAuth();
  const showToast = useToast();

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

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!email.toLowerCase().endsWith("@gmail.com")) {
      showToast("Please use a valid @gmail.com email address.", "warning");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/auth/send-otp", { email });
      showToast("OTP sent! Check your inbox.", "success");
      setStep(2);
    } catch (err) {
      const message = err.response?.data?.error || "Failed to send OTP. Please try again.";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/api/auth/signup", { name, email, password, otp });
      const data = res.data;

      if (data.token) {
        login(data.token, data.user?.name);
        navigate("/");
      }
    } catch (err) {
      const message = err.response?.data?.error || "Signup failed. Please try again.";
      showToast(message, "error");
    } finally {
      setLoading(false);
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
          {step === 1 ? (
            <form className="signup-form" onSubmit={handleSendOtp}>
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
                  placeholder="Email Address (@gmail.com only)"
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
                  minLength="6"
                />
              </div>

              <button type="submit" className="primary-btn signup-btn" disabled={loading}>
                {loading ? "Sending OTP..." : "Continue"}
              </button>

              <div className="auth-footer-links">
                <p>Already have a sanctuary? <Link to="/login">Sign in here</Link></p>
                <Link to="/" className="back-home">← Back to Home</Link>
              </div>
            </form>
          ) : (
             <form className="signup-form" onSubmit={handleSignup}>
              <div className="form-top-note">
                Verify Your Email
              </div>
              <h2>Enter OTP</h2>
              <p className="form-subtitle">We sent a 6-digit code to {email}</p>
              
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength="6"
                />
              </div>

              <button type="submit" className="primary-btn signup-btn" disabled={loading}>
                {loading ? "Verifying..." : "Verify & Get Started"}
              </button>

              <div className="auth-footer-links" style={{ marginTop: '15px' }}>
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  ← Back to details
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

export default Signup;