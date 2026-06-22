import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getInitials, getAvatarColor } from '../data/users';
import { groups, trendingTags } from '../data/posts'; // sidebar data stays static for now
import { postsAPI } from '../services/api';
import { FiHeart, FiMessageCircle, FiShare2, FiBookmark, FiSend, FiTrash2, FiLoader } from 'react-icons/fi';
import './Community.css';

const filters   = ['All', 'Meals', 'Tips', 'Recipes', 'Transformations'];
const filterToType = { Meals: 'meal', Tips: 'tip', Recipes: 'recipe', Transformations: 'transformation' };
const postTypes    = ['meal', 'tip', 'recipe', 'transformation'];
const typeEmoji    = { meal: '🥗', tip: '💡', recipe: '📖', transformation: '💪' };

export default function Community() {
  const { user } = useAuth();

  const [feedPosts, setFeedPosts]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [newPostText, setNewPostText] = useState('');
  const [newPostType, setNewPostType] = useState('meal');
  const [posting, setPosting]         = useState(false);
  const [openComments, setOpenComments]   = useState({});
  const [commentInputs, setCommentInputs] = useState({});

  // ── Fetch posts on mount and when filter changes ──
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError('');
      try {
        const type = filterToType[activeFilter];
        const { posts } = await postsAPI.getAll(type);
        setFeedPosts(posts);
      } catch (err) {
        setError('Failed to load posts. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [activeFilter]);

  // ── Submit new post ──
  const handleSubmitPost = async () => {
    if (!newPostText.trim()) return;
    setPosting(true);
    try {
      const { post } = await postsAPI.create({ type: newPostType, content: newPostText, tags: [], images: [] });
      setFeedPosts(prev => [{ ...post, liked: false, likesCount: 0 }, ...prev]);
      setNewPostText('');
      setNewPostType('meal');
    } catch (err) {
      setError('Failed to create post.');
    } finally {
      setPosting(false);
    }
  };

  // ── Toggle like ──
  const toggleLike = async (post) => {
    // Optimistic update — update UI immediately, revert if API fails
    setFeedPosts(prev => prev.map(p =>
      p._id === post._id
        ? { ...p, liked: !p.liked, likesCount: p.liked ? p.likesCount - 1 : p.likesCount + 1 }
        : p
    ));
    try {
      await postsAPI.toggleLike(post._id);
    } catch {
      // Revert on failure
      setFeedPosts(prev => prev.map(p =>
        p._id === post._id
          ? { ...p, liked: !p.liked, likesCount: p.liked ? p.likesCount - 1 : p.likesCount + 1 }
          : p
      ));
    }
  };

  // ── Delete post ──
  const deletePost = async (postId) => {
    try {
      await postsAPI.delete(postId);
      setFeedPosts(prev => prev.filter(p => p._id !== postId));
    } catch {
      setError('Failed to delete post.');
    }
  };

  // ── Submit comment ──
  const handleSubmitComment = async (postId) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    try {
      const { comment } = await postsAPI.addComment(postId, text);
      setFeedPosts(prev => prev.map(p =>
        p._id === postId ? { ...p, comments: [...p.comments, comment] } : p
      ));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch {
      setError('Failed to post comment.');
    }
  };

  // ── Delete comment ──
  const deleteComment = async (postId, commentId) => {
    try {
      await postsAPI.deleteComment(postId, commentId);
      setFeedPosts(prev => prev.map(p =>
        p._id === postId
          ? { ...p, comments: p.comments.filter(c => c._id !== commentId) }
          : p
      ));
    } catch {
      setError('Failed to delete comment.');
    }
  };

  // ── Share ──
  const handleShare = async (post) => {
    const url = `${window.location.origin}/community#${post._id}`;
    if (navigator.share) {
      try { await navigator.share({ title: `Post by ${post.authorName}`, text: post.content.slice(0, 100), url }); }
      catch (_) {}
    } else {
      await navigator.clipboard.writeText(url);
      setFeedPosts(prev => prev.map(p => p._id === post._id ? { ...p, shareCopied: true } : p));
      setTimeout(() => setFeedPosts(prev => prev.map(p => p._id === post._id ? { ...p, shareCopied: false } : p)), 2000);
    }
  };

  return (
    <div className="community-page">
      <div className="community-layout">
        <div className="community-feed">

          {/* Create Post */}
          <div className="card create-post-card">
            <div className="create-post-row">
              <div className="avatar" style={{ background: getAvatarColor(user?._id) }}>
                {getInitials(user?.name)}
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
                  <button key={type}
                    className={`btn btn-sm ${newPostType === type ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setNewPostType(type)}
                  >
                    {typeEmoji[type]} {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
              <button className="btn btn-primary btn-sm"
                disabled={!newPostText.trim() || posting}
                onClick={handleSubmitPost}
              >
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="tabs" style={{ marginBottom: 'var(--space-lg)' }}>
            {filters.map(f => (
              <button key={f} className={`tab ${activeFilter === f ? 'active' : ''}`}
                onClick={() => setActiveFilter(f)}>{f}</button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="card" style={{ color: 'var(--danger, #e8735a)', padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>
              Loading posts...
            </div>
          )}

          {/* Empty */}
          {!loading && feedPosts.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>
              No posts yet. Be the first to share!
            </div>
          )}

          {/* Posts */}
          {feedPosts.map(post => (
            <div key={post._id} className="card post-card">
              <div className="post-header">
                <div className="avatar" style={{ background: getAvatarColor(post.authorId) }}>
                  {getInitials(post.authorName)}
                </div>
                <div className="post-author-info">
                  <div className="post-author-row">
                    <strong>{post.authorName}</strong>
                    {post.authorRole === 'nutritionist' && <span className="badge badge-primary">Expert</span>}
                  </div>
                  <span className="post-time">
                    {new Date(post.createdAt).toLocaleDateString()} • {post.type}
                  </span>
                </div>
                {post.authorId === user?._id && (
                  <button className="post-delete-btn" onClick={() => deletePost(post._id)} title="Delete post">
                    <FiTrash2 />
                  </button>
                )}
              </div>

              <div className="post-content">
                <p style={{ whiteSpace: 'pre-line' }}>{post.content}</p>
              </div>

              {post.tags?.length > 0 && (
                <div className="post-tags">
                  {post.tags.map(t => <span key={t} className="tag">#{t}</span>)}
                </div>
              )}

              <div className="post-actions">
                <button className={`post-action-btn ${post.liked ? 'liked' : ''}`} onClick={() => toggleLike(post)}>
                  <FiHeart style={post.liked ? { fill: 'var(--accent)', color: 'var(--accent)' } : {}} />
                  {post.likesCount || 0}
                </button>
                <button className={`post-action-btn ${openComments[post._id] ? 'active' : ''}`}
                  onClick={() => setOpenComments(prev => ({ ...prev, [post._id]: !prev[post._id] }))}>
                  <FiMessageCircle /> {post.comments?.length || 0}
                </button>
                <button className="post-action-btn" onClick={() => handleShare(post)}>
                  <FiShare2 /> {post.shareCopied ? 'Copied!' : post.shares || 0}
                </button>
                <button className="post-action-btn">
                  <FiBookmark />
                </button>
              </div>

              {/* Comments */}
              {post.comments?.length > 0 && (
                <div className="post-comments">
                  {post.comments.slice(0, 2).map(c => (
                    <div key={c._id} className="post-comment">
                      <div className="avatar avatar-sm" style={{ background: getAvatarColor(c.userId) }}>
                        {getInitials(c.userName)}
                      </div>
                      <div className="comment-body">
                        <strong>{c.userName}</strong>
                        <p>{c.text}</p>
                        <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      {c.userId === user?._id && (
                        <button className="comment-delete-btn" onClick={() => deleteComment(post._id, c._id)}>
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

              {/* Comment input */}
              {openComments[post._id] && (
                <div className="comment-input-row">
                  <div className="avatar avatar-sm" style={{ background: getAvatarColor(user?._id) }}>
                    {getInitials(user?.name)}
                  </div>
                  <input type="text" placeholder="Write a comment..."
                    value={commentInputs[post._id] || ''}
                    onChange={e => setCommentInputs(prev => ({ ...prev, [post._id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleSubmitComment(post._id)}
                    autoFocus
                  />
                  <button className="btn btn-primary btn-sm"
                    disabled={!commentInputs[post._id]?.trim()}
                    onClick={() => handleSubmitComment(post._id)}>
                    <FiSend />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sidebar — static for now */}
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
