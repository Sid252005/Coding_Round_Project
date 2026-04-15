/**
 * admin.js routes
 * Dashboard, monitoring, leaderboard — all require admin JWT.
 */

const express = require('express');
const supabase = require('../config/supabase');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require JWT
router.use(requireAdmin);

// ─── GET /api/admin/stats ──────────────────────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    // Count by status using Supabase
    const { data, error } = await supabase
      .from('participants')
      .select('status');

    if (error) throw error;

    const stats = data.reduce(
      (acc, p) => {
        acc.total++;
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      },
      { total: 0, not_started: 0, in_progress: 0, submitted: 0 }
    );

    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/participants ──────────────────────────────────────────────
router.get('/participants', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/leaderboard ───────────────────────────────────────────────
router.get('/leaderboard', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('id, name, prn, score, status, start_time, end_time')
      .order('score', { ascending: false })
      .order('end_time', { ascending: true, nullsFirst: false });

    if (error) throw error;

    // Calculate time taken for each participant
    const leaderboard = data.map((p, idx) => {
      const timeTaken = p.start_time && p.end_time
        ? Math.floor((new Date(p.end_time) - new Date(p.start_time)) / 1000)
        : null;

      return {
        rank: idx + 1,
        ...p,
        time_taken: timeTaken,
      };
    });

    res.json(leaderboard);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/submissions ───────────────────────────────────────────────
router.get('/submissions', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/submissions/:participantId ────────────────────────────────
router.get('/submissions/:participantId', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('participant_id', req.params.participantId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/admin/participants/:id ───────────────────────────────────────
router.delete('/participants/:id', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Participant removed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
