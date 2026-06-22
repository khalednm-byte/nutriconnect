const express  = require('express');
const { Message, Conversation } = require('../models/Message');
const auth     = require('../middleware/auth');

const router = express.Router();

// ── GET /api/messages/conversations ──────────────────────────────────────────
// Returns all conversations for the logged-in user
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
      .populate('participants', 'name role profile.avatar')
      .sort({ lastMessageAt: -1 });

    res.json({ conversations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/messages/conversations/:id ──────────────────────────────────────
// Returns all messages in a conversation
router.get('/conversations/:id', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation)
      return res.status(404).json({ message: 'Conversation not found' });

    // Make sure the requester is a participant
    if (!conversation.participants.includes(req.user.id))
      return res.status(403).json({ message: 'Not authorized' });

    const messages = await Message.find({ conversationId: req.params.id })
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { conversationId: req.params.id, senderId: { $ne: req.user.id }, read: false },
      { $set: { read: true } }
    );

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/messages/conversations ─────────────────────────────────────────
// Start a new conversation or return existing one
router.post('/conversations', auth, async (req, res) => {
  try {
    const { participantId } = req.body;
    if (!participantId)
      return res.status(400).json({ message: 'participantId is required' });

    // Check if conversation already exists between these two users
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, participantId], $size: 2 }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, participantId],
      });
    }

    res.status(201).json({ conversation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/messages/conversations/:id/messages ────────────────────────────
// Send a message in a conversation
router.post('/conversations/:id/messages', auth, async (req, res) => {
  try {
    const { text, type } = req.body;
    if (!text) return res.status(400).json({ message: 'Message text is required' });

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation)
      return res.status(404).json({ message: 'Conversation not found' });

    if (!conversation.participants.includes(req.user.id))
      return res.status(403).json({ message: 'Not authorized' });

    const message = await Message.create({
      conversationId: req.params.id,
      senderId: req.user.id,
      text,
      type: type || 'text',
    });

    // Update conversation's last message
    conversation.lastMessage  = text;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
