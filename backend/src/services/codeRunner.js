/**
 * codeRunner.js
 * Core service for executing participant code in a sandboxed environment.
 *
 * Supports: Python, C++, C, Java
 * Security: Dangerous pattern blocking, execution timeout, temp file isolation
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

// ─── SECURITY: Block dangerous operations ─────────────────────────────────────
const DANGEROUS_PATTERNS = [
  // Python: system calls, file system, network, code injection
  'import os', 'import sys', 'import subprocess', 'import socket',
  'import urllib', 'import requests', 'import shutil',
  '__import__', 'open(', 'eval(', 'exec(', 'compile(',
  'os.system', 'os.popen', 'os.remove', 'os.rmdir',

  // C/C++: system calls, file IO, network
  'system(', 'popen(', 'fopen(', 'fwrite(', 'remove(',
  '#include <sys/', '#include <unistd',
  'fork(', 'exec(', 'socket(',

  // Java: runtime execution, file IO, network
  'Runtime.getRuntime', 'ProcessBuilder', 'new File(',
  'FileWriter', 'FileReader', 'new Socket(',

  // Shell injection attempts
  'rm -rf', 'del /f', 'format c:', '> /dev/', '| bash', '| sh',
];

// ─── LANGUAGE CONFIG ───────────────────────────────────────────────────────────
const LANGUAGES = {
  python: {
    extension: 'py',
    // No compile step for Python
    compile: null,
    // Run python with the temp file
    getRunCmd: (filePath) => `python "${filePath}"`,
  },
  cpp: {
    extension: 'cpp',
    getCompileCmd: (srcFile, outFile) => `g++ "${srcFile}" -o "${outFile}" -std=c++17`,
    getRunCmd: (outFile) => `"${outFile}"`,
  },
  c: {
    extension: 'c',
    getCompileCmd: (srcFile, outFile) => `gcc "${srcFile}" -o "${outFile}"`,
    getRunCmd: (outFile) => `"${outFile}"`,
  },
  java: {
    extension: 'java',
    // javac requires the file to match the public class name
    getCompileCmd: (srcFile) => `javac "${srcFile}"`,
    // Run from the temp directory with class name Main
    getRunCmd: (tmpDir) => `java -cp "${tmpDir}" Main`,
  },
};

const EXECUTION_TIMEOUT_MS = 5000;   // 5 seconds per test case
const COMPILE_TIMEOUT_MS  = 15000;  // 15 seconds for compilation

// ─── HELPER: Execute command with timeout  ────────────────────────────────────
/**
 * Wraps child_process.exec in a Promise with stdin support and timeout.
 *
 * @param {string} command  - Shell command to run
 * @param {string} stdin    - Optional stdin input for the process
 * @param {number} timeout  - Timeout in ms (default: EXECUTION_TIMEOUT_MS)
 * @returns {Promise<string>} stdout output of the command
 */
function execWithTimeout(command, stdin = '', timeout = EXECUTION_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const child = exec(
      command,
      { timeout, killSignal: 'SIGKILL' },
      (error, stdout, stderr) => {
        if (error) {
          if (error.killed || error.signal === 'SIGKILL') {
            return reject(new Error('Time Limit Exceeded: Your code ran too long (5s limit)'));
          }
          // Return stderr as the error message (compilation errors, runtime errors)
          return reject(new Error(stderr || error.message));
        }
        resolve(stdout);
      }
    );

    // Feed stdin to the process if provided
    if (stdin && child.stdin) {
      child.stdin.write(stdin);
      child.stdin.end();
    }
  });
}

// ─── HELPER: Clean up temp directory ──────────────────────────────────────────
function cleanup(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (_) {
    // Ignore cleanup errors
  }
}

// ─── HELPER: Check for dangerous code patterns ────────────────────────────────
function containsDangerousCode(code) {
  const lower = code.toLowerCase();
  return DANGEROUS_PATTERNS.some((pattern) =>
    lower.includes(pattern.toLowerCase())
  );
}

