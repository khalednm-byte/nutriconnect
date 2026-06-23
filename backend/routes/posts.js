const express = require('express');
const Post    = require('../models/Post');
const auth    = require('../middleware/auth');

const router = express.Router();

// ── GET /api/posts ────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { type } = req.query;
    const filter = type ? { type } : {};
    const posts = await Post.find(filter).sort({ createdAt: -1 });

    // Add liked/saved flags relative to the requesting user
    const enriched = posts.map(p => ({
      ...p.toObject(),
      liked: p.likes.includes(req.user.id),
      likesCount: p.likes.length,
    }));

    res.json({ posts: enriched });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/posts ───────────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { type, content, tags, images } = req.body;
    if (!type || !content)
      return res.status(400).json({ message: 'Type and content are required' });

    const safeImages = (images || [])
      .filter(img => typeof img === 'string' && (img.startsWith('data:image/') || img.startsWith('http')))
      .slice(0, 4);

    for (const img of safeImages) {
      if (img.startsWith('data:image/') && img.length > 1_500_000)
        return res.status(400).json({ message: 'Each image must be under 1 MB' });
    }

    const post = await Post.create({
      authorId:   req.user.id,
      authorName: req.user.name,
      authorRole: req.user.role === 'user' ? 'patient' : req.user.role,
      type, content, tags, images: safeImages,
    });
    res.status(201).json({ post });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/posts/:id ─────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.authorId.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });

    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/posts/:id/like ──────────────────────────────────────────────────
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post   = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const alreadyLiked = post.likes.includes(req.user.id);
    if (alreadyLiked) {
      post.likes.pull(req.user.id);
    } else {
      post.likes.push(req.user.id);
    }
    await post.save();
    res.json({ liked: !alreadyLiked, likesCount: post.likes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/posts/:id/comments ──────────────────────────────────────────────
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Comment text is required' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = { userId: req.user.id, userName: req.user.name, text };
    post.comments.push(comment);
    await post.save();

    res.status(201).json({ comment: post.comments[post.comments.length - 1] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/posts/:id/comments/:commentId ─────────────────────────────────
router.delete('/:id/comments/:commentId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.userId.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });

    comment.deleteOne();
    await post.save();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
