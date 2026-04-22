import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInitials, getAvatarColor } from '../data/users';
import {
  FiHome, FiUsers, FiMessageSquare, FiCalendar, FiBook,
  FiAward, FiTrendingUp, FiSettings, FiLogOut, FiMenu,
  FiX, FiSearch, FiBell, FiUser, FiGrid, FiBookOpen,
  FiShield, FiChevronLeft,
} from 'react-icons/fi';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', icon: FiHome, label: 'Dashboard' },
  { path: '/community', icon: FiUsers, label: 'Community' },
  { path: '/meal-planner', icon: FiCalendar, label: 'Meal Planner' },
  { path: '/recipes', icon: FiBook, label: 'Recipes' },
  { path: '/nutritionists', icon: FiGrid, label: 'Nutritionists' },
  { path: '/messages', icon: FiMessageSquare, label: 'Messages', badge: 3 },
  { path: '/progress', icon: FiTrendingUp, label: 'Progress' },
  { path: '/challenges', icon: FiAward, label: 'Challenges' },
  { path: '/blog', icon: FiBookOpen, label: 'Blog' },
];

const bottomItems = [
  { path: '/profile', icon: FiUser, label: 'Profile' },
  { path: '/admin', icon: FiShield, label: 'Admin' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <Link to="/dashboard" className="sidebar-logo">
            <div className="logo-icon">
              <span>N</span>
            </div>
            {!collapsed && <span className="logo-text">NutriConnect</span>}
          </Link>
          <button className="sidebar-toggle" onClick={onToggle}>
            <FiChevronLeft />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            {!collapsed && <span className="nav-section-label">Main Menu</span>}
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="nav-icon" />
                {!collapsed && <span className="nav-label">{item.label}</span>}
                {!collapsed && item.badge && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </Link>
            ))}
          </div>

          <div className="nav-section">
            {!collapsed && <span className="nav-section-label">Account</span>}
            {bottomItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="nav-icon" />
                {!collapsed && <span className="nav-label">{item.label}</span>}
              </Link>
            ))}
            <button className="nav-item logout-btn" onClick={handleLogout}>
              <FiLogOut className="nav-icon" />
              {!collapsed && <span className="nav-label">Logout</span>}
            </button>
          </div>
        </nav>

        {!collapsed && user && (
          <div className="sidebar-user">
            <div className="avatar avatar-sm" style={{ background: getAvatarColor(user.id) }}>
              {getInitials(user.name)}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user.name}</span>
              <span className="sidebar-user-plan">{user.subscription} plan</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
