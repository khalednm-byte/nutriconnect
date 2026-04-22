import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getInitials, getAvatarColor } from '../data/users';
import { badges } from '../data/challenges';
import { FiEdit2, FiCamera, FiMapPin, FiCalendar, FiTarget, FiAward } from 'react-icons/fi';
import './Profile.css';

export default function Profile() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || 'Alex Morgan',
    bio: user?.profile?.bio || 'Fitness enthusiast',
    height: user?.profile?.height || 178,
    currentWeight: user?.profile?.currentWeight || 78,
    targetWeight: user?.profile?.targetWeight || 72,
    age: user?.profile?.age || 28,
  });

  const earnedBadges = badges.filter(b => b.earned);
  const weightProgress = ((profile.currentWeight - profile.targetWeight) / (80 - profile.targetWeight)) * 100;

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <div className="profile-header card">
        <div className="profile-cover"></div>
        <div className="profile-info">
          <div className="profile-avatar-wrapper">
            <div className="avatar avatar-2xl" style={{ background: getAvatarColor(user?.id || 'u1') }}>
              {getInitials(profile.name)}
            </div>
            <button className="profile-avatar-edit"><FiCamera /></button>
          </div>
          <div className="profile-details">
            <h2>{profile.name}</h2>
            <p className="profile-bio">{profile.bio}</p>
            <div className="profile-meta">
              <span><FiMapPin /> New York, NY</span>
              <span><FiCalendar /> Joined Nov 2025</span>
              <span className="badge badge-secondary">{user?.subscription || 'premium'} plan</span>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setEditing(!editing)}>
            <FiEdit2 /> {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        <div className="profile-stats-row">
          <div className="profile-stat">
            <strong>{user?.stats?.followers || 156}</strong>
            <span>Followers</span>
          </div>
          <div className="profile-stat">
            <strong>{user?.stats?.following || 89}</strong>
            <span>Following</span>
          </div>
          <div className="profile-stat">
            <strong>{user?.stats?.postsCount || 42}</strong>
            <span>Posts</span>
          </div>
          <div className="profile-stat">
            <strong>{user?.stats?.streak || 14}</strong>
            <span>Day Streak</span>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        {/* Goals & Body Stats */}
        <div className="card">
          <h3>Body Stats & Goals</h3>
          <div className="profile-body-stats">
            <div className="body-stat-row">
              <span className="body-stat-label">Height</span>
              <span className="body-stat-value">{profile.height} cm</span>
            </div>
            <div className="body-stat-row">
              <span className="body-stat-label">Current Weight</span>
              <span className="body-stat-value">{profile.currentWeight} kg</span>
            </div>
            <div className="body-stat-row">
              <span className="body-stat-label">Target Weight</span>
              <span className="body-stat-value">{profile.targetWeight} kg</span>
            </div>
            <div className="body-stat-row">
              <span className="body-stat-label">Age</span>
              <span className="body-stat-value">{profile.age}</span>
            </div>
            <div className="body-stat-row">
              <span className="body-stat-label">BMI</span>
              <span className="body-stat-value">{(profile.currentWeight / ((profile.height / 100) ** 2)).toFixed(1)}</span>
            </div>
          </div>
          <div style={{ marginTop: 'var(--space-xl)' }}>
            <div className="dash-macro-label">
              <span>Weight Goal Progress</span>
              <span>{profile.currentWeight}kg → {profile.targetWeight}kg</span>
            </div>
            <div className="progress-bar" style={{ marginTop: '8px' }}>
              <div className="progress-bar-fill" style={{ width: `${Math.min(Math.max(100 - weightProgress, 0), 100)}%` }}></div>
            </div>
          </div>
        </div>

        {/* Diet Preferences */}
        <div className="card">
          <h3>Diet Preferences</h3>
          <div className="profile-tags-section">
            <h4><FiTarget /> Goals</h4>
            <div className="profile-tags">
              {(user?.profile?.goals || ['weight_loss', 'muscle_gain']).map(g => (
                <span key={g} className="tag active">{g.replace(/_/g, ' ')}</span>
              ))}
            </div>
          </div>
          <div className="profile-tags-section">
            <h4>🍽️ Diet Style</h4>
            <div className="profile-tags">
              {(user?.profile?.dietPreferences || ['high_protein', 'low_carb']).map(d => (
                <span key={d} className="tag active">{d.replace(/_/g, ' ')}</span>
              ))}
            </div>
          </div>
          <div className="profile-tags-section">
            <h4>⚠️ Allergies</h4>
            <div className="profile-tags">
              {(user?.profile?.allergies || ['gluten']).map(a => (
                <span key={a} className="badge badge-accent">{a}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="card full-width">
          <h3><FiAward /> Badges ({earnedBadges.length}/{badges.length})</h3>
          <div className="profile-badges-grid">
            {badges.map(b => (
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
