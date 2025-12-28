import { useEffect, useState } from "react";
import "./Journal.css";
import { Link } from "react-router-dom";

export default function Journal() {
    const [journals, setJournals] = useState([]);
    const [mood, setMood] = useState("");
    const [content, setContent] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [greeting, setGreeting] = useState("");
    const [streak, setStreak] = useState(0);


    const token = localStorage.getItem("token");

    useEffect(() => {
        // Dynamic Greeting
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good morning");
        else if (hour < 18) setGreeting("Good afternoon");
        else setGreeting("Good evening");

        fetchJournals();
        fetchStreak();
    }, []);

    const fetchJournals = async () => {
        const res = await fetch("http://localhost:8080/api/journal", {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setJournals(data);
    };

    const handleSave = async () => {
        if (!mood || !content) return alert("Please select a mood and write something.");
        setLoading(true);

        const url = editingId
            ? `http://localhost:8080/api/journal/${editingId}`
            : "http://localhost:8080/api/journal";

        await fetch(url, {
            method: editingId ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ mood, content }),
        });

        setMood("");
        setContent("");
        setEditingId(null);
        setLoading(false);
        fetchJournals();
        fetchStreak();
    };

    const handleDelete = async (id) => {
        await fetch(`http://localhost:8080/api/journal/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        fetchJournals();
    };

    const handleEdit = (journal) => {
        setEditingId(journal._id);
        setMood(journal.mood);
        setContent(journal.content);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const fetchStreak = async () => {
        const res = await fetch("http://localhost:8080/api/user/me", {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setStreak(data.streak);
    };


    return (
        <div className="journal-page-wrapper">
            <div className="journal-container">

                {/* Header Section */}
                <header className="journal-page-header">
                    {/* Back to Home Button */}
                    <Link to="/" className="back-home-btn">
                        <span className="arrow">←</span> Back to Home
                    </Link>

                    <div className="header-badge">{greeting}, Welcome to your space</div>
                    <h1>My Journal Sanctuary</h1>
                    <p className="header-subtitle">Capture your thoughts, find your clarity.</p>
                    <div className="streak-badge">
                        🔥 {streak} day streak
                    </div>

                </header>

                <div className="journal-layout">
                    {/* Left Side: Entry Form */}
                    <div className="journal-form-section">
                        <div className="journal-card form-card">
                            <h3>{editingId ? "Update your thought" : "How are you feeling?"}</h3>

                            <div className="input-group">
                                <select value={mood} onChange={(e) => setMood(e.target.value)}>
                                    <option value="">Select mood</option>
                                    <option value="happy">😊 Happy</option>
                                    <option value="sad">😔 Sad</option>
                                    <option value="anxious">😟 Anxious</option>
                                    <option value="calm">😌 Calm</option>
                                    <option value="angry">😡 Angry</option>
                                </select>
                            </div>

                            <div className="input-group">
                                <textarea
                                    placeholder="What's on your mind today? Let it flow..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                />
                            </div>

                            <button className="primary-btn journal-save-btn" onClick={handleSave} disabled={loading}>
                                {loading ? "Saving..." : editingId ? "Update Entry" : "Save Entry"}
                            </button>

                            {editingId && (
                                <button className="secondary-btn cancel-btn" onClick={() => { setEditingId(null); setMood(""); setContent(""); }}>
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Feed Section */}
                    <div className="journal-feed-section">
                        <h3>Recent Reflections</h3>
                        <div className="journal-list">
                            {journals.length === 0 ? (
                                <div className="empty-state">
                                    <p>Your journal is empty. Start your first reflection above.</p>
                                </div>
                            ) : (
                                journals.map((j) => (
                                    <div key={j._id} className="journal-card feed-card">
                                        <div className="card-header">
                                            <span className={`mood-tag mood-${j.mood}`}>{j.mood}</span>
                                            <span className="card-date">{new Date(j.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="card-content">{j.content}</p>
                                        <div className="card-actions">
                                            <button onClick={() => handleEdit(j)}>Edit</button>
                                            <button className="delete-text" onClick={() => handleDelete(j._id)}>Delete</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}