import { useState, useEffect } from 'react';
import { applicationsAPI } from '../services/api';
import {
  FiUsers, FiUserCheck, FiDollarSign, FiActivity,
  FiAlertTriangle, FiTrendingUp, FiBarChart2, FiPieChart,
  FiCheck, FiX,
} from 'react-icons/fi';
import './AdminDashboard.css';

const adminStats = [
  { icon: FiUsers,      label: 'Total Users',   value: '52,430', change: '+12%', color: 'primary' },
  { icon: FiUserCheck,  label: 'Active Today',  value: '8,245',  change: '+5%',  color: 'info' },
  { icon: FiDollarSign, label: 'Revenue',       value: '$45.2K', change: '+18%', color: 'secondary' },
  { icon: FiActivity,   label: 'Consultations', value: '1,234',  change: '+8%',  color: 'accent' },
];

const recentUsers = [
  { name: 'Olivia Brown', email: 'olivia@email.com', plan: 'premium', joined: '2h ago',  status: 'active' },
  { name: 'Ethan Davis',  email: 'ethan@email.com',  plan: 'free',    joined: '5h ago',  status: 'active' },
  { name: 'Sophia Lee',   email: 'sophia@email.com', plan: 'pro',     joined: '1d ago',  status: 'active' },
  { name: 'Noah Taylor',  email: 'noah@email.com',   plan: 'free',    joined: '2d ago',  status: 'inactive' },
  { name: 'Emma White',   email: 'emma@email.com',   plan: 'premium', joined: '3d ago',  status: 'active' },
];

const reportItems = [
  { type: 'spam',          content: 'Advertising supplements in community...', reporter: 'Maria G.',  time: '1h ago' },
  { type: 'inappropriate', content: 'Misleading health claims about...',        reporter: 'James W.', time: '3h ago' },
];

const statusStyle = {
  pending:  { background: 'var(--warning, #f5a623)', color: '#fff' },
  approved: { background: 'var(--primary)',           color: '#fff' },
  rejected: { background: 'var(--danger, #e8735a)',   color: '#fff' },
};

