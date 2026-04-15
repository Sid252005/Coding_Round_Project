import { useState, useEffect } from 'react';
import { getAllSubmissions, getParticipants } from '../../services/api';

export default function SubmissionViewer() {
  const [submissions, setSubmissions] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState('all');
  const [selectedSubmission, setSelectedSubmission]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [sub, par] = await Promise.all([getAllSubmissions(), getParticipants()]);
        setSubmissions(sub.data);
        setParticipants(par.data);
      } catch (_) {}
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = selectedParticipant === 'all'
    ? submissions
    : submissions.filter((s) => s.participant_id === selectedParticipant);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>📊 Submission Viewer</h1>
        <p>Review all participant code submissions and test results</p>
      </div>

      {/* Participant Filter */}
      <div className="form-group" style={{ maxWidth: '350px', marginBottom: '1.5rem' }}>
        <label>Filter by Participant</label>
        <select
          className="form-control"
          value={selectedParticipant}
          onChange={(e) => setSelectedParticipant(e.target.value)}
        >
          <option value="all">All Participants ({submissions.length} submissions)</option>
          {participants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.prn})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '300px' }}><div className="spinner" /></div>
      ) : (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          {/* Submission List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No submissions found.
              </div>
            ) : (
              filtered.map((sub) => (
                <div
                  key={sub.id}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    padding: '1rem',
                    border: selectedSubmission?.id === sub.id
                      ? '1px solid var(--gold-primary)'
                      : '1px solid var(--border)',
                  }}
                  onClick={() => setSelectedSubmission(sub)}
                >
                  <div className="flex-between">
                    <div>
                      <p style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{sub.participant_name}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {sub.participant_prn} · {sub.question_title}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 700, color: 'var(--gold-primary)' }}>{sub.score} pts</p>
                      <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                        {sub.language}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Submission Detail */}
          {selectedSubmission ? (
            <div className="card" style={{ position: 'sticky', top: '1rem' }}>
              <div className="card-header flex-between">
                <h3>{selectedSubmission.participant_name}</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedSubmission(null)}>✕</button>
              </div>

              <div className="flex gap-1" style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span className="badge badge-muted">{selectedSubmission.participant_prn}</span>
                <span className="badge badge-blue">{selectedSubmission.language}</span>
                <span className="badge badge-gold">⭐ {selectedSubmission.score} pts</span>
                <span className="badge badge-muted">
                  ⏱️ {selectedSubmission.time_taken}s
                </span>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                📝 {selectedSubmission.question_title}
              </p>

              {/* Code */}
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
                  CODE:
                </p>
                <pre style={{
                  background: '#0D1117',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-code)',
                  overflowX: 'auto',
                  maxHeight: '300px',
                  color: '#e6edf3',
                  lineHeight: 1.5,
                }}>
                  {selectedSubmission.code}
                </pre>
              </div>

              {/* Test Results */}
              {selectedSubmission.test_results?.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
                    TEST RESULTS:
                  </p>
                  {selectedSubmission.test_results.map((tr, idx) => (
                    <div key={idx} className={`test-case-row ${tr.passed ? 'pass' : 'fail'}`}>
                      <div className="flex-between">
                        <span>{tr.passed ? '✅ PASS' : '❌ FAIL'} — Test #{idx + 1}</span>
                        <span>{tr.marks_awarded || 0} pts</span>
                      </div>
                      {!tr.passed && tr.error && (
                        <div style={{ marginTop: '0.3rem', color: 'var(--red-error)', fontSize: '0.8rem' }}>
                          Error: {tr.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <p>Select a submission to view code and test results</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
