import { useState, useEffect } from 'react';
import { getLeaderboard } from '../../services/api';
import { useSocket } from '../../context/SocketContext';

export default function Leaderboard() {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const { on, off } = useSocket();

  const fetchLeaderboard = async () => {
    try {
      const { data: lb } = await getLeaderboard();
      setData(lb);
      setLastRefresh(new Date());
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard();

    const handleEvent = () => fetchLeaderboard();
    on('participant-submitted', handleEvent);

    const interval = setInterval(fetchLeaderboard, 15000);

    return () => {
      off('participant-submitted', handleEvent);
      clearInterval(interval);
    };
  }, []);

  const formatTime = (seconds) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="fade-in">
      <div className="page-header flex-between">
        <div>
          <h1>🏆 Leaderboard</h1>
          <p>
            Ranked by score (highest first), then by time taken (lowest first).
            {lastRefresh && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                {' '}Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchLeaderboard}>
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '300px' }}><div className="spinner" /></div>
      ) : data.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <p>No submissions yet. The leaderboard will populate once participants submit.</p>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          {data.length >= 3 && (
            <div className="grid-3" style={{ marginBottom: '2rem' }}>
              {data.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className="card"
                  style={{
                    textAlign: 'center',
                    padding: '2rem',
                    border: p.rank === 1 ? '1px solid var(--gold-primary)' : '1px solid var(--border)',
                    background: p.rank === 1 ? 'rgba(201,168,76,0.08)' : undefined,
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                    {getRankBadge(p.rank)}
                  </div>
                  <h3 style={{ marginBottom: '0.25rem' }}>{p.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{p.prn}</p>
                  <div className="stat-number" style={{ fontSize: '2rem' }}>{p.score}</div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    points · {formatTime(p.time_taken)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Full table */}
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>PRN</th>
                    <th>Score</th>
                    <th>Time Taken</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((p) => (
                    <tr key={p.id} className={`rank-${p.rank}`}>
                      <td style={{ fontWeight: 700, fontSize: '1.1rem' }}>{getRankBadge(p.rank)}</td>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td style={{ fontFamily: 'var(--font-code)', fontSize: '0.85rem' }}>{p.prn}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--gold-primary)', fontSize: '1.1rem' }}>
                          {p.score}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{formatTime(p.time_taken)}</td>
                      <td>
                        <span className={`badge ${p.status === 'submitted' ? 'badge-green' : p.status === 'in_progress' ? 'badge-orange' : 'badge-muted'}`}>
                          {p.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
