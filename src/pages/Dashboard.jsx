import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiTrendingUp, FiCalendar, FiAward, FiUsers, FiArrowRight, FiStar, FiTarget, FiZap } from 'react-icons/fi';
import { getInitials, getAvatarColor } from '../data/users'; // Visual helpers can stay
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  
  const [data, setData] = useState({
    todayMeals: null,
    posts: [],
    challenges: [],
    loading: true
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [mealsRes, postsRes, challengesRes] = await Promise.all([
          axios.get('/api/meals/plan'),
          axios.get('/api/community/posts'),
          axios.get('/api/challenges')
        ]);
        
        setData({
          todayMeals: mealsRes.data['Monday'],
          posts: postsRes.data,
          challenges: challengesRes.data.challenges,
          loading: false
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setData(prev => ({ ...prev, loading: false }));
      }
    };
    
    fetchDashboardData();
  }, []);

  if (data.loading) {
    return <div className="dashboard-page" style={{ textAlign: 'center', padding: '50px' }}>Loading your dashboard...</div>;
  }

  const { todayMeals, posts, challenges } = data;
  const todayCalories = todayMeals ? Object.values(todayMeals).reduce((sum, m) => sum + m.calories, 0) : 0;

  const quickStats = [
    { icon: FiZap, label: 'Calories Today', value: '1,340', sub: `/ ${todayCalories.toLocaleString()} cal`, color: 'primary' },
    { icon: FiTarget, label: 'Streak', value: `${user?.stats?.streak || 14}`, sub: 'days 🔥', color: 'secondary' },
    { icon: FiAward, label: 'Level', value: `${user?.stats?.level || 12}`, sub: `${user?.stats?.points || 2480} pts`, color: 'accent' },
    { icon: FiUsers, label: 'Followers', value: `${user?.stats?.followers || 156}`, sub: '+8 this week', color: 'info' },
  ];

  const upcomingConsultations = [
    { nutritionist: 'Dr. Emily Roberts', time: 'Today, 2:00 PM', type: 'Video Call', status: 'confirmed' },
    { nutritionist: 'Coach Ryan Mitchell', time: 'Tomorrow, 10:00 AM', type: 'Chat', status: 'pending' },
  ];

  return (
    <div className="dashboard-page">
      {/* Greeting */}
      <div className="dash-greeting animate-fade-in-up">
        <div>
          <h1>Good afternoon, {user?.name?.split(' ')[0] || 'Alex'} 👋</h1>
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
          <div className="dash-meals">
            {Object.entries(todayMeals).map(([mealType, meal]) => (
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
        </div>

        {/* Macros */}
        <div className="dash-section card animate-fade-in-up delay-3">
          <div className="dash-section-header">
            <h3>Macro Progress</h3>
            <Link to="/progress" className="btn btn-ghost btn-sm">Details <FiArrowRight /></Link>
          </div>
          <div className="dash-macros">
            {[
              { label: 'Protein', current: 85, target: 150, color: 'var(--primary)' },
              { label: 'Carbs', current: 120, target: 250, color: 'var(--secondary)' },
              { label: 'Fat', current: 40, target: 65, color: 'var(--accent)' },
              { label: 'Fiber', current: 18, target: 30, color: 'var(--info)' },
            ].map(m => (
              <div key={m.label} className="dash-macro-row">
                <div className="dash-macro-label">
                  <span>{m.label}</span>
                  <span>{m.current}g / {m.target}g</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${(m.current / m.target) * 100}%`, background: m.color }}></div>
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
            {challenges.filter(c => c.active).slice(0, 3).map(c => (
              <div key={c.id} className="dash-challenge-item">
                <span className="dash-challenge-icon">{c.icon}</span>
                <div className="dash-challenge-info">
                  <strong>{c.title}</strong>
                  <div className="progress-bar" style={{ height: '6px' }}>
                    <div className="progress-bar-fill" style={{ width: `${(c.progress / c.duration) * 100}%` }}></div>
                  </div>
                  <span className="dash-challenge-meta">{c.progress}/{c.duration} days • {c.deadline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Community */}
        <div className="dash-section card full-width animate-fade-in-up delay-6">
          <div className="dash-section-header">
            <h3>Community Feed</h3>
            <Link to="/community" className="btn btn-ghost btn-sm">See All <FiArrowRight /></Link>
          </div>
          <div className="dash-feed-preview">
            {posts.slice(0, 2).map(p => (
              <div key={p.id} className="dash-feed-item">
                <div className="avatar avatar-sm" style={{ background: getAvatarColor(p.authorId) }}>
                  {getInitials(p.authorName)}
                </div>
                <div className="dash-feed-content">
                  <div className="dash-feed-top">
                    <strong>{p.authorName}</strong>
                    {p.authorRole === 'nutritionist' && <span className="badge badge-primary">Expert</span>}
                    <span className="dash-feed-time">{p.createdAt}</span>
                  </div>
                  <p>{p.content.substring(0, 150)}...</p>
                  <div className="dash-feed-stats">
                    <span>❤️ {p.likes}</span>
                    <span>💬 {p.comments.length}</span>
                    <span>🔄 {p.shares}</span>
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
