const express = require('express');
const User    = require('../models/User');
const auth    = require('../middleware/auth');

const router = express.Router();

// ── POST /api/setup/bootstrap-admin ───────────────────────────────────────────
// One-time use: promotes the CURRENTLY LOGGED IN user to admin,
// but ONLY if no admin exists in the database yet.
//
// This lets you create your first admin account through the app itself —
// register normally, log in, then call this endpoint once.
// After the first admin exists, this route always returns 403, permanently.
router.post('/bootstrap-admin', auth, async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(403).json({
        message: 'An admin already exists. This setup route is now permanently disabled.',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { role: 'admin', subscription: 'premium' },
      { new: true }
    ).select('-password');

    res.json({
      message: `${user.name} is now an admin. This route is now disabled for all future requests.`,
      user,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/setup/status ──────────────────────────────────────────────────────
// Lets the frontend check whether an admin already exists,
// so it can hide/show a "Become first admin" button appropriately.
router.get('/status', async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' });
    res.json({ adminExists: !!existingAdmin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
