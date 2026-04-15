/**
 * timer.js routes
 * Admin controls the global competition timer.
 * Participants read the timer state to sync their countdown.
 */

const express = require('express');
const supabase = require('../config/supabase');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/timer ───────────────────────────────────────────────────────────
// Public: participants poll this to sync their timer
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('timer_config')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) throw error;

    // Calculate remaining seconds
    let remainingSeconds = null;
    if (data.is_active && data.start_time) {
      const elapsed = Math.floor((Date.now() - new Date(data.start_time).getTime()) / 1000);
      const totalSeconds = (data.duration_minutes || 60) * 60;
      remainingSeconds = Math.max(0, totalSeconds - elapsed);
    }

    res.json({ ...data, remaining_seconds: remainingSeconds });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/timer/set ──────────────────────────────────────────────────────
// Admin: set duration
router.post('/set', requireAdmin, async (req, res, next) => {
  try {
    const { duration_minutes } = req.body;

    if (!duration_minutes || duration_minutes < 1 || duration_minutes > 300) {
      return res.status(400).json({ error: 'Duration must be between 1 and 300 minutes' });
    }

    const { data, error } = await supabase
      .from('timer_config')
      .update({ duration_minutes, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .single();

    if (error) throw error;

    const io = req.app.get('io');
    if (io) io.emit('timer-updated', data);

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/timer/start ────────────────────────────────────────────────────
// Admin: start the global competition timer
router.post('/start', requireAdmin, async (req, res, next) => {
  try {
    const startTime = new Date().toISOString();

    const { data, error } = await supabase
      .from('timer_config')
      .update({ is_active: true, start_time: startTime, updated_at: startTime })
      .eq('id', 1)
      .select()
      .single();

    if (error) throw error;

    // Broadcast to all connected clients
    const io = req.app.get('io');
    if (io) io.emit('timer-started', data);

    res.json({ message: 'Timer started', timer: data });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/timer/stop ─────────────────────────────────────────────────────
// Admin: stop / reset the timer
router.post('/stop', requireAdmin, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('timer_config')
      .update({ is_active: false, start_time: null, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .single();

    if (error) throw error;

    const io = req.app.get('io');
    if (io) io.emit('timer-stopped', data);

    res.json({ message: 'Timer stopped', timer: data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
