import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getInitials, getAvatarColor } from '../data/users';
import { groupsAPI, challengeDefinitionsAPI } from '../services/api';
import {
  FiUsers, FiPlus, FiX, FiCheck, FiCopy, FiAward, FiTrendingUp,
} from 'react-icons/fi';
import './Groups.css';

export default function Groups() {
  const { user } = useAuth();
  const isNutritionist = user?.role === 'nutritionist';

  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState(null);
  const [myGroup, setMyGroup]       = useState(null);
  const [groups, setGroups]         = useState([]);
  const [patients, setPatients]     = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining]       = useState(false);
  const [creating, setCreating]     = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', memberIds: [] });
  const [createError, setCreateError] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const load = async () => {
      try {
        if (isNutritionist) {
          const [groupsRes, patientsRes] = await Promise.all([
            groupsAPI.getMine(),
            challengeDefinitionsAPI.getMyPatients(),
          ]);
          setGroups(groupsRes.groups || []);
          setPatients(patientsRes.patients || []);
        } else {
          const { group } = await groupsAPI.getMyGroup();
          setMyGroup(group);
          if (group?._id) {
            const lb = await groupsAPI.getLeaderboard(group._id);
            setLeaderboard(lb.leaderboard || []);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isNutritionist]);

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      setCreateError('Group name is required.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const { group } = await groupsAPI.create(createForm);
      setGroups(prev => [group, ...prev]);
      setShowCreate(false);
      setCreateForm({ name: '', description: '', memberIds: [] });
      showToast(`Group "${group.name}" created!`);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const toggleMember = (patientId) => {
    setCreateForm(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(patientId)
        ? prev.memberIds.filter(id => id !== patientId)
        : [...prev.memberIds, patientId],
    }));
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      showToast('Enter an invite code.', 'error');
      return;
    }
    setJoining(true);
    try {
      const { group } = await groupsAPI.join(inviteCode.trim());
      setMyGroup(group);
      const lb = await groupsAPI.getLeaderboard(group._id);
      setLeaderboard(lb.leaderboard || []);
      setInviteCode('');
      showToast(`Joined "${group.name}"!`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setJoining(false);
    }
  };

  const copyInviteCode = (code) => {
    navigator.clipboard.writeText(code);
    showToast('Invite code copied!');
  };

  if (loading) {
    return (
      <div className="groups-page">
        <p style={{ color: 'var(--text-muted)', padding: 'var(--space-2xl)' }}>Loading groups...</p>
      </div>
    );
  }

  return (
    <div className="groups-page">
      {toast && (
        <div className={`groups-toast groups-toast-${toast.type}`}>
          <FiCheck /> {toast.msg}
        </div>
      )}

      <div className="groups-header">
        <div>
          <h2>Groups</h2>
          <p>
            {isNutritionist
              ? 'Create groups for your patients and track their progress together'
              : 'Join your nutritionist\'s group to compete on challenges'}
          </p>
        </div>
        {isNutritionist && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <FiPlus /> Create Group
          </button>
        )}
      </div>

      {/* ── Nutritionist view ── */}
      {isNutritionist && (
        <>
          {groups.length === 0 ? (
            <div className="card groups-empty">
              <FiUsers size={40} />
              <h3>No groups yet</h3>
              <p>Create a group and share the invite code with your patients so they can join.</p>
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                <FiPlus /> Create Your First Group
              </button>
            </div>
          ) : (
            <div className="groups-grid">
              {groups.map(group => (
                <div key={group._id} className="card group-card">
                  <div className="group-card-header">
                    <h3>{group.name}</h3>
                    {group.inviteCode && (
                      <button
                        className="invite-code-btn"
                        onClick={() => copyInviteCode(group.inviteCode)}
                        title="Copy invite code"
                      >
                        <FiCopy /> {group.inviteCode}
                      </button>
                    )}
                  </div>
                  {group.description && (
                    <p className="group-description">{group.description}</p>
                  )}
                  <div className="group-members">
                    <span className="group-members-label">
                      {group.members?.length || 0} member{(group.members?.length || 0) !== 1 ? 's' : ''}
                    </span>
                    <div className="group-member-avatars">
                      {(group.members || []).slice(0, 6).map(m => (
                        <div
                          key={m._id}
                          className="avatar avatar-sm"
                          style={{ background: getAvatarColor(m._id) }}
                          title={m.name}
                        >
                          {getInitials(m.name)}
                        </div>
                      ))}
                      {(group.members?.length || 0) > 6 && (
                        <span className="group-more">+{group.members.length - 6}</span>
                      )}
                    </div>
                  </div>
                  {group.challengeIds?.length > 0 && (
                    <div className="group-challenges">
                      <FiAward /> {group.challengeIds.length} challenge{group.challengeIds.length !== 1 ? 's' : ''} assigned
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Patient view ── */}
      {!isNutritionist && (
        <>
          {myGroup ? (
            <div className="groups-layout">
              <div className="card group-detail">
                <h3>{myGroup.name}</h3>
                {myGroup.description && <p className="group-description">{myGroup.description}</p>}
                <div className="group-members">
                  <span className="group-members-label">
                    {myGroup.members?.length || 0} members in your group
                  </span>
                  <div className="group-member-list">
                    {(myGroup.members || []).map(m => (
                      <div key={m._id} className="group-member-row">
                        <div className="avatar avatar-sm" style={{ background: getAvatarColor(m._id) }}>
                          {getInitials(m.name)}
                        </div>
                        <span>{m.name}</span>
                        <span className="member-points">{m.stats?.points || 0} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {leaderboard.length > 0 && (
                <div className="card group-leaderboard">
                  <h3><FiTrendingUp /> Group Leaderboard</h3>
                  <div className="lb-list">
                    {leaderboard.map(entry => (
                      <div key={entry.userId} className={`lb-row ${entry.userId === user?._id ? 'lb-you' : ''}`}>
                        <span className="lb-rank">#{entry.rank}</span>
                        <div className="avatar avatar-sm" style={{ background: getAvatarColor(entry.userId) }}>
                          {getInitials(entry.name)}
                        </div>
                        <span className="lb-name">{entry.name}{entry.userId === user?._id ? ' (you)' : ''}</span>
                        <span className="lb-stat">{entry.completedCount} challenges</span>
                        <span className="lb-points">{entry.totalPoints} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card groups-join">
              <FiUsers size={40} />
              <h3>Join a Group</h3>
              <p>Ask your nutritionist for an invite code, then enter it below to join their group.</p>
              <div className="join-form">
                <input
                  type="text"
                  placeholder="Enter invite code (e.g. ABC123)"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  maxLength={8}
                />
                <button className="btn btn-primary" onClick={handleJoin} disabled={joining}>
                  {joining ? 'Joining...' : 'Join Group'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Create Group Modal ── */}
      {showCreate && isNutritionist && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal form-modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Create Group</h3>
                <p className="modal-subtitle">Patients can join using the invite code you'll receive</p>
              </div>
              <button className="modal-close" onClick={() => setShowCreate(false)}><FiX /></button>
            </div>
            <div style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', maxHeight: '60vh', overflowY: 'auto' }}>
              {createError && (
                <div style={{ color: 'var(--danger)', fontSize: 'var(--font-sm)', padding: 'var(--space-sm)', background: 'rgba(232,115,90,0.1)', borderRadius: 'var(--radius-md)' }}>
                  {createError}
                </div>
              )}
              <label className="groups-field">
                <span>Group Name *</span>
                <input
                  value={createForm.name}
                  onChange={e => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Weight Loss Warriors"
                  autoFocus
                />
              </label>
              <label className="groups-field">
                <span>Description</span>
                <textarea
                  rows={2}
                  value={createForm.description}
                  onChange={e => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What's this group about?"
                />
              </label>
              {patients.length > 0 && (
                <div className="groups-field">
                  <span>Add Patients (optional)</span>
                  <div className="patient-checklist">
                    {patients.map(p => (
                      <label key={p._id} className="patient-check-item">
                        <input
                          type="checkbox"
                          checked={createForm.memberIds.includes(p._id)}
                          onChange={() => toggleMember(p._id)}
                        />
                        <div className="avatar avatar-sm" style={{ background: getAvatarColor(p._id) }}>
                          {getInitials(p.name)}
                        </div>
                        <span>{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                {creating ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
