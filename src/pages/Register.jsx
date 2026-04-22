import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiTarget, FiArrowRight, FiArrowLeft } from 'react-icons/fi';

const goals = ['Weight Loss', 'Muscle Gain', 'Better Health', 'More Energy', 'Sports Performance', 'Manage Condition'];
const diets = ['No Preference', 'Keto', 'Vegan', 'Paleo', 'Mediterranean', 'High Protein', 'Low Carb', 'Vegetarian'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', goals: [], diet: 'No Preference',
  });

  const updateForm = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleGoal = (goal) => {
    setForm(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step < 3) { setStep(step + 1); return; }
    setLoading(true);
    setTimeout(() => {
      register(form);
      navigate('/dashboard');
    }, 600);
  };

  return (
    <div className="auth-card">
      <h1>Create Account</h1>
      <p className="auth-subtitle">Step {step} of 3 — {step === 1 ? 'Your details' : step === 2 ? 'Your goals' : 'Diet preference'}</p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{
            flex: 1, height: '4px', borderRadius: '4px',
            background: s <= step ? 'var(--primary)' : 'var(--surface)',
            transition: 'background 0.3s ease',
          }} />
        ))}
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {step === 1 && (
          <>
            <div className="input-group">
              <label>Full Name</label>
              <div className="input-with-icon">
                <FiUser className="input-icon" />
                <input
                  type="text" placeholder="Enter your full name"
                  value={form.name} onChange={e => updateForm('name', e.target.value)} required
                />
              </div>
            </div>
            <div className="input-group">
              <label>Email</label>
              <div className="input-with-icon">
                <FiMail className="input-icon" />
                <input
                  type="email" placeholder="Enter your email"
                  value={form.email} onChange={e => updateForm('email', e.target.value)} required
                />
              </div>
            </div>
            <div className="input-group">
              <label>Password</label>
              <div className="input-with-icon">
                <FiLock className="input-icon" />
                <input
                  type="password" placeholder="Create a password"
                  value={form.password} onChange={e => updateForm('password', e.target.value)} required
                />
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
              Select your nutrition goals (pick one or more):
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {goals.map(g => (
                <button
                  key={g} type="button"
                  className={`tag ${form.goals.includes(g) ? 'active' : ''}`}
                  style={{ padding: '12px', justifyContent: 'center', textAlign: 'center' }}
                  onClick={() => toggleGoal(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
              Choose your preferred diet style:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {diets.map(d => (
                <button
                  key={d} type="button"
                  className={`tag ${form.diet === d ? 'active' : ''}`}
                  style={{ padding: '12px', justifyContent: 'center', textAlign: 'center' }}
                  onClick={() => updateForm('diet', d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          {step > 1 && (
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(step - 1)}>
              <FiArrowLeft /> Back
            </button>
          )}
          <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={loading}>
            {step < 3 ? <>Next <FiArrowRight /></> : loading ? 'Creating...' : 'Create Account'}
          </button>
        </div>
      </form>

      <p className="auth-footer">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}
