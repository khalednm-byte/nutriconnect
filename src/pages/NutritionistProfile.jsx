import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { nutritionists as mockNutritionists, getInitials, getAvatarColor } from '../data/users';
import { usersAPI } from '../services/api';
import { FiStar, FiMapPin, FiGlobe, FiAward, FiCalendar, FiVideo, FiMessageSquare, FiArrowLeft, FiCheck } from 'react-icons/fi';
import './NutritionistProfile.css';

// Default availability/slots for real nutritionists who haven't set a schedule yet.
// This is presentation-only data until a real booking/availability system exists.
const DEFAULT_AVAILABILITY = [
  { day: 'Monday',    slots: ['9:00 AM', '11:00 AM', '2:00 PM'] },
  { day: 'Wednesday', slots: ['10:00 AM', '1:00 PM', '4:00 PM'] },
  { day: 'Friday',    slots: ['9:00 AM', '12:00 PM'] },
];

// Normalize a real User document (with nutritionistProfile) into the same
// shape the page expects — mirrors the normalize() used on the Nutritionists list page.
function normalize(n) {
  const np = n.nutritionistProfile || {};
  return {
    id:                n._id,
    name:              n.name,
    verified:          true,
    title:             np.title             || 'Nutritionist',
    specializations:   np.specializations   || [],
    credentials:       np.credentials       || [],
    experience:        np.experience        || 0,
    rating:            np.rating            || 0,
    reviewCount:       np.reviewCount       || 0,
    consultationRate:  np.consultationRate  || 0,
    consultationTypes: np.consultationTypes || ['video'],
    bio:               n.profile?.bio       || '',
    location:          n.profile?.location  || '',
    languages:         np.languages?.length ? np.languages : ['English'],
    totalClients:      np.totalClients      || 0,
    stats:             n.stats || { followers: 0, postsCount: 0 },
    availability:      DEFAULT_AVAILABILITY,
  };
}

