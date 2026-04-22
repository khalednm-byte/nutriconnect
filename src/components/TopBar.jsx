import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getInitials, getAvatarColor } from '../data/users';
import { FiSearch, FiBell, FiMenu, FiX } from 'react-icons/fi';
import './TopBar.css';

export default function TopBar({ title, onMenuToggle }) {
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onMenuToggle}>
          <FiMenu />
        </button>
        <h2 className="topbar-title">{title}</h2>
      </div>

      <div className="topbar-right">
        <div className={`topbar-search ${searchOpen ? 'open' : ''}`}>
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search anything..."
            className="search-input"
          />
          {searchOpen && (
            <button className="search-close" onClick={() => setSearchOpen(false)}>
              <FiX />
            </button>
          )}
        </div>

        <button className="topbar-icon-btn" onClick={() => setSearchOpen(!searchOpen)}>
          <FiSearch />
        </button>

        <button className="topbar-icon-btn notification-dot">
          <FiBell />
        </button>

        {user && (
          <div className="topbar-user">
            <div className="avatar avatar-sm" style={{ background: getAvatarColor(user.id) }}>
              {getInitials(user.name)}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
