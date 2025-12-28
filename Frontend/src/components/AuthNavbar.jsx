import { Link, useLocation } from "react-router-dom";
import "./AuthNavbar.css";

function AuthNavbar() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <nav className="auth-navbar">
      <div className="auth-nav-container">
        <Link to="/" className="auth-logo">
          Back to home
        </Link>
        
        <div className="auth-nav-links">
          <Link to="/" className="nav-text-link">Home</Link>
          <span className="nav-divider">|</span>
          {isLoginPage ? (
            <div className="nav-prompt">
              <span>New here?</span>
              <Link to="/signup" className="auth-nav-button">Create Account</Link>
            </div>
          ) : (
            <div className="nav-prompt">
              <span>Have an account?</span>
              <Link to="/login" className="auth-nav-button">Sign In</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default AuthNavbar;