const express     = require('express');
const Application = require('../models/NutritionistApplication');
const User        = require('../models/User');
const auth        = require('../middleware/auth');

const router = express.Router();

// ── POST /api/applications ────────────────────────────────────────────────────
// Any regular user can submit an application
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'user')
      return res.status(403).json({ message: 'Only regular users can apply' });

    // Prevent duplicate pending applications
    const existing = await Application.findOne({
      userId: req.user.id,
      status: 'pending',
    });
    if (existing)
      return res.status(400).json({ message: 'You already have a pending application' });

    const application = await Application.create({
      ...req.body,
      userId:    req.user.id,
      userName:  req.user.name,
      userEmail: req.user.email,
    });

    res.status(201).json({ application });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/applications ─────────────────────────────────────────────────────
// Admin only — get all applications
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ message: 'Admin access required' });

    const { status } = req.query;
    const filter = status ? { status } : {};
    const applications = await Application.find(filter).sort({ createdAt: -1 });
    res.json({ applications });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/applications/:id ─────────────────────────────────────────────────
// Admin approves or rejects. Approving promotes the user's role to 'nutritionist'.
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ message: 'Admin access required' });

    const { status, reviewNotes } = req.body;
    if (!['approved', 'rejected'].includes(status))
      return res.status(400).json({ message: 'Status must be approved or rejected' });

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status, reviewNotes, reviewedBy: req.user.id, reviewedAt: new Date() },
      { new: true }
    );

    if (!application)
      return res.status(404).json({ message: 'Application not found' });

    // If approved — promote user role and copy profile data
    if (status === 'approved') {
      await User.findByIdAndUpdate(application.userId, {
        role: 'nutritionist',
        nutritionistProfile: {
          title:             application.title,
          credentials:       application.credentials.split(',').map(s => s.trim()),
          specializations:   application.specializations,
          experience:        application.experience,
          consultationRate:  application.consultationRate,
          consultationTypes: application.consultationTypes,
          languages:         application.languages?.split(',').map(s => s.trim()) || [],
        },
        'profile.location': application.location,
        'profile.bio':      application.bio,
      });
    }

    res.json({ application });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
