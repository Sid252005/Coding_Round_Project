-- =============================================
-- Deathly Hallows Coding Challenge - Supabase Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- PARTICIPANTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  prn TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'submitted')),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- QUESTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  round_type TEXT NOT NULL CHECK (round_type IN ('debug', 'blind')),
  buggy_code TEXT,
  test_cases JSONB DEFAULT '[]'::JSONB,
  marks INTEGER DEFAULT 10,
  sample_input TEXT,
  sample_output TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SUBMISSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  participant_name TEXT,
  participant_prn TEXT,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  question_title TEXT,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  output TEXT,
  test_results JSONB DEFAULT '[]'::JSONB,
  time_taken INTEGER DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TIMER CONFIG TABLE (single row with id=1)
-- =============================================
CREATE TABLE IF NOT EXISTS timer_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  duration_minutes INTEGER DEFAULT 60,
  start_time TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default timer row
INSERT INTO timer_config (id, duration_minutes, is_active)
VALUES (1, 60, FALSE)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_participants_prn ON participants(prn);
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);
CREATE INDEX IF NOT EXISTS idx_submissions_participant ON submissions(participant_id);
CREATE INDEX IF NOT EXISTS idx_submissions_question ON submissions(question_id);

-- =============================================
-- Row Level Security (RLS) - Disable for service key usage
-- =============================================
ALTER TABLE participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE timer_config DISABLE ROW LEVEL SECURITY;

-- =============================================
-- Sample Questions (Optional - for testing)
-- =============================================
INSERT INTO questions (title, description, round_type, buggy_code, test_cases, marks, sample_input, sample_output)
VALUES 
(
  'Fix the Fibonacci',
  'The following code is supposed to print the nth Fibonacci number. Find and fix the bug.',
  'debug',
  'def fibonacci(n):\n    if n <= 0:\n        return 0\n    elif n == 1:\n        return 1\n    else:\n        return fibonacci(n-1) + fibonacci(n-3)  # Bug here!\n\nn = int(input())\nprint(fibonacci(n))',
  '[{"input": "5", "expected_output": "5", "marks": 5}, {"input": "10", "expected_output": "55", "marks": 5}]'::JSONB,
  10,
  '5',
  '5'
),
(
  'Sum of Array',
  'Write a program that reads N integers and prints their sum.\n\nInput: First line is N, next N lines are integers.\nOutput: Print the sum.',
  'blind',
  NULL,
  '[{"input": "3\n1\n2\n3", "expected_output": "6", "marks": 5}, {"input": "4\n10\n20\n30\n40", "expected_output": "100", "marks": 5}]'::JSONB,
  10,
  '3\n1\n2\n3',
  '6'
);
