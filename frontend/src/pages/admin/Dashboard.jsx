import { useState, useEffect } from 'react';
import { useNavigate, NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAdminStats } from '../../services/api';
import { useSocket } from '../../context/SocketContext';

// ─── Admin Sidebar Layout ─────────────────────────────────────
export function AdminLayout({ children }) {
  const { logoutAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: '/admin/dashboard',   icon: '🏠', label: 'Dashboard' },
    { to: '/admin/questions',   icon: '📝', label: 'Questions' },
    { to: '/admin/timer',       icon: '⏱️', label: 'Timer Control' },
    { to: '/admin/monitor',     icon: '👁️', label: 'Live Monitor' },
    { to: '/admin/leaderboard', icon: '🏆', label: 'Leaderboard' },
    { to: '/admin/submissions', icon: '📊', label: 'Submissions' },
  ];

  const handleLogout = () => {
    if (!confirm('Logout from admin panel?')) return;
    logoutAdmin();
    navigate('/admin/login');
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>🪄</div>
        <h2>Deathly Hallows</h2>
        <p style={{ fontSize: '0.7rem', color: 'var(--gold-dark)', marginTop: '0.2rem', fontWeight: 600 }}>
          ADMIN PORTAL
        </p>
      </div>

      {/* Nav Links */}
      <div style={{ flex: 1 }}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </div>

      {/* Footer: Participant link + Logout */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-item"
          style={{ color: 'var(--blue-info)', marginBottom: '0.25rem', display: 'flex' }}
        >
          <span className="nav-icon">🔗</span>
          Participant Login
        </a>
        <button
          className="nav-item"
          onClick={handleLogout}
          style={{ width: '100%', color: 'var(--red-error)', border: '1px solid rgba(231,76,60,0.2)', cursor: 'pointer' }}
        >
          <span className="nav-icon">🚪</span>
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="admin-layout">
      {/* Desktop Sidebar */}
      <nav className="sidebar">
        <SidebarContent />
      </nav>

      {/* Mobile Top Bar */}
      <div style={{
        display: 'none',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
        padding: '0.75rem 1rem',
        alignItems: 'center', justifyContent: 'space-between',
      }} className="mobile-topbar">
        <span style={{ fontFamily: 'var(--font-heading)', color: 'var(--gold-primary)' }}>🪄 Admin</span>
        <button className="btn btn-ghost btn-sm" onClick={() => setMobileOpen(true)}>☰ Menu</button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300 }}
          />
          <nav style={{
            position: 'fixed', left: 0, top: 0, bottom: 0, width: '260px',
            background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)',
            padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column',
            gap: '0.3rem', zIndex: 301, overflowY: 'auto',
          }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setMobileOpen(false)}
              style={{ alignSelf: 'flex-end', marginBottom: '0.5rem' }}
            >
              ✕ Close
            </button>
            <SidebarContent />
          </nav>
        </>
      )}

      {/* Page Content */}
      <main className="admin-content">
        {children || <Outlet />}
      </main>

      <style>{`
        @media (max-width: 900px) {
          .mobile-topbar { display: flex !important; }
          .admin-content { margin-left: 0 !important; padding-top: 4rem !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────
export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, not_started: 0, in_progress: 0, submitted: 0 });
  const [loading, setLoading] = useState(true);
  const { on, off, emit } = useSocket();

  const fetchStats = async () => {
    try {
      const { data } = await getAdminStats();
      setStats(data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
    emit('join-admin');

    const handleEvent = () => fetchStats();
    on('participant-started',   handleEvent);
    on('participant-submitted', handleEvent);

    const interval = setInterval(fetchStats, 20000);
    return () => {
      off('participant-started',   handleEvent);
      off('participant-submitted', handleEvent);
      clearInterval(interval);
    };
  }, []);

  const statItems = [
    { label: 'Total Registered', value: stats.total,        color: 'var(--gold-primary)',  icon: '👥' },
    { label: 'Not Started',      value: stats.not_started,  color: 'var(--text-muted)',    icon: '⏳' },
    { label: 'In Progress',      value: stats.in_progress,  color: 'var(--orange-warn)',   icon: '⚡' },
    { label: 'Submitted',        value: stats.submitted,    color: 'var(--green-magic)',   icon: '✅' },
  ];

  // How to run a test steps
  const runSteps = [
    {
      step: '1',
      to: '/admin/questions',
      icon: '📝',
      label: 'Add Questions',
      desc: 'Go to Questions → click "🧙 Load Sample Questions" for 3 ready-made questions, or create your own with test cases.',
      action: 'Go to Questions →',
    },
    {
      step: '2',
      to: '/admin/timer',
      icon: '⏱️',
      label: 'Set the Timer',
      desc: 'Go to Timer Control → set duration (e.g. 60 minutes) → Save Duration. Do NOT start yet.',
      action: 'Set Timer →',
    },
    {
      step: '3',
      to: null,
      icon: '🔗',
      label: 'Share the Participant Link',
      desc: `Share your site URL with students. They login with Name + PRN (no password). The link is: ${window.location.origin}/`,
      action: null,
    },
    {
      step: '4',
      to: '/admin/timer',
      icon: '▶️',
      label: 'Start the Competition',
      desc: 'Once all participants are logged in, go to Timer Control → click "Start Competition". The countdown starts for everyone simultaneously.',
      action: 'Start Timer →',
    },
    {
      step: '5',
      to: '/admin/monitor',
      icon: '👁️',
      label: 'Monitor Live',
      desc: 'Watch the Live Monitor to see who started, who is coding, and who submitted.',
      action: 'Live Monitor →',
    },
    {
      step: '6',
      to: '/admin/leaderboard',
      icon: '🏆',
      label: 'View Results',
      desc: 'After the timer ends, check the Leaderboard for rankings and Submissions to view each participant\'s code.',
      action: 'Leaderboard →',
    },
  ];

  return (
    <div className="fade-in">
      {/* ── Page Header ── */}
      <div className="page-header">
        <h1>🏠 Dashboard</h1>
        <p>Real-time competition overview — auto-refreshes every 20 seconds</p>
      </div>

      {/* ── Stats Grid ── */}
      {loading ? (
        <div className="flex-center" style={{ padding: '3rem' }}><div className="spinner" /></div>
      ) : (
        <div className="grid-4" style={{ marginBottom: '2rem' }}>
          {statItems.map((s) => (
            <div key={s.label} className="stat-card">
              <div style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>{s.icon}</div>
              <div className="stat-number" style={{
                background: 'none',
                WebkitTextFillColor: s.color,
                color: s.color,
                fontSize: '2.25rem',
              }}>
                {s.value}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── How to Run a Test ── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3>🚀 How to Run a Test — Step by Step</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {runSteps.map((s) => (
            <div
              key={s.step}
              style={{
                display: 'grid',
                gridTemplateColumns: '36px 1fr auto',
                gap: '1rem',
                alignItems: 'center',
                padding: '0.85rem 1rem',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
              }}
            >
              {/* Step badge */}
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'var(--gold-glow)',
                border: '1.5px solid var(--gold-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold-primary)',
                flexShrink: 0,
              }}>
                {s.step}
              </div>

              {/* Content */}
              <div>
                <p style={{ fontWeight: 600, margin: 0, marginBottom: '0.2rem', fontSize: '0.95rem' }}>
                  {s.icon} {s.label}
                </p>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.82rem', lineHeight: '1.5' }}>
                  {s.desc}
                </p>
              </div>

              {/* Action link */}
              {s.action && s.to && (
                <Link
                  to={s.to}
                  className="btn btn-outline btn-sm"
                  style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  {s.action}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="card">
        <div className="card-header">
          <h3>⚡ Quick Actions</h3>
        </div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <Link to="/admin/questions"   className="btn btn-gold">📝 Manage Questions</Link>
          <Link to="/admin/timer"       className="btn btn-outline">⏱️ Control Timer</Link>
          <Link to="/admin/monitor"     className="btn btn-ghost">👁️ Live Monitor</Link>
          <Link to="/admin/leaderboard" className="btn btn-ghost">🏆 Leaderboard</Link>
          <Link to="/admin/submissions" className="btn btn-ghost">📊 Submissions</Link>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost"
          >
            🔗 Participant Page ↗
          </a>
        </div>
      </div>
    </div>
  );
}
