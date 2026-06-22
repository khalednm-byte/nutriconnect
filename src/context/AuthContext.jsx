import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authAPI, setToken, clearToken, getToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]                   = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading]             = useState(true); // true while restoring session

  // ── On app load, try to restore session from in-memory token ─────────────
  // If the token is still in memory (e.g. navigating between pages),
  // fetch the current user so the session persists across React re-renders.
  useEffect(() => {
    const restore = async () => {
      const token = getToken(); // reads from localStorage now
      if (!token) { setLoading(false); return; }
      try {
        const { user } = await authAPI.me();
        setUser(user);
        setIsAuthenticated(true);
      } catch {
        // Token expired or invalid — clear it and go to login
        clearToken();
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  // Returns { success: true } or { success: false, error: 'message' }
  // so the Login page can show the right error without crashing.
  const login = useCallback(async (email, password) => {
    try {
      const { token, user } = await authAPI.login(email, password);
      setToken(token);
      setUser(user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (name, email, password) => {
    try {
      const { token, user } = await authAPI.register(name, email, password);
      setToken(token);
      setUser(user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // ── Update local user state (e.g. after profile edit) ────────────────────
  const updateUser = useCallback((updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  }, []);

  const value = { user, isAuthenticated, loading, login, register, logout, updateUser };

  // Don't render children until we've tried to restore the session.
  // This prevents a flash of the login page on refresh.
  if (loading) return null;

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
