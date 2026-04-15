import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin]       = useState(null);
  const [participant, setParticipant] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    // Restore sessions from localStorage
    const adminToken = localStorage.getItem('admin_token');
    const savedParticipant = localStorage.getItem('participant');

    if (adminToken) {
      setAdmin({ token: adminToken });
    }

    if (savedParticipant) {
      try {
        setParticipant(JSON.parse(savedParticipant));
      } catch (_) {
        localStorage.removeItem('participant');
      }
    }

    setLoading(false);
  }, []);

  // Admin
  const loginAdmin = (token) => {
    localStorage.setItem('admin_token', token);
    setAdmin({ token });
  };

  const logoutAdmin = () => {
    localStorage.removeItem('admin_token');
    setAdmin(null);
  };

  // Participant
  const loginParticipant = (participantData) => {
    localStorage.setItem('participant', JSON.stringify(participantData));
    setParticipant(participantData);
  };

  const updateParticipant = (updates) => {
    const updated = { ...participant, ...updates };
    localStorage.setItem('participant', JSON.stringify(updated));
    setParticipant(updated);
  };

  const logoutParticipant = () => {
    localStorage.removeItem('participant');
    setParticipant(null);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        participant,
        loading,
        loginAdmin,
        logoutAdmin,
        loginParticipant,
        updateParticipant,
        logoutParticipant,
        isAdmin: !!admin,
        isParticipant: !!participant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
