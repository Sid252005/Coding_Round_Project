import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { participantLogin } from '../../services/api';

export default function ParticipantLogin() {
  const [name, setName]       = useState('');
  const [prn, setPrn]         = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { loginParticipant }  = useAuth();
  const navigate              = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await participantLogin(name.trim(), prn.trim());
      loginParticipant(data.participant);
      navigate('/welcome');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ minHeight: '100vh' }}>
      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[
          { top: '5%', left: '5%',  size: '500px', color: 'rgba(201,168,76,0.04)' },
          { top: '70%', right: '5%', size: '400px', color: 'rgba(116,0,1,0.04)' },
        ].map((orb, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: orb.top, left: orb.left, right: orb.right,
            width: orb.size, height: orb.size,
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${orb.color}, transparent 70%)`,
          }} />
        ))}
      </div>

      <div className="auth-card fade-in" style={{ maxWidth: '480px' }}>
        {/* HP Banner */}
        <div className="hp-banner">
          <div className="deathly-symbol">🪄</div>
          <h1>Deathly Hallows</h1>
          <h1 style={{ fontSize: '1rem', fontFamily: 'var(--font-body)', marginTop: '0.25rem' }}>
            Coding Challenge
          </h1>
          <p style={{ marginTop: '0.5rem' }}>
            "It is our choices that show what we truly are."
          </p>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.2rem' }}>
            Participant Login
          </h2>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="participant-name">Full Name *</label>
              <input
                id="participant-name"
                type="text"
                className="form-control"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="participant-prn">PRN / Roll Number *</label>
              <input
                id="participant-prn"
                type="text"
                className="form-control"
                placeholder="e.g. 2301234567"
                value={prn}
                onChange={(e) => setPrn(e.target.value.toUpperCase())}
                required
                autoComplete="off"
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                Your PRN is your unique identifier — no password needed.
              </small>
            </div>

            <button
              id="participant-login-btn"
              type="submit"
              className="btn btn-gold btn-lg"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {loading ? '🔮 Entering...' : '✨ Enter the Arena'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Are you an organizer?{' '}
          <a href="/admin/login">Admin Login →</a>
        </p>
      </div>
    </div>
  );
}
