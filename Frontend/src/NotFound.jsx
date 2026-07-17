import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center', color: 'var(--accent)', padding: '20px' }}>
      <h1 style={{ fontSize: '8rem', margin: 0, opacity: 0.8, textShadow: '0 0 30px var(--accent-glow)' }}>404</h1>
      <h2 style={{ fontSize: '2rem', fontWeight: 300, marginBottom: '10px', color: 'var(--text)' }}>Wandering Mind?</h2>
      <p style={{ maxWidth: '400px', margin: '15px auto 30px', color: 'var(--text-light)', lineHeight: 1.6 }}>
        The page you are looking for doesn't seem to exist. Let's take a deep breath and guide you back to your sanctuary.
      </p>
      <Link to="/" style={{ background: 'var(--accent)', color: 'var(--bg)', textDecoration: 'none', padding: '12px 30px', borderRadius: '25px', fontWeight: 'bold', transition: '0.3s', boxShadow: '0 4px 12px rgba(106, 191, 143, 0.2)' }}>
        Return Home
      </Link>
    </div>
  );
}
