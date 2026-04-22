import { useState } from 'react';
import { Link } from 'react-router-dom';
import { articles, articleCategories } from '../data/articles';
import { getInitials, getAvatarColor } from '../data/users';
import { FiClock, FiHeart, FiMessageCircle, FiArrowRight } from 'react-icons/fi';
import './Blog.css';

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = articles.filter(a => {
    const matchCat = activeCategory === 'All' || a.category === activeCategory;
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const featured = articles.filter(a => a.featured);

  return (
    <div className="blog-page">
      <div className="blog-header">
        <h2>Expert Articles & Insights</h2>
        <p>Evidence-based nutrition knowledge from certified professionals</p>
      </div>

      {/* Featured */}
      <div className="blog-featured">
        {featured.slice(0, 2).map((a, i) => (
          <Link to={`/blog/${a.slug}`} key={a.id} className={`blog-featured-card card card-interactive ${i === 0 ? 'large' : ''}`}>
            <div className="blog-featured-image">
              <span>{a.category === 'Nutrition Science' ? '🧬' : a.category === 'Sports Nutrition' ? '🏋️' : '🥗'}</span>
            </div>
            <div className="blog-featured-content">
              <span className="badge badge-primary">{a.category}</span>
              <h3>{a.title}</h3>
              <p>{a.excerpt}</p>
              <div className="blog-meta">
                <div className="avatar avatar-sm" style={{ background: getAvatarColor(a.authorId) }}>
                  {getInitials(a.authorName)}
                </div>
                <span>{a.authorName}</span>
                <span>•</span>
                <span><FiClock /> {a.readTime} min read</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Controls */}
      <div className="blog-controls">
        <input type="text" placeholder="Search articles..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '350px' }} />
        <div className="blog-categories">
          {articleCategories.map(c => (
            <button key={c} className={`tag ${activeCategory === c ? 'active' : ''}`} onClick={() => setActiveCategory(c)}>{c}</button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="blog-grid">
        {filtered.map(a => (
          <Link to={`/blog/${a.slug}`} key={a.id} className="blog-card card card-interactive">
            <div className="blog-card-image">
              <span>{a.category === 'Gut Health' ? '🦠' : a.category === 'Meal Planning' ? '📋' : a.category === 'Family Nutrition' ? '👨‍👩‍👧' : a.category === 'Medical Nutrition' ? '💊' : '📚'}</span>
            </div>
            <div className="blog-card-content">
              <span className="badge badge-info">{a.category}</span>
              <h4>{a.title}</h4>
              <p>{a.excerpt}</p>
              <div className="blog-card-footer">
                <div className="blog-card-author">
                  <div className="avatar avatar-sm" style={{ background: getAvatarColor(a.authorId) }}>
                    {getInitials(a.authorName)}
                  </div>
                  <span>{a.authorName}</span>
                </div>
                <div className="blog-card-stats">
                  <span><FiClock /> {a.readTime}m</span>
                  <span><FiHeart /> {a.likes}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
