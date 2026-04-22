import { useState } from 'react';
import { challenges, badges, leaderboard } from '../data/challenges';
import { getInitials, getAvatarColor } from '../data/users';
import { FiAward, FiTrendingUp, FiUsers, FiZap } from 'react-icons/fi';
import './Challenges.css';

export default function Challenges() {
  const [tab, setTab] = useState('challenges');
  const activeChallenges = challenges.filter(c => c.active);
  const completedChallenges = challenges.filter(c => c.completed);

  return (
    <div className="challenges-page">
      <div className="challenges-header">
        <h2>Challenges & Achievements</h2>
        <p>Stay motivated with fun challenges and earn badges</p>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--space-2xl)', maxWidth: '400px' }}>
        <button className={`tab ${tab === 'challenges' ? 'active' : ''}`} onClick={() => setTab('challenges')}>
          <FiZap /> Challenges
        </button>
        <button className={`tab ${tab === 'badges' ? 'active' : ''}`} onClick={() => setTab('badges')}>
          <FiAward /> Badges
        </button>
        <button className={`tab ${tab === 'leaderboard' ? 'active' : ''}`} onClick={() => setTab('leaderboard')}>
          <FiTrendingUp /> Leaderboard
        </button>
      </div>

      {tab === 'challenges' && (
        <>
          <h3 style={{ marginBottom: 'var(--space-lg)' }}>Active Challenges</h3>
          <div className="challenges-grid">
            {activeChallenges.map(c => (
              <div key={c.id} className="challenge-card card">
                <div className="challenge-top">
                  <span className="challenge-icon-big">{c.icon}</span>
                  <span className="badge badge-primary">{c.type}</span>
                </div>
                <h3>{c.title}</h3>
                <p>{c.description}</p>
                <div style={{ margin: 'var(--space-lg) 0' }}>
                  <div className="dash-macro-label">
                    <span>Progress</span>
                    <span>{c.progress}/{c.duration} days</span>
                  </div>
                  <div className="progress-bar" style={{ marginTop: '8px' }}>
                    <div className="progress-bar-fill" style={{ width: `${(c.progress / c.duration) * 100}%` }}></div>
                  </div>
                </div>
                <div className="challenge-footer">
                  <span className="challenge-participants"><FiUsers /> {c.participants.toLocaleString()}</span>
                  <span className="challenge-reward">🏆 {c.reward.points} pts</span>
                  <span className="challenge-deadline">{c.deadline}</span>
                </div>
              </div>
            ))}
          </div>

          {completedChallenges.length > 0 && (
            <>
              <h3 style={{ margin: 'var(--space-2xl) 0 var(--space-lg)' }}>Completed ✅</h3>
              <div className="challenges-grid">
                {completedChallenges.map(c => (
                  <div key={c.id} className="challenge-card card completed">
                    <div className="challenge-top">
                      <span className="challenge-icon-big">{c.icon}</span>
                      <span className="badge badge-success">Completed!</span>
                    </div>
                    <h3>{c.title}</h3>
                    <p>{c.description}</p>
                    <div className="challenge-footer">
                      <span className="challenge-reward">🏆 +{c.reward.points} pts earned</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {tab === 'badges' && (
        <div className="badges-grid">
          {badges.map(b => (
            <div key={b.id} className={`badge-card card ${b.earned ? 'earned' : 'locked'}`}>
              <span className="badge-icon-big">{b.icon}</span>
              <h4>{b.name}</h4>
              <p>{b.description}</p>
              {b.earned ? (
                <span className="badge badge-success" style={{ marginTop: 'auto' }}>Earned {b.earnedDate}</span>
              ) : (
                <span className="badge badge-info" style={{ marginTop: 'auto' }}>Locked</span>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'leaderboard' && (
        <div className="card leaderboard-card">
          <h3 style={{ marginBottom: 'var(--space-xl)' }}>🏆 Community Leaderboard</h3>
          <div className="leaderboard-list">
            {leaderboard.map((entry, i) => (
              <div key={entry.rank} className={`leaderboard-item ${entry.userId === 'u1' ? 'current-user' : ''}`}>
                <span className={`lb-rank ${i < 3 ? `top-${i + 1}` : ''}`}>
                  {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${entry.rank}`}
                </span>
                <div className="avatar avatar-sm" style={{ background: getAvatarColor(entry.userId) }}>
                  {getInitials(entry.name)}
                </div>
                <div className="lb-info">
                  <strong>{entry.name}</strong>
                  <span>Level {entry.level} • {entry.streak} day streak</span>
                </div>
                <div className="lb-points">
                  <strong>{entry.points.toLocaleString()}</strong>
                  <span>pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