export default function AdminDashboard() {
  const [applications, setApplications] = useState([]);
  const [expandedApp, setExpandedApp]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [reviewNotes, setReviewNotes]   = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const { applications } = await applicationsAPI.getAll();
        setApplications(applications);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const { application } = await applicationsAPI.review(id, status, reviewNotes[id] || '');
      setApplications(prev => prev.map(a => a._id === id ? application : a));
      if (expandedApp === id) setExpandedApp(null);
    } catch (err) {
      console.error(err);
    }
  };

  const pendingCount = applications.filter(a => a.status === 'pending').length;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <p>Platform overview and management</p>
      </div>

      <div className="admin-stats">
        {adminStats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className={`stat-icon stat-icon-${s.color}`}><s.icon /></div>
            <div className="stat-content">
              <h4>{s.value}</h4>
              <p>{s.label}</p>
              <span className="stat-change positive">{s.change} this month</span>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-grid">
        <div className="card">
          <h3><FiBarChart2 /> User Growth</h3>
          <div className="admin-chart">
            {['Jan','Feb','Mar','Apr','May','Jun'].map((m, i) => (
              <div key={m} className="admin-bar-col">
                <div className="admin-bar" style={{ height: `${30 + i * 15}%` }}></div>
                <span>{m}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3><FiPieChart /> Subscription Mix</h3>
          <div className="admin-pie-legend">
            <div className="admin-pie-visual">
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" fill="none" stroke="var(--primary)"   strokeWidth="20" strokeDasharray="220 220" transform="rotate(-90 80 80)" />
                <circle cx="80" cy="80" r="70" fill="none" stroke="var(--secondary)" strokeWidth="20" strokeDasharray="110 330" strokeDashoffset="-220" transform="rotate(-90 80 80)" />
                <circle cx="80" cy="80" r="70" fill="none" stroke="var(--accent)"    strokeWidth="20" strokeDasharray="110 330" strokeDashoffset="-330" transform="rotate(-90 80 80)" />
              </svg>
            </div>
            <div className="admin-legend">
              <div className="admin-legend-item"><span className="legend-dot" style={{ background:'var(--primary)' }}></span> Free (50%)</div>
              <div className="admin-legend-item"><span className="legend-dot" style={{ background:'var(--secondary)' }}></span> Premium (25%)</div>
              <div className="admin-legend-item"><span className="legend-dot" style={{ background:'var(--accent)' }}></span> Pro (25%)</div>
            </div>
          </div>
        </div>

        {/* Nutritionist Applications */}
        <div className="card full-width">
          <div className="admin-section-header">
            <h3><FiUserCheck /> Nutritionist Applications</h3>
            {pendingCount > 0 && <span className="admin-pending-badge">{pendingCount} pending</span>}
          </div>

          {loading ? (
            <p className="admin-empty">Loading applications...</p>
          ) : applications.length === 0 ? (
            <p className="admin-empty">No applications yet.</p>
          ) : (
            <div className="admin-applications">
              {applications.map(app => (
                <div key={app._id} className="admin-app-card">
                  <div className="admin-app-header"
                    onClick={() => setExpandedApp(expandedApp === app._id ? null : app._id)}>
                    <div className="admin-app-info">
                      <strong>{app.userName}</strong>
                      <span>{app.userEmail}</span>
                      <span className="admin-app-title">{app.title}</span>
                    </div>
                    <div className="admin-app-meta">
                      <span className="admin-app-time">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                      <span className="admin-app-status" style={statusStyle[app.status]}>
                        {app.status}
                      </span>
                    </div>
                  </div>

                  {expandedApp === app._id && (
                    <div className="admin-app-detail">
                      <div className="admin-app-detail-grid">
                        <div><span>Location</span><strong>{app.location}</strong></div>
                        <div><span>Experience</span><strong>{app.experience} years</strong></div>
                        <div><span>Rate</span><strong>${app.consultationRate}/hr</strong></div>
                        <div><span>Credentials</span><strong>{app.credentials}</strong></div>
                        <div><span>Languages</span><strong>{app.languages || '—'}</strong></div>
                        <div><span>Consultation</span><strong>{(app.consultationTypes || []).join(', ')}</strong></div>
                      </div>
                      <div className="admin-app-bio"><span>Bio</span><p>{app.bio}</p></div>
                      <div className="admin-app-bio"><span>Motivation</span><p>{app.motivation}</p></div>
                      <div className="admin-app-specs">
                        <span>Specializations</span>
                        <div className="admin-app-tags">
                          {(app.specializations || []).map(s => (
                            <span key={s} className="tag">{s.replace(/_/g, ' ')}</span>
                          ))}
                        </div>
                      </div>
                      {app.status === 'pending' && (
                        <>
                          <label className="admin-app-notes">
                            <span>Review Notes (optional)</span>
                            <textarea
                              rows={2}
                              value={reviewNotes[app._id] || ''}
                              onChange={e => setReviewNotes(prev => ({ ...prev, [app._id]: e.target.value }))}
                              placeholder="Add notes for the applicant..."
                            />
                          </label>
                          <div className="admin-app-actions">
                            <button className="btn btn-ghost btn-sm" onClick={() => updateStatus(app._id, 'rejected')}>
                              <FiX /> Reject
                            </button>
                            <button className="btn btn-primary btn-sm" onClick={() => updateStatus(app._id, 'approved')}>
                              <FiCheck /> Approve
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="card full-width">
          <h3><FiUsers /> Recent Users</h3>
          <div className="admin-table">
            <div className="admin-table-header">
              <span>Name</span><span>Email</span><span>Plan</span><span>Joined</span><span>Status</span>
            </div>
            {recentUsers.map((u, i) => (
              <div key={i} className="admin-table-row">
                <span className="admin-user-name">{u.name}</span>
                <span className="admin-user-email">{u.email}</span>
                <span><span className={`badge badge-${u.plan === 'pro' ? 'secondary' : u.plan === 'premium' ? 'primary' : 'info'}`}>{u.plan}</span></span>
                <span>{u.joined}</span>
                <span><span className={`badge badge-${u.status === 'active' ? 'success' : 'accent'}`}>{u.status}</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Reported Content */}
        <div className="card">
          <h3><FiAlertTriangle /> Reported Content</h3>
          <div className="admin-reports">
            {reportItems.map((r, i) => (
              <div key={i} className="admin-report-item">
                <span className="badge badge-accent">{r.type}</span>
                <p>{r.content}</p>
                <div className="admin-report-meta"><span>By {r.reporter}</span><span>{r.time}</span></div>
                <div className="admin-report-actions">
                  <button className="btn btn-ghost btn-sm">Dismiss</button>
                  <button className="btn btn-danger btn-sm">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Health */}
        <div className="card">
          <h3><FiTrendingUp /> Platform Health</h3>
          <div className="admin-health">
            {[
              { label: 'Uptime',          value: '99.9%', color: 'var(--primary)' },
              { label: 'API Response',    value: '45ms',  color: 'var(--primary)' },
              { label: 'Error Rate',      value: '0.02%', color: 'var(--primary)' },
              { label: 'Active Sessions', value: '8,245', color: 'var(--secondary)' },
            ].map(h => (
              <div key={h.label} className="admin-health-item">
                <span className="admin-health-label">{h.label}</span>
                <strong style={{ color: h.color }}>{h.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
