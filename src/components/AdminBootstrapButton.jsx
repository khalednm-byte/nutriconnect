// Standalone component — import and drop this into your Profile.jsx
// wherever you want the button to appear (e.g. near the Edit Profile button).
//
// Usage in Profile.jsx:
//   import AdminBootstrapButton from '../components/AdminBootstrapButton';
//   ...
//   <AdminBootstrapButton />

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { setupAPI } from '../services/api';
import { FiShield, FiCheck } from 'react-icons/fi';

export default function AdminBootstrapButton() {
  const { user, updateUser } = useAuth();
  const [adminExists, setAdminExists] = useState(true); // default true = hidden until checked
  const [loading, setLoading]         = useState(false);
  const [done, setDone]               = useState(false);

  useEffect(() => {
    // Only bother checking if the current user isn't already an admin
    if (user?.role === 'admin') return;
    setupAPI.getStatus()
      .then(({ adminExists }) => setAdminExists(adminExists))
      .catch(() => {}); // fail silently — button just won't show
  }, [user?.role]);

  // Don't render anything if: already an admin, an admin already exists, or still checking
  if (user?.role === 'admin' || adminExists) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
      const { user: updated } = await setupAPI.bootstrapAdmin();
      updateUser(updated);
      setDone(true);
    } catch (err) {
      alert(err.message); // simple fallback — replace with your toast system if preferred
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <span className="badge badge-success" style={{ padding: 'var(--space-sm) var(--space-md)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <FiCheck /> You are now an admin
      </span>
    );
  }

  return (
    <button className="btn btn-secondary btn-sm" onClick={handleClick} disabled={loading}>
      <FiShield /> {loading ? 'Setting up...' : 'Become First Admin'}
    </button>
  );
}
