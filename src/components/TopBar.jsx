import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInitials, getAvatarColor } from '../data/users';
import { FiSearch, FiBell, FiMessageSquare, FiCheckCircle, FiAward, FiStar } from 'react-icons/fi';
import './TopBar.css';

// Maps notification type → icon
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

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close panel when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <header className="topbar">
      <h1 className="topbar-title">{title}</h1>

      <div className="topbar-search">
        <FiSearch className="topbar-search-icon" />
        <input type="text" placeholder="Search anything..." />
      </div>

      <div className="topbar-actions">
        {/* Notification bell */}
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

        {/* Avatar */}
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
