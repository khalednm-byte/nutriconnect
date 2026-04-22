import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import './DashboardLayout.css';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/community': 'Community',
  '/meal-planner': 'Meal Planner',
  '/recipes': 'Recipes',
  '/nutritionists': 'Nutritionists',
  '/messages': 'Messages',
  '/progress': 'Progress',
  '/challenges': 'Challenges',
  '/blog': 'Blog',
  '/profile': 'My Profile',
  '/admin': 'Admin Dashboard',
};

export default function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const title = pageTitles[location.pathname] || 'NutriConnect';

  return (
    <div className={`dashboard-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="dashboard-content">
        <TopBar
          title={title}
          onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
