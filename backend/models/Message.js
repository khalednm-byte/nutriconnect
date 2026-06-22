const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  senderId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:           { type: String, required: true },
  type:           { type: String, enum: ['text', 'file'], default: 'text' },
  read:           { type: Boolean, default: false },
}, { timestamps: true });

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage:  { type: String, default: '' },
  lastMessageAt:{ type: Date, default: Date.now },
  unreadCount:  { type: Map, of: Number, default: {} }, // { userId: count }
}, { timestamps: true });

module.exports = {
  Message:      mongoose.model('Message', messageSchema),
  Conversation: mongoose.model('Conversation', conversationSchema),
};
