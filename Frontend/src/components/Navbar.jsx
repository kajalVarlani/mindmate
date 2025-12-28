import { useNavigate, Link, useLocation } from 'react-router-dom';
import "./Navbar.css";
import logo from "../assets/logo.png";
import LogoutButton from "../components/LogoutButton.jsx";
import { useAuth } from "../Context/AuthContext";

export default function Navbar() {

    const location = useLocation();

    // JWT Logic: Check if a token exists in local storage
    const token = localStorage.getItem("token");
    const { isAuthenticated, logout } = useAuth(); // Refresh ki zaroorat nahi padegi
    const navigate = useNavigate();
    const handleLogout = () => {
        logout(); // Yeh context update karega aur UI turant change hogi
        navigate("/");
    };

    return (
        <header className="glass-nav-wrapper">
            <nav className="glass-navbar">
                {/* Logo: Routes to Home if logged in, else Landing */}
                <div className="nav-left" onClick={() => navigate("/")}>
                    <img src={logo} alt="MindMate Logo" className="nav-logo-img" />
                    <span className="nav-brand-text">MindMate</span>
                </div>

                <div className="nav-center">
                    {isAuthenticated ? (
                        /* Logged In Links */
                        <>
                            <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>Dashboard</Link>
                            <Link to="/MindfulTools" className={`nav-item ${location.pathname === '/MindfulTools' ? 'active' : ''}`}>Tools</Link>
                            <Link to="/journal" className={`nav-item ${location.pathname === '/journal' ? 'active' : ''}`}>Journal</Link>
                            <Link to="/chat" className={`nav-item ${location.pathname === '/chat' ? 'active' : ''}`}>AI Companion</Link>
                        </>
                    ) : (
                        /* Visitor Links */
                        <>
                            <a href="#features" className="nav-item">Ecosystem</a>
                            <a href="#how" className="nav-item">The Path</a>
                            <a href="#faq" className="nav-item">FAQ</a>
                        </>
                    )}
                </div>

                <div className="nav-right">
                    {isAuthenticated ? (
                        <LogoutButton />
                    ) : (
                        <button className="journal-pill" onClick={() => navigate("/Signup")}>
                            Start Your Journey
                        </button>
                    )}
                </div>
            </nav>
        </header>
    );
}