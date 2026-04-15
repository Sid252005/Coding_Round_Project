import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Submitted() {
  const { participant, logoutParticipant } = useAuth();
  const navigate = useNavigate();

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
      background: 'radial-gradient(ellipse at center, rgba(46,204,113,0.05) 0%, transparent 60%)',
    }}>
      <div className="auth-card fade-in" style={{ maxWidth: '560px', textAlign: 'center' }}>
        {/* Success Icon */}
        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🎉</div>

        <h1 style={{ marginBottom: '0.5rem' }}>Test Submitted!</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          "It does not do to dwell on dreams and forget to live."
        </p>

        {participant && (
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-active)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}>
            <div className="grid-2" style={{ gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
                  Name
                </p>
                <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{participant.name}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
                  PRN
                </p>
                <p style={{ fontWeight: 700, fontFamily: 'var(--font-code)', color: 'var(--gold-primary)', fontSize: '1.1rem' }}>
                  {participant.prn}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
                  Score
                </p>
                <p style={{ fontWeight: 700, color: 'var(--green-magic)', fontSize: '1.5rem' }}>
                  {participant.score || 0}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
                  Status
                </p>
                <span className="badge badge-green">✅ Submitted</span>
              </div>
            </div>
          </div>
        )}

        <div className="alert alert-info" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <p>📊 Your results will be reviewed by the admin.</p>
          <p style={{ marginTop: '0.3rem', fontSize: '0.85rem' }}>
            The leaderboard will be revealed at the end of the competition.
          </p>
        </div>

        <button className="btn btn-ghost" onClick={handleLogout}>
          🚪 Exit Competition
        </button>
      </div>
    </div>
  );
}
