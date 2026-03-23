import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center', color: '#6860E6', padding: '20px' }}>
      <h1 style={{ fontSize: '8rem', margin: 0, opacity: 0.8 }}>404</h1>
      <h2 style={{ fontSize: '2rem', fontWeight: 300, marginBottom: '10px' }}>Wandering Mind?</h2>
      <p style={{ maxWidth: '400px', margin: '15px auto 30px', color: '#666', lineHeight: 1.6 }}>
        The page you are looking for doesn't seem to exist. Let's take a deep breath and guide you back to your sanctuary.
      </p>
      <Link to="/" style={{ background: 'var(--primary-color)', color: 'white', textDecoration: 'none', padding: '12px 30px', borderRadius: '25px', fontWeight: 'bold', transition: '0.3s' }}>
        Return Home
      </Link>
    </div>
  );
}
