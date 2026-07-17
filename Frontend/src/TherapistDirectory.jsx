import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { getImageUrl } from "./services/api";
import "./TherapistDirectory.css";

const SPEC_OPTIONS = [
  "All",
  "Anxiety",
  "Depression",
  "Stress Management",
  "Relationship Counseling",
  "Trauma & PTSD",
  "Self-Esteem Issues",
  "Grief Support",
];

export default function TherapistDirectory() {
  const [therapists, setTherapists] = useState([]);
  const [selectedSpec, setSelectedSpec] = useState("All");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchTherapists();
  }, [selectedSpec]);

  const fetchTherapists = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const url = selectedSpec === "All" ? "/api/therapists" : `/api/therapists?specialization=${encodeURIComponent(selectedSpec)}`;
      const res = await api.get(url);
      setTherapists(res.data);
    } catch {
      // Silently show empty state — no repeated toast spam
      setTherapists([]);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tdir-page">
      <header className="tdir-header">
        <Link to="/chat" className="tdir-back">← Back to Home</Link>
        <h1>Find Your Wellness Guide</h1>
        <p className="tdir-subtitle">Consult verified therapists and schedule personalized support sessions.</p>
      </header>

      <div className="tdir-layout">
        {/* Specialization Filter Sidebar */}
        <aside className="tdir-filters">
          <h3>Filter by Specialization</h3>
          <div className="tdir-spec-list">
            {SPEC_OPTIONS.map((spec) => (
              <button
                key={spec}
                className={selectedSpec === spec ? "active" : ""}
                onClick={() => setSelectedSpec(spec)}
              >
                {spec === "All" ? "🌐 Show All" : spec}
              </button>
            ))}
          </div>
        </aside>

        {/* Therapist Listings grid */}
        <main className="tdir-content">
          {loading ? (
            <div className="tdir-loader">
              <span className="tdir-spinner" />
              <p>Searching for therapists...</p>
            </div>
          ) : fetchError ? (
            <div className="tdir-empty">
              <p>⚠️ Unable to load therapist directory right now. Please try again in a moment.</p>
              <button className="tdir-retry-btn" onClick={fetchTherapists}>Retry</button>
            </div>
          ) : therapists.length === 0 ? (
            <div className="tdir-empty">
              <p>No therapists match the selected specialization yet.</p>
            </div>
          ) : (
            <div className="tdir-grid">
              {therapists.map((t) => (
                <div key={t._id} className="tdir-card">
                  <div className="tdir-card-header">
                    <img src={getImageUrl(t.profilePicUrl)} alt={t.name} />
                    <div className="tdir-rating">
                      {t.reviewCount > 0 ? (
                        <>⭐ {t.rating.toFixed(1)} <span>({t.reviewCount})</span></>
                      ) : (
                        <span className="rating-new" style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent)', background: 'rgba(106, 191, 143, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>New</span>
                      )}
                    </div>
                  </div>

                  <div className="tdir-card-body">
                    <h3>Dr. {t.name}</h3>
                    <p className="experience">💼 {t.experience} Years Experience</p>
                    <p className="bio">{t.bio ? t.bio.slice(0, 100) + "..." : "No bio available."}</p>
                    
                    <div className="specializations-tags">
                      {t.specializations.map((spec) => (
                        <span key={spec} className="spec-tag">{spec}</span>
                      ))}
                    </div>
                  </div>

                  <div className="tdir-card-footer">
                    <div className="price-info">
                      <span className="price-val">₹{t.price}</span>
                      <span className="price-label">/ {t.sessionDuration} mins</span>
                    </div>
                    <button
                      className="book-btn"
                      onClick={() => navigate(`/therapists/${t._id}`)}
                    >
                      Book Session
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
