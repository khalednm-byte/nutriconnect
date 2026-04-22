import { createContext, useContext, useState, useCallback } from 'react';
import { currentUser } from '../data/users';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = useCallback(async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      if (res.data.success) {
        setUser(res.data.user);
        setIsAuthenticated(true);
        // We could store the token in localStorage here: localStorage.setItem('token', res.data.token)
        return true;
      }
    } catch (error) {
      console.error('Login failed:', error.response?.data?.error || error.message);
      return false;
    }
  }, []);

  const register = useCallback(async (data) => {
    try {
      const res = await axios.post('/api/auth/register', data);
      if (res.data.success) {
        setUser(res.data.user);
        setIsAuthenticated(true);
        return true;
      }
    } catch (error) {
      console.error('Registration failed:', error.response?.data?.error || error.message);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const value = { user, isAuthenticated, login, register, logout };

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