export default function NutritionistProfile() {
  const { id } = useParams();
  const [n, setN]             = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedDay, setSelectedDay]   = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booked, setBooked]             = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setNotFound(false);

      // First check if this id matches a mock nutritionist (for demo/fallback data)
      const mockMatch = mockNutritionists.find(m => m.id === id);
      if (mockMatch) {
        setN(mockMatch);
        setSelectedDay(mockMatch.availability?.[0]?.day || null);
        setLoading(false);
        return;
      }

      // Otherwise treat it as a real MongoDB user id and fetch from the backend
      try {
        const { user } = await usersAPI.getProfile(id);
        if (!user || user.role !== 'nutritionist') {
          setNotFound(true);
        } else {
          const normalized = normalize(user);
          setN(normalized);
          setSelectedDay(normalized.availability[0]?.day || null);
        }
      } catch (err) {
        console.error('Failed to load nutritionist:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const daySlots = n?.availability?.find(a => a.day === selectedDay)?.slots || [];

  const handleBook = () => {
    if (selectedSlot) setBooked(true);
  };

  if (loading) {
    return <div style={{ padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>Loading profile...</div>;
  }

  if (notFound || !n) {
    return (
      <div style={{ padding: 'var(--space-2xl)' }}>
        <Link to="/nutritionists" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-lg)' }}>
          <FiArrowLeft /> Back to listing
        </Link>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>
          Nutritionist not found.
        </div>
      </div>
    );
  }

  return (
    <div className="nutprofile-page">
      <Link to="/nutritionists" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-lg)' }}>
        <FiArrowLeft /> Back to listing
      </Link>

      <div className="nutprofile-grid">
        <div className="nutprofile-main">
          <div className="card nutprofile-hero">
            <div className="nutprofile-top">
              <div className="avatar avatar-xl" style={{ background: getAvatarColor(n.id) }}>
                {getInitials(n.name)}
              </div>
              <div className="nutprofile-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2>{n.name}</h2>
                  {n.verified && <span className="badge badge-success">✓ Verified</span>}
                </div>
                <p className="nutprofile-title">{n.title}</p>
                <div className="nutprofile-meta">
                  {n.location && <span><FiMapPin /> {n.location}</span>}
                  <span><FiGlobe /> {n.languages.join(', ')}</span>
                  <span><FiAward /> {n.experience} years experience</span>
                </div>
                <div className="nutprofile-rating">
                  <div className="star-rating">
                    {[...Array(5)].map((_, i) => (
                      <FiStar key={i} style={i < Math.floor(n.rating)
                        ? { fill: 'var(--secondary)', color: 'var(--secondary)' }
                        : { color: 'var(--text-muted)' }} />
                    ))}
                  </div>
                  <strong>{n.rating}</strong>
                  <span>({n.reviewCount} reviews)</span>
                </div>
              </div>
            </div>
          </div>

          {n.bio && (
            <div className="card">
              <h3>About</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)', fontSize: 'var(--font-sm)' }}>{n.bio}</p>
            </div>
          )}

          {n.specializations.length > 0 && (
            <div className="card">
              <h3>Specializations</h3>
              <div className="nutprofile-specs">
                {n.specializations.map(s => (
                  <span key={s} className="tag active">{s.replace(/_/g, ' ')}</span>
                ))}
              </div>
            </div>
          )}

          {n.credentials.length > 0 && (
            <div className="card">
              <h3>Credentials</h3>
              <div className="nutprofile-creds">
                {n.credentials.map(c => (
                  <div key={c} className="nutprofile-cred">
                    <FiAward /> <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h3>Stats</h3>
            <div className="nutprofile-stats-grid">
              <div className="nutprofile-stat-box"><strong>{n.totalClients}</strong><span>Clients</span></div>
              <div className="nutprofile-stat-box"><strong>{(n.stats.followers || 0).toLocaleString()}</strong><span>Followers</span></div>
              <div className="nutprofile-stat-box"><strong>{n.stats.postsCount || 0}</strong><span>Posts</span></div>
              <div className="nutprofile-stat-box"><strong>{n.reviewCount}</strong><span>Reviews</span></div>
            </div>
          </div>
        </div>

        {/* Booking Sidebar */}
        <div className="nutprofile-sidebar">
          <div className="card nutprofile-booking">
            <h3>Book a Consultation</h3>
            <div className="nutprofile-price">
              {n.consultationRate > 0
                ? <><strong>${n.consultationRate}</strong> <span>/session</span></>
                : <span style={{ color: 'var(--text-muted)' }}>Rate not set</span>
              }
            </div>

            <div className="nutprofile-consult-types">
              {n.consultationTypes.map(t => (
                <div key={t} className="nutprofile-type-item">
                  {t === 'video' ? <FiVideo /> : t === 'chat' ? <FiMessageSquare /> : '🏥'}
                  <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                </div>
              ))}
            </div>

            <div className="divider"></div>

            <h4><FiCalendar /> Select Day</h4>
            <div className="nutprofile-day-btns">
              {n.availability.map(a => (
                <button
                  key={a.day}
                  className={`tag ${selectedDay === a.day ? 'active' : ''}`}
                  onClick={() => { setSelectedDay(a.day); setSelectedSlot(null); setBooked(false); }}
                >
                  {a.day}
                </button>
              ))}
            </div>

            <h4 style={{ marginTop: 'var(--space-lg)' }}>Available Slots</h4>
            <div className="nutprofile-slots">
              {daySlots.map(s => (
                <button
                  key={s}
                  className={`nutprofile-slot-btn ${selectedSlot === s ? 'selected' : ''}`}
                  onClick={() => { setSelectedSlot(s); setBooked(false); }}
                >
                  {s}
                </button>
              ))}
            </div>

            {booked ? (
              <div className="nutprofile-booked">
                <FiCheck /> Booked for {selectedDay} at {selectedSlot}!
              </div>
            ) : (
              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: 'var(--space-xl)' }}
                disabled={!selectedSlot}
                onClick={handleBook}
              >
                Book {selectedSlot || 'Select a time'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
