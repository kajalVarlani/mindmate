import "./LandingPage.css";
import { useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./Home.jsx";
import { useAuth } from "./Context/AuthContext";
export default function LandingPage() {
    const { isAuthenticated } = useAuth(); // React is variable ko "watch" karega
    const navigate = useNavigate();

    if (isAuthenticated) {
        return (
            <div className="landing">
                <Navbar />
                <Home /> 
                <Footer />
            </div>
        );
    }

    // AGAR LOGGED OUT HAI: Landing Page sections dikhao
    return (
        <div className="landing">
            <Navbar />

            {/* HERO SECTION */}
            <section className="hero">
                <div className="hero-content">
                    <div className="hero-badge">Your Privacy-First Wellness Space</div>
                    <h1>MindMate: Nurture Your <span className="brand-glow">Inner Peace</span></h1>
                    <p className="hero-subtext">
                        A single sanctuary for your emotional journey. Express yourself through private journaling,
                        receive real-time support from our AI Companion, and find your center—all in one place.
                    </p>
                    <div className="hero-buttons">
                        <button className="primary-btn glow-btn" onClick={() => navigate("/signup")}>
                            Begin Your Journey
                        </button>
                        <a href="#how" className="text-link">How it works ↓</a>
                    </div>
                </div>
            </section>

            {/* PILLARS GRID - Every component now styled */}
            <section className="pillars-section" id="features">
                <div className="section-header">
                    <h2>The MindMate Ecosystem</h2>
                    <div className="underline"></div>
                </div>

                <div className="pillars-grid">
                    <div className="feature-card">
                        <div className="icon-box">💬</div>
                        <h3>AI Companion</h3>
                        <p>A non-judgmental companion to talk through heavy emotions, anytime you need.</p>
                        <button className="card-btn" onClick={() => navigate("/chat")}>Chat Now</button>
                    </div>

                    <div className="feature-card highlighted">
                        <div className="icon-box">🌿</div>
                        <h3>Thought Journal</h3>
                        <p>Release your thoughts in a safe, encrypted digital diary. Track your growth over time.</p>
                        <button className="card-btn" onClick={() => navigate("/journal")}>Write Entry</button>
                    </div>

                    <div className="feature-card">
                        <div className="icon-box">🧘</div>
                        <h3>Mindful Tools</h3>
                        <p>Simple exercises designed to ground you when life feels a bit too loud.</p>
                        <button className="card-btn" onClick={() => navigate("/MindfulTools")}>Try Now</button>
                    </div>
                </div>
            </section>

            {/* REFINED STATS - Real values, not fake users */}
            <section className="values-section">
                <div className="values-grid">
                    <div className="value-item">
                        <h4>Encrypted</h4>
                        <p>Your journals are yours alone.</p>
                    </div>
                    <div className="value-item">
                        <h4>No Judgment</h4>
                        <p>Our AI is built for empathy.</p>
                    </div>
                    <div className="value-item">
                        <h4>Always Ready</h4>
                        <p>Available 24/7 on your time.</p>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS - Clean & Minimal */}
            <section className="how-it-works" id="how">
                <h2>The Path to Clarity</h2>
                <div className="steps-container">
                    <div className="step-item">
                        <div className="step-num">01</div>
                        <p>Check-in with your current mood</p>
                    </div>
                    <div className="step-divider"></div>
                    <div className="step-item">
                        <div className="step-num">02</div>
                        <p>Choose your tool: Chat or Write</p>
                    </div>
                    <div className="step-divider"></div>
                    <div className="step-item">
                        <div className="step-num">03</div>
                        <p>Reflect, release, and find balance</p>
                    </div>
                </div>
            </section>


            {/* REFINED FINAL CTA */}
            {/* FAQ SECTION - Fully Styled Accordions */}
            <section className="faq-section" id="faq">
                <div className="faq-container">
                    <div className="section-header">
                        <h2>Common Questions</h2>
                        <div className="underline"></div>
                    </div>

                    <div className="faq-list">
                        <details className="faq-item">
                            <summary>Is my data truly private?</summary>
                            <div className="faq-content">
                                <p>Absolutely. MindMate uses end-to-end encryption for your journals. Your thoughts and AI conversations are private and are never shared with third parties.</p>
                            </div>
                        </details>

                        <details className="faq-item">
                            <summary>Is MindMate a replacement for therapy?</summary>
                            <div className="faq-content">
                                <p>MindMate is a wellness tool designed for daily support and reflection. It is not a replacement for clinical psychiatric care or emergency medical services.</p>
                            </div>
                        </details>

                        <details className="faq-item">
                            <summary>How does the AI Companion work?</summary>
                            <div className="faq-content">
                                <p>Our AI is built on empathetic listening frameworks. It acts as a non-judgmental sounding board to help you process emotions in real-time.</p>
                            </div>
                        </details>

                    </div>
                </div>
            </section>
            <section className="cta-wrapper">
                <div className="cta-inner">
                    <h2>Start your first check-in today.</h2>
                    <button className="primary-btn" onClick={() => navigate("/signup")}>
                        Join MindMate
                    </button>
                </div>
            </section>

            <Footer />
        </div>
    );
}