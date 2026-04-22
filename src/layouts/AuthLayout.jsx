import { Outlet, Link } from 'react-router-dom';
import './AuthLayout.css';

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-bg-effects">
        <div className="auth-orb auth-orb-1"></div>
        <div className="auth-orb auth-orb-2"></div>
        <div className="auth-orb auth-orb-3"></div>
      </div>
      <Link to="/" className="auth-back-logo">
        <div className="logo-icon"><span>N</span></div>
        <span className="logo-text">NutriConnect</span>
      </Link>
      <div className="auth-card-wrapper">
        <Outlet />
      </div>
    </div>
  );
}
