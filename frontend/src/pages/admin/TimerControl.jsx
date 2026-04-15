import { useState, useEffect } from 'react';
import { getTimer, setTimer, startTimer, stopTimer } from '../../services/api';
import { useSocket } from '../../context/SocketContext';

export default function TimerControl() {
  const [timer, setTimerState] = useState(null);
  const [duration, setDuration] = useState(60);
  const [loading, setLoading]   = useState(true);
  const [message, setMessage]   = useState('');
  const [remaining, setRemaining] = useState(null);
  const { on, off, emit } = useSocket();

  const fetchTimer = async () => {
    try {
      const { data } = await getTimer();
      setTimerState(data);
      setDuration(data.duration_minutes || 60);
      setRemaining(data.remaining_seconds);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchTimer();
    emit('join-admin');

    // Live countdown
    const interval = setInterval(() => {
      setRemaining((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
    }, 1000);

    const handleStart  = (data) => { setTimerState(data); setRemaining(data.duration_minutes * 60); };
    const handleStop   = (data) => { setTimerState(data); setRemaining(null); };
    const handleUpdate = (data) => { setTimerState(data); };

    on('timer-started', handleStart);
    on('timer-stopped', handleStop);
    on('timer-updated', handleUpdate);

    return () => {
      clearInterval(interval);
      off('timer-started', handleStart);
      off('timer-stopped', handleStop);
      off('timer-updated', handleUpdate);
    };
  }, []);

  const handleSet = async () => {
    try {
      await setTimer(duration);
      setMessage('✅ Timer duration set!');
      fetchTimer();
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.error || 'Failed to set timer'}`);
    }
  };

  const handleStart = async () => {
    if (!confirm(`Start ${duration}-minute competition timer? All participants will see the countdown.`)) return;
    try {
      await startTimer();
      setMessage('✅ Timer started! Competition has begun!');
      fetchTimer();
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.error || 'Failed to start timer'}`);
    }
  };

  const handleStop = async () => {
    if (!confirm('Stop the timer? This will pause the competition.')) return;
    try {
      await stopTimer();
      setMessage('⏹️ Timer stopped.');
      fetchTimer();
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.error || 'Failed to stop timer'}`);
    }
  };

  const formatTime = (s) => {
    if (s === null || s === undefined) return '--:--';
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const pct = timer && remaining !== null
    ? Math.max(0, (remaining / (timer.duration_minutes * 60)) * 100)
    : 100;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>⏱️ Timer Control</h1>
        <p>Set and control the global competition timer</p>
      </div>

      {message && (
        <div className={`alert ${message.startsWith('✅') || message.startsWith('⏹️') ? 'alert-success' : 'alert-error'}`}
          style={{ marginBottom: '1.5rem' }}>
          {message}
        </div>
      )}

      <div className="grid-2" style={{ gap: '1.5rem' }}>
        {/* Timer Status */}
        <div className="card">
          <div className="card-header">
            <h3>Current Status</h3>
          </div>

          {loading ? (
            <div className="flex-center" style={{ padding: '2rem' }}><div className="spinner" /></div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{
                fontSize: '4rem',
                fontFamily: 'var(--font-code)',
                fontWeight: 700,
                color: timer?.is_active ? 'var(--gold-primary)' : 'var(--text-muted)',
                marginBottom: '1rem',
              }}>
                {formatTime(remaining)}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div className="timer-bar" style={{ height: '8px' }}>
                  <div className="timer-bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div>
                <span className={`badge ${timer?.is_active ? 'badge-green' : 'badge-muted'}`}>
                  {timer?.is_active ? '🟢 RUNNING' : '⏸️ STOPPED'}
                </span>
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                Duration: {timer?.duration_minutes || 60} minutes
              </p>
            </div>
          )}
        </div>

        {/* Timer Controls */}
        <div className="card">
          <div className="card-header">
            <h3>Controls</h3>
          </div>

          <div className="form-group">
            <label>Set Duration (minutes)</label>
            <input
              type="number"
              className="form-control"
              value={duration}
              min={1}
              max={300}
              onChange={(e) => setDuration(parseInt(e.target.value))}
            />
          </div>

          <button className="btn btn-outline" style={{ width: '100%', marginBottom: '0.75rem' }} onClick={handleSet}>
            💾 Set Duration
          </button>

          <button
            className="btn btn-gold btn-lg"
            style={{ width: '100%', marginBottom: '0.75rem' }}
            onClick={handleStart}
            disabled={timer?.is_active}
          >
            ▶️ Start Competition
          </button>

          <button
            className="btn btn-danger"
            style={{ width: '100%' }}
            onClick={handleStop}
            disabled={!timer?.is_active}
          >
            ⏹️ Stop Timer
          </button>

          <div className="alert alert-warning" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
            ⚠️ Starting the timer broadcasts to ALL connected participants.
            Make sure all participants are logged in before starting.
          </div>
        </div>
      </div>
    </div>
  );
}
