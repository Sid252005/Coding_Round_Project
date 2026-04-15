import { useState, useEffect } from 'react';
import { getParticipants, deleteParticipant } from '../../services/api';
import { useSocket } from '../../context/SocketContext';

const STATUS_CONFIG = {
  not_started: { badge: 'badge-muted',   label: '⏳ Not Started' },
  in_progress: { badge: 'badge-orange',  label: '⚡ In Progress' },
  submitted:   { badge: 'badge-green',   label: '✅ Submitted'   },
};

export default function LiveMonitor() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [filter, setFilter]             = useState('all');
  const { on, off } = useSocket();

  const fetchParticipants = async () => {
    try {
      const { data } = await getParticipants();
      setParticipants(data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchParticipants();

    const handleEvent = () => fetchParticipants();
    on('participant-started',   handleEvent);
    on('participant-submitted', handleEvent);

    const interval = setInterval(fetchParticipants, 15000); // refresh every 15s

    return () => {
      off('participant-started',   handleEvent);
      off('participant-submitted', handleEvent);
      clearInterval(interval);
    };
  }, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove ${name} from the competition?`)) return;
    try {
      await deleteParticipant(id);
      fetchParticipants();
    } catch (_) {}
  };

  const filtered = participants.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.prn.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    all:          participants.length,
    not_started:  participants.filter((p) => p.status === 'not_started').length,
    in_progress:  participants.filter((p) => p.status === 'in_progress').length,
    submitted:    participants.filter((p) => p.status === 'submitted').length,
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>👁️ Live Monitor</h1>
        <p>Real-time participant tracking — refreshes every 15 seconds</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { key: 'all',          label: `All (${counts.all})` },
          { key: 'not_started',  label: `Not Started (${counts.not_started})` },
          { key: 'in_progress',  label: `In Progress (${counts.in_progress})` },
          { key: 'submitted',    label: `Submitted (${counts.submitted})` },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`btn btn-sm ${filter === tab.key ? 'btn-gold' : 'btn-ghost'}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}

        {/* Search */}
        <input
          className="form-control"
          placeholder="🔍 Search name or PRN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 'auto', marginLeft: 'auto', maxWidth: '250px' }}
        />
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '300px' }}><div className="spinner" /></div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>PRN</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Started At</th>
                  <th>Submitted At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      {search ? 'No matching participants found' : 'No participants registered yet'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((p, idx) => {
                    const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.not_started;
                    return (
                      <tr key={p.id}>
                        <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td style={{ fontFamily: 'var(--font-code)', fontSize: '0.85rem' }}>{p.prn}</td>
                        <td><span className={`badge ${sc.badge}`}>{sc.label}</span></td>
                        <td style={{ fontWeight: 700, color: 'var(--gold-primary)' }}>{p.score || 0}</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {p.start_time ? new Date(p.start_time).toLocaleTimeString() : '—'}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {p.end_time ? new Date(p.end_time).toLocaleTimeString() : '—'}
                        </td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(p.id, p.name)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
