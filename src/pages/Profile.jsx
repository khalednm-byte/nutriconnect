import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getInitials, getAvatarColor } from '../data/users';
import { badges } from '../data/challenges';
import { usersAPI, challengesAPI } from '../services/api';
import {
  FiEdit2, FiCamera, FiMapPin, FiCalendar, FiTarget,
  FiAward, FiStar, FiCheck, FiX, FiAlertCircle,
} from 'react-icons/fi';
import './Profile.css';

const GOAL_OPTIONS = [
  'weight_loss','muscle_gain','maintain_weight','improve_endurance',
  'better_nutrition','stress_reduction','more_energy',
];
const DIET_OPTIONS = [
  'high_protein','low_carb','vegan','vegetarian','keto',
  'mediterranean','gluten_free','dairy_free','paleo',
];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [joinedChallenges, setJoinedChallenges] = useState([]);

  // Fetch the user's completed challenges to derive which badges are actually earned
  useEffect(() => {
    const load = async () => {
      try {
        const { challenges } = await challengesAPI.getJoined();
        setJoinedChallenges(challenges);
      } catch (err) {
        console.error('Failed to load challenge history:', err);
      }
    };
    load();
  }, []);

  // Edit form state — initialised from the real user object
  const [form, setForm] = useState({
    name:          user?.name                    || '',
    bio:           user?.profile?.bio            || '',
    location:      user?.profile?.location       || '',
    height:        user?.profile?.height         || '',
    currentWeight: user?.profile?.currentWeight  || '',
    targetWeight:  user?.profile?.targetWeight   || '',
    age:           user?.profile?.age            || '',
    goals:         user?.profile?.goals          || [],
    dietPreferences: user?.profile?.dietPreferences || [],
    allergies:     (user?.profile?.allergies || []).join(', '),
  });

  const handleField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleMulti = (key, value) => setForm(prev => ({
    ...prev,
    [key]: prev[key].includes(value)
      ? prev[key].filter(v => v !== value)
      : [...prev[key], value],
  }));

  const handleSave = async () => {
    setError('');
    if (!form.name.trim()) return setError('Name is required.');
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        profile: {
          bio:             form.bio.trim(),
          location:        form.location.trim(),
          height:          Number(form.height)        || 0,
          currentWeight:   Number(form.currentWeight) || 0,
          targetWeight:    Number(form.targetWeight)  || 0,
          age:             Number(form.age)           || 0,
          goals:           form.goals,
          dietPreferences: form.dietPreferences,
          allergies:       form.allergies.split(',').map(s => s.trim()).filter(Boolean),
        },
      };
      const { user: updated } = await usersAPI.updateProfile(payload);
      updateUser(updated); // push changes into AuthContext so all components see them
      setEditing(false);
      setSuccess('Profile updated successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to current user data and close
    setForm({
      name:          user?.name                    || '',
      bio:           user?.profile?.bio            || '',
      location:      user?.profile?.location       || '',
      height:        user?.profile?.height         || '',
      currentWeight: user?.profile?.currentWeight  || '',
      targetWeight:  user?.profile?.targetWeight   || '',
      age:           user?.profile?.age            || '',
      goals:         user?.profile?.goals          || [],
      dietPreferences: user?.profile?.dietPreferences || [],
      allergies:     (user?.profile?.allergies || []).join(', '),
    });
    setError('');
    setEditing(false);
  };

  // Derive earned badges from completed challenges — same logic as the Challenges page
  const earnedBadgeIds = new Set(
    joinedChallenges
      .filter(j => j.completed && j.reward?.badge)
      .map(j => j.reward.badge)
  );
  const enrichedBadges = badges.map(b => {
    const completedEntry = joinedChallenges.find(j => j.reward?.badge === b.id && j.completed);
    return {
      ...b,
      earned:     earnedBadgeIds.has(b.id),
      earnedDate: completedEntry ? new Date(completedEntry.completedAt).toLocaleDateString() : null,
    };
  });
  const earnedBadges  = enrichedBadges.filter(b => b.earned);
  const currentWeight = editing ? Number(form.currentWeight) : (user?.profile?.currentWeight || 0);
  const targetWeight  = editing ? Number(form.targetWeight)  : (user?.profile?.targetWeight  || 0);
  const height        = editing ? Number(form.height)        : (user?.profile?.height        || 0);

  // Determine goal direction from selected goals
  const activeGoals = editing ? form.goals : (user?.profile?.goals || []);
  const isWeightGain = activeGoals.includes('muscle_gain') && !activeGoals.includes('weight_loss');
  const isWeightLoss = activeGoals.includes('weight_loss');

  // Calculate progress only when both weights are set and direction is clear
  let weightProgress = 0;
  let progressLabel  = '';
  if (currentWeight > 0 && targetWeight > 0) {
    if (isWeightLoss && currentWeight > targetWeight) {
      // How far have we come from a starting point? We don't store start weight,
      // so we use current vs target — 0% means just started, 100% means reached goal.
      // We approximate start as current + some buffer to show meaningful progress.
      const startWeight  = currentWeight + 5; // 5kg above current as a baseline
      weightProgress = Math.min(
        ((startWeight - currentWeight) / (startWeight - targetWeight)) * 100, 100
      );
      progressLabel = `${currentWeight}kg → ${targetWeight}kg (losing)`;
    } else if (isWeightGain && targetWeight > currentWeight) {
      const startWeight  = currentWeight - 5; // 5kg below current as a baseline
      weightProgress = Math.min(
        ((currentWeight - startWeight) / (targetWeight - startWeight)) * 100, 100
      );
      progressLabel = `${currentWeight}kg → ${targetWeight}kg (gaining)`;
    } else if (!isWeightLoss && !isWeightGain) {
      // No weight goal selected — show neutral maintenance bar
      weightProgress = 50;
      progressLabel  = `${currentWeight}kg (maintaining)`;
    }
  }

  return (
    <div className="profile-page">

      {/* Success toast */}
      {success && (
        <div className="profile-toast">
          <FiCheck /> {success}
        </div>
      )}

      {/* Profile Header */}
      <div className="profile-header card">
        <div className="profile-cover"></div>
        <div className="profile-info">
          <div className="profile-avatar-wrapper">
            <div className="avatar avatar-2xl" style={{ background: getAvatarColor(user?._id) }}>
              {getInitials(editing ? form.name : user?.name)}
            </div>
            <button className="profile-avatar-edit" title="Change photo (coming soon)">
              <FiCamera />
            </button>
          </div>

          <div className="profile-details">
            {editing ? (
              <input
                className="profile-name-input"
                value={form.name}
                onChange={e => handleField('name', e.target.value)}
                placeholder="Your name"
              />
            ) : (
              <h2>{user?.name}</h2>
            )}

            {editing ? (
              <textarea
                className="profile-bio-input"
                value={form.bio}
                onChange={e => handleField('bio', e.target.value)}
                placeholder="Write a short bio..."
                rows={2}
              />
            ) : (
              <p className="profile-bio">{user?.profile?.bio || 'No bio yet.'}</p>
            )}

            <div className="profile-meta">
              {editing ? (
                <input
                  className="profile-location-input"
                  value={form.location}
                  onChange={e => handleField('location', e.target.value)}
                  placeholder="Your location"
                />
              ) : (
                user?.profile?.location && <span><FiMapPin /> {user.profile.location}</span>
              )}
              <span><FiCalendar /> Joined {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              <span className="badge badge-secondary">{user?.subscription || 'free'} plan</span>
            </div>
          </div>

          <div className="profile-header-actions">
            {editing ? (
              <>
                <button className="btn btn-ghost btn-sm" onClick={handleCancel} disabled={saving}>
                  <FiX /> Cancel
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                  <FiCheck /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
                  <FiEdit2 /> Edit Profile
                </button>
                {user?.role === 'user' && (
                  <button className="btn btn-primary btn-sm" onClick={() => navigate('/apply-nutritionist')}>
                    <FiStar /> Apply as Nutritionist
                  </button>
                )}
                {user?.role === 'nutritionist' && (
                  <span className="badge badge-primary" style={{ padding: 'var(--space-sm) var(--space-md)' }}>
                    ✓ Verified Nutritionist
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="profile-error">
            <FiAlertCircle /> {error}
          </div>
        )}

        <div className="profile-stats-row">
          <div className="profile-stat"><strong>{user?.stats?.followers || 0}</strong><span>Followers</span></div>
          <div className="profile-stat"><strong>{user?.stats?.following || 0}</strong><span>Following</span></div>
          <div className="profile-stat"><strong>{user?.stats?.postsCount || 0}</strong><span>Posts</span></div>
          <div className="profile-stat"><strong>{user?.stats?.streak || 0}</strong><span>Day Streak</span></div>
        </div>
      </div>

      <div className="profile-grid">

        {/* Body Stats */}
        <div className="card">
          <h3>Body Stats & Goals</h3>
          <div className="profile-body-stats">
            {editing ? (
              <div className="profile-stats-edit-grid">
                {[
                  { key: 'height',        label: 'Height (cm)' },
                  { key: 'currentWeight', label: 'Current Weight (kg)' },
                  { key: 'targetWeight',  label: 'Target Weight (kg)' },
                  { key: 'age',           label: 'Age' },
                ].map(({ key, label }) => (
                  <label key={key} className="profile-edit-field">
                    <span>{label}</span>
                    <input
                      type="number" min="0"
                      value={form[key]}
                      onChange={e => handleField(key, e.target.value)}
                    />
                  </label>
                ))}
              </div>
            ) : (
              <>
                {[
                  { label: 'Height',         value: height        ? `${height} cm`        : '—' },
                  { label: 'Current Weight', value: currentWeight ? `${currentWeight} kg`  : '—' },
                  { label: 'Target Weight',  value: targetWeight  ? `${targetWeight} kg`   : '—' },
                  { label: 'Age',            value: user?.profile?.age || '—' },
                  { label: 'BMI',            value: height && currentWeight
                    ? (currentWeight / ((height / 100) ** 2)).toFixed(1)
                    : '—'
                  },
                ].map(s => (
                  <div key={s.label} className="body-stat-row">
                    <span className="body-stat-label">{s.label}</span>
                    <span className="body-stat-value">{s.value}</span>
                  </div>
                ))}
              </>
            )}
          </div>
          {currentWeight > 0 && targetWeight > 0 && progressLabel && (
            <div style={{ marginTop: 'var(--space-xl)' }}>
              <div className="dash-macro-label">
                <span>Weight Goal Progress</span>
                <span>{progressLabel}</span>
              </div>
              <div className="progress-bar" style={{ marginTop: '8px' }}>
                <div className="progress-bar-fill" style={{ width: `${weightProgress}%` }} />
              </div>
              {!isWeightLoss && !isWeightGain && currentWeight > 0 && (
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-xs)' }}>
                  Add a weight goal (weight loss or muscle gain) for a progress bar.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Diet Preferences */}
        <div className="card">
          <h3>Diet Preferences</h3>

          <div className="profile-tags-section">
            <h4><FiTarget /> Goals</h4>
            {editing ? (
              <div className="profile-multi-select">
                {GOAL_OPTIONS.map(g => (
                  <button
                    key={g} type="button"
                    className={`tag ${form.goals.includes(g) ? 'active' : ''}`}
                    onClick={() => toggleMulti('goals', g)}
                  >
                    {g.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            ) : (
              <div className="profile-tags">
                {(user?.profile?.goals || []).length > 0
                  ? user.profile.goals.map(g => <span key={g} className="tag active">{g.replace(/_/g, ' ')}</span>)
                  : <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>None set</span>
                }
              </div>
            )}
          </div>

          <div className="profile-tags-section">
            <h4>🍽️ Diet Style</h4>
            {editing ? (
              <div className="profile-multi-select">
                {DIET_OPTIONS.map(d => (
                  <button
                    key={d} type="button"
                    className={`tag ${form.dietPreferences.includes(d) ? 'active' : ''}`}
                    onClick={() => toggleMulti('dietPreferences', d)}
                  >
                    {d.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            ) : (
              <div className="profile-tags">
                {(user?.profile?.dietPreferences || []).length > 0
                  ? user.profile.dietPreferences.map(d => <span key={d} className="tag active">{d.replace(/_/g, ' ')}</span>)
                  : <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>None set</span>
                }
              </div>
            )}
          </div>

          <div className="profile-tags-section">
            <h4>⚠️ Allergies</h4>
            {editing ? (
              <label className="profile-edit-field" style={{ gridColumn: '1/-1' }}>
                <span>Comma-separated (e.g. gluten, dairy)</span>
                <input
                  value={form.allergies}
                  onChange={e => handleField('allergies', e.target.value)}
                  placeholder="gluten, dairy, nuts"
                />
              </label>
            ) : (
              <div className="profile-tags">
                {(user?.profile?.allergies || []).length > 0
                  ? user.profile.allergies.map(a => <span key={a} className="badge badge-accent">{a}</span>)
                  : <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>None</span>
                }
              </div>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="card full-width">
          <h3><FiAward /> Badges ({earnedBadges.length}/{enrichedBadges.length})</h3>
          <div className="profile-badges-grid">
            {enrichedBadges.map(b => (
              <div key={b.id} className={`profile-badge ${b.earned ? 'earned' : 'locked'}`}>
                <span className="profile-badge-icon">{b.icon}</span>
                <strong>{b.name}</strong>
                <span>{b.description}</span>
                {b.earned && <span className="profile-badge-date">Earned {b.earnedDate}</span>}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
