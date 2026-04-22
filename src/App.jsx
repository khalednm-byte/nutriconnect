import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

// Public Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

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
import AdminDashboard from './pages/AdminDashboard';

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
      </Route>

      {/* Dashboard Routes (Protected) */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/community" element={<Community />} />
        <Route path="/meal-planner" element={<MealPlanner />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/nutritionists" element={<Nutritionists />} />
        <Route path="/nutritionists/:id" element={<NutritionistProfile />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
