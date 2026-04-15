/**
 * server.js
 * Main Express server entry point for Deathly Hallows Coding Challenge.
 *
 * Responsibilities:
 * - Express app setup with CORS, JSON parsing
 * - Socket.IO for real-time admin monitoring + timer sync
 * - Mount all API routes
 * - Global error handler
 */

require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

// ─── App Setup ────────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ─── CORS Config ─────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173', // Vite dev server
  'http://localhost:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  })
);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Socket.IO Setup ─────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

// Make io available to routes via req.app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });

  // Admin joins dedicated room for targeted broadcasts
  socket.on('join-admin', () => {
    socket.join('admin');
    console.log(`👑 Admin joined room`);
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes         = require('./routes/auth');
const adminRoutes        = require('./routes/admin');
const questionsRoutes    = require('./routes/questions');
const submissionsRoutes  = require('./routes/submissions');
const timerRoutes        = require('./routes/timer');

app.use('/api/auth',        authRoutes);
app.use('/api/admin',       adminRoutes);
app.use('/api/questions',   questionsRoutes);
app.use('/api',             submissionsRoutes); // /api/run-code, /api/submissions/*
app.use('/api/timer',       timerRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ─── Serve React Frontend (production) ────────────────────────────────────────
// In Docker, the frontend build is copied to ./public (relative to server.js)
// This serves the React app for ALL non-API routes
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  const frontendBuild = path.join(__dirname, '../../public');

  app.use(express.static(frontendBuild));

  // React Router: return index.html for any non-API route
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
}

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`\n🪄 Deathly Hallows Coding Challenge Backend`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\nℹ️  Admin email: ${process.env.ADMIN_EMAIL}`);
});

module.exports = { app, server, io };
