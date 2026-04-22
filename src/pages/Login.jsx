import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('alex@nutriconnect.com');
  const [password, setPassword] = useState('password');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login(email, password);
      navigate('/dashboard');
    }, 600);
  };

  return (
    <div className="auth-card">
      <h1>Welcome Back</h1>
      <p className="auth-subtitle">Sign in to continue your nutrition journey</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Email</label>
          <div className="input-with-icon">
            <FiMail className="input-icon" />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label>Password</label>
          <div className="input-with-icon">
            <FiLock className="input-icon" />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="input-icon"
              style={{ right: '14px', left: 'auto', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text-muted)', position: 'absolute' }}
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked /> Remember me
          </label>
          <a href="#" style={{ fontSize: '0.875rem', color: 'var(--primary-light)' }}>Forgot password?</a>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="divider-text" style={{ margin: '24px 0 16px' }}>or continue with</div>

      <div className="auth-social-buttons">
        <button className="auth-social-btn">🇬 Google</button>
        <button className="auth-social-btn">🍎 Apple</button>
      </div>

      <p className="auth-footer">
        Don't have an account? <Link to="/register">Sign up free</Link>
      </p>
    </div>
  );
}
