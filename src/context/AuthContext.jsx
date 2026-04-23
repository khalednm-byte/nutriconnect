import { createContext, useContext, useState, useCallback } from 'react';

// Hardcoded here to avoid Vite module caching issues during development.
// When the backend is built, login() will be replaced with an API call
// and this object goes away entirely.
const devUser = {
  id: 'u1',
  name: 'Alex Morgan',
  email: 'alex@nutriconnect.com',
  avatar: null,
  role: 'admin',
  subscription: 'premium',
  assignedNutritionist: { id: 'n1', userId: 'nu1', name: 'Dr. Emily Roberts' },
  profile: {
    bio: 'Fitness enthusiast on a journey to better health 💪',
    goals: ['weight_loss', 'muscle_gain'],
    dietPreferences: ['high_protein', 'low_carb'],
    allergies: ['gluten'],
    currentWeight: 78,
    targetWeight: 72,
    height: 178,
    age: 28,
  },
  stats: {
    followers: 156,
    following: 89,
    postsCount: 42,
    streak: 14,
    badges: ['early_adopter', '7_day_streak', 'first_post', 'recipe_master'],
    points: 2480,
    level: 12,
  },
  notifications: 5,
  createdAt: '2025-11-15T08:00:00Z',
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = useCallback((email, password) => {
    setUser(devUser);
    setIsAuthenticated(true);
    return true;
  }, []);

  const register = useCallback((data) => {
    setUser({ ...devUser, ...data });
    setIsAuthenticated(true);
    return true;
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
