import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <p>This application is for wellness support and not a substitute for professional mental health care</p>
      <p>© {new Date().getFullYear()} MindMate — By Kajal</p>
      <div className="footer-links">
        <Link to="/admin/login">🛡️ Admin Portal</Link>
        <Link to="/therapist/login">🩺 Therapist Portal</Link>
        <a href="#">Privacy</a>
        <a href="#">Terms</a>
      </div>
    </footer>
  );
}