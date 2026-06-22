import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { progressAPI } from '../services/api';
import { FiTrendingUp, FiTrendingDown, FiTarget, FiCalendar, FiDroplet, FiPlus, FiX } from 'react-icons/fi';
import './Progress.css';

// Fallback mock data shown until the user has logged real entries
const MOCK_WEIGHT = [
  { week:'W1', value:80 },{ week:'W2', value:79.5 },{ week:'W3', value:79.2 },
  { week:'W4', value:78.8 },{ week:'W5', value:78.5 },{ week:'W6', value:78.1 },
  { week:'W7', value:78 },{ week:'W8', value:77.6 },
];
const MOCK_CALORIES = [
  { day:'Mon', value:2100 },{ day:'Tue', value:1950 },{ day:'Wed', value:2200 },
  { day:'Thu', value:1800 },{ day:'Fri', value:2050 },{ day:'Sat', value:2300 },
  { day:'Sun', value:1900 },
];

export default function Progress() {
  const { user } = useAuth();

  const [timeframe, setTimeframe]     = useState('8W');
  const [loading, setLoading]         = useState(true);
  const [weightHistory, setWeightHistory] = useState(MOCK_WEIGHT);
  const [weeklyCalories, setWeeklyCalories] = useState(MOCK_CALORIES);
  const [todayLog, setTodayLog]       = useState(null);
  const [usingMock, setUsingMock]     = useState(true);

  // Weight log modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [weightInput, setWeightInput]   = useState('');
  const [waterInput, setWaterInput]     = useState('');
  const [notesInput, setNotesInput]     = useState('');
  const [logSaving, setLogSaving]       = useState(false);
  const [logError, setLogError]         = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await progressAPI.get();
        if (data.weightHistory?.length > 0) {
          setWeightHistory(data.weightHistory);
          setUsingMock(false);
        }
        if (data.weeklyCalories) setWeeklyCalories(data.weeklyCalories);
        if (data.todayLog)       setTodayLog(data.todayLog);
      } catch (err) {
        console.error('Failed to load progress:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLogWeight = async () => {
    if (!weightInput || Number(weightInput) <= 0) {
      setLogError('Please enter a valid weight.'); return;
    }
    setLogSaving(true); setLogError('');
    try {
      const { log } = await progressAPI.logWeight(
        Number(weightInput),
        new Date().toISOString().split('T')[0],
        notesInput,
        Number(waterInput) || 0,
      );
      const today = new Date().toISOString().split('T')[0];
      setWeightHistory(prev => {
        const existingIndex = prev.findIndex(e => e.date === today);
        const newEntry = { week: `W${prev.length + 1}`, date: today, value: log.weight };
        if (existingIndex >= 0) {
          // Update existing today's entry
          const next = [...prev];
          next[existingIndex] = { ...next[existingIndex], value: log.weight };
          return next;
        }
        // New entry
        return usingMock ? [newEntry] : [...prev, newEntry];
      });
      setUsingMock(false);
      setTodayLog(log);
      setShowLogModal(false);
      setWeightInput(''); setWaterInput(''); setNotesInput('');
    } catch (err) {
      setLogError(err.message);
    } finally {
      setLogSaving(false);
    }
  };

  const todayHasEntry = todayLog?.weight !== null && todayLog?.weight !== undefined;

  const openLogModal = () => {
    // Pre-fill with today's existing values if already logged
    if (todayHasEntry) {
      setWeightInput(String(todayLog.weight));
      setWaterInput(String(todayLog.waterIntake || ''));
      setNotesInput(todayLog.notes || '');
    } else {
      setWeightInput('');
      setWaterInput('');
      setNotesInput('');
    }
    setLogError('');
    setShowLogModal(true);
  };

  const handleToggleHabit = async (habit) => {
    const newVal = !habit.completed;
    // Optimistic update
    setTodayLog(prev => ({
      ...prev,
      habits: prev.habits.map(h =>
        h.name === habit.name ? { ...h, completed: newVal } : h
      ),
    }));
    try {
      await progressAPI.toggleHabit(habit.name, newVal);
    } catch (err) {
      // Revert on failure
      setTodayLog(prev => ({
        ...prev,
        habits: prev.habits.map(h =>
          h.name === habit.name ? { ...h, completed: !newVal } : h
        ),
      }));
    }
  };

  // Chart math
  const displayWeight = weightHistory.slice(
    timeframe === '4W' ? -4 : timeframe === '12W' ? -12 : timeframe === '6M' ? -24 : -8
  );
  const maxWeight  = Math.max(...displayWeight.map(d => d.value));
  const minWeight  = Math.min(...displayWeight.map(d => d.value));
  const weightRange = maxWeight - minWeight || 1;
  const maxCal     = Math.max(...weeklyCalories.map(d => d.value)) || 1;

  const latestWeight = weightHistory[weightHistory.length - 1]?.value;
  const firstWeight  = weightHistory[0]?.value;
  const weightDiff   = latestWeight && firstWeight ? (latestWeight - firstWeight).toFixed(1) : null;
  const targetWeight = user?.profile?.targetWeight;

  const completedHabits = todayLog?.habits?.filter(h => h.completed).length || 0;
  const totalHabits     = todayLog?.habits?.length || 6;

  return (
    <div className="progress-page">
      <div className="progress-header">
        <div>
          <h2>Progress Tracking</h2>
          <p>Monitor your nutrition journey over time</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openLogModal}>
          <FiPlus /> {todayHasEntry ? 'Edit Today\'s Entry' : 'Log Today\'s Weight'}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="progress-stats">
        <div className="stat-card">
          <div className={`stat-icon stat-icon-primary`}>
            {weightDiff && Number(weightDiff) < 0 ? <FiTrendingDown /> : <FiTrendingUp />}
          </div>
          <div className="stat-content">
            <h4>{weightDiff ? `${weightDiff > 0 ? '+' : ''}${weightDiff} kg` : '—'}</h4>
            <p>Weight Change</p>
            <span className="stat-change positive">
              {usingMock ? 'Log weight to track' : `Last ${weightHistory.length} entries`}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-secondary"><FiTarget /></div>
          <div className="stat-content">
            <h4>{latestWeight ? `${latestWeight} kg` : '—'}</h4>
            <p>Current Weight</p>
            <span className="stat-change positive">
              {todayHasEntry
                ? '✓ Logged today'
                : targetWeight ? `Goal: ${targetWeight} kg` : 'Set goal in Profile'
              }
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-accent"><FiCalendar /></div>
          <div className="stat-content">
            <h4>{completedHabits}/{totalHabits}</h4>
            <p>Habits Today</p>
            <span className="stat-change positive">
              {completedHabits === totalHabits ? 'All done! 🎉' : `${totalHabits - completedHabits} remaining`}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-info"><FiDroplet /></div>
          <div className="stat-content">
            <h4>{todayLog?.waterIntake ? `${todayLog.waterIntake}L` : '—'}</h4>
            <p>Water Today</p>
            <span className="stat-change positive">Goal: 2L</span>
          </div>
        </div>
      </div>

      <div className="progress-grid">

        {/* Weight Chart */}
        <div className="card">
          <div className="chart-header">
            <div>
              <h3>Weight Progress</h3>
              {usingMock && (
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                  Sample data — log your weight to see real progress
                </p>
              )}
            </div>
            <div className="tabs" style={{ padding: '2px' }}>
              {['4W','8W','12W','6M'].map(t => (
                <button key={t} className={`tab ${timeframe === t ? 'active' : ''}`}
                  onClick={() => setTimeframe(t)}
                  style={{ padding: '4px 12px', fontSize: '12px' }}>{t}</button>
              ))}
            </div>
          </div>
          <div className="chart-container">
            <div className="chart-y-axis">
              <span>{maxWeight} kg</span>
              <span>{((maxWeight + minWeight) / 2).toFixed(1)}</span>
              <span>{minWeight} kg</span>
            </div>
            <div className="chart-area">
              <svg width="100%" height="200" viewBox="0 0 700 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={`M ${displayWeight.map((d, i) =>
                  `${(i / Math.max(displayWeight.length - 1, 1)) * 700},${200 - ((d.value - minWeight) / weightRange) * 160 - 20}`
                ).join(' L ')} L 700,200 L 0,200 Z`} fill="url(#weightGrad)" />
                <polyline
                  points={displayWeight.map((d, i) =>
                    `${(i / Math.max(displayWeight.length - 1, 1)) * 700},${200 - ((d.value - minWeight) / weightRange) * 160 - 20}`
                  ).join(' ')}
                  fill="none" stroke="var(--primary)" strokeWidth="3"
                  strokeLinejoin="round" strokeLinecap="round" />
                {displayWeight.map((d, i) => (
                  <circle key={i}
                    cx={(i / Math.max(displayWeight.length - 1, 1)) * 700}
                    cy={200 - ((d.value - minWeight) / weightRange) * 160 - 20}
                    r="5" fill="var(--primary)" stroke="var(--bg-primary)" strokeWidth="2">
                    <title>{d.value} kg{d.date ? ` — ${d.date}` : ''}</title>
                  </circle>
                ))}
              </svg>
              <div className="chart-x-labels">
                {displayWeight.map(d => <span key={d.week}>{d.week}</span>)}
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Calories */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xl)' }}>
            <div>
              <h3>Weekly Calories</h3>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                From your meal plan
              </p>
            </div>
          </div>
          <div className="cal-bars">
            {weeklyCalories.map(d => (
              <div key={d.day} className="cal-bar-col">
                <span className="cal-bar-value">{d.value || 0}</span>
                <div className="cal-bar-track">
                  <div className="cal-bar-fill" style={{
                    height: `${(d.value / maxCal) * 100}%`,
                    background: d.value > 2200 ? 'var(--accent)' : d.value > 2000 ? 'var(--secondary)' : 'var(--primary)'
                  }} />
                </div>
                <span className="cal-bar-label">{d.day}</span>
              </div>
            ))}
          </div>
          <div className="cal-legend">
            <span><span className="cal-dot" style={{ background: 'var(--primary)' }} /> On track</span>
            <span><span className="cal-dot" style={{ background: 'var(--secondary)' }} /> Moderate</span>
            <span><span className="cal-dot" style={{ background: 'var(--accent)' }} /> Over limit</span>
          </div>
        </div>

        {/* Habit Tracker */}
        <div className="card full-width">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
            <h3>Daily Habits</h3>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>
          {loading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>Loading habits...</p>
          ) : (
            <div className="habits-grid">
              {(todayLog?.habits || []).map(h => (
                <div
                  key={h.name}
                  className={`habit-card ${h.completed ? 'done' : ''}`}
                  onClick={() => handleToggleHabit(h)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="habit-icon">{h.icon}</span>
                  <strong>{h.name}</strong>
                  <div className="progress-bar" style={{ height: '4px', margin: '8px 0' }}>
                    <div className="progress-bar-fill" style={{ width: h.completed ? '100%' : '0%', transition: 'width 0.3s ease' }} />
                  </div>
                  <span className="habit-streak">
                    {h.completed ? 'Done today ✓' : 'Tap to complete'}
                  </span>
                  <div className={`habit-check ${h.completed ? 'checked' : ''}`}>
                    {h.completed ? '✓' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Log Weight Modal */}
      {showLogModal && (
        <div className="modal-overlay" onClick={() => setShowLogModal(false)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{todayHasEntry ? 'Edit Today\'s Entry' : 'Log Today\'s Entry'}</h3>
                <p className="modal-subtitle">
                  {todayHasEntry
                    ? `Already logged ${todayLog.weight}kg today — update below`
                    : new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                  }
                </p>
              </div>
              <button className="modal-close" onClick={() => setShowLogModal(false)}><FiX /></button>
            </div>
            <div style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              {logError && (
                <div style={{ color: 'var(--danger, #e8735a)', fontSize: 'var(--font-sm)', padding: 'var(--space-sm)', background: 'rgba(232,115,90,0.1)', borderRadius: 'var(--radius-md)' }}>
                  {logError}
                </div>
              )}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Weight (kg) *
                </span>
                <input type="number" min="1" max="500" step="0.1"
                  value={weightInput} onChange={e => setWeightInput(e.target.value)}
                  placeholder="e.g. 78.5" autoFocus />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Water intake (litres)
                </span>
                <input type="number" min="0" max="10" step="0.1"
                  value={waterInput} onChange={e => setWaterInput(e.target.value)}
                  placeholder="e.g. 2.0" />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Notes (optional)
                </span>
                <input type="text" value={notesInput} onChange={e => setNotesInput(e.target.value)}
                  placeholder="How are you feeling today?" />
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowLogModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleLogWeight} disabled={logSaving}>
                {logSaving ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
