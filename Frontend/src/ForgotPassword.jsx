import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "./services/api";
import { useToast } from "./components/Toast";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1 = enter email, 2 = enter OTP + new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const showToast = useToast();
  const navigate = useNavigate();

  /* ── Step 1: Request OTP ── */
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast("Please enter your email address.", "warning");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
      showToast("OTP sent! Check your inbox.", "success");
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.error || "Something went wrong. Please try again.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: Verify OTP + Reset ── */
  const handleReset = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters.", "warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords don't match.", "warning");
      return;
    }
    if (otp.length !== 6) {
      showToast("Please enter the 6-digit OTP.", "warning");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", { email, otp, newPassword });
      showToast("Password reset! Please log in with your new password.", "success", 4500);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      const msg = err.response?.data?.error || "Reset failed. Please try again.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fp-wrapper">
      <div className="fp-card">

        {/* Icon */}
        <div className="fp-icon"><i className="fa-solid fa-key"></i></div>

        {/* Step indicator */}
        <div className="fp-steps">
          <div className={`fp-step ${step >= 1 ? "active" : ""}`}>
            <span>1</span> Email
          </div>
          <div className="fp-step-line" />
          <div className={`fp-step ${step >= 2 ? "active" : ""}`}>
            <span>2</span> Reset
          </div>
        </div>

        {step === 1 ? (
          <>
            <h2 className="fp-title">Forgot Password?</h2>
            <p className="fp-subtitle">
              Enter your registered email and we'll send you a reset code.
            </p>

            <form onSubmit={handleSendOtp} className="fp-form">
              <div className="fp-input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="fp-btn fp-btn--primary"
                disabled={loading}
              >
                {loading ? (
                  <span className="fp-spinner" />
                ) : (
                  "Send Reset Code"
                )}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="fp-title">Reset Password</h2>
            <p className="fp-subtitle">
              We sent a code to <strong>{email}</strong>. Enter it below with your new password.
            </p>

            <form onSubmit={handleReset} className="fp-form">
              <div className="fp-input-group">
                <label>6-Digit OTP</label>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>

              <div className="fp-input-group">
                <label>New Password</label>
                <div className="fp-pass-wrap">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="fp-eye-btn"
                    onClick={() => setShowPass(!showPass)}
                    tabIndex={-1}
                  >
                    {showPass ? <i className="fa-regular fa-eye-slash"></i> : <i className="fa-regular fa-eye"></i>}
                  </button>
                </div>
              </div>

              <div className="fp-input-group">
                <label>Confirm New Password</label>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {/* Password match indicator */}
                {confirmPassword && (
                  <span className={`fp-match ${newPassword === confirmPassword ? "match" : "no-match"}`}>
                    {newPassword === confirmPassword ? "✓ Passwords match" : "✗ Passwords don't match"}
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="fp-btn fp-btn--primary"
                disabled={loading}
              >
                {loading ? <span className="fp-spinner" /> : "Reset Password"}
              </button>

              <button
                type="button"
                className="fp-btn fp-btn--ghost"
                onClick={() => { setStep(1); setOtp(""); setNewPassword(""); setConfirmPassword(""); }}
              >
                ← Use a different email
              </button>
            </form>
          </>
        )}

        <div className="fp-footer-links">
          <Link to="/login">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
