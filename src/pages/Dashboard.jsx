import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postsAPI } from '../services/api';
import { getInitials, getAvatarColor } from '../data/users';
import { weeklyMealPlan } from '../data/meals';
import { challenges as mockChallenges } from '../data/challenges';
import { FiTrendingUp, FiCalendar, FiAward, FiUsers, FiArrowRight, FiTarget, FiZap } from 'react-icons/fi';
import './Dashboard.css';

const upcomingConsultations = [
  { nutritionist: 'Dr. Emily Roberts',  time: 'Today, 2:00 PM',    type: 'Video Call', status: 'confirmed' },
  { nutritionist: 'Coach Ryan Mitchell', time: 'Tomorrow, 10:00 AM', type: 'Chat',       status: 'pending' },
];

export default function Dashboard() {
  const { user } = useAuth();

  const [posts, setPosts]       = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  // Meals — use Monday from mock data until meal planner API exists
  const todayMeals = weeklyMealPlan?.Monday || {};
  const mealEntries = Object.entries(todayMeals).filter(([, meal]) => meal !== null);
  const todayCalories = mealEntries.reduce((sum, [, m]) => sum + (m?.calories || 0), 0);

  // Challenges — use mock data until challenges API exists
  const activeChallenges = (mockChallenges || []).filter(c => c.active).slice(0, 3);

  useEffect(() => {
    const load = async () => {
      try {
        const { posts } = await postsAPI.getAll();
        setPosts(posts);
      } catch (err) {
        console.error('Failed to load posts:', err);
      } finally {
        setPostsLoading(false);
      }
    };
    load();
  }, []);

  const quickStats = [
    { icon: FiZap,    label: 'Calories Today', value: todayCalories.toLocaleString(), sub: '/ 2,200 cal goal', color: 'primary' },
    { icon: FiTarget, label: 'Streak',         value: `${user?.stats?.streak  || 0}`, sub: 'days 🔥',         color: 'secondary' },
    { icon: FiAward,  label: 'Level',          value: `${user?.stats?.level   || 1}`, sub: `${user?.stats?.points || 0} pts`, color: 'accent' },
    { icon: FiUsers,  label: 'Followers',      value: `${user?.stats?.followers || 0}`, sub: '+8 this week',  color: 'info' },
  ];

  return (
    <div className="dashboard-page">

      {/* Greeting */}
      <div className="dash-greeting animate-fade-in-up">
        <div>
          <h1>Good {getGreeting()}, {user?.name?.split(' ')[0] || 'there'} 👋</h1>
          <p>Here's your nutrition overview for today.</p>
        </div>
        <Link to="/meal-planner" className="btn btn-primary">
          Plan Today's Meals <FiArrowRight />
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="dash-stats">
        {quickStats.map((s, i) => (
          <div key={i} className={`stat-card animate-fade-in-up delay-${i + 1}`}>
            <div className={`stat-icon stat-icon-${s.color}`}><s.icon /></div>
            <div className="stat-content">
              <h4>{s.value}</h4>
              <p>{s.label}</p>
              <span className="stat-change positive">{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-grid">

        {/* Today's Meals */}
        <div className="dash-section card animate-fade-in-up delay-2">
          <div className="dash-section-header">
            <h3>Today's Meals</h3>
            <Link to="/meal-planner" className="btn btn-ghost btn-sm">View Plan <FiArrowRight /></Link>
          </div>
          {mealEntries.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)', padding: 'var(--space-md) 0' }}>
              No meals planned yet.
            </p>
          ) : (
            <>
              <div className="dash-meals">
                {mealEntries.map(([mealType, meal]) => (
                  <div key={mealType} className="dash-meal-item">
                    <div className="dash-meal-icon">
                      {mealType === 'breakfast' ? '🌅' : mealType === 'lunch' ? '☀️' : mealType === 'dinner' ? '🌙' : '🍎'}
                    </div>
                    <div className="dash-meal-info">
                      <strong>{mealType.charAt(0).toUpperCase() + mealType.slice(1)}</strong>
                      <span>{meal.name}</span>
                    </div>
                    <span className="dash-meal-cal">{meal.calories} cal</span>
                  </div>
                ))}
              </div>
              <div className="dash-total-cal">
                <span>Total</span>
                <strong>{todayCalories.toLocaleString()} cal</strong>
              </div>
            </>
          )}
        </div>

        {/* Macros */}
        <div className="dash-section card animate-fade-in-up delay-3">
          <div className="dash-section-header">
            <h3>Macro Progress</h3>
            <Link to="/progress" className="btn btn-ghost btn-sm">Details <FiArrowRight /></Link>
          </div>
          <div className="dash-macros">
            {[
              { label: 'Protein', current: 85,  target: 150, color: 'var(--primary)' },
              { label: 'Carbs',   current: 120, target: 250, color: 'var(--secondary)' },
              { label: 'Fat',     current: 40,  target: 65,  color: 'var(--accent)' },
              { label: 'Fiber',   current: 18,  target: 30,  color: 'var(--info)' },
            ].map(m => (
              <div key={m.label} className="dash-macro-row">
                <div className="dash-macro-label">
                  <span>{m.label}</span>
                  <span>{m.current}g / {m.target}g</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill"
                    style={{ width: `${Math.min((m.current / m.target) * 100, 100)}%`, background: m.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Consultations */}
        <div className="dash-section card animate-fade-in-up delay-4">
          <div className="dash-section-header">
            <h3>Upcoming Sessions</h3>
            <Link to="/nutritionists" className="btn btn-ghost btn-sm">Browse <FiArrowRight /></Link>
          </div>
          <div className="dash-consultations">
            {upcomingConsultations.map((c, i) => (
              <div key={i} className="dash-consultation-item">
                <div className="avatar avatar-sm" style={{ background: getAvatarColor(`n${i + 1}`) }}>
                  {getInitials(c.nutritionist)}
                </div>
                <div className="dash-consultation-info">
                  <strong>{c.nutritionist}</strong>
                  <span>{c.time} • {c.type}</span>
                </div>
                <span className={`badge badge-${c.status === 'confirmed' ? 'success' : 'secondary'}`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Challenges */}
        <div className="dash-section card animate-fade-in-up delay-5">
          <div className="dash-section-header">
            <h3>Active Challenges</h3>
            <Link to="/challenges" className="btn btn-ghost btn-sm">View All <FiArrowRight /></Link>
          </div>
          <div className="dash-challenges">
            {activeChallenges.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>No active challenges.</p>
            ) : (
              activeChallenges.map(c => (
                <div key={c.id} className="dash-challenge-item">
                  <span className="dash-challenge-icon">{c.icon}</span>
                  <div className="dash-challenge-info">
                    <strong>{c.title}</strong>
                    <div className="progress-bar" style={{ height: '6px' }}>
                      <div className="progress-bar-fill"
                        style={{ width: `${Math.min(((c.progress || 0) / (c.duration || 1)) * 100, 100)}%` }} />
                    </div>
                    <span className="dash-challenge-meta">
                      {c.progress || 0}/{c.duration || 0} days • {c.deadline || ''}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Community Feed */}
        <div className="dash-section card full-width animate-fade-in-up delay-6">
          <div className="dash-section-header">
            <h3>Community Feed</h3>
            <Link to="/community" className="btn btn-ghost btn-sm">See All <FiArrowRight /></Link>
          </div>
          <div className="dash-feed-preview">
            {postsLoading && (
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>Loading posts...</p>
            )}
            {!postsLoading && posts.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
                No posts yet. <Link to="/community">Be the first to share!</Link>
              </p>
            )}
            {posts.slice(0, 2).map(p => (
              <div key={p._id} className="dash-feed-item">
                <div className="avatar avatar-sm" style={{ background: getAvatarColor(p.authorId) }}>
                  {getInitials(p.authorName)}
                </div>
                <div className="dash-feed-content">
                  <div className="dash-feed-top">
                    <strong>{p.authorName}</strong>
                    {p.authorRole === 'nutritionist' && <span className="badge badge-primary">Expert</span>}
                    <span className="dash-feed-time">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p>{p.content?.substring(0, 150)}{p.content?.length > 150 ? '...' : ''}</p>
                  <div className="dash-feed-stats">
                    <span>❤️ {p.likesCount || 0}</span>
                    <span>💬 {p.comments?.length || 0}</span>
                    <span>🔄 {p.shares || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}
