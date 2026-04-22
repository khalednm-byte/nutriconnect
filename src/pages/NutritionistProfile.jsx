import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { nutritionists, getInitials, getAvatarColor } from '../data/users';
import { FiStar, FiMapPin, FiGlobe, FiAward, FiCalendar, FiVideo, FiMessageSquare, FiArrowLeft, FiCheck } from 'react-icons/fi';
import './NutritionistProfile.css';

export default function NutritionistProfile() {
  const { id } = useParams();
  const n = nutritionists.find(n => n.id === id) || nutritionists[0];
  const [selectedDay, setSelectedDay] = useState(n.availability[0]?.day || 'Monday');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booked, setBooked] = useState(false);

  const daySlots = n.availability.find(a => a.day === selectedDay)?.slots || [];

  const handleBook = () => {
    if (selectedSlot) setBooked(true);
  };

  return (
    <div className="nutprofile-page">
      <Link to="/nutritionists" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-lg)' }}>
        <FiArrowLeft /> Back to listing
      </Link>

      <div className="nutprofile-grid">
        {/* Main Info */}
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
                  <span><FiMapPin /> {n.location}</span>
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

          <div className="card">
            <h3>About</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)', fontSize: 'var(--font-sm)' }}>{n.bio}</p>
          </div>

          <div className="card">
            <h3>Specializations</h3>
            <div className="nutprofile-specs">
              {n.specializations.map(s => (
                <span key={s} className="tag active">{s.replace(/_/g, ' ')}</span>
              ))}
            </div>
          </div>

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

          <div className="card">
            <h3>Stats</h3>
            <div className="nutprofile-stats-grid">
              <div className="nutprofile-stat-box"><strong>{n.totalClients}</strong><span>Clients</span></div>
              <div className="nutprofile-stat-box"><strong>{n.stats.followers.toLocaleString()}</strong><span>Followers</span></div>
              <div className="nutprofile-stat-box"><strong>{n.stats.postsCount}</strong><span>Posts</span></div>
              <div className="nutprofile-stat-box"><strong>{n.reviewCount}</strong><span>Reviews</span></div>
            </div>
          </div>
        </div>

        {/* Booking Sidebar */}
        <div className="nutprofile-sidebar">
          <div className="card nutprofile-booking">
            <h3>Book a Consultation</h3>
            <div className="nutprofile-price">
              <strong>${n.consultationRate}</strong> <span>/session</span>
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
