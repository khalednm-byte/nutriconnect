import { useParams, Link } from 'react-router-dom';
import { articles } from '../data/articles';
import { getInitials, getAvatarColor } from '../data/users';
import { FiArrowLeft, FiClock, FiHeart, FiMessageCircle, FiShare2, FiBookmark } from 'react-icons/fi';
import './BlogPost.css';

export default function BlogPost() {
  const { slug } = useParams();
  const article = articles.find(a => a.slug === slug) || articles[0];

  return (
    <div className="blogpost-page">
      <Link to="/blog" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-xl)' }}>
        <FiArrowLeft /> Back to Blog
      </Link>

      <article className="blogpost-article">
        <div className="blogpost-header">
          <span className="badge badge-primary">{article.category}</span>
          <h1>{article.title}</h1>
          <p className="blogpost-excerpt">{article.excerpt}</p>

          <div className="blogpost-author-bar">
            <div className="blogpost-author">
              <div className="avatar avatar-md" style={{ background: getAvatarColor(article.authorId) }}>
                {getInitials(article.authorName)}
              </div>
              <div>
                <strong>{article.authorName}</strong>
                <span>{article.publishedAt} • <FiClock /> {article.readTime} min read</span>
              </div>
            </div>
            <div className="blogpost-actions">
              <button className="btn btn-ghost btn-sm"><FiHeart /> {article.likes}</button>
              <button className="btn btn-ghost btn-sm"><FiMessageCircle /> {article.comments}</button>
              <button className="btn btn-ghost btn-sm"><FiShare2 /></button>
              <button className="btn btn-ghost btn-sm"><FiBookmark /></button>
            </div>
          </div>
        </div>

        <div className="blogpost-image">
          <span>{article.category === 'Nutrition Science' ? '🧬' : article.category === 'Sports Nutrition' ? '🏋️' : '📚'}</span>
        </div>

        <div className="blogpost-body">
          {article.content.split('\\n\\n').map((para, i) => {
            if (para.startsWith('## ')) {
              return <h2 key={i}>{para.replace('## ', '')}</h2>;
            }
            return <p key={i}>{para}</p>;
          })}
        </div>

        <div className="blogpost-tags">
          {article.tags.map(t => <span key={t} className="tag">#{t.replace(/_/g, ' ')}</span>)}
        </div>
      </article>

      {/* Related */}
      <div className="blogpost-related">
        <h3>Related Articles</h3>
        <div className="blogpost-related-grid">
          {articles.filter(a => a.id !== article.id).slice(0, 3).map(a => (
            <Link to={`/blog/${a.slug}`} key={a.id} className="card card-interactive card-compact" style={{ textDecoration: 'none' }}>
              <span className="badge badge-info">{a.category}</span>
              <h4 style={{ margin: 'var(--space-sm) 0', fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>{a.title}</h4>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{a.authorName} • {a.readTime}m</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
