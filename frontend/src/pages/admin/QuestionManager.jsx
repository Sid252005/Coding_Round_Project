import { useState, useEffect } from 'react';
import {
  getQuestionsAdmin, createQuestion, updateQuestion, deleteQuestion,
} from '../../services/api';

const EMPTY_FORM = {
  title: '',
  description: '',
  round_type: 'blind',
  buggy_code: '',
  marks: 10,
  sample_input: '',
  sample_output: '',
  test_cases: [{ input: '', expected_output: '', marks: 5 }],
};

// ── Pre-built sample questions for a college competition ────────
const SAMPLE_QUESTIONS = [
  {
    title: 'Sum of Two Numbers',
    description: `Write a program that reads two integers and prints their sum.

Input Format:
Two integers A and B on separate lines.

Output Format:
Print the sum of A and B.

Constraints: -10^9 ≤ A, B ≤ 10^9`,
    round_type: 'blind',
    buggy_code: '',
    marks: 10,
    sample_input: '5\n3',
    sample_output: '8',
    test_cases: [
      { input: '5\n3',     expected_output: '8',   marks: 3 },
      { input: '100\n200', expected_output: '300',  marks: 3 },
      { input: '-5\n10',   expected_output: '5',   marks: 4 },
    ],
  },
  {
    title: 'Reverse a String',
    description: `Write a program that reads a string and prints it reversed.

Input Format:
A single line containing a string S.

Output Format:
Print the reversed string.

Example:
Input: hello
Output: olleh`,
    round_type: 'blind',
    buggy_code: '',
    marks: 10,
    sample_input: 'hello',
    sample_output: 'olleh',
    test_cases: [
      { input: 'hello',     expected_output: 'olleh',     marks: 3 },
      { input: 'python',    expected_output: 'nohtyp',    marks: 3 },
      { input: 'abcde',     expected_output: 'edcba',     marks: 4 },
    ],
  },
  {
    title: 'Fix the Factorial Bug',
    description: `The following code is supposed to calculate the factorial of N.
Find and fix the bug in the code.

Input: A single integer N (0 ≤ N ≤ 10)
Output: Print N! (factorial of N)`,
    round_type: 'debug',
    buggy_code: `n = int(input())
result = 0  # Bug: should be 1, not 0
for i in range(1, n + 1):
    result *= i
print(result)`,
    marks: 10,
    sample_input: '5',
    sample_output: '120',
    test_cases: [
      { input: '5',  expected_output: '120', marks: 3 },
      { input: '0',  expected_output: '1',   marks: 3 },
      { input: '10', expected_output: '3628800', marks: 4 },
    ],
  },
];

