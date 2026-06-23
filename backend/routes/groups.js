const express      = require('express');
const Group        = require('../models/Group');
const User         = require('../models/User');
const Challenge    = require('../models/Challenge');
const UserChallenge= require('../models/UserChallenge');
const auth         = require('../middleware/auth');

const router = express.Router();

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Helper — only nutritionists can manage groups
function requireNutritionist(req, res, next) {
  if (req.user.role !== 'nutritionist') {
    return res.status(403).json({ message: 'Only nutritionists can manage groups' });
  }
  next();
}

// Helper — verify a list of patient IDs all belong to this nutritionist
async function validateOwnPatients(nutritionistId, patientIds) {
  if (!patientIds || patientIds.length === 0) return true;
  const patients = await User.find({
    _id: { $in: patientIds },
    role: { $in: ['patient', 'user'] },
    $or: [
      { 'assignedNutritionist.id': nutritionistId },
      { 'assignedNutritionist': nutritionistId },
    ],
  });
  return patients.length === patientIds.length;
}

// ── GET /api/groups/my-group ──────────────────────────────────────────────────
// For regular users — get the group they belong to (one group at a time)
router.get('/my-group', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('groupId');
    if (!user?.groupId) return res.json({ group: null });

    const group = await Group.findById(user.groupId)
      .populate('members', 'name profile.avatar stats.points')
      .populate('challengeIds');

    res.json({ group });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/groups/join ─────────────────────────────────────────────────────
// User joins a group via invite code from their nutritionist
router.post('/join', auth, async (req, res) => {
  try {
    if (req.user.role !== 'patient' && req.user.role !== 'user')
      return res.status(403).json({ message: 'Only patients can join groups' });

    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ message: 'inviteCode is required' });

    const group = await Group.findOne({ inviteCode: inviteCode.toUpperCase().trim() });
    if (!group) return res.status(404).json({ message: 'Invalid invite code' });

    const isPatient = await validateOwnPatients(group.nutritionistId.toString(), [req.user.id]);
    if (!isPatient)
      return res.status(403).json({ message: 'You can only join groups created by your assigned nutritionist' });

    const user = await User.findById(req.user.id);
    if (user.groupId && user.groupId.toString() !== group._id.toString()) {
      await Group.findByIdAndUpdate(user.groupId, { $pull: { members: req.user.id } });
    }

    if (!group.members.some(m => m.toString() === req.user.id)) {
      group.members.push(req.user.id);
      await group.save();
    }
    await User.findByIdAndUpdate(req.user.id, { $set: { groupId: group._id } });

    const updated = await Group.findById(group._id)
      .populate('members', 'name profile.avatar stats.points')
      .populate('challengeIds');
    res.json({ group: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/groups ────────────────────────────────────────────────────────────
// For nutritionists — list groups they manage
router.get('/', auth, requireNutritionist, async (req, res) => {
  try {
    const groups = await Group.find({ nutritionistId: req.user.id })
      .populate('members', 'name profile.avatar stats.points')
      .populate('challengeIds')
      .sort({ createdAt: -1 });

    for (const group of groups) {
      if (!group.inviteCode) {
        group.inviteCode = generateInviteCode();
        await group.save();
      }
    }

    res.json({ groups });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/groups ───────────────────────────────────────────────────────────
// Create a new group — nutritionist only
router.post('/', auth, requireNutritionist, async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;
    if (!name) return res.status(400).json({ message: 'Group name is required' });

    // Validate all proposed members are this nutritionist's own patients
    if (memberIds?.length > 0) {
      const valid = await validateOwnPatients(req.user.id, memberIds);
      if (!valid) {
        return res.status(403).json({ message: 'You can only add your own patients to a group' });
      }
    }

    const group = await Group.create({
      nutritionistId: req.user.id,
      name,
      description: description || '',
      members: memberIds || [],
      inviteCode: generateInviteCode(),
    });

    // Update each member's groupId (single group per user)
    if (memberIds?.length > 0) {
      await User.updateMany(
        { _id: { $in: memberIds } },
        { $set: { groupId: group._id } }
      );
    }

    res.status(201).json({ group });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/groups/:id ────────────────────────────────────────────────────────
// Update group details (name, description) — owner nutritionist only
router.put('/:id', auth, requireNutritionist, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.nutritionistId.toString() !== req.user.id)
      return res.status(403).json({ message: 'You can only edit your own groups' });

    const { name, description } = req.body;
    if (name !== undefined) group.name = name;
    if (description !== undefined) group.description = description;
    await group.save();

    res.json({ group });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/groups/:id/members ──────────────────────────────────────────────
// Add a patient to the group — owner nutritionist only
router.post('/:id/members', auth, requireNutritionist, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.nutritionistId.toString() !== req.user.id)
      return res.status(403).json({ message: 'You can only manage your own groups' });

    const valid = await validateOwnPatients(req.user.id, [userId]);
    if (!valid) return res.status(403).json({ message: 'You can only add your own patients' });

    // A user can only be in one group at a time — remove from any previous group
    const patient = await User.findById(userId);
    if (patient.groupId && patient.groupId.toString() !== group._id.toString()) {
      await Group.findByIdAndUpdate(patient.groupId, { $pull: { members: userId } });
    }

    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }
    await User.findByIdAndUpdate(userId, { $set: { groupId: group._id } });

    const updated = await Group.findById(group._id).populate('members', 'name profile.avatar stats.points');
    res.json({ group: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/groups/:id/members/:userId ────────────────────────────────────
// Remove a patient from the group
router.delete('/:id/members/:userId', auth, requireNutritionist, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.nutritionistId.toString() !== req.user.id)
      return res.status(403).json({ message: 'You can only manage your own groups' });

    group.members = group.members.filter(m => m.toString() !== req.params.userId);
    await group.save();
    await User.findByIdAndUpdate(req.params.userId, { $set: { groupId: null } });

    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/groups/:id/challenges ───────────────────────────────────────────
// Assign an existing challenge to the group
router.post('/:id/challenges', auth, requireNutritionist, async (req, res) => {
  try {
    const { challengeId } = req.body;
    if (!challengeId) return res.status(400).json({ message: 'challengeId is required' });

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.nutritionistId.toString() !== req.user.id)
      return res.status(403).json({ message: 'You can only manage your own groups' });

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    if (!group.challengeIds.includes(challengeId)) {
      group.challengeIds.push(challengeId);
      await group.save();
    }
    // Link the challenge back to this group too
    challenge.groupId = group._id;
    await challenge.save();

    const updated = await Group.findById(group._id).populate('challengeIds');
    res.json({ group: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/groups/:id/badges ───────────────────────────────────────────────
// Add a custom badge/reward to the group
router.post('/:id/badges', auth, requireNutritionist, async (req, res) => {
  try {
    const { name, icon, description, pointsThreshold } = req.body;
    if (!name) return res.status(400).json({ message: 'Badge name is required' });

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.nutritionistId.toString() !== req.user.id)
      return res.status(403).json({ message: 'You can only manage your own groups' });

    group.badges.push({ name, icon: icon || '🏅', description: description || '', pointsThreshold: pointsThreshold || 0 });
    await group.save();

    res.status(201).json({ group });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/groups/:id ─────────────────────────────────────────────────────
// Delete a group entirely — owner nutritionist only
router.delete('/:id', auth, requireNutritionist, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.nutritionistId.toString() !== req.user.id)
      return res.status(403).json({ message: 'You can only delete your own groups' });

    // Unassign all members from this group
    await User.updateMany({ groupId: group._id }, { $set: { groupId: null } });
    await group.deleteOne();

    res.json({ message: 'Group deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/groups/:id/leaderboard ───────────────────────────────────────────
// Returns group members ranked by completed challenges (primary) and
// total points earned from completed challenges (secondary tiebreaker).
// Accessible to: the owning nutritionist, or any member of the group.
router.get('/:id/leaderboard', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('members', 'name profile.avatar role');
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isOwner  = group.nutritionistId.toString() === req.user.id;
    const isMember = group.members.some(m => m._id.toString() === req.user.id);
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'You do not have access to this leaderboard' });
    }

    // For every member, count their completed challenges scoped to this group
    // and sum the points earned from those completions.
    const memberStats = await Promise.all(
      group.members.map(async (member) => {
        const completed = await UserChallenge.find({
          userId: member._id,
          groupId: group._id,
          completed: true,
        });

        const completedCount = completed.length;
        const totalPoints    = completed.reduce((sum, c) => sum + (c.reward?.points || 0), 0);

        return {
          userId:         member._id,
          name:           member.name,
          avatar:         member.profile?.avatar || null,
          completedCount,
          totalPoints,
        };
      })
    );

    // Sort: most completed challenges first, then most points as tiebreaker
    memberStats.sort((a, b) => {
      if (b.completedCount !== a.completedCount) return b.completedCount - a.completedCount;
      return b.totalPoints - a.totalPoints;
    });

    // Attach rank after sorting
    const ranked = memberStats.map((m, i) => ({ ...m, rank: i + 1 }));

    res.json({
      group: { _id: group._id, name: group.name },
      leaderboard: ranked,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
