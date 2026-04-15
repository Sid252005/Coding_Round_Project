/**
 * questions.js routes
 * CRUD for competition questions.
 * GET (participant view) is public; all others require admin JWT.
 */

const express = require('express');
const supabase = require('../config/supabase');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/questions/participant ──────────────────────────────────────────
// Returns all questions for participants (without hidden test case answers)
router.get('/participant', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('id, title, description, round_type, buggy_code, marks, sample_input, sample_output');

    if (error) throw error;

    // Shuffle questions randomly per participant (bonus feature)
    const shuffled = data.sort(() => Math.random() - 0.5);

    res.json(shuffled);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/questions ───────────────────────────────────────────────────────
// Admin: returns ALL questions including hidden test cases
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/questions/:id ───────────────────────────────────────────────────
router.get('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/questions ──────────────────────────────────────────────────────
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { title, description, round_type, buggy_code, test_cases, marks, sample_input, sample_output } = req.body;

    if (!title || !description || !round_type) {
      return res.status(400).json({ error: 'Title, description, and round type are required' });
    }

    if (!['debug', 'blind'].includes(round_type)) {
      return res.status(400).json({ error: 'round_type must be "debug" or "blind"' });
    }

    const { data, error } = await supabase
      .from('questions')
      .insert({
        title,
        description,
        round_type,
        buggy_code: buggy_code || null,
        test_cases: test_cases || [],
        marks: marks || 10,
        sample_input: sample_input || '',
        sample_output: sample_output || '',
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/questions/:id ───────────────────────────────────────────────────
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { title, description, round_type, buggy_code, test_cases, marks, sample_input, sample_output } = req.body;

    const { data, error } = await supabase
      .from('questions')
      .update({ title, description, round_type, buggy_code, test_cases, marks, sample_input, sample_output })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/questions/:id ────────────────────────────────────────────────
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Question deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
