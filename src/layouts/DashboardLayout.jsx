import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import './DashboardLayout.css';

const pageTitles = {
  '/dashboard':          'Dashboard',
  '/community':          'Community',
  '/meal-planner':       'Meal Planner',
  '/recipes':            'Recipes',
  '/nutritionists':      'Nutritionists',
  '/messages':           'Messages',
  '/progress':           'Progress',
  '/challenges':         'Challenges',
  '/blog':               'Blog',
  '/profile':            'My Profile',
  '/admin':              'Admin Dashboard',
  '/apply-nutritionist': 'Become a Nutritionist',
};

export default function DashboardLayout() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'NutriConnect';

  return (
    // No sidebarCollapsed state needed anymore — sidebar is always expanded
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content">
        <TopBar title={title} />
        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
