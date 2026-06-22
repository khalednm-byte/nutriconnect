import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';
import './Auth.css';

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password)  { setError('All fields are required.'); return; }
    if (password.length < 6)           { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm)          { setError('Passwords do not match.'); return; }

    setLoading(true);
    const result = await register(name, email, password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon"><span>N</span></div>
          <span>NutriConnect</span>
        </div>

        <h2>Create your account</h2>
        <p className="auth-subtitle">Start your nutrition journey today</p>

        {error && (
          <div className="auth-error">
            <FiAlertCircle /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-field">
            <span><FiUser /> Full Name</span>
            <input
              type="text"
              placeholder="Alex Morgan"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </label>
          <label className="auth-field">
            <span><FiMail /> Email</span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </label>
          <label className="auth-field">
            <span><FiLock /> Password</span>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </label>
          <label className="auth-field">
            <span><FiLock /> Confirm Password</span>
            <input
              type="password"
              placeholder="Repeat your password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />
          </label>
          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
