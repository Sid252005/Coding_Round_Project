/**
 * auth.js routes
 * Handles login for admin and participants.
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const router = express.Router();

// ─── POST /api/auth/admin/login ───────────────────────────────────────────────
router.post('/admin/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Compare against env-stored credentials (no DB lookup needed for single admin)
    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { role: 'admin', email },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ token, message: 'Admin login successful' });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/participant/login ─────────────────────────────────────────
router.post('/participant/login', async (req, res, next) => {
  try {
    const { name, prn } = req.body;

    if (!name || !prn) {
      return res.status(400).json({ error: 'Name and PRN are required' });
    }

    const trimmedPRN = prn.trim().toUpperCase();
    const trimmedName = name.trim();

    // Check if participant already exists
    const { data: existing, error: fetchError } = await supabase
      .from('participants')
      .select('*')
      .eq('prn', trimmedPRN)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows found (that's OK)
      throw fetchError;
    }

    if (existing) {
      // Already registered — return their existing record
      if (existing.status === 'submitted') {
        return res.status(400).json({
          error: 'You have already submitted your test. Contact admin if this is an error.',
        });
      }

      return res.json({
        participant: existing,
        message: 'Welcome back! Resuming your session.',
      });
    }

    // New participant — create record
    const { data: newParticipant, error: insertError } = await supabase
      .from('participants')
      .insert({ name: trimmedName, prn: trimmedPRN, status: 'not_started' })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        // Unique constraint violation
        return res.status(409).json({ error: 'PRN already registered. Contact admin if this is a mistake.' });
      }
      throw insertError;
    }

    res.status(201).json({
      participant: newParticipant,
      message: 'Registration successful!',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
