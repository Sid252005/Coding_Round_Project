/**
 * Timer Component
 * Syncs with backend timer state and renders a circular countdown.
 */

import { useState, useEffect, useRef } from 'react';
import { getTimer } from '../../services/api';
import { useSocket } from '../../context/SocketContext';

const formatTime = (seconds) => {
  if (seconds === null || seconds === undefined) return '--:--';
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function Timer({ onTimeUp, totalMinutes }) {
  const [remaining, setRemaining] = useState(null);
  const [total, setTotal]         = useState((totalMinutes || 60) * 60);
  const [active, setActive]       = useState(false);
  const intervalRef = useRef(null);
  const { on, off } = useSocket();

  // Poll timer from server every 10 seconds to stay in sync
  const syncTimer = async () => {
    try {
      const { data } = await getTimer();
      if (data.is_active && data.remaining_seconds !== null) {
        setRemaining(data.remaining_seconds);
        setTotal((data.duration_minutes || 60) * 60);
        setActive(true);
      } else {
        setActive(false);
        setRemaining(null);
      }
    } catch (_) {}
  };

  // Initial sync
  useEffect(() => {
    syncTimer();
    const syncInterval = setInterval(syncTimer, 10000);
    return () => clearInterval(syncInterval);
  }, []);

  // Local countdown (once active)
  useEffect(() => {
    clearInterval(intervalRef.current);

    if (active && remaining !== null && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            onTimeUp && onTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(intervalRef.current);
  }, [active, remaining !== null]);

  // Socket events
  useEffect(() => {
    const handleStart = (data) => {
      setTotal((data.duration_minutes || 60) * 60);
      setRemaining((data.duration_minutes || 60) * 60);
      setActive(true);
    };
    const handleStop = () => {
      setActive(false);
      setRemaining(null);
    };
    const handleUpdate = (data) => {
      setTotal((data.duration_minutes || 60) * 60);
    };

    on('timer-started', handleStart);
    on('timer-stopped', handleStop);
    on('timer-updated', handleUpdate);

    return () => {
      off('timer-started', handleStart);
      off('timer-stopped', handleStop);
      off('timer-updated', handleUpdate);
    };
  }, [on, off]);

  // Determine urgency level
  const pct      = total > 0 && remaining !== null ? ((remaining / total) * 100) : 100;
  const isWarn   = remaining !== null && remaining < 600; // < 10 min
  const isDanger = remaining !== null && remaining < 120; // < 2 min

  const barColor = isDanger ? '#E74C3C' : isWarn ? '#E67E22' : '#C9A84C';
  const textClass = isDanger ? 'danger' : isWarn ? 'warning' : '';

  if (!active) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}>
          ⏳ Waiting for admin to start...
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      {/* Time display */}
      <div className={`timer-display ${textClass}`}>
        ⏱️ {formatTime(remaining)}
      </div>

      {/* Progress bar */}
      <div style={{ flex: 1, minWidth: '80px' }}>
        <div className="timer-bar">
          <div
            className="timer-bar-fill"
            style={{ width: `${pct}%`, backgroundColor: barColor }}
          />
        </div>
      </div>
    </div>
  );
}
