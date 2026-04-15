/**
 * submissions.js routes
 * POST /api/run-code   — Run code, score it, save submission
 * POST /api/submissions/save  — Auto-save (no execution)
 */

const express = require('express');
const supabase = require('../config/supabase');
const { runCode } = require('../services/codeRunner');

const router = express.Router();

// ─── POST /api/run-code ───────────────────────────────────────────────────────
// Main endpoint: run code against test cases, score, and save.
router.post('/run-code', async (req, res, next) => {
  try {
    const { participant_id, question_id, code, language } = req.body;

    // Validate request
    if (!participant_id || !question_id || !code || !language) {
      return res.status(400).json({ error: 'participant_id, question_id, code, and language are required' });
    }

    if (!['python', 'cpp', 'c', 'java'].includes(language)) {
      return res.status(400).json({ error: 'Supported languages: python, cpp, c, java' });
    }

    // Verify participant exists and hasn't already submitted all
    const { data: participant, error: pErr } = await supabase
      .from('participants')
      .select('*')
      .eq('id', participant_id)
      .single();

    if (pErr || !participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    // Fetch the question WITH test cases (admin-only data)
    const { data: question, error: qErr } = await supabase
      .from('questions')
      .select('*')
      .eq('id', question_id)
      .single();

    if (qErr || !question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const testCases = question.test_cases || [];

    // ── Execute the code ────────────────────────────────────────────────────
    const startTime = Date.now();
    const executionResult = await runCode(code, language, testCases);
    const executionTime = Math.floor((Date.now() - startTime) / 1000);

    // ── Save submission to DB ───────────────────────────────────────────────
    // Upsert: if participant already submitted for this question, update it
    const { data: existingSub } = await supabase
      .from('submissions')
      .select('id')
      .eq('participant_id', participant_id)
      .eq('question_id', question_id)
      .single();

    let submission;

    const submissionPayload = {
      participant_id,
      participant_name: participant.name,
      participant_prn: participant.prn,
      question_id,
      question_title: question.title,
      code,
      language,
      score: executionResult.score,
      output: executionResult.compilationError
        || (executionResult.results[0]?.got ?? ''),
      test_results: executionResult.results,
      time_taken: executionTime,
      submitted_at: new Date().toISOString(),
    };

    if (existingSub) {
      const { data, error } = await supabase
        .from('submissions')
        .update(submissionPayload)
        .eq('id', existingSub.id)
        .select()
        .single();

      if (error) throw error;
      submission = data;
    } else {
      const { data, error } = await supabase
        .from('submissions')
        .insert(submissionPayload)
        .select()
        .single();

      if (error) throw error;
      submission = data;
    }

    // ── Update participant's total score ────────────────────────────────────
    // Recalculate total score from all their submissions
    const { data: allSubs, error: allSubsErr } = await supabase
      .from('submissions')
      .select('score')
      .eq('participant_id', participant_id);

    if (!allSubsErr) {
      const totalScore = allSubs.reduce((sum, s) => sum + (s.score || 0), 0);

      await supabase
        .from('participants')
        .update({ score: totalScore })
        .eq('id', participant_id);
    }

    res.json({
      message: 'Code executed and saved',
      score: executionResult.score,
      totalMarks: executionResult.totalMarks,
      compilationError: executionResult.compilationError || null,
      results: executionResult.results,
      submission_id: submission.id,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/submissions/final-submit ──────────────────────────────────────
// Called when participant submits the test (final submit or auto-submit on timeout)
router.post('/submissions/final-submit', async (req, res, next) => {
  try {
    const { participant_id } = req.body;

    if (!participant_id) {
      return res.status(400).json({ error: 'participant_id required' });
    }

    const { data, error } = await supabase
      .from('participants')
      .update({ status: 'submitted', end_time: new Date().toISOString() })
      .eq('id', participant_id)
      .select()
      .single();

    if (error) throw error;

    // Emit socket event for live admin monitoring (accessed via app.get)
    const io = req.app.get('io');
    if (io) {
      io.emit('participant-submitted', { participant: data });
    }

    res.json({ message: 'Test submitted successfully', participant: data });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/submissions/autosave ──────────────────────────────────────────
// Auto-save code without executing (every 30 seconds)
router.post('/submissions/autosave', async (req, res, next) => {
  try {
    const { participant_id, question_id, code, language } = req.body;

    if (!participant_id || !question_id || !code) {
      return res.status(400).json({ error: 'participant_id, question_id, code required' });
    }

    // Check if submission exists, create draft if not
    const { data: existing } = await supabase
      .from('submissions')
      .select('id')
      .eq('participant_id', participant_id)
      .eq('question_id', question_id)
      .single();

    if (existing) {
      await supabase
        .from('submissions')
        .update({ code, language })
        .eq('id', existing.id);
    } else {
      // Get participant info for denormalized fields
      const { data: participant } = await supabase
        .from('participants')
        .select('name, prn')
        .eq('id', participant_id)
        .single();

      const { data: question } = await supabase
        .from('questions')
        .select('title')
        .eq('id', question_id)
        .single();

      await supabase
        .from('submissions')
        .insert({
          participant_id,
          participant_name: participant?.name,
          participant_prn: participant?.prn,
          question_id,
          question_title: question?.title,
          code,
          language: language || 'python',
          score: 0,
        });
    }

    res.json({ message: 'Auto-saved' });
  } catch (err) {
    // Don't fail the user for autosave errors
    res.json({ message: 'Auto-save skipped' });
  }
});

// ─── PUT /api/submissions/start ───────────────────────────────────────────────
// Called when participant clicks "Start Test"
router.put('/submissions/start', async (req, res, next) => {
  try {
    const { participant_id } = req.body;

    if (!participant_id) {
      return res.status(400).json({ error: 'participant_id required' });
    }

    // Fetch participant first to check current status
    const { data: existing, error: fetchErr } = await supabase
      .from('participants')
      .select('*')
      .eq('id', participant_id)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    // If already in_progress or submitted, just return current state
    if (existing.status === 'in_progress' || existing.status === 'submitted') {
      return res.json({ message: 'Test already started', participant: existing });
    }

    // Update to in_progress
    const { data, error } = await supabase
      .from('participants')
      .update({ status: 'in_progress', start_time: new Date().toISOString() })
      .eq('id', participant_id)
      .select()
      .single();

    if (error) throw error;

    const io = req.app.get('io');
    if (io) {
      io.emit('participant-started', { participant: data });
    }

    res.json({ message: 'Test started', participant: data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
