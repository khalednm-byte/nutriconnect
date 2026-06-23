// ─── API Service ──────────────────────────────────────────────────────────────
// All HTTP calls to the backend go through here.
// The base URL points to our Express server.
// The token is stored in memory (not localStorage) for security.

const BASE_URL = 'http://localhost:5000/api';

// Token persisted in localStorage so it survives page refreshes.
// NOTE: for production, httpOnly cookies are more secure.
// For a local dev/portfolio project, localStorage is acceptable.
const TOKEN_KEY = 'nutriconnect_token';

export const setToken   = (token) => { localStorage.setItem(TOKEN_KEY, token); };
export const getToken   = ()      => localStorage.getItem(TOKEN_KEY);
export const clearToken = ()      => { localStorage.removeItem(TOKEN_KEY); };

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const data = await res.json();

  // If the server returns an error, throw it so callers can catch it
  if (!res.ok) throw new Error(data.message || 'Something went wrong');

  return data;
}

// Convenience methods
const api = {
  get:    (path)         => request('GET',    path),
  post:   (path, body)   => request('POST',   path, body),
  put:    (path, body)   => request('PUT',    path, body),
  delete: (path)         => request('DELETE', path),
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (name, email, password) =>
    api.post('/auth/register', { name, email, password }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) =>
    api.post('/auth/reset-password', { token, password }),
  me: () =>
    api.get('/auth/me'),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersAPI = {
  search:          (q)      => api.get(`/users/search?q=${encodeURIComponent(q)}`),
  getProfile:      (id)     => api.get(`/users/${id}`),
  updateProfile:   (data)   => api.put('/users/profile', data),
  getNutritionists:()       => api.get('/users/nutritionists'),
  getNotifications:()       => api.get('/users/notifications'),
  markAllRead:     ()       => api.put('/users/notifications/read'),
};

// ── Recipes ───────────────────────────────────────────────────────────────────
export const recipesAPI = {
  getAll:   (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/recipes${query ? '?' + query : ''}`);
  },
  getById:  (id)          => api.get(`/recipes/${id}`),
  create:   (data)        => api.post('/recipes', data),
  update:   (id, data)    => api.put(`/recipes/${id}`, data),
  delete:   (id)          => api.delete(`/recipes/${id}`),
};

// ── Posts ─────────────────────────────────────────────────────────────────────
export const postsAPI = {
  getAll:        (type)       => api.get(`/posts${type ? '?type=' + type : ''}`),
  create:        (data)       => api.post('/posts', data),
  delete:        (id)         => api.delete(`/posts/${id}`),
  toggleLike:    (id)         => api.post(`/posts/${id}/like`),
  addComment:    (id, text)   => api.post(`/posts/${id}/comments`, { text }),
  deleteComment: (id, cId)    => api.delete(`/posts/${id}/comments/${cId}`),
};

// ── Messages ──────────────────────────────────────────────────────────────────
export const messagesAPI = {
  getUnreadCount:    ()              => api.get('/messages/unread-count'),
  getConversations:  ()              => api.get('/messages/conversations'),
  getMessages:       (convId)        => api.get(`/messages/conversations/${convId}`),
  startConversation: (participantId) => api.post('/messages/conversations', { participantId }),
  sendMessage:       (convId, text, type) =>
    api.post(`/messages/conversations/${convId}/messages`, { text, type }),
};

// ── Setup (one-time admin bootstrap) ────────────────────────────────────────────
export const setupAPI = {
  getStatus:      ()  => api.get('/setup/status'),
  bootstrapAdmin: ()  => api.post('/setup/bootstrap-admin'),
};

// ── Groups ────────────────────────────────────────────────────────────────────
export const groupsAPI = {
  getMine:        ()             => api.get('/groups'),       // nutritionist's own groups
  getMyGroup:     ()             => api.get('/groups/my-group'), // patient's group
  join:           (inviteCode)   => api.post('/groups/join', { inviteCode }),
  getLeaderboard: (id)           => api.get(`/groups/${id}/leaderboard`),
  create:         (data)         => api.post('/groups', data),
  update:         (id, data)     => api.put(`/groups/${id}`, data),
  delete:         (id)           => api.delete(`/groups/${id}`),
  addMember:      (id, userId)   => api.post(`/groups/${id}/members`, { userId }),
  removeMember:   (id, userId)   => api.delete(`/groups/${id}/members/${userId}`),
  assignChallenge:(id, challengeId) => api.post(`/groups/${id}/challenges`, { challengeId }),
  addBadge:       (id, data)     => api.post(`/groups/${id}/badges`, data),
};

// ── Challenge Definitions (admin/nutritionist creation) ────────────────────────
export const challengeDefinitionsAPI = {
  getAll:      ()         => api.get('/challenge-definitions'),
  create:      (data)     => api.post('/challenge-definitions', data),
  update:      (id, data) => api.put(`/challenge-definitions/${id}`, data),
  delete:      (id)       => api.delete(`/challenge-definitions/${id}`),
  getMyPatients: ()       => api.get('/challenge-definitions/my-patients'),
};

// ── Challenges ────────────────────────────────────────────────────────────────
export const challengesAPI = {
  getJoined: ()           => api.get('/challenges'),
  join:      (data)       => api.post('/challenges/join', data),
  checkIn:   (id)         => api.post(`/challenges/${id}/checkin`),
  leave:     (id)         => api.delete(`/challenges/${id}`),
};

// ── Progress ──────────────────────────────────────────────────────────────────
export const progressAPI = {
  get:          ()                         => api.get('/progress'),
  logWeight:    (weight, date, notes, waterIntake) =>
    api.post('/progress/weight', { weight, date, notes, waterIntake }),
  toggleHabit:  (habitName, completed)     =>
    api.put('/progress/habits', { habitName, completed }),
};

// ── Meal Plan ─────────────────────────────────────────────────────────────────
export const mealPlanAPI = {
  get:              ()           => api.get('/mealplan'),
  save:             (plan)       => api.put('/mealplan', { plan }),
  getPatientPlan:   (patientId)  => api.get(`/mealplan/patient/${patientId}`),
  savePatientPlan:  (patientId, plan) => api.put(`/mealplan/patient/${patientId}`, { plan }),
  submitSwapRequest:(data)       => api.post('/mealplan/swap-requests', data),
  getSwapRequests:  ()           => api.get('/mealplan/swap-requests'),
  getIncomingSwapRequests: ()    => api.get('/mealplan/swap-requests/incoming'),
  reviewSwapRequest:(id, status, reviewNotes) =>
    api.put(`/mealplan/swap-requests/${id}`, { status, reviewNotes }),
};

// ── Applications ──────────────────────────────────────────────────────────────
export const applicationsAPI = {
  submit:   (data)         => api.post('/applications', data),
  getAll:   (status)       => api.get(`/applications${status ? '?status=' + status : ''}`),
  review:   (id, status, reviewNotes) =>
    api.put(`/applications/${id}`, { status, reviewNotes }),
};

export default api;
