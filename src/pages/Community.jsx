import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getInitials, getAvatarColor } from '../data/users';
import { posts, groups, trendingTags } from '../data/posts';
import { FiHeart, FiMessageCircle, FiShare2, FiBookmark, FiSend, FiTrash2 } from 'react-icons/fi';
import './Community.css';

const filters = ['All', 'Meals', 'Tips', 'Recipes', 'Transformations'];

const filterToType = {
  'Meals': 'meal',
  'Tips': 'tip',
  'Recipes': 'recipe',
  'Transformations': 'transformation',
};

const postTypes = ['meal', 'tip', 'recipe', 'transformation'];

const typeEmoji = {
  meal: '🥗',
  tip: '💡',
  recipe: '📖',
  transformation: '💪',
};

export default function Community() {
  const { user } = useAuth();

  const [activeFilter, setActiveFilter] = useState('All');
  const [feedPosts, setFeedPosts] = useState(posts);
  const [newPostText, setNewPostText] = useState('');
  const [newPostType, setNewPostType] = useState('meal');
  const [openComments, setOpenComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});

  const filtered = activeFilter === 'All'
    ? feedPosts
    : feedPosts.filter(p => p.type === filterToType[activeFilter]);

  const handleSubmitPost = () => {
    if (!newPostText.trim()) return;
    const newPost = {
      id: `p${Date.now()}`,
      authorId: user?.id || 'u1',
      authorName: user?.name || 'Alex Morgan',
      authorRole: user?.role,
      type: newPostType,
      content: newPostText,
      images: [],
      tags: [],
      likes: 0,
      comments: [],
      shares: 0,
      liked: false,
      saved: false,
      createdAt: 'Just now',
    };
    setFeedPosts(prev => [newPost, ...prev]);
    setNewPostText('');
    setNewPostType('meal');
  };

  const toggleLike = (id) => {
    setFeedPosts(prev => prev.map(p =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ));
  };

  const toggleSave = (id) => {
    setFeedPosts(prev => prev.map(p =>
      p.id === id ? { ...p, saved: !p.saved } : p
    ));
  };

  const toggleCommentBox = (postId) => {
    setOpenComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  // --- SHARE ---
  // Uses the native share sheet on mobile. Falls back to copying the link
  // to clipboard on desktop, with a brief visual confirmation.
  const handleShare = async (post) => {
    const url = `${window.location.origin}/community#${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Post by ${post.authorName}`, text: post.content.slice(0, 100), url });
      } catch (_) { /* user cancelled — do nothing */ }
    } else {
      await navigator.clipboard.writeText(url);
      setFeedPosts(prev => prev.map(p =>
        p.id === post.id ? { ...p, shareCopied: true } : p
      ));
      setTimeout(() => {
        setFeedPosts(prev => prev.map(p =>
          p.id === post.id ? { ...p, shareCopied: false } : p
        ));
      }, 2000);
    }
  };

  // --- DELETE POST ---
  // Filter removes the post whose ID matches. Everything else stays.
  const deletePost = (postId) => {
    setFeedPosts(prev => prev.filter(p => p.id !== postId));
  };

  // --- DELETE COMMENT ---
  // Map finds the right post, then filters its comments array.
  const deleteComment = (postId, commentId) => {
    setFeedPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, comments: p.comments.filter(c => c.id !== commentId) }
        : p
    ));
  };

  const handleCommentInput = (postId, value) => {
    setCommentInputs(prev => ({ ...prev, [postId]: value }));
  };

  const handleSubmitComment = (postId) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    const newComment = {
      id: `c${Date.now()}`,
      userId: user?.id || 'u1',
      userName: user?.name || 'Alex Morgan',
      text,
      time: 'Just now',
    };
    setFeedPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p
    ));
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  return (
    <div className="community-page">
      <div className="community-layout">
        <div className="community-feed">

          {/* Create Post */}
          <div className="card create-post-card">
            <div className="create-post-row">
              <div className="avatar" style={{ background: getAvatarColor(user?.id || 'u1') }}>
                {getInitials(user?.name || 'Alex Morgan')}
              </div>
              <textarea
                placeholder="Share a meal, tip, or achievement..."
                value={newPostText}
                onChange={e => setNewPostText(e.target.value)}
                rows={2}
              />
            </div>
            <div className="create-post-actions">
              <div className="post-type-selector">
                {postTypes.map(type => (
                  <button
                    key={type}
                    className={`btn btn-sm ${newPostType === type ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setNewPostType(type)}
                  >
                    {typeEmoji[type]} {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
              <button
                className="btn btn-primary btn-sm"
                disabled={!newPostText.trim()}
                onClick={handleSubmitPost}
              >
                Post
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="tabs" style={{ marginBottom: 'var(--space-lg)' }}>
            {filters.map(f => (
              <button
                key={f}
                className={`tab ${activeFilter === f ? 'active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >{f}</button>
            ))}
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>
              No posts in this category yet. Be the first to share!
            </div>
          )}

          {/* Posts */}
          {filtered.map(post => (
            <div key={post.id} className="card post-card">
              <div className="post-header">
                <div className="avatar" style={{ background: getAvatarColor(post.authorId) }}>
                  {getInitials(post.authorName)}
                </div>
                <div className="post-author-info">
                  <div className="post-author-row">
                    <strong>{post.authorName}</strong>
                    {post.authorRole === 'nutritionist' && <span className="badge badge-primary">Expert</span>}
                  </div>
                  <span className="post-time">{post.createdAt} • {post.type}</span>
                </div>
              {/* Delete button — only visible on your own posts */}
              {post.authorId === (user?.id || 'u1') && (
                <button
                  className="post-delete-btn"
                  onClick={() => deletePost(post.id)}
                  title="Delete post"
                >
                  <FiTrash2 />
                </button>
              )}
              </div>

              <div className="post-content">
                <p style={{ whiteSpace: 'pre-line' }}>{post.content}</p>
              </div>

              {post.images.length > 0 && (
                <div className="post-image-placeholder">
                  <span>{post.type === 'meal' ? '🍽️' : post.type === 'transformation' ? '💪' : '🥤'}</span>
                </div>
              )}

              {post.tags.length > 0 && (
                <div className="post-tags">
                  {post.tags.map(t => <span key={t} className="tag">#{t}</span>)}
                </div>
              )}

              <div className="post-actions">
                <button
                  className={`post-action-btn ${post.liked ? 'liked' : ''}`}
                  onClick={() => toggleLike(post.id)}
                >
                  <FiHeart style={post.liked ? { fill: 'var(--accent)', color: 'var(--accent)' } : {}} />
                  {post.likes}
                </button>
                <button
                  className={`post-action-btn ${openComments[post.id] ? 'active' : ''}`}
                  onClick={() => toggleCommentBox(post.id)}
                >
                  <FiMessageCircle /> {post.comments.length}
                </button>
                <button className="post-action-btn" onClick={() => handleShare(post)}>
                  <FiShare2 /> {post.shareCopied ? 'Copied!' : post.shares}
                </button>
                <button
                  className={`post-action-btn ${post.saved ? 'saved' : ''}`}
                  onClick={() => toggleSave(post.id)}
                >
                  <FiBookmark style={post.saved ? { fill: 'var(--secondary)', color: 'var(--secondary)' } : {}} />
                </button>
              </div>

              {/* Comments list */}
              {post.comments.length > 0 && (
                <div className="post-comments">
                  {post.comments.slice(0, 2).map(c => (
                    <div key={c.id} className="post-comment">
                      <div className="avatar avatar-sm" style={{ background: getAvatarColor(c.userId) }}>
                        {getInitials(c.userName)}
                      </div>
                      <div className="comment-body">
                        <strong>{c.userName}</strong>
                        <p>{c.text}</p>
                        <span>{c.time}</span>
                      </div>
                      {/* Only show delete on your own comments */}
                      {c.userId === (user?.id || 'u1') && (
                        <button
                          className="comment-delete-btn"
                          onClick={() => deleteComment(post.id, c.id)}
                          title="Delete comment"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                  ))}
                  {post.comments.length > 2 && (
                    <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
                      View all {post.comments.length} comments
                    </button>
                  )}
                </div>
              )}

              {/* Comment input — shown when comment icon is clicked */}
              {openComments[post.id] && (
                <div className="comment-input-row">
                  <div className="avatar avatar-sm" style={{ background: getAvatarColor(user?.id || 'u1') }}>
                    {getInitials(user?.name || 'Alex Morgan')}
                  </div>
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={commentInputs[post.id] || ''}
                    onChange={e => handleCommentInput(post.id, e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmitComment(post.id)}
                    autoFocus
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!commentInputs[post.id]?.trim()}
                    onClick={() => handleSubmitComment(post.id)}
                  >
                    <FiSend />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="community-sidebar">
          <div className="card">
            <h4>🔥 Trending Tags</h4>
            <div className="trending-tags">
              {trendingTags.map(t => <span key={t} className="tag">{t}</span>)}
            </div>
          </div>
          <div className="card">
            <h4>👥 Popular Groups</h4>
            <div className="groups-list">
              {groups.map(g => (
                <div key={g.id} className="group-item">
                  <span className="group-icon">{g.icon}</span>
                  <div className="group-info">
                    <strong>{g.name}</strong>
                    <span>{g.members.toLocaleString()} members</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
