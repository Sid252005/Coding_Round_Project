import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { startTest } from '../../services/api';
import { useState } from 'react';

export default function Welcome() {
  const { participant, updateParticipant, logoutParticipant } = useAuth();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [error, setError]       = useState('');

  if (!participant) {
    navigate('/');
    return null;
  }

  const handleStartTest = async () => {
    if (!confirm('Are you ready to begin? The test will start immediately.')) return;

    setStarting(true);
    try {
      const { data } = await startTest(participant.id);
      updateParticipant(data.participant);
      navigate('/test');
    } catch (err) {
      // If already started, just navigate to test
      if (participant.status === 'in_progress') {
        navigate('/test');
      } else {
        setError(err.response?.data?.error || 'Failed to start test. Try again.');
      }
    } finally {
      setStarting(false);
    }
  };

  const handleLogout = () => {
    logoutParticipant();
    navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.05) 0%, transparent 60%)',
    }}>
      <div className="auth-card fade-in" style={{ maxWidth: '600px', textAlign: 'center' }}>
        {/* Banner */}
        <div className="hp-banner" style={{ paddingBottom: '2rem' }}>
          <div className="deathly-symbol" style={{ fontSize: '4rem' }}>🏆</div>
          <h1>Welcome, Wizard!</h1>
          <p>"Every expert was once a beginner."</p>
        </div>

        {/* Participant Info Card */}
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-active)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <div className="grid-2" style={{ gap: '1rem', textAlign: 'left' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Name
              </p>
              <p style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                {participant.name}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                PRN
              </p>
              <p style={{ fontWeight: 700, fontSize: '1.2rem', fontFamily: 'var(--font-code)', color: 'var(--gold-primary)' }}>
                {participant.prn}
              </p>
            </div>
          </div>
        </div>

        {/* Status */}
        {participant.status === 'submitted' ? (
          <div className="alert alert-success">
            ✅ You have already submitted your test. 
            Check back for results!
          </div>
        ) : participant.status === 'in_progress' ? (
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
              ⚡ Your test is in progress. Click below to resume.
            </div>
            <button
              className="btn btn-gold btn-lg animate-pulse-gold"
              onClick={() => navigate('/test')}
              style={{ width: '100%' }}
            >
              ▶️ Resume Test
            </button>
          </div>
        ) : (
          <>
            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            {/* Instructions */}
            <div style={{
              textAlign: 'left',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
            }}>
              <p style={{ fontWeight: 600, color: 'var(--gold-primary)', marginBottom: '0.75rem' }}>
                📜 Before you begin:
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {[
                  '🔒 Do NOT switch tabs or minimize the window',
                  '🚫 Copy-paste and right-click are disabled',
                  '📝 Your code auto-saves every 30 seconds',
                  '⏱️ Submit before time runs out — auto-submit on timeout',
                  '💻 Supported: Python, C++, C, Java',
                ].map((item) => (
                  <li key={item} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <button
              id="start-test-btn"
              className="btn btn-gold btn-lg animate-pulse-gold"
              onClick={handleStartTest}
              disabled={starting}
              style={{ width: '100%' }}
            >
              {starting ? '🔮 Starting...' : '🪄 Start Test'}
            </button>
          </>
        )}

        <button
          className="btn btn-ghost btn-sm"
          onClick={handleLogout}
          style={{ marginTop: '1.5rem', color: 'var(--text-muted)' }}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}
