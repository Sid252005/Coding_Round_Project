import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { AdminRoute, ParticipantRoute } from './components/ProtectedRoute';

// Participant Pages
import ParticipantLogin from './pages/participant/ParticipantLogin';
import Welcome          from './pages/participant/Welcome';
import TestArena        from './pages/participant/TestArena';
import Submitted        from './pages/participant/Submitted';

// Admin Pages
import AdminLogin   from './pages/admin/AdminLogin';
import Dashboard, { AdminLayout } from './pages/admin/Dashboard';
import QuestionManager  from './pages/admin/QuestionManager';
import TimerControl     from './pages/admin/TimerControl';
import LiveMonitor      from './pages/admin/LiveMonitor';
import Leaderboard      from './pages/admin/Leaderboard';
import SubmissionViewer from './pages/admin/SubmissionViewer';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* ── Participant Routes ─────────────────── */}
            <Route path="/"           element={<ParticipantLogin />} />
            <Route path="/welcome"    element={<ParticipantRoute><Welcome /></ParticipantRoute>} />
            <Route path="/test"       element={<ParticipantRoute><TestArena /></ParticipantRoute>} />
            <Route path="/submitted"  element={<ParticipantRoute><Submitted /></ParticipantRoute>} />

            {/* ── Admin Routes ───────────────────────── */}
            <Route path="/admin/login" element={<AdminLogin />} />

            <Route
              path="/admin"
              element={<AdminRoute><AdminLayout /></AdminRoute>}
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard"   element={<Dashboard />} />
              <Route path="questions"   element={<QuestionManager />} />
              <Route path="timer"       element={<TimerControl />} />
              <Route path="monitor"     element={<LiveMonitor />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="submissions" element={<SubmissionViewer />} />
            </Route>

            {/* ── 404 Fallback ────────────────────────── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
