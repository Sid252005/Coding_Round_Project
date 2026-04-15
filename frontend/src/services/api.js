import axios from 'axios';

// Base URL: env var for prod, Vite proxy for dev
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000, // 30s for code execution
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT for admin ─────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 ─────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// ════════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════════
export const adminLogin = (email, password) =>
  api.post('/auth/admin/login', { email, password });

export const participantLogin = (name, prn) =>
  api.post('/auth/participant/login', { name, prn });

// ════════════════════════════════════════════════════════════
//  QUESTIONS
// ════════════════════════════════════════════════════════════
export const getQuestionsAdmin  = ()            => api.get('/questions');
export const getQuestionsParticipant = ()       => api.get('/questions/participant');
export const getQuestion        = (id)          => api.get(`/questions/${id}`);
export const createQuestion     = (data)        => api.post('/questions', data);
export const updateQuestion     = (id, data)    => api.put(`/questions/${id}`, data);
export const deleteQuestion     = (id)          => api.delete(`/questions/${id}`);

// ════════════════════════════════════════════════════════════
//  CODE EXECUTION
// ════════════════════════════════════════════════════════════
export const runCode = (payload) => api.post('/run-code', payload);

// ════════════════════════════════════════════════════════════
//  SUBMISSIONS
// ════════════════════════════════════════════════════════════
export const autoSaveCode     = (payload) => api.post('/submissions/autosave', payload);
export const startTest        = (participant_id) => api.put('/submissions/start', { participant_id });
export const finalSubmit      = (participant_id) => api.post('/submissions/final-submit', { participant_id });

// ════════════════════════════════════════════════════════════
//  ADMIN
// ════════════════════════════════════════════════════════════
export const getAdminStats         = ()     => api.get('/admin/stats');
export const getParticipants       = ()     => api.get('/admin/participants');
export const getLeaderboard        = ()     => api.get('/admin/leaderboard');
export const getAllSubmissions      = ()     => api.get('/admin/submissions');
export const getParticipantSubmissions = (id) => api.get(`/admin/submissions/${id}`);
export const deleteParticipant     = (id)   => api.delete(`/admin/participants/${id}`);

// ════════════════════════════════════════════════════════════
//  TIMER
// ════════════════════════════════════════════════════════════
export const getTimer     = ()       => api.get('/timer');
export const setTimer     = (mins)   => api.post('/timer/set', { duration_minutes: mins });
export const startTimer   = ()       => api.post('/timer/start');
export const stopTimer    = ()       => api.post('/timer/stop');

export default api;