// ─── MAIN EXPORT: runCode ─────────────────────────────────────────────────────
/**
 * Runs participant code against provided test cases.
 *
 * @param {string} code       - Source code from participant
 * @param {string} language   - 'python' | 'cpp' | 'c' | 'java'
 * @param {Array}  testCases  - [{ input, expected_output, marks }]
 *
 * @returns {Object} { score, totalMarks, results, compilationError? }
 */
async function runCode(code, language, testCases = []) {
  // ── Security check ─────────────────────────────────────────────────────────
  if (containsDangerousCode(code)) {
    return {
      score: 0,
      totalMarks: testCases.reduce((sum, tc) => sum + (tc.marks || 10), 0),
      compilationError: '⚠️ Security Violation: Your code contains restricted operations.',
      results: testCases.map((tc) => ({
        passed: false,
        input: tc.input,
        expected: tc.expected_output,
        got: '',
        error: 'Blocked by security filter',
      })),
    };
  }

  const langConfig = LANGUAGES[language];
  if (!langConfig) {
    return {
      score: 0,
      totalMarks: 0,
      compilationError: `Unsupported language: ${language}`,
      results: [],
    };
  }

  // ── Create isolated temp directory ─────────────────────────────────────────
  const tmpDir = path.join(os.tmpdir(), `dhcc_${uuidv4()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  // For Java, class must be named "Main"
  const baseName   = language === 'java' ? 'Main' : 'solution';
  const srcFile    = path.join(tmpDir, `${baseName}.${langConfig.extension}`);
  const outFile    = path.join(tmpDir, baseName); // for C/C++ executable

  // Fix Java class name to always be "Main" regardless of what participant wrote
  let finalCode = code;
  if (language === 'java') {
    finalCode = code.replace(/public\s+class\s+\w+/g, 'public class Main');
  }

  fs.writeFileSync(srcFile, finalCode, 'utf8');

  const totalMarks = testCases.reduce((sum, tc) => sum + (tc.marks || 10), 0);

  // ── Compilation step (C, C++, Java) ────────────────────────────────────────
  if (langConfig.getCompileCmd) {
    try {
      const compileCmd = language === 'java'
        ? langConfig.getCompileCmd(srcFile)
        : langConfig.getCompileCmd(srcFile, outFile);

      await execWithTimeout(compileCmd, '', COMPILE_TIMEOUT_MS);
    } catch (err) {
      cleanup(tmpDir);
      return {
        score: 0,
        totalMarks,
        compilationError: `Compilation Error:\n${err.message}`,
        results: testCases.map((tc) => ({
          passed: false,
          input: tc.input,
          expected: tc.expected_output,
          got: '',
          error: 'Compilation Error',
        })),
      };
    }
  }

  // ── Run against each test case ─────────────────────────────────────────────
  const results = [];
  let score = 0;

  for (const tc of testCases) {
    const tcMarks = tc.marks || 10;
    let runCmd;

    if (language === 'java') {
      runCmd = langConfig.getRunCmd(tmpDir);
    } else if (language === 'python') {
      runCmd = langConfig.getRunCmd(srcFile);
    } else {
      // C or C++ — run the compiled binary
      runCmd = langConfig.getRunCmd(outFile);
    }

    try {
      const rawOutput = await execWithTimeout(runCmd, tc.input || '', EXECUTION_TIMEOUT_MS);
      const actualOutput   = rawOutput.trim().replace(/\r\n/g, '\n');
      const expectedOutput = (tc.expected_output || '').trim().replace(/\r\n/g, '\n');

      const passed = actualOutput === expectedOutput;

      if (passed) score += tcMarks;

      results.push({
        passed,
        input: tc.input,
        expected: expectedOutput,
        got: actualOutput,
        marks_awarded: passed ? tcMarks : 0,
      });
    } catch (err) {
      results.push({
        passed: false,
        input: tc.input,
        expected: tc.expected_output,
        got: '',
        error: err.message,
        marks_awarded: 0,
      });
    }
  }

  cleanup(tmpDir);

  return { score, totalMarks, results };
}

module.exports = { runCode };