export default function QuestionManager() {
  const [questions, setQuestions]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [seeding, setSeeding]       = useState(false);
  const [message, setMessage]       = useState({ text: '', type: '' });
  const [expandedId, setExpandedId] = useState(null);

  const fetchQuestions = async () => {
    try {
      const { data } = await getQuestionsAdmin();
      setQuestions(data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchQuestions(); }, []);

  // Close modal on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setShowForm(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (q) => {
    setEditing(q.id);
    setForm({
      title: q.title,
      description: q.description,
      round_type: q.round_type,
      buggy_code: q.buggy_code || '',
      marks: q.marks,
      sample_input: q.sample_input || '',
      sample_output: q.sample_output || '',
      test_cases: q.test_cases?.length
        ? q.test_cases
        : [{ input: '', expected_output: '', marks: 5 }],
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateQuestion(editing, form);
        showMsg('✅ Question updated successfully!');
      } else {
        await createQuestion(form);
        showMsg('✅ Question created successfully!');
      }
      closeForm();
      fetchQuestions();
    } catch (err) {
      showMsg(`❌ ${err.response?.data?.error || 'Save failed. Try again.'}`, 'error');
    }
    setSaving(false);
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteQuestion(id);
      showMsg('🗑️ Question deleted.');
      fetchQuestions();
    } catch (_) {}
  };

  // Seed all 3 sample questions at once
  const handleSeedSamples = async () => {
    if (!confirm('This will add 3 sample questions to your database. Continue?')) return;
    setSeeding(true);
    try {
      for (const q of SAMPLE_QUESTIONS) {
        await createQuestion(q);
      }
      showMsg('✅ 3 sample questions added! Participants can now start the test.');
      fetchQuestions();
    } catch (err) {
      showMsg('❌ Some questions failed to seed. Try again.', 'error');
    }
    setSeeding(false);
  };

  // Test cases helpers
  const addTestCase = () =>
    setForm((f) => ({
      ...f,
      test_cases: [...f.test_cases, { input: '', expected_output: '', marks: 5 }],
    }));

  const removeTestCase = (idx) =>
    setForm((f) => ({
      ...f,
      test_cases: f.test_cases.filter((_, i) => i !== idx),
    }));

  const updateTestCase = (idx, field, val) =>
    setForm((f) => ({
      ...f,
      test_cases: f.test_cases.map((tc, i) =>
        i === idx ? { ...tc, [field]: val } : tc
      ),
    }));

  return (
    <div className="fade-in">
      {/* ── Page Header ── */}
      <div className="page-header flex-between">
        <div>
          <h1>📝 Question Manager</h1>
          <p>Add, edit, and manage competition questions</p>
        </div>
        <div className="flex gap-2">
          {/* Seed Samples Button */}
          <button
            className="btn btn-outline"
            onClick={handleSeedSamples}
            disabled={seeding}
            title="Add 3 pre-built sample questions (Sum of Numbers, Reverse String, Fix Factorial)"
          >
            {seeding ? '🔮 Adding...' : '🧙 Load Sample Questions'}
          </button>
          <button className="btn btn-gold" onClick={openNew}>
            + Add Question
          </button>
        </div>
      </div>

      {/* ── Alert Message ── */}
      {message.text && (
        <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}
          style={{ marginBottom: '1.5rem' }}>
          {message.text}
        </div>
      )}

      {/* ── How to Run a Test: Guide Banner ── */}
      {questions.length === 0 && !loading && (
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-active)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          <h3 style={{ marginBottom: '1rem' }}>🚀 How to Run a Test — Quick Guide</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[
              { step: '1', label: 'Add Questions', desc: 'Click "Load Sample Questions" to add 3 ready-made questions, or create your own.' },
              { step: '2', label: 'Set Timer',     desc: 'Go to Timer Control → set duration (e.g. 60 min) → click Save.' },
              { step: '3', label: 'Share the Link', desc: 'Give participants the URL of this site. They login with Name + PRN.' },
              { step: '4', label: 'Start the Test', desc: 'Go to Timer Control → click "Start Competition". Timer starts for ALL participants.' },
              { step: '5', label: 'Monitor Live',  desc: 'Check Live Monitor to see who started and submitted.' },
              { step: '6', label: 'View Results',  desc: 'After submissions, check Leaderboard and Submissions tab for scores.' },
            ].map((s) => (
              <div key={s.step} className="flex gap-2" style={{ alignItems: 'flex-start' }}>
                <div style={{
                  minWidth: '28px', height: '28px', borderRadius: '50%',
                  background: 'var(--gold-glow)', border: '1px solid var(--gold-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-primary)',
                }}>
                  {s.step}
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.label}: </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{s.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Question List ── */}
      {loading ? (
        <div className="flex-center" style={{ minHeight: '300px' }}>
          <div className="spinner" />
        </div>
      ) : questions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</p>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            No questions yet. Load samples or add your own to get started.
          </p>
          <div className="flex gap-2" style={{ justifyContent: 'center' }}>
            <button className="btn btn-gold" onClick={handleSeedSamples} disabled={seeding}>
              {seeding ? '🔮 Adding...' : '🧙 Load Sample Questions'}
            </button>
            <button className="btn btn-outline" onClick={openNew}>
              + Create Custom
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {questions.map((q, idx) => (
            <div key={q.id} className="card" style={{ padding: '1.25rem' }}>
              <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
                {/* Left: Title + badges */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex gap-1" style={{ alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.8rem' }}>Q{idx + 1}</span>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>{q.title}</h3>
                  </div>
                  <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                    <span className={`badge ${q.round_type === 'debug' ? 'badge-orange' : 'badge-blue'}`}>
                      {q.round_type === 'debug' ? '🐛 Debug Round' : '🎯 Blind Round'}
                    </span>
                    <span className="badge badge-gold">⭐ {q.marks} marks</span>
                    <span className="badge badge-muted">{q.test_cases?.length || 0} test cases</span>
                  </div>
                </div>

                {/* Right: Action buttons */}
                <div className="flex gap-1" style={{ flexShrink: 0 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                  >
                    {expandedId === q.id ? '🔼 Hide' : '🔽 Preview'}
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(q)}>
                    ✏️ Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(q.id, q.title)}>
                    🗑️ Delete
                  </button>
                </div>
              </div>

              {/* Expandable Preview */}
              {expandedId === q.id && (
                <div style={{
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border)',
                  animation: 'fadeIn 0.2s ease',
                }}>
                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem',
                    lineHeight: '1.7',
                    whiteSpace: 'pre-wrap',
                    marginBottom: q.sample_input ? '1rem' : 0,
                  }}>
                    {q.description}
                  </p>
                  {q.buggy_code && (
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.78rem', color: 'var(--orange-warn)', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        🐛 Buggy Code shown to participants:
                      </p>
                      <pre style={{
                        background: '#0D1117', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)', padding: '1rem',
                        fontSize: '0.82rem', fontFamily: 'var(--font-code)',
                        color: '#e6edf3', overflowX: 'auto', lineHeight: 1.5,
                      }}>
                        {q.buggy_code}
                      </pre>
                    </div>
                  )}
                  {(q.sample_input || q.sample_output) && (
                    <div className="grid-2" style={{ gap: '0.75rem' }}>
                      {q.sample_input && (
                        <div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.3rem' }}>Sample Input:</p>
                          <pre style={{ background: '#0D1117', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', fontSize: '0.82rem', fontFamily: 'var(--font-code)', color: '#e6edf3' }}>
                            {q.sample_input}
                          </pre>
                        </div>
                      )}
                      {q.sample_output && (
                        <div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.3rem' }}>Sample Output:</p>
                          <pre style={{ background: '#0D1117', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', fontSize: '0.82rem', fontFamily: 'var(--font-code)', color: '#e6edf3' }}>
                            {q.sample_output}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                  {q.test_cases?.length > 0 && (
                    <details style={{ marginTop: '1rem' }}>
                      <summary style={{ cursor: 'pointer', color: 'var(--gold-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                        🔒 {q.test_cases.length} Hidden Test Case{q.test_cases.length > 1 ? 's' : ''} (click to view)
                      </summary>
                      <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {q.test_cases.map((tc, i) => (
                          <div key={i} style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', fontFamily: 'var(--font-code)' }}>
                            <span style={{ color: 'var(--gold-primary)', fontWeight: 600 }}>TC #{i + 1}</span>
                            <span style={{ color: 'var(--text-secondary)', margin: '0 0.5rem' }}>·</span>
                            <span style={{ color: 'var(--text-muted)' }}>In: </span>
                            <span style={{ color: '#e6edf3' }}>{tc.input || '(empty)'}</span>
                            <span style={{ color: 'var(--text-muted)', margin: '0 0.5rem' }}>→</span>
                            <span style={{ color: 'var(--text-muted)' }}>Out: </span>
                            <span style={{ color: 'var(--green-magic)' }}>{tc.expected_output}</span>
                            <span className="badge badge-gold" style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>{tc.marks}pts</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {showForm && (
        <>
          {/* Backdrop — click to close */}
          <div
            onClick={closeForm}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.82)',
              zIndex: 1000,
            }}
          />

          {/* Modal panel — scrolls independently */}
          <div style={{
            position: 'fixed',
            top: 0, right: 0,
            width: '100%', maxWidth: '760px',
            height: '100vh',
            background: 'var(--bg-card)',
            borderLeft: '1px solid var(--border)',
            zIndex: 1001,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
            animation: 'slideIn 0.25s ease',
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              flexShrink: 0,
            }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
                  {editing ? '✏️ Edit Question' : '✨ New Question'}
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.2rem' }}>
                  Press Esc or click backdrop to close
                </p>
              </div>
              <button
                className="btn btn-ghost"
                onClick={closeForm}
                style={{ fontSize: '1.2rem', padding: '0.4rem 0.8rem' }}
                title="Close (Esc)"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              <form id="question-form" onSubmit={handleSave}>
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Sum of Two Numbers"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label>Round Type *</label>
                  <select
                    className="form-control"
                    value={form.round_type}
                    onChange={(e) => setForm({ ...form, round_type: e.target.value })}
                  >
                    <option value="blind">🎯 Blind Coding — participants write from scratch</option>
                    <option value="debug">🐛 Debugging — participants fix buggy code</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Problem Description *</label>
                  <textarea
                    className="form-control"
                    rows={6}
                    placeholder="Describe the problem clearly. Include input/output format and constraints."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                  />
                </div>

                {form.round_type === 'debug' && (
                  <div className="form-group">
                    <label>Buggy Code * <span style={{ color: 'var(--orange-warn)', fontSize: '0.78rem' }}>(shown to participants in editor)</span></label>
                    <textarea
                      className="form-control"
                      rows={10}
                      placeholder="Paste the buggy code here..."
                      value={form.buggy_code}
                      style={{ fontFamily: 'var(--font-code)', fontSize: '0.85rem' }}
                      onChange={(e) => setForm({ ...form, buggy_code: e.target.value })}
                    />
                  </div>
                )}

                <div className="grid-2">
                  <div className="form-group">
                    <label>Sample Input <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(shown to participants)</span></label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="e.g. 5&#10;3"
                      value={form.sample_input}
                      style={{ fontFamily: 'var(--font-code)' }}
                      onChange={(e) => setForm({ ...form, sample_input: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Sample Output <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(shown to participants)</span></label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="e.g. 8"
                      value={form.sample_output}
                      style={{ fontFamily: 'var(--font-code)' }}
                      onChange={(e) => setForm({ ...form, sample_output: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Total Marks for this Question</label>
                  <input
                    type="number"
                    className="form-control"
                    value={form.marks}
                    min={1} max={100}
                    onChange={(e) => setForm({ ...form, marks: parseInt(e.target.value) || 10 })}
                    style={{ maxWidth: '180px' }}
                  />
                </div>

                {/* ── Test Cases ── */}
                <div style={{
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                }}>
                  <div className="flex-between" style={{ marginBottom: '1rem' }}>
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--gold-primary)', margin: 0 }}>
                        🔒 Hidden Test Cases
                      </p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.2rem' }}>
                        Participants never see these — only their pass/fail status
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={addTestCase}
                    >
                      + Add Test Case
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {form.test_cases.map((tc, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem',
                        }}
                      >
                        <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--gold-primary)', fontSize: '0.85rem' }}>
                            Test Case #{idx + 1}
                          </span>
                          {form.test_cases.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => removeTestCase(idx)}
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid-2" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                              Input (stdin)
                            </label>
                            <textarea
                              className="form-control"
                              rows={3}
                              value={tc.input}
                              style={{ fontFamily: 'var(--font-code)', fontSize: '0.82rem' }}
                              onChange={(e) => updateTestCase(idx, 'input', e.target.value)}
                              placeholder="(leave empty if no input needed)"
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                              Expected Output (exact match)
                            </label>
                            <textarea
                              className="form-control"
                              rows={3}
                              value={tc.expected_output}
                              style={{ fontFamily: 'var(--font-code)', fontSize: '0.82rem' }}
                              onChange={(e) => updateTestCase(idx, 'expected_output', e.target.value)}
                              placeholder="Exact output the code must print"
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            Marks for this test case:
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={tc.marks}
                            min={1}
                            onChange={(e) => updateTestCase(idx, 'marks', parseInt(e.target.value) || 1)}
                            style={{ maxWidth: '100px' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            {/* Sticky Footer Buttons */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              display: 'flex',
              gap: '0.75rem',
              flexShrink: 0,
            }}>
              <button
                type="submit"
                form="question-form"
                className="btn btn-gold"
                disabled={saving}
                style={{ flex: 1 }}
              >
                {saving ? '🔮 Saving...' : editing ? '💾 Update Question' : '✨ Create Question'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={closeForm}
                style={{ flex: '0 0 auto' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
