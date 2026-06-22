import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { nutritionists as mockNutritionists, getInitials, getAvatarColor } from '../data/users';
import { usersAPI } from '../services/api';
import { FiStar, FiSearch, FiMapPin, FiVideo, FiMessageSquare } from 'react-icons/fi';
import './Nutritionists.css';

const specializations = [
  'All', 'Sports Nutrition', 'Weight Management', 'Gut Health',
  'Plant-Based', 'Pediatric', 'Holistic', 'Bodybuilding',
];

// ── Normalize a user from the API into the same shape as mock data ────────────
// Real users store nutritionist info under nutritionistProfile.*
// Mock data has it at the top level. This function flattens both into one shape.
function normalize(n) {
  const np = n.nutritionistProfile || {};
  return {
    _id:               n._id  || n.id,
    name:              n.name,
    verified:          true,
    title:             np.title             || n.title             || 'Nutritionist',
    specializations:   np.specializations   || n.specializations   || [],
    credentials:       np.credentials       || n.credentials       || [],
    experience:        np.experience        || n.experience        || 0,
    rating:            np.rating            || n.rating            || 0,
    reviewCount:       np.reviewCount       || n.reviewCount       || 0,
    consultationRate:  np.consultationRate  || n.consultationRate  || 0,
    bio:               n.profile?.bio       || n.bio               || '',
    location:          n.profile?.location  || n.location          || '',
    languages:         np.languages         || n.languages         || [],
    consultationTypes: np.consultationTypes || n.consultationTypes || [],
    available:         np.available !== false,
  };
}

export default function Nutritionists() {
  const [nutritionists, setNutritionists] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [activeSpec, setActiveSpec]       = useState('All');

  useEffect(() => {
    const load = async () => {
      try {
        const { nutritionists: real } = await usersAPI.getNutritionists();
        // If no real nutritionists in DB yet, fall back to mock data
        const source = real.length > 0 ? real : mockNutritionists;
        setNutritionists(source.map(normalize));
      } catch (err) {
        console.error('Failed to load nutritionists:', err);
        // On error, still show mock data so page isn't blank
        setNutritionists(mockNutritionists.map(normalize));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = nutritionists.filter(n => {
    const matchSearch =
      n.name.toLowerCase().includes(search.toLowerCase()) ||
      n.specializations.some(s => s.toLowerCase().includes(search.toLowerCase()));
    const matchSpec =
      activeSpec === 'All' ||
      n.specializations.some(s =>
        s.toLowerCase().includes(activeSpec.toLowerCase().replace(/ /g, '_'))
      );
    return matchSearch && matchSpec;
  });

  return (
    <div className="nutritionists-page">
      <div className="nut-header">
        <h2>Find Your Expert Nutritionist</h2>
        <p>Browse certified professionals and book consultations</p>
      </div>

      <div className="nut-controls">
        <div className="nut-search">
          <FiSearch className="nut-search-icon" />
          <input
            type="text"
            placeholder="Search by name or specialty..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="nut-specs">
          {specializations.map(s => (
            <button
              key={s}
              className={`tag ${activeSpec === s ? 'active' : ''}`}
              onClick={() => setActiveSpec(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="nut-results">
        {loading
          ? <span className="nut-count">Loading...</span>
          : <span className="nut-count">{filtered.length} nutritionist{filtered.length !== 1 ? 's' : ''} found</span>
        }
      </div>

      {!loading && filtered.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>
          No nutritionists match your search.
        </div>
      )}

      <div className="nut-grid">
        {filtered.map(n => (
          <div key={n._id} className="nut-card card">
            <div className="nut-card-top">
              <div className="avatar avatar-lg" style={{ background: getAvatarColor(n._id) }}>
                {getInitials(n.name)}
              </div>
              <div className="nut-card-info">
                <div className="nut-name-row">
                  <h3>{n.name}</h3>
                  {n.verified && <span className="badge badge-success">✓ Verified</span>}
                </div>
                <p className="nut-title">{n.title}</p>
                <div className="nut-meta">
                  {n.location && <span><FiMapPin /> {n.location}</span>}
                  {n.rating > 0 && (
                    <span>
                      <FiStar style={{ fill: 'var(--secondary)', color: 'var(--secondary)' }} />
                      {n.rating} ({n.reviewCount})
                    </span>
                  )}
                  {n.experience > 0 && <span>{n.experience}yr exp</span>}
                </div>
              </div>
            </div>

            {n.bio && <p className="nut-bio">{n.bio}</p>}

            {n.specializations.length > 0 && (
              <div className="nut-card-tags">
                {n.specializations.slice(0, 3).map(s => (
                  <span key={s} className="tag">{s.replace(/_/g, ' ')}</span>
                ))}
              </div>
            )}

            <div className="nut-card-bottom">
              <div className="nut-price">
                {n.consultationRate > 0
                  ? <><strong>${n.consultationRate}</strong><span>/session</span></>
                  : <span style={{ color: 'var(--text-muted)' }}>Rate TBD</span>
                }
              </div>
              <div className="nut-consult-types">
                {n.consultationTypes.map(t => (
                  <span key={t} className="nut-type-icon" title={t}>
                    {t === 'video' ? <FiVideo /> : t === 'chat' ? <FiMessageSquare /> : '🏥'}
                  </span>
                ))}
              </div>
              <Link to={`/nutritionists/${n._id}`} className="btn btn-primary btn-sm">
                View Profile
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
