const express = require('express');
const User    = require('../models/User');
const auth    = require('../middleware/auth');

const router = express.Router();

// ── GET /api/users/nutritionists ──────────────────────────────────────────────
// Public — must be before /:id or Express will try to find a user with id "nutritionists"
router.get('/nutritionists', async (req, res) => {
  try {
    const nutritionists = await User.find({ role: 'nutritionist' })
      .select('-password -notifications');
    res.json({ nutritionists });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/users/profile ────────────────────────────────────────────────────
// Must be before /:id for the same reason
router.put('/profile', auth, async (req, res) => {
  try {
    const allowed = ['name', 'profile', 'nutritionistProfile'];
    const updates = {};
    allowed.forEach(key => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/users/notifications ─────────────────────────────────────────────
router.get('/notifications', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('notifications');
    res.json({ notifications: user.notifications });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/users/notifications/read ────────────────────────────────────────
router.put('/notifications/read', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $set: { 'notifications.$[].read': true }
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/users/:id ────────────────────────────────────────────────────────
// Keep this LAST — it's a wildcard that catches anything not matched above
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
