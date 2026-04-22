import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMenu, FiX } from 'react-icons/fi';
import './Navbar.css';

export default function Navbar() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <div className="logo-icon"><span>N</span></div>
          <span className="logo-text">NutriConnect</span>
        </Link>

        <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
          <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link to="/nutritionists" className={`navbar-link ${location.pathname === '/nutritionists' ? 'active' : ''}`}>Nutritionists</Link>
          <Link to="/blog" className={`navbar-link ${location.pathname === '/blog' ? 'active' : ''}`}>Blog</Link>
          <a href="#features" className="navbar-link">Features</a>
          <a href="#pricing" className="navbar-link">Pricing</a>

          <div className="navbar-auth">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary btn-sm">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">Log In</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Sign Up Free</Link>
              </>
            )}
          </div>
        </div>

        <button className="navbar-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>
    </nav>
  );
}
