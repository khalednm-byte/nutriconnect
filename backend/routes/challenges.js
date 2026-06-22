const express        = require('express');
const UserChallenge  = require('../models/UserChallenge');
const User           = require('../models/User');
const auth           = require('../middleware/auth');

const router = express.Router();

// ── GET /api/challenges ───────────────────────────────────────────────────────
// Returns the user's joined challenges + real participant counts per challenge
router.get('/', auth, async (req, res) => {
  try {
    const [joined, participantCounts] = await Promise.all([
      UserChallenge.find({ userId: req.user.id }).sort({ createdAt: -1 }),
      // Count how many users have joined each challenge
      UserChallenge.aggregate([
        { $group: { _id: '$challengeId', count: { $sum: 1 } } }
      ]),
    ]);

    // Convert aggregation result to a simple map: { ch1: 42, ch2: 17, ... }
    const countMap = {};
    participantCounts.forEach(p => { countMap[p._id] = p.count; });

    res.json({ challenges: joined, participantCounts: countMap });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/challenges/join ─────────────────────────────────────────────────
// Join a challenge — creates a UserChallenge document.
// Accepts either a real challengeRef (Mongo _id) for admin/nutritionist-created
// challenges, or a legacy mock challengeId string for the static catalog.
router.post('/join', auth, async (req, res) => {
  try {
    const { challengeId, challengeRef, title, icon, duration, reward, groupId } = req.body;
    if (!challengeId || !title || !duration)
      return res.status(400).json({ message: 'challengeId, title and duration are required' });

    const existing = await UserChallenge.findOne({ userId: req.user.id, challengeId });
    if (existing)
      return res.status(400).json({ message: 'Already joined this challenge' });

    // If this challenge came from a real Challenge document, pull its groupId
    // automatically so the leaderboard can scope this completion correctly,
    // even if the frontend didn't pass groupId explicitly.
    let resolvedGroupId = groupId || null;
    if (!resolvedGroupId && challengeRef) {
      const Challenge = require('../models/Challenge');
      const challengeDoc = await Challenge.findById(challengeRef);
      if (challengeDoc?.groupId) resolvedGroupId = challengeDoc.groupId;
    }

    const challenge = await UserChallenge.create({
      userId: req.user.id,
      challengeId,
      challengeRef: challengeRef || null,
      title, icon, duration,
      groupId: resolvedGroupId,
      reward: reward || { points: 0 },
    });

    res.status(201).json({ challenge });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/challenges/:id/checkin ─────────────────────────────────────────
// Daily check-in — increments progress by 1, once per day
router.post('/:id/checkin', auth, async (req, res) => {
  try {
    const challenge = await UserChallenge.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    if (challenge.completed) return res.status(400).json({ message: 'Challenge already completed' });

    // Prevent multiple check-ins on same day
    const today    = new Date().toISOString().split('T')[0];
    const lastDate = challenge.lastCheckIn?.toISOString().split('T')[0];
    if (lastDate === today)
      return res.status(400).json({ message: 'Already checked in today' });

    challenge.progress  += 1;
    challenge.lastCheckIn = new Date();

    // Check if challenge is now complete
    if (challenge.progress >= challenge.duration) {
      challenge.completed  = true;
      challenge.completedAt = new Date();

      // Award points to the user
      if (challenge.reward?.points) {
        await User.findByIdAndUpdate(req.user.id, {
          $inc: { 'stats.points': challenge.reward.points },
        });
      }
    }

    await challenge.save();
    res.json({ challenge, justCompleted: challenge.completed });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/challenges/:id ────────────────────────────────────────────────
// Leave a challenge
router.delete('/:id', auth, async (req, res) => {
  try {
    const challenge = await UserChallenge.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    if (challenge.completed) return res.status(400).json({ message: 'Cannot leave a completed challenge' });

    await challenge.deleteOne();
    res.json({ message: 'Left challenge successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
