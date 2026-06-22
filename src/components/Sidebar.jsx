import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInitials, getAvatarColor } from '../data/users';
import {
  FiHome, FiUsers, FiMessageSquare, FiCalendar, FiBook,
  FiAward, FiTrendingUp, FiLogOut, FiUser, FiGrid,
  FiBookOpen, FiShield,
} from 'react-icons/fi';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard',    icon: FiHome,          label: 'Dashboard' },
  { path: '/community',    icon: FiUsers,          label: 'Community' },
  { path: '/meal-planner', icon: FiCalendar,       label: 'Meal Planner' },
  { path: '/recipes',      icon: FiBook,           label: 'Recipes' },
  { path: '/nutritionists',icon: FiGrid,           label: 'Nutritionists' },
  { path: '/messages',     icon: FiMessageSquare,  label: 'Messages', badge: 3 },
  { path: '/progress',     icon: FiTrendingUp,     label: 'Progress' },
  { path: '/challenges',   icon: FiAward,          label: 'Challenges' },
  { path: '/blog',         icon: FiBookOpen,       label: 'Blog' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <aside className="sidebar">
      {/* Logo — no toggle button */}
      <div className="sidebar-header">
        <Link to="/dashboard" className="sidebar-logo">
          <div className="logo-icon"><span>N</span></div>
          <span className="logo-text">NutriConnect</span>
        </Link>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <span className="nav-section-label">Main Menu</span>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <item.icon className="nav-icon" />
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </Link>
          ))}
        </div>

        <div className="nav-section">
          <span className="nav-section-label">Account</span>
          <Link
            to="/profile"
            className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
          >
            <FiUser className="nav-icon" />
            <span className="nav-label">Profile</span>
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className={`nav-item ${location.pathname === '/admin' ? 'active' : ''}`}
            >
              <FiShield className="nav-icon" />
              <span className="nav-label">Admin</span>
            </Link>
          )}
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <FiLogOut className="nav-icon" />
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </nav>

      {user && (
        <div className="sidebar-user">
          <div className="avatar avatar-sm" style={{ background: getAvatarColor(user._id) }}>
            {getInitials(user.name)}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user.name}</span>
            <span className="sidebar-user-plan">{user.subscription} plan</span>
          </div>
        </div>
      )}
    </aside>
  );
}
