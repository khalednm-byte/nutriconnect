import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './PublicLayout.css';

export default function PublicLayout() {
  return (
    <div className="public-layout">
      <Navbar />
      <main className="public-main">
        <Outlet />
      </main>
      <footer className="public-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="logo-icon"><span>N</span></div>
                <span className="logo-text">NutriConnect</span>
              </div>
              <p className="footer-tagline">Your personalized nutrition consultation and wellness community platform.</p>
              <div className="footer-social">
                <a href="#" aria-label="Twitter">𝕏</a>
                <a href="#" aria-label="Instagram">📷</a>
                <a href="#" aria-label="YouTube">▶️</a>
              </div>
            </div>
            <div className="footer-col">
              <h4>Platform</h4>
              <a href="#">Find Nutritionists</a>
              <a href="#">Meal Planner</a>
              <a href="#">Community</a>
              <a href="#">Challenges</a>
            </div>
            <div className="footer-col">
              <h4>Resources</h4>
              <a href="#">Blog</a>
              <a href="#">Recipes</a>
              <a href="#">Help Center</a>
              <a href="#">API Docs</a>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Careers</a>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 NutriConnect. All rights reserved.</p>
            <p>Made with 💚 for healthier lives</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
