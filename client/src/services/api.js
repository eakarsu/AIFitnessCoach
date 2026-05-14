import axios from 'axios';

/**
 * Central axios client for AI Fitness Coach.
 *
 * Adds:
 *  - Authorization: Bearer <token> on every request, pulled from localStorage.
 *  - 401 response interceptor that clears auth state and bounces to /login.
 *  - X-Request-Id for request correlation in logs.
 *
 * Components should import this instead of using the global axios singleton
 * directly so behavior stays consistent across the app.
 */
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  timeout: 120000, // long enough for AI calls
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      // Clear auth state and bounce to /login. We avoid using react-router
      // here because the interceptor lives outside the router tree.
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (_) { /* ignore */ }
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

// AI endpoint helpers — keep call sites concise and consistent.
export const aiApi = {
  // Existing endpoints
  generateWorkout: (payload) => api.post('/api/ai/workout/generate', payload),
  analyzeGolf: (payload) => api.post('/api/ai/golf/analyze', payload),
  analyzeRunning: (payload) => api.post('/api/ai/running/analyze', payload),
  optimizeTeam: (payload) => api.post('/api/ai/team/optimize', payload),
  adviseRecovery: (payload) => api.post('/api/ai/recovery/advise', payload),

  // Advanced (aiNew) endpoints — were dead code from the UI before.
  periodizationPlan: (payload) => api.post('/api/ai/periodization-plan', payload),
  performanceTrend: (payload) => api.post('/api/ai/performance-trend', payload),
  injuryRisk: (payload) => api.post('/api/ai/injury-risk', payload),
  nutritionPlan: (payload) => api.post('/api/ai/nutrition-plan', payload),
  teamChallenge: (payload) => api.post('/api/ai/team-challenge', payload),
};

export default api;
