import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { badges as globalBadges, leaderboard as mockLeaderboard } from '../data/challenges';
import { getInitials, getAvatarColor } from '../data/users';
import {
  challengesAPI, challengeDefinitionsAPI, groupsAPI,
} from '../services/api';
import {
  FiAward, FiTrendingUp, FiUsers, FiZap, FiCheck, FiPlus, FiX,
  FiClock, FiAlertCircle, FiUserCheck, FiTarget,
} from 'react-icons/fi';
import './Challenges.css';

const CHALLENGE_TYPES = ['daily', 'weekly', 'monthly'];

export default function Challenges() {
  const { user, updateUser } = useAuth();
  const canCreate = user?.role === 'admin' || user?.role === 'nutritionist';

  const [tab, setTab]               = useState('challenges');
  const [definitions, setDefinitions] = useState([]); // real Challenge documents (public + assigned)
  const [joined, setJoined]         = useState([]);    // UserChallenge participation records
  const [participantCounts, setParticipantCounts] = useState({});
  const [patients, setPatients]     = useState([]);    // nutritionist's own patients, for assignment
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState(null);
  const [checkingIn, setCheckingIn] = useState(null);

  // Create-challenge modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '', description: '', icon: '🎯', type: 'weekly', duration: 7,
    points: 100, visibility: 'public', assignedTo: '',
  });
  const [createError, setCreateError] = useState('');
  const [creating, setCreating]       = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const calls = [
          challengeDefinitionsAPI.getAll(),
          challengesAPI.getJoined(),
        ];
        if (canCreate) calls.push(challengeDefinitionsAPI.getMyPatients());

        const results = await Promise.all(calls);
        setDefinitions(results[0].challenges || []);
        setJoined(results[1].challenges || []);
        setParticipantCounts(results[1].participantCounts || {});
        if (canCreate) setPatients(results[2].patients || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [canCreate]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Derive earned badges from completed challenges ──
  const earnedBadgeIds = new Set(
    joined.filter(j => j.completed && j.reward?.badge).map(j => j.reward.badge)
  );
  const enrichedBadges = globalBadges.map(b => {
    const entry = joined.find(j => j.reward?.badge === b.id && j.completed);
    return { ...b, earned: earnedBadgeIds.has(b.id), earnedDate: entry ? new Date(entry.completedAt).toLocaleDateString() : null };
  });
  const earnedBadges = enrichedBadges.filter(b => b.earned);

  const getJoinedEntry = (defId) => joined.find(j => j.challengeId === defId);

  // ── Join a real challenge definition ──
  const handleJoin = async (def) => {
    try {
      const { challenge: entry } = await challengesAPI.join({
        challengeId:  def._id,
        challengeRef: def._id,
        title:        def.title,
        icon:         def.icon,
        duration:     def.duration,
        reward:       def.reward,
        groupId:      def.groupId || null,
      });
      setJoined(prev => [...prev, entry]);
      showToast(`Joined "${def.title}"! Check in daily to progress.`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCheckIn = async (entry) => {
    setCheckingIn(entry._id);
    try {
      const { challenge: updated, justCompleted } = await challengesAPI.checkIn(entry._id);
      setJoined(prev => prev.map(j => j._id === entry._id ? updated : j));
      if (justCompleted) {
        showToast(`🎉 Challenge complete! +${updated.reward?.points || 0} points earned!`);
        updateUser({ stats: { ...user?.stats, points: (user?.stats?.points || 0) + (updated.reward?.points || 0) } });
      } else {
        showToast(`✓ Checked in! Day ${updated.progress}/${updated.duration}`);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCheckingIn(null);
    }
  };

  const handleLeave = async (entry) => {
    try {
      await challengesAPI.leave(entry._id);
      setJoined(prev => prev.filter(j => j._id !== entry._id));
      showToast('Left challenge.');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const checkedInToday = (entry) => {
    if (!entry.lastCheckIn) return false;
    const today    = new Date().toISOString().split('T')[0];
    const lastDate = new Date(entry.lastCheckIn).toISOString().split('T')[0];
    return lastDate === today;
  };

  // ── Create a new challenge definition (admin / nutritionist) ──
  const handleCreateField = (key, value) => setCreateForm(prev => ({ ...prev, [key]: value }));

  const handleCreateSubmit = async () => {
    setCreateError('');
    if (!createForm.title.trim())        return setCreateError('Title is required.');
    if (!createForm.description.trim())  return setCreateError('Description is required.');
    if (!createForm.duration || createForm.duration < 1) return setCreateError('Duration must be at least 1 day.');
    if (createForm.visibility === 'assigned' && !createForm.assignedTo)
      return setCreateError('Select a patient to assign this challenge to.');

    setCreating(true);
    try {
      const { challenge } = await challengeDefinitionsAPI.create({
        title:       createForm.title.trim(),
        description: createForm.description.trim(),
        icon:        createForm.icon,
        type:        createForm.type,
        duration:    Number(createForm.duration),
        reward:      { points: Number(createForm.points) || 0 },
        visibility:  createForm.visibility,
        assignedTo:  createForm.visibility === 'assigned' ? createForm.assignedTo : null,
      });
      setDefinitions(prev => [challenge, ...prev]);
      showToast(`Challenge "${challenge.title}" created.`);
      setShowCreate(false);
      setCreateForm({ title: '', description: '', icon: '🎯', type: 'weekly', duration: 7, points: 100, visibility: 'public', assignedTo: '' });
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const publicDefs   = definitions.filter(d => d.visibility === 'public');
  const assignedDefs = definitions.filter(d => d.visibility === 'assigned' && d.assignedTo === user?._id);
  const joinedActive   = joined.filter(j => !j.completed);
  const joinedComplete = joined.filter(j => j.completed);

  return (
    <div className="challenges-page">

      {toast && (
        <div className={`planner-toast planner-toast-${toast.type}`}>
          {toast.type === 'error' ? <FiX /> : <FiCheck />} {toast.msg}
        </div>
      )}

      <div className="challenges-header">
        <div>
          <h2>Challenges & Achievements</h2>
          <p>Stay motivated with fun challenges and earn badges</p>
        </div>
        {canCreate && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            <FiPlus /> Create Challenge
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="challenges-stats">
        <div className="stat-card">
          <div className="stat-icon stat-icon-primary"><FiZap /></div>
          <div className="stat-content">
            <h4>{joinedActive.length}</h4>
            <p>Active Challenges</p>
            <span className="stat-change positive">{joinedComplete.length} completed</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-secondary"><FiAward /></div>
          <div className="stat-content">
            <h4>{earnedBadges.length}</h4>
            <p>Badges Earned</p>
            <span className="stat-change positive">of {enrichedBadges.length} total</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-accent"><FiTrendingUp /></div>
          <div className="stat-content">
            <h4>{user?.stats?.points || 0}</h4>
            <p>Total Points</p>
            <span className="stat-change positive">Level {user?.stats?.level || 1}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--space-2xl)', maxWidth: '440px' }}>
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

      {/* ── Challenges Tab ── */}
      {tab === 'challenges' && (
        <>
          {/* Assigned to me — highlighted distinctly */}
          {assignedDefs.length > 0 && (
            <>
              <h3 style={{ marginBottom: 'var(--space-lg)' }}>
                <FiUserCheck style={{ marginRight: 6, color: 'var(--secondary)' }} />
                Assigned to You
              </h3>
              <div className="challenges-grid" style={{ marginBottom: 'var(--space-2xl)' }}>
                {assignedDefs.map(def => {
                  const entry = getJoinedEntry(def._id);
                  return (
                    <div key={def._id} className="challenge-card card assigned-challenge">
                      <div className="challenge-top">
                        <span className="challenge-icon-big">{def.icon}</span>
                        <span className="badge badge-secondary">Assigned</span>
                      </div>
                      <h3>{def.title}</h3>
                      <p>{def.description}</p>
                      <div className="challenge-footer">
                        <span className="challenge-reward">🏆 {def.reward.points} pts</span>
                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                          {def.duration} days
                        </span>
                      </div>
                      {!entry && (
                        <button className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: 'var(--space-md)' }}
                          onClick={() => handleJoin(def)}>
                          <FiPlus /> Start Challenge
                        </button>
                      )}
                      {entry && !entry.completed && (
                        <div className="challenge-joined-badge"><FiCheck /> In progress — {entry.progress}/{entry.duration} days</div>
                      )}
                      {entry?.completed && (
                        <div className="challenge-joined-badge" style={{ background: 'rgba(78,191,143,0.15)' }}>
                          <FiCheck /> Completed
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* My active joined challenges with check-in */}
          {joinedActive.length > 0 && (
            <>
              <h3 style={{ marginBottom: 'var(--space-lg)' }}>My Active Challenges</h3>
              <div className="challenges-grid" style={{ marginBottom: 'var(--space-2xl)' }}>
                {joinedActive.map(entry => {
                  const alreadyIn = checkedInToday(entry);
                  return (
                    <div key={entry._id} className="challenge-card card active-challenge">
                      <div className="challenge-top">
                        <span className="challenge-icon-big">{entry.icon}</span>
                        <button className="challenge-leave-btn" onClick={() => handleLeave(entry)} title="Leave challenge">
                          <FiX />
                        </button>
                      </div>
                      <h3>{entry.title}</h3>
                      <div style={{ margin: 'var(--space-lg) 0' }}>
                        <div className="dash-macro-label">
                          <span>Progress</span>
                          <span>{entry.progress}/{entry.duration} days</span>
                        </div>
                        <div className="progress-bar" style={{ marginTop: '8px' }}>
                          <div className="progress-bar-fill" style={{ width: `${(entry.progress / entry.duration) * 100}%` }} />
                        </div>
                      </div>
                      <div className="challenge-footer">
                        <span className="challenge-reward">🏆 {entry.reward?.points || 0} pts</span>
                        {entry.lastCheckIn && (
                          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                            <FiClock /> Last: {new Date(entry.lastCheckIn).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <button className={`btn btn-sm ${alreadyIn ? 'btn-ghost' : 'btn-primary'}`}
                        style={{ width: '100%', marginTop: 'var(--space-md)' }}
                        onClick={() => !alreadyIn && handleCheckIn(entry)}
                        disabled={alreadyIn || checkingIn === entry._id}>
                        {checkingIn === entry._id ? 'Checking in...' : alreadyIn ? '✓ Checked in today' : 'Check In Today'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Public catalog */}
          <h3 style={{ marginBottom: 'var(--space-lg)' }}>Public Challenges</h3>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading challenges...</p>
          ) : publicDefs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No public challenges yet.</p>
          ) : (
            <div className="challenges-grid">
              {publicDefs.map(def => {
                const entry = getJoinedEntry(def._id);
                return (
                  <div key={def._id} className={`challenge-card card ${entry ? 'already-joined' : ''}`}>
                    <div className="challenge-top">
                      <span className="challenge-icon-big">{def.icon}</span>
                      <span className="badge badge-primary">{def.type}</span>
                    </div>
                    <h3>{def.title}</h3>
                    <p>{def.description}</p>
                    <div className="challenge-footer">
                      <span className="challenge-participants">
                        <FiUsers /> {(participantCounts[def._id] || 0).toLocaleString()} joined
                      </span>
                      <span className="challenge-reward">🏆 {def.reward.points} pts</span>
                      <span className="challenge-deadline">{def.duration} days</span>
                    </div>
                    {!entry && (
                      <button className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: 'var(--space-md)' }}
                        onClick={() => handleJoin(def)}>
                        <FiPlus /> Join Challenge
                      </button>
                    )}
                    {entry && (
                      <div className="challenge-joined-badge"><FiCheck /> Joined</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Completed */}
          {joinedComplete.length > 0 && (
            <>
              <h3 style={{ margin: 'var(--space-2xl) 0 var(--space-lg)' }}>Completed ✅</h3>
              <div className="challenges-grid">
                {joinedComplete.map(entry => (
                  <div key={entry._id} className="challenge-card card completed">
                    <div className="challenge-top">
                      <span className="challenge-icon-big">{entry.icon}</span>
                      <span className="badge badge-success">Completed!</span>
                    </div>
                    <h3>{entry.title}</h3>
                    <div className="challenge-footer">
                      <span className="challenge-reward">🏆 +{entry.reward?.points || 0} pts earned</span>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                        {entry.completedAt ? new Date(entry.completedAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Badges Tab ── */}
      {tab === 'badges' && (
        <div className="badges-grid">
          {enrichedBadges.map(b => (
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

      {/* ── Leaderboard Tab (global mock — group leaderboard lives on Groups page) ── */}
      {tab === 'leaderboard' && (
        <div className="card leaderboard-card">
          <h3 style={{ marginBottom: 'var(--space-xl)' }}>🏆 Community Leaderboard</h3>
          <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
            Platform-wide ranking. For your group's leaderboard, visit the <a href="/groups" style={{ color: 'var(--primary)' }}>Groups page</a>.
          </p>
          <div className="leaderboard-list">
            {mockLeaderboard.map((entry, i) => (
              <div key={entry.rank} className={`leaderboard-item ${entry.userId === user?._id ? 'current-user' : ''}`}>
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

      {/* ── Create Challenge Modal ── */}
      {showCreate && canCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal form-modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Challenge</h3>
              <button className="modal-close" onClick={() => setShowCreate(false)}><FiX /></button>
            </div>
            <div style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', maxHeight: '60vh', overflowY: 'auto' }}>
              {createError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger, #e8735a)', fontSize: 'var(--font-sm)', padding: 'var(--space-sm)', background: 'rgba(232,115,90,0.1)', borderRadius: 'var(--radius-md)' }}>
                  <FiAlertCircle /> {createError}
                </div>
              )}
              <label className="profile-edit-field">
                <span>Title *</span>
                <input value={createForm.title} onChange={e => handleCreateField('title', e.target.value)} placeholder="e.g. 14-Day No Sugar Challenge" />
              </label>
              <label className="profile-edit-field">
                <span>Description *</span>
                <textarea rows={3} value={createForm.description} onChange={e => handleCreateField('description', e.target.value)}
                  placeholder="What does the participant need to do?" style={{ width: '100%', resize: 'vertical' }} />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <label className="profile-edit-field">
                  <span>Icon (emoji)</span>
                  <input value={createForm.icon} onChange={e => handleCreateField('icon', e.target.value)} maxLength={2} />
                </label>
                <label className="profile-edit-field">
                  <span>Type</span>
                  <select value={createForm.type} onChange={e => handleCreateField('type', e.target.value)}>
                    {CHALLENGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label className="profile-edit-field">
                  <span>Duration (days) *</span>
                  <input type="number" min="1" value={createForm.duration} onChange={e => handleCreateField('duration', e.target.value)} />
                </label>
                <label className="profile-edit-field">
                  <span>Reward Points</span>
                  <input type="number" min="0" value={createForm.points} onChange={e => handleCreateField('points', e.target.value)} />
                </label>
              </div>

              <label className="profile-edit-field">
                <span>Visibility</span>
                <select value={createForm.visibility} onChange={e => handleCreateField('visibility', e.target.value)}>
                  <option value="public">Public — anyone can join</option>
                  {user?.role === 'nutritionist' && (
                    <option value="assigned">Assigned — only one specific patient</option>
                  )}
                </select>
              </label>

              {createForm.visibility === 'assigned' && (
                <label className="profile-edit-field">
                  <span>Assign to Patient *</span>
                  <select value={createForm.assignedTo} onChange={e => handleCreateField('assignedTo', e.target.value)}>
                    <option value="">Select a patient...</option>
                    {patients.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                  {patients.length === 0 && (
                    <small style={{ color: 'var(--text-muted)' }}>You have no patients assigned to you yet.</small>
                  )}
                </label>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateSubmit} disabled={creating}>
                {creating ? 'Creating...' : 'Create Challenge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
