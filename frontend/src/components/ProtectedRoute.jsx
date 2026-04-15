import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Loading screen while auth restores from localStorage
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>Casting spells...</p>
    </div>
  );
}

export function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return isAdmin ? children : <Navigate to="/admin/login" replace />;
}

export function ParticipantRoute({ children }) {
  const { isParticipant, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return isParticipant ? children : <Navigate to="/" replace />;
}
