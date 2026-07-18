import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import { useAuth } from './Context/AuthContext';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const { userName } = useAuth();
  
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="home-dashboard">
      <Navbar />
      
      <main className="dashboard-content">
        <header className="welcome-header">
          <span className="date-pill">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
          <h1>{greeting}, <span className="brand-glow">{userName || "Friend"}</span>.</h1>
          <p>How is your mind feeling in this moment?</p>
        </header>

        <section className="quick-actions">
          <div className="action-card main-action" onClick={() => navigate("/chat")}>
            <div className="action-icon"><i className="fa-regular fa-comments"></i></div>
            <div className="action-info">
              <h3>Talk to AI Companion</h3>
              <p>Vent, reflect, or just chat in a safe space.</p>
            </div>
            <span className="action-arrow">→</span>
          </div>

          <div className="secondary-grid">
            <div className="action-card" onClick={() => navigate("/journal")}>
              <div className="action-icon"><i className="fa-solid fa-pen-to-square"></i></div>
              <h3>Private Journal</h3>
              <p>Capture your thoughts for today.</p>
            </div>

            <div className="action-card" onClick={() => navigate("/MindfulTools")}>
              <div className="action-icon"><i className="fa-solid fa-spa"></i></div>
              <h3>Mindful Tools</h3>
              <p>Breathing, Grounding &amp; more.</p>
            </div>

            <div className="action-card" onClick={() => navigate("/therapists")}>
              <div className="action-icon"><i className="fa-solid fa-user-doctor"></i></div>
              <h3>Consult Therapist</h3>
              <p>Schedule professional sessions.</p>
            </div>

            <div className="action-card" onClick={() => navigate("/therapist/register")}>
              <div className="action-icon"><i className="fa-solid fa-briefcase-medical"></i></div>
              <h3>Apply as Therapist</h3>
              <p>Join our team &amp; help others heal.</p>
            </div>
          </div>
        </section>

        <section className="daily-quote">
          <div className="quote-box">
            <p>"Whatever you feel. Put it down."</p>
          </div>
        </section>
      </main>
    </div>
  );
}