import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { applicationsAPI } from '../services/api';
import {
  FiUser, FiMapPin, FiBook, FiAward, FiGlobe,
  FiClock, FiCheck, FiAlertCircle,
} from 'react-icons/fi';
import './NutritionistApplication.css';

const SPECIALIZATION_OPTIONS = [
  'sports_nutrition','weight_management','meal_planning','diabetes_management',
  'gut_health','medical_nutrition','plant_based','weight_loss','mindful_eating',
  'pediatric_nutrition','prenatal_nutrition','food_allergies','keto','heart_health','eating_disorders',
];
const CONSULTATION_TYPES = ['video', 'chat', 'in_person'];

export default function NutritionistApplication() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm] = useState({
    title: '', bio: '', location: '', experience: '',
    credentials: '', specializations: [], consultationRate: '',
    consultationTypes: [], languages: '', motivation: '',
  });
  const [error, setError]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  const handleField  = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const toggleMulti  = (key, value) => setForm(prev => ({
    ...prev,
    [key]: prev[key].includes(value) ? prev[key].filter(v => v !== value) : [...prev[key], value],
  }));

  const handleSubmit = async () => {
    setError('');
    if (!form.title.trim())       return setError('Professional title is required.');
    if (!form.bio.trim())         return setError('Bio is required.');
    if (!form.location.trim())    return setError('Location is required.');
    if (!form.experience)         return setError('Years of experience is required.');
    if (!form.credentials.trim()) return setError('Credentials are required.');
    if (!form.specializations.length) return setError('Select at least one specialization.');
    if (!form.consultationTypes.length) return setError('Select at least one consultation type.');
    if (!form.motivation.trim())  return setError('Please tell us your motivation.');

    setSubmitting(true);
    try {
      await applicationsAPI.submit({
        ...form,
        userName:  user?.name,
        userEmail: user?.email,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="application-page">
        <div className="application-success card">
          <div className="success-icon"><FiCheck /></div>
          <h2>Application Submitted!</h2>
          <p>Thank you for applying. Our admin team will review your application and get back to you within 3–5 business days.</p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="application-page">
      <div className="application-header">
        <h2>Apply to Become a Nutritionist</h2>
        <p>Fill in your professional details. Your application will be reviewed by our admin team before approval.</p>
      </div>

      <div className="application-form card">
        {error && <div className="application-error"><FiAlertCircle /> {error}</div>}

        <section className="app-section">
          <h4 className="app-section-title"><FiUser /> Professional Info</h4>
          <div className="app-field-grid">
            <label className="app-field app-field-full">
              <span>Full Name</span>
              <input value={user?.name || ''} disabled style={{ opacity: 0.6 }} />
              <small>Pulled from your account</small>
            </label>
            <label className="app-field app-field-full">
              <span>Professional Title *</span>
              <input value={form.title} onChange={e => handleField('title', e.target.value)} placeholder="e.g. Registered Dietitian Nutritionist" />
            </label>
            <label className="app-field">
              <span>Years of Experience *</span>
              <input type="number" min="0" max="60" value={form.experience} onChange={e => handleField('experience', e.target.value)} placeholder="e.g. 8" />
            </label>
            <label className="app-field">
              <span>Location *</span>
              <input value={form.location} onChange={e => handleField('location', e.target.value)} placeholder="e.g. New York, NY" />
            </label>
            <label className="app-field app-field-full">
              <span>Credentials *</span>
              <input value={form.credentials} onChange={e => handleField('credentials', e.target.value)} placeholder="e.g. RDN, CSSD, LD" />
            </label>
            <label className="app-field app-field-full">
              <span>Languages Spoken</span>
              <input value={form.languages} onChange={e => handleField('languages', e.target.value)} placeholder="e.g. English, Spanish" />
            </label>
          </div>
        </section>

        <section className="app-section">
          <h4 className="app-section-title"><FiBook /> Bio</h4>
          <p className="app-hint">Write a professional bio that will appear on your public profile.</p>
          <textarea className="app-textarea" rows={5} value={form.bio}
            onChange={e => handleField('bio', e.target.value)}
            placeholder="Tell potential clients about your background..." />
        </section>

        <section className="app-section">
          <h4 className="app-section-title"><FiAward /> Specializations *</h4>
          <div className="app-checkbox-grid">
            {SPECIALIZATION_OPTIONS.map(s => (
              <label key={s} className={`app-checkbox-item ${form.specializations.includes(s) ? 'checked' : ''}`}>
                <input type="checkbox" checked={form.specializations.includes(s)} onChange={() => toggleMulti('specializations', s)} />
                {s.replace(/_/g, ' ')}
              </label>
            ))}
          </div>
        </section>

        <section className="app-section">
          <h4 className="app-section-title"><FiClock /> Consultation Details</h4>
          <div className="app-field-grid">
            <label className="app-field">
              <span>Hourly Rate (USD)</span>
              <input type="number" min="0" value={form.consultationRate} onChange={e => handleField('consultationRate', e.target.value)} placeholder="e.g. 85" />
            </label>
          </div>
          <p className="app-hint" style={{ marginTop: 'var(--space-md)' }}>Consultation types available *</p>
          <div className="app-toggle-group">
            {CONSULTATION_TYPES.map(t => (
              <button key={t} type="button"
                className={`app-toggle ${form.consultationTypes.includes(t) ? 'active' : ''}`}
                onClick={() => toggleMulti('consultationTypes', t)}>
                {t === 'video' ? '📹' : t === 'chat' ? '💬' : '🏢'} {t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </section>

        <section className="app-section">
          <h4 className="app-section-title"><FiGlobe /> Why do you want to join NutriConnect? *</h4>
          <textarea className="app-textarea" rows={4} value={form.motivation}
            onChange={e => handleField('motivation', e.target.value)}
            placeholder="Tell us what motivates you..." />
        </section>

        <div className="app-footer">
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  );
}
