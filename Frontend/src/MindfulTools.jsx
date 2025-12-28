import { useState } from "react";
import BreathingWidget from "./components/BreathingWidget";
import GroundingTool from "./components/GroundingTool";
import ThoughtDump from "./components/ThoughtDump"; // New Component
import Navbar from "./components/Navbar.jsx";
import "./MindfulTools.css";
import { Navigate, useNavigate } from "react-router-dom";


// ... (imports remain same)

export default function MindfulTools() {
  const [activeTool, setActiveTool] = useState(null);
  const navigate = useNavigate();

  if (activeTool) {
    return (
      <div className="tools-page-wrapper">
        <div className="tool-viewer-container">
          <button className="back-tools-btn" onClick={() => setActiveTool(null)}>
            ← Back to Tools
          </button>
          <div className="active-tool-content">
             {activeTool === "breathing" && <BreathingWidget />}
             {activeTool === "grounding" && <GroundingTool />}
             {activeTool === "dump" && <ThoughtDump />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tools-page-wrapper">
      <main className="tools-container">
        {/* Simplified navigation back */}
        <button className="back-tools-btn" onClick={() => navigate("/")}>← Home</button>
        
        <header className="tools-header">
          <span className="tools-badge">Calm Zone</span>
          <h1>Mindful <span className="brand-glow">Tools</span></h1>
          <p className="tools-subtext">Exercises designed to ground you when life feels a bit too loud.</p>
        </header>

        <div className="tools-grid">
          {/* Card 1 */}
          <div className="tool-card active-card" onClick={() => setActiveTool("breathing")}>
            <div className="tool-icon-box">🫁</div>
            <h3>Guided Breathing</h3>
            <p>Master the 4-4-6 technique to calm your nervous system.</p>
            <span className="tool-status">Start Practice</span>
          </div>

          {/* Card 2 */}
          <div className="tool-card active-card" onClick={() => setActiveTool("grounding")}>
            <div className="tool-icon-box">🌱</div>
            <h3>5-4-3-2-1 Grounding</h3>
            <p>Reconnect with the present moment using your five senses.</p>
            <span className="tool-status">Start Practice</span>
          </div>

          {/* Card 3 */}
          <div className="tool-card active-card" onClick={() => setActiveTool("dump")}>
            <div className="tool-icon-box">🧠</div>
            <h3>Thought Dump</h3>
            <p>Release heavy thoughts into the void. No saving, no judging.</p>
            <span className="tool-status">Start Practice</span>
          </div>
        </div>
      </main>
    </div>
  );
}