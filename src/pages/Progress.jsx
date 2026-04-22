import { useState } from 'react';
import { FiTrendingUp, FiTrendingDown, FiTarget, FiCalendar, FiDroplet } from 'react-icons/fi';
import './Progress.css';

const weightData = [
  { week: 'W1', value: 80 }, { week: 'W2', value: 79.5 }, { week: 'W3', value: 79.2 },
  { week: 'W4', value: 78.8 }, { week: 'W5', value: 78.5 }, { week: 'W6', value: 78.1 },
  { week: 'W7', value: 78 }, { week: 'W8', value: 77.6 },
];

const calorieData = [
  { day: 'Mon', value: 2100 }, { day: 'Tue', value: 1950 }, { day: 'Wed', value: 2200 },
  { day: 'Thu', value: 1800 }, { day: 'Fri', value: 2050 }, { day: 'Sat', value: 2300 },
  { day: 'Sun', value: 1900 },
];

const habits = [
  { name: '2L Water', icon: '💧', streak: 14, total: 30, done: true },
  { name: '30min Exercise', icon: '🏃', streak: 8, total: 30, done: true },
  { name: '8h Sleep', icon: '😴', streak: 6, total: 30, done: false },
  { name: 'No Sugar', icon: '🚫', streak: 3, total: 30, done: true },
  { name: 'Meal Logging', icon: '📝', streak: 14, total: 30, done: false },
  { name: 'Veggies 5/day', icon: '🥦', streak: 10, total: 30, done: true },
];

export default function Progress() {
  const [timeframe, setTimeframe] = useState('8W');
  const maxWeight = Math.max(...weightData.map(d => d.value));
  const minWeight = Math.min(...weightData.map(d => d.value));
  const weightRange = maxWeight - minWeight || 1;
  const maxCal = Math.max(...calorieData.map(d => d.value));

  return (
    <div className="progress-page">
      <div className="progress-header">
        <h2>Progress Tracking</h2>
        <p>Monitor your nutrition journey over time</p>
      </div>

      {/* Summary Stats */}
      <div className="progress-stats">
        <div className="stat-card">
          <div className="stat-icon stat-icon-primary"><FiTrendingDown /></div>
          <div className="stat-content"><h4>-2.4 kg</h4><p>Weight Lost</p><span className="stat-change positive">Last 8 weeks</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-secondary"><FiTarget /></div>
          <div className="stat-content"><h4>78 kg</h4><p>Current Weight</p><span className="stat-change positive">Goal: 72 kg</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-accent"><FiCalendar /></div>
          <div className="stat-content"><h4>14</h4><p>Day Streak</p><span className="stat-change positive">Personal best!</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-info"><FiDroplet /></div>
          <div className="stat-content"><h4>2.1L</h4><p>Avg. Water</p><span className="stat-change positive">↑ 0.3L</span></div>
        </div>
      </div>

      <div className="progress-grid">
        {/* Weight Chart */}
        <div className="card">
          <div className="chart-header">
            <h3>Weight Progress</h3>
            <div className="tabs" style={{ padding: '2px' }}>
              {['4W', '8W', '12W', '6M'].map(t => (
                <button key={t} className={`tab ${timeframe === t ? 'active' : ''}`} onClick={() => setTimeframe(t)}
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
                {/* Area fill */}
                <path d={`M ${weightData.map((d, i) => `${(i / (weightData.length - 1)) * 700},${200 - ((d.value - minWeight) / weightRange) * 160 - 20}`).join(' L ')} L 700,200 L 0,200 Z`}
                  fill="url(#weightGrad)" />
                {/* Line */}
                <polyline
                  points={weightData.map((d, i) => `${(i / (weightData.length - 1)) * 700},${200 - ((d.value - minWeight) / weightRange) * 160 - 20}`).join(' ')}
                  fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                {/* Dots */}
                {weightData.map((d, i) => (
                  <circle key={i}
                    cx={(i / (weightData.length - 1)) * 700}
                    cy={200 - ((d.value - minWeight) / weightRange) * 160 - 20}
                    r="5" fill="var(--primary)" stroke="var(--bg-primary)" strokeWidth="2" />
                ))}
              </svg>
              <div className="chart-x-labels">
                {weightData.map(d => <span key={d.week}>{d.week}</span>)}
              </div>
            </div>
          </div>
        </div>

        {/* Calorie Bars */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-xl)' }}>Weekly Calories</h3>
          <div className="cal-bars">
            {calorieData.map(d => (
              <div key={d.day} className="cal-bar-col">
                <span className="cal-bar-value">{d.value}</span>
                <div className="cal-bar-track">
                  <div className="cal-bar-fill" style={{
                    height: `${(d.value / maxCal) * 100}%`,
                    background: d.value > 2200 ? 'var(--accent)' : d.value > 2000 ? 'var(--secondary)' : 'var(--primary)'
                  }}></div>
                </div>
                <span className="cal-bar-label">{d.day}</span>
              </div>
            ))}
          </div>
          <div className="cal-legend">
            <span><span className="cal-dot" style={{ background: 'var(--primary)' }}></span> On track</span>
            <span><span className="cal-dot" style={{ background: 'var(--secondary)' }}></span> Moderate</span>
            <span><span className="cal-dot" style={{ background: 'var(--accent)' }}></span> Over limit</span>
          </div>
        </div>

        {/* Habit Tracker */}
        <div className="card full-width">
          <h3 style={{ marginBottom: 'var(--space-xl)' }}>Daily Habits</h3>
          <div className="habits-grid">
            {habits.map(h => (
              <div key={h.name} className={`habit-card ${h.done ? 'done' : ''}`}>
                <span className="habit-icon">{h.icon}</span>
                <strong>{h.name}</strong>
                <div className="progress-bar" style={{ height: '4px', margin: '8px 0' }}>
                  <div className="progress-bar-fill" style={{ width: `${(h.streak / h.total) * 100}%` }}></div>
                </div>
                <span className="habit-streak">{h.streak}/{h.total} days</span>
                <div className={`habit-check ${h.done ? 'checked' : ''}`}>
                  {h.done ? '✓' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
