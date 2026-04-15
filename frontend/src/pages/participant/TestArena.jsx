/**
 * TestArena.jsx
 * The main coding competition page for participants.
 *
 * Features:
 * - Tab UI for multiple questions
 * - Monaco Editor with language selection
 * - Anti-cheat: blocks copy-paste, right-click, detects tab switches
 * - Auto-save every 30 seconds
 * - Timer (synced from server via socket)
 * - Run code + view test results
 * - Final submit button
 * - Auto-submit on timer expiry
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CodeEditor from '../../components/CodeEditor';
import Timer from '../../components/Timer';
import {
  getQuestionsParticipant,
  runCode,
  autoSaveCode,
  finalSubmit,
} from '../../services/api';

const DEFAULT_LANG = 'python';

export default function TestArena() {
  const { participant, updateParticipant } = useAuth();
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────
  const [questions, setQuestions]   = useState([]);
  const [activeTab, setActiveTab]   = useState(0);
  const [codes, setCodes]           = useState({});       // { questionId: string }
  const [languages, setLanguages]   = useState({});       // { questionId: 'python' }
  const [results, setResults]       = useState({});       // { questionId: result }
  const [running, setRunning]       = useState({});       // { questionId: bool }
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState({});
  const [tabWarning, setTabWarning] = useState(false);
  const [tabWarnCount, setTabWarnCount] = useState(0);
  const [loading, setLoading]       = useState(true);

  const autoSaveTimerRef   = useRef(null);
  const tabWarnTimeoutRef  = useRef(null);

  // ── Load questions ─────────────────────────────────────────────
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data } = await getQuestionsParticipant();
        setQuestions(data);

        // Initialize code + language for each question
        const initCodes  = {};
        const initLangs  = {};
        data.forEach((q) => {
          initCodes[q.id]  = q.buggy_code || '';    // For debug, pre-fill buggy code
          initLangs[q.id]  = DEFAULT_LANG;
        });
        setCodes(initCodes);
        setLanguages(initLangs);
      } catch (_) {}
      setLoading(false);
    };
    fetchQuestions();
  }, []);

  // ── Anti-Cheat: Tab switch / visibility detection ─────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !submitted) {
        setTabWarning(true);
        setTabWarnCount((c) => c + 1);

        clearTimeout(tabWarnTimeoutRef.current);
        tabWarnTimeoutRef.current = setTimeout(() => {
          setTabWarning(false);
        }, 5000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [submitted]);

  // ── Anti-Cheat: Disable right-click ──────────────────────────
  useEffect(() => {
    const handleContextMenu = (e) => { e.preventDefault(); };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  // ── Anti-Cheat: Disable copy-paste ────────────────────────────
  useEffect(() => {
    const noop = (e) => { e.preventDefault(); };
    document.addEventListener('copy',  noop);
    document.addEventListener('paste', noop);
    document.addEventListener('cut',   noop);
    return () => {
      document.removeEventListener('copy',  noop);
      document.removeEventListener('paste', noop);
      document.removeEventListener('cut',   noop);
    };
  }, []);

  // ── Auto-save every 30 seconds ─────────────────────────────────
  const performAutoSave = useCallback(async () => {
    if (!participant || questions.length === 0) return;

    for (const q of questions) {
      const code = codes[q.id];
      if (!code || code.trim() === '') continue;

      setAutoSaveStatus((prev) => ({ ...prev, [q.id]: 'saving' }));
      try {
        await autoSaveCode({
          participant_id: participant.id,
          question_id: q.id,
          code,
          language: languages[q.id] || DEFAULT_LANG,
        });
        setAutoSaveStatus((prev) => ({ ...prev, [q.id]: 'saved' }));
        setTimeout(() => {
          setAutoSaveStatus((prev) => ({ ...prev, [q.id]: null }));
        }, 2000);
      } catch (_) {
        setAutoSaveStatus((prev) => ({ ...prev, [q.id]: null }));
      }
    }
  }, [participant, questions, codes, languages]);

  useEffect(() => {
    autoSaveTimerRef.current = setInterval(performAutoSave, 30000);
    return () => clearInterval(autoSaveTimerRef.current);
  }, [performAutoSave]);

  // ── Run Code ───────────────────────────────────────────────────
  const handleRun = async (question) => {
    const code     = codes[question.id] || '';
    const language = languages[question.id] || DEFAULT_LANG;

    if (!code.trim()) {
      setResults((prev) => ({ ...prev, [question.id]: { error: 'Please write some code first!' } }));
      return;
    }

    setRunning((prev) => ({ ...prev, [question.id]: true }));
    setResults((prev) => ({ ...prev, [question.id]: null }));

    try {
      const { data } = await runCode({
        participant_id: participant.id,
        question_id: question.id,
        code,
        language,
      });
      setResults((prev) => ({ ...prev, [question.id]: data }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [question.id]: { error: err.response?.data?.error || 'Execution failed. Try again.' },
      }));
    } finally {
      setRunning((prev) => ({ ...prev, [question.id]: false }));
    }
  };

  // ── Final Submit ───────────────────────────────────────────────
  const handleFinalSubmit = async (isAutoSubmit = false) => {
    if (!isAutoSubmit) {
      if (!confirm('⚠️ Are you sure you want to submit? This is final!')) return;
    }

    setSubmitting(true);
    try {
      // Auto-save all codes first
      await performAutoSave();

      const { data } = await finalSubmit(participant.id);
      updateParticipant(data.participant);
      setSubmitted(true);
      navigate('/submitted');
    } catch (err) {
      console.error('Final submit error:', err);
      // Even on error, if auto-submit, navigate anyway
      if (isAutoSubmit) navigate('/submitted');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Time-up handler ────────────────────────────────────────────
  const handleTimeUp = useCallback(() => {
    handleFinalSubmit(true);
  }, []);

  // ── Current question ────────────────────────────────────────────
  const currentQuestion = questions[activeTab];

  if (!participant) {
    navigate('/');
    return null;
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Summoning your challenges...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="loading-screen">
        <p style={{ fontSize: '2rem' }}>📭</p>
        <p>No questions available yet. Please wait for the admin to add questions.</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-primary)',
    }}>
      {/* ── Tab Warning Overlay ── */}
      {tabWarning && (
        <div className="tab-warning" onClick={() => setTabWarning(false)}>
          <div className="tab-warning-box">
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</p>
            <h2 style={{ color: 'var(--red-error)', marginBottom: '0.75rem' }}>
              Tab Switch Detected!
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Switching windows/tabs during the exam is not allowed.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Warning #{tabWarnCount}. Repeated violations may result in auto-disqualification.
            </p>
            <button className="btn btn-danger" onClick={() => setTabWarning(false)}>
              Return to Test
            </button>
          </div>
        </div>
      )}

      {/* ── Top Bar ── */}
      <header style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        {/* Left: Branding + participant info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🪄</span>
          <div>
            <p style={{ fontFamily: 'var(--font-heading)', color: 'var(--gold-primary)', fontSize: '0.9rem', lineHeight: 1.2 }}>
              Deathly Hallows
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {participant.name} · {participant.prn}
            </p>
          </div>
        </div>

        {/* Center: Timer */}
        <Timer onTimeUp={handleTimeUp} />

        {/* Right: Submit button */}
        <button
          id="final-submit-btn"
          className="btn btn-gold"
          onClick={() => handleFinalSubmit(false)}
          disabled={submitting}
        >
          {submitting ? '🔮 Submitting...' : '✅ Submit Test'}
        </button>
      </header>

      {/* ── Question Tabs ── */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '0 1.5rem',
        display: 'flex',
        gap: '0.25rem',
        overflowX: 'auto',
      }}>
        {questions.map((q, idx) => {
          const hasResult = results[q.id];
          const score = hasResult?.score;
          return (
            <button
              key={q.id}
              onClick={() => setActiveTab(idx)}
              style={{
                padding: '0.65rem 1.25rem',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === idx ? '2px solid var(--gold-primary)' : '2px solid transparent',
                color: activeTab === idx ? 'var(--gold-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                fontWeight: activeTab === idx ? 700 : 400,
                whiteSpace: 'nowrap',
                transition: 'var(--transition)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span className={`badge ${q.round_type === 'debug' ? 'badge-orange' : 'badge-blue'}`}
                style={{ fontSize: '0.65rem' }}>
                {q.round_type === 'debug' ? 'Debug' : 'Blind'}
              </span>
              Q{idx + 1}: {q.title.substring(0, 20)}{q.title.length > 20 ? '...' : ''}
              {score !== undefined && score !== null && (
                <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>
                  {score}pts
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Main Content ── */}
      {currentQuestion && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 0,
          flex: 1,
          minHeight: 0,
        }}>
          {/* Left Pane: Problem Statement */}
          <div style={{
            borderRight: '1px solid var(--border)',
            padding: '1.5rem',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 110px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem' }}>{currentQuestion.title}</h2>
              <span className={`badge ${currentQuestion.round_type === 'debug' ? 'badge-orange' : 'badge-blue'}`}>
                {currentQuestion.round_type === 'debug' ? '🐛 Debugging' : '🎯 Blind Coding'}
              </span>
              <span className="badge badge-gold">⭐ {currentQuestion.marks} marks</span>
            </div>

            <div style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.25rem',
              fontSize: '0.9rem',
              lineHeight: '1.75',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
            }}>
              {currentQuestion.description}
            </div>

            {/* Sample I/O */}
            {(currentQuestion.sample_input || currentQuestion.sample_output) && (
              <div className="grid-2" style={{ gap: '0.75rem', marginBottom: '1.25rem' }}>
                {currentQuestion.sample_input && (
                  <div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Sample Input
                    </p>
                    <pre style={{
                      background: '#0D1117',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem',
                      fontSize: '0.82rem',
                      fontFamily: 'var(--font-code)',
                      color: '#e6edf3',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {currentQuestion.sample_input}
                    </pre>
                  </div>
                )}
                {currentQuestion.sample_output && (
                  <div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Sample Output
                    </p>
                    <pre style={{
                      background: '#0D1117',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem',
                      fontSize: '0.82rem',
                      fontFamily: 'var(--font-code)',
                      color: '#e6edf3',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {currentQuestion.sample_output}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Test Results */}
            {results[currentQuestion.id] && (
              <div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Execution Results
                </p>

                {results[currentQuestion.id].error ? (
                  <div className="alert alert-error" style={{ fontFamily: 'var(--font-code)', fontSize: '0.82rem', whiteSpace: 'pre-wrap' }}>
                    {results[currentQuestion.id].error}
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2" style={{ marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-gold">
                        Score: {results[currentQuestion.id].score}/{results[currentQuestion.id].totalMarks}
                      </span>
                      <span className="badge badge-green">
                        ✅ {results[currentQuestion.id].results?.filter(r => r.passed).length} passed
                      </span>
                      <span className="badge badge-red">
                        ❌ {results[currentQuestion.id].results?.filter(r => !r.passed).length} failed
                      </span>
                    </div>

                    {results[currentQuestion.id].compilationError && (
                      <div className="alert alert-error" style={{ marginBottom: '0.75rem', fontFamily: 'var(--font-code)', fontSize: '0.82rem', whiteSpace: 'pre-wrap' }}>
                        {results[currentQuestion.id].compilationError}
                      </div>
                    )}

                    {results[currentQuestion.id].results?.map((r, i) => (
                      <div key={i} className={`test-case-row ${r.passed ? 'pass' : 'fail'}`}>
                        <div className="flex-between">
                          <span style={{ fontWeight: 600 }}>
                            {r.passed ? '✅' : '❌'} Test #{i + 1}
                          </span>
                          <span>{r.marks_awarded || 0} pts</span>
                        </div>
                        {!r.passed && r.error && (
                          <div style={{ marginTop: '0.25rem', opacity: 0.8, fontSize: '0.78rem', whiteSpace: 'pre-wrap' }}>
                            {r.error}
                          </div>
                        )}
                        {!r.passed && !r.error && r.got !== undefined && (
                          <div style={{ marginTop: '0.25rem', opacity: 0.8, fontSize: '0.78rem' }}>
                            Got: "{r.got}" · Expected: "{r.expected}"
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Pane: Code Editor */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1rem' }}>
            <CodeEditor
              value={codes[currentQuestion.id] || ''}
              onChange={(val) => setCodes((prev) => ({ ...prev, [currentQuestion.id]: val }))}
              language={languages[currentQuestion.id] || DEFAULT_LANG}
              onLanguageChange={(lang) =>
                setLanguages((prev) => ({ ...prev, [currentQuestion.id]: lang }))
              }
              defaultCode={currentQuestion.buggy_code}
              autoSaveStatus={autoSaveStatus[currentQuestion.id]}
            />

            <button
              id={`run-code-btn-${activeTab}`}
              className="btn btn-gold btn-lg"
              onClick={() => handleRun(currentQuestion)}
              disabled={running[currentQuestion.id]}
              style={{ alignSelf: 'flex-end' }}
            >
              {running[currentQuestion.id] ? '⚙️ Running...' : '▶️ Run & Submit Code'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
