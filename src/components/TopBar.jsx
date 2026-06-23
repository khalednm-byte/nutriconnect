import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInitials, getAvatarColor } from '../data/users';
import { usersAPI } from '../services/api';
import { FiSearch, FiBell, FiMessageSquare, FiCheckCircle, FiAward, FiStar, FiUser, FiX } from 'react-icons/fi';
import './TopBar.css';

const notifIcon = {
  message:   <FiMessageSquare style={{ color: 'var(--primary)' }} />,
  swap:      <FiCheckCircle   style={{ color: 'var(--secondary)' }} />,
  community: <FiStar          style={{ color: 'var(--accent)' }} />,
  challenge: <FiAward         style={{ color: 'var(--secondary)' }} />,
  tip:       <FiStar          style={{ color: 'var(--info)' }} />,
};

export default function TopBar({ title }) {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [showNotifs, setShowNotifs]   = useState(false);
  const [notifications, setNotifications] = useState(
    user?.notificationItems || []
  );
  const notifRef = useRef(null);

  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState({ patients: [], nutritionists: [] });
  const [searchOpen, setSearchOpen]       = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef(null);
  const searchTimer = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const runSearch = useCallback(async (q) => {
    if (!q || q.length < 2) {
      setSearchResults({ patients: [], nutritionists: [] });
      return;
    }
    setSearchLoading(true);
    try {
      const results = await usersAPI.search(q);
      setSearchResults(results);
    } catch {
      setSearchResults({ patients: [], nutritionists: [] });
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!searchQuery.trim()) {
      setSearchResults({ patients: [], nutritionists: [] });
      return;
    }
    searchTimer.current = setTimeout(() => runSearch(searchQuery.trim()), 300);
    return () => clearTimeout(searchTimer.current);
  }, [searchQuery, runSearch]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleSearchSelect = (person, type) => {
    setSearchOpen(false);
    setSearchQuery('');
    if (type === 'nutritionist') {
      navigate(`/nutritionists/${person._id}`);
    } else if (person._id === user?._id) {
      navigate('/profile');
    } else {
      navigate(`/messages`);
    }
  };

  const hasResults = searchResults.patients.length > 0 || searchResults.nutritionists.length > 0;

  return (
    <header className="topbar">
      <h1 className="topbar-title">{title}</h1>

      <div className="topbar-search" ref={searchRef}>
        <FiSearch className="topbar-search-icon" />
        <input
          type="text"
          placeholder="Search patients or nutritionists..."
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
          onFocus={() => setSearchOpen(true)}
        />
        {searchQuery && (
          <button className="search-clear-btn" onClick={() => { setSearchQuery(''); setSearchOpen(false); }}>
            <FiX />
          </button>
        )}

        {searchOpen && searchQuery.trim().length >= 2 && (
          <div className="search-dropdown">
            {searchLoading && (
              <p className="search-empty">Searching...</p>
            )}
            {!searchLoading && !hasResults && (
              <p className="search-empty">No results for "{searchQuery}"</p>
            )}
            {!searchLoading && searchResults.nutritionists.length > 0 && (
              <div className="search-section">
                <span className="search-section-label">Nutritionists</span>
                {searchResults.nutritionists.map(n => (
                  <button key={n._id} className="search-result-item" onClick={() => handleSearchSelect(n, 'nutritionist')}>
                    <div className="avatar avatar-sm" style={{ background: getAvatarColor(n._id) }}>
                      {getInitials(n.name)}
                    </div>
                    <div className="search-result-info">
                      <strong>{n.name}</strong>
                      <span>{n.nutritionistProfile?.title || 'Nutritionist'}</span>
                    </div>
                    <span className="badge badge-primary">Expert</span>
                  </button>
                ))}
              </div>
            )}
            {!searchLoading && searchResults.patients.length > 0 && (
              <div className="search-section">
                <span className="search-section-label">Patients</span>
                {searchResults.patients.map(p => (
                  <button key={p._id} className="search-result-item" onClick={() => handleSearchSelect(p, 'patient')}>
                    <div className="avatar avatar-sm" style={{ background: getAvatarColor(p._id) }}>
                      {getInitials(p.name)}
                    </div>
                    <div className="search-result-info">
                      <strong>{p.name}</strong>
                      <span>{p.email}</span>
                    </div>
                    <FiUser className="search-result-icon" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="topbar-actions">
        <div className="notif-wrapper" ref={notifRef}>
          <button
            className={`topbar-icon-btn ${showNotifs ? 'active' : ''}`}
            onClick={() => setShowNotifs(prev => !prev)}
            title="Notifications"
          >
            <FiBell />
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount}</span>
            )}
          </button>

          {showNotifs && (
            <div className="notif-panel">
              <div className="notif-panel-header">
                <h4>Notifications</h4>
                {unreadCount > 0 && (
                  <button className="notif-mark-all" onClick={markAllRead}>
                    Mark all read
                  </button>
                )}
              </div>

              <div className="notif-list">
                {notifications.length === 0 && (
                  <p className="notif-empty">You're all caught up 🎉</p>
                )}
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`notif-item ${!n.read ? 'unread' : ''}`}
                    onClick={() => markRead(n.id)}
                  >
                    <div className="notif-icon">{notifIcon[n.type] || <FiBell />}</div>
                    <div className="notif-body">
                      <p>{n.text}</p>
                      <span>{n.time}</span>
                    </div>
                    {!n.read && <div className="notif-dot" />}
                  </div>
                ))}
              </div>

              {notifications.length > 0 && (
                <div className="notif-panel-footer">
                  <button className="btn btn-ghost btn-sm" style={{ width: '100%' }}>
                    View all notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className="topbar-avatar"
          onClick={() => navigate('/profile')}
          title="My Profile"
        >
          <div className="avatar avatar-sm" style={{ background: getAvatarColor(user?._id) }}>
            {getInitials(user?.name || 'AM')}
          </div>
        </div>
      </div>
    </header>
  );
}
