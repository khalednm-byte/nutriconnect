import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Component } from 'react';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

// Public Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Dashboard Pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Community from './pages/Community';
import MealPlanner from './pages/MealPlanner';
import Recipes from './pages/Recipes';
import Nutritionists from './pages/Nutritionists';
import NutritionistProfile from './pages/NutritionistProfile';
import Messages from './pages/Messages';
import Challenges from './pages/Challenges';
import Progress from './pages/Progress';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Groups from './pages/Groups';
import AdminDashboard from './pages/AdminDashboard';
import NutritionistApplication from './pages/NutritionistApplication';

// Error boundary — catches render crashes and shows the error
// instead of a blank screen. Remove in production or replace with
// a proper error UI.
class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', color: '#e8735a', fontFamily: 'monospace' }}>
          <h2>Page crashed</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '13px' }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
          <button onClick={() => this.setState({ error: null })} style={{ marginTop: '1rem' }}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
      </Route>

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Dashboard Routes (Protected) */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard"          element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
        <Route path="/profile"            element={<ErrorBoundary><Profile /></ErrorBoundary>} />
        <Route path="/community"          element={<ErrorBoundary><Community /></ErrorBoundary>} />
        <Route path="/groups"             element={<ErrorBoundary><Groups /></ErrorBoundary>} />
        <Route path="/meal-planner"       element={<ErrorBoundary><MealPlanner /></ErrorBoundary>} />
        <Route path="/recipes"            element={<ErrorBoundary><Recipes /></ErrorBoundary>} />
        <Route path="/nutritionists"      element={<ErrorBoundary><Nutritionists /></ErrorBoundary>} />
        <Route path="/nutritionists/:id"  element={<ErrorBoundary><NutritionistProfile /></ErrorBoundary>} />
        <Route path="/messages"           element={<ErrorBoundary><Messages /></ErrorBoundary>} />
        <Route path="/challenges"         element={<ErrorBoundary><Challenges /></ErrorBoundary>} />
        <Route path="/progress"           element={<ErrorBoundary><Progress /></ErrorBoundary>} />
        <Route path="/blog"               element={<ErrorBoundary><Blog /></ErrorBoundary>} />
        <Route path="/blog/:slug"         element={<ErrorBoundary><BlogPost /></ErrorBoundary>} />
        <Route path="/admin"              element={<ErrorBoundary><AdminDashboard /></ErrorBoundary>} />
        <Route path="/apply-nutritionist" element={<ErrorBoundary><NutritionistApplication /></ErrorBoundary>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
