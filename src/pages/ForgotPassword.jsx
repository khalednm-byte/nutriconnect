import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { FiMail, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail]       = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [devResetUrl, setDevResetUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      const data = await authAPI.forgotPassword(email);
      setSent(true);
      if (data.resetUrl) setDevResetUrl(data.resetUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon"><span>N</span></div>
          <span>NutriConnect</span>
        </div>

        <h2>Reset your password</h2>
        <p className="auth-subtitle">
          Enter your email and we'll send you a link to reset your password.
        </p>

        {error && (
          <div className="auth-error">
            <FiAlertCircle /> {error}
          </div>
        )}

        {sent ? (
          <div className="auth-success">
            <FiCheckCircle /> If an account exists for that email, a reset link has been sent.
            {devResetUrl && (
              <p style={{ marginTop: 'var(--space-md)', fontSize: 'var(--font-xs)', wordBreak: 'break-all' }}>
                <strong>Dev mode:</strong>{' '}
                <a href={devResetUrl} style={{ color: 'var(--primary)' }}>{devResetUrl}</a>
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-field">
              <span><FiMail /> Email</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
              />
            </label>
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="auth-switch">
          <Link to="/login">← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
