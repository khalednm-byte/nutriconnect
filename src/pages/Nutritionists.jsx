import { useState } from 'react';
import { Link } from 'react-router-dom';
import { nutritionists } from '../data/users';
import { getInitials, getAvatarColor } from '../data/users';
import { FiStar, FiSearch, FiMapPin, FiVideo, FiMessageSquare, FiFilter } from 'react-icons/fi';
import './Nutritionists.css';

const specializations = ['All', 'Sports Nutrition', 'Weight Management', 'Gut Health', 'Plant-Based', 'Pediatric', 'Holistic', 'Bodybuilding'];

export default function Nutritionists() {
  const [search, setSearch] = useState('');
  const [activeSpec, setActiveSpec] = useState('All');

  const filtered = nutritionists.filter(n => {
    const matchSearch = n.name.toLowerCase().includes(search.toLowerCase()) ||
      n.specializations.some(s => s.includes(search.toLowerCase()));
    const matchSpec = activeSpec === 'All' ||
      n.specializations.some(s => s.toLowerCase().includes(activeSpec.toLowerCase().replace(' ', '_')));
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
          <input type="text" placeholder="Search by name or specialty..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="nut-specs">
          {specializations.map(s => (
            <button key={s} className={`tag ${activeSpec === s ? 'active' : ''}`} onClick={() => setActiveSpec(s)}>{s}</button>
          ))}
        </div>
      </div>

      <div className="nut-results">
        <span className="nut-count">{filtered.length} nutritionists found</span>
      </div>

      <div className="nut-grid">
        {filtered.map(n => (
          <div key={n.id} className="nut-card card">
            <div className="nut-card-top">
              <div className="avatar avatar-lg" style={{ background: getAvatarColor(n.id) }}>
                {getInitials(n.name)}
              </div>
              <div className="nut-card-info">
                <div className="nut-name-row">
                  <h3>{n.name}</h3>
                  {n.verified && <span className="badge badge-success">✓ Verified</span>}
                </div>
                <p className="nut-title">{n.title}</p>
                <div className="nut-meta">
                  <span><FiMapPin /> {n.location}</span>
                  <span><FiStar style={{ fill: 'var(--secondary)', color: 'var(--secondary)' }} /> {n.rating} ({n.reviewCount})</span>
                  <span>{n.experience}yr exp</span>
                </div>
              </div>
            </div>
            <p className="nut-bio">{n.bio}</p>
            <div className="nut-card-tags">
              {n.specializations.slice(0, 3).map(s => (
                <span key={s} className="tag">{s.replace(/_/g, ' ')}</span>
              ))}
            </div>
            <div className="nut-card-bottom">
              <div className="nut-price">
                <strong>${n.consultationRate}</strong>
                <span>/session</span>
              </div>
              <div className="nut-consult-types">
                {n.consultationTypes.map(t => (
                  <span key={t} className="nut-type-icon" title={t}>
                    {t === 'video' ? <FiVideo /> : t === 'chat' ? <FiMessageSquare /> : '🏥'}
                  </span>
                ))}
              </div>
              <Link to={`/nutritionists/${n.id}`} className="btn btn-primary btn-sm">View Profile</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
