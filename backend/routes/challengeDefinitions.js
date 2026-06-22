const express   = require('express');
const Challenge = require('../models/Challenge');
const User      = require('../models/User');
const auth      = require('../middleware/auth');

const router = express.Router();

// Helper — only admin or nutritionist may create/manage challenge definitions
function requireCreator(req, res, next) {
  if (!['admin', 'nutritionist'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Only admins and nutritionists can manage challenges' });
  }
  next();
}

// ── GET /api/challenge-definitions ────────────────────────────────────────────
// Returns challenges visible to the current user:
// - All public challenges
// - Challenges specifically assigned to this user
// - If admin/nutritionist: also their own created challenges
router.get('/', auth, async (req, res) => {
  try {
    const query = {
      active: true,
      $or: [
        { visibility: 'public' },
        { visibility: 'assigned', assignedTo: req.user.id },
      ],
    };

    // Admins and nutritionists also see everything they created, even if inactive
    if (['admin', 'nutritionist'].includes(req.user.role)) {
      query.$or.push({ createdBy: req.user.id });
    }

    const challenges = await Challenge.find(query).sort({ createdAt: -1 });
    res.json({ challenges });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/challenge-definitions ───────────────────────────────────────────
// Create a new challenge — admin or nutritionist only
router.post('/', auth, requireCreator, async (req, res) => {
  try {
    const { title, description, icon, type, duration, reward, visibility, assignedTo, groupId } = req.body;

    if (!title || !description || !duration)
      return res.status(400).json({ message: 'title, description and duration are required' });

    // If assigning to a specific patient, validate that relationship
    if (visibility === 'assigned' && assignedTo) {
      const patient = await User.findById(assignedTo);
      if (!patient) return res.status(404).json({ message: 'Patient not found' });

      // Nutritionists can only assign to their own patients
      if (req.user.role === 'nutritionist') {
        const isOwnPatient = patient.assignedNutritionist?.id?.toString() === req.user.id
          || patient.assignedNutritionist?.toString() === req.user.id;
        if (!isOwnPatient) {
          return res.status(403).json({ message: 'You can only assign challenges to your own patients' });
        }
      }
    }

    const challenge = await Challenge.create({
      title, description,
      icon:     icon || '🎯',
      type:     type || 'weekly',
      duration,
      createdBy:   req.user.id,
      creatorRole: req.user.role,
      visibility:  visibility || 'public',
      assignedTo:  visibility === 'assigned' ? assignedTo : null,
      groupId:     groupId || null,
      reward:      reward || { points: 100 },
    });

    res.status(201).json({ challenge });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/challenge-definitions/:id ────────────────────────────────────────
// Update a challenge — only the creator or an admin
router.put('/:id', auth, requireCreator, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    const isOwner = challenge.createdBy.toString() === req.user.id;
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ message: 'You can only edit challenges you created' });
    }

    const allowed = ['title', 'description', 'icon', 'type', 'duration', 'reward', 'visibility', 'assignedTo', 'active'];
    allowed.forEach(key => { if (req.body[key] !== undefined) challenge[key] = req.body[key]; });

    await challenge.save();
    res.json({ challenge });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/challenge-definitions/:id ─────────────────────────────────────
router.delete('/:id', auth, requireCreator, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    const isOwner = challenge.createdBy.toString() === req.user.id;
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ message: 'You can only delete challenges you created' });
    }

    await challenge.deleteOne();
    res.json({ message: 'Challenge deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/challenge-definitions/my-patients ────────────────────────────────
// Helper for the nutritionist UI — list patients they can assign challenges to
router.get('/my-patients', auth, async (req, res) => {
  try {
    if (req.user.role !== 'nutritionist')
      return res.status(403).json({ message: 'Only nutritionists can view their patients' });

    // Patients are users whose assignedNutritionist.id matches this nutritionist
    const patients = await User.find({
      role: 'user',
      $or: [
        { 'assignedNutritionist.id': req.user.id },
        { 'assignedNutritionist': req.user.id },
      ],
    }).select('name email profile.avatar');

    res.json({ patients });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
