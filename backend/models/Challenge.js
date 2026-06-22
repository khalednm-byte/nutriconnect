const mongoose = require('mongoose');

// A challenge definition, created by an admin or nutritionist.
// Replaces the old hardcoded mock challenges — these are now real, persisted records.
const challengeSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  icon:        { type: String, default: '🎯' },
  type:        { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' },
  duration:    { type: Number, required: true }, // days needed to complete

  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  creatorRole: { type: String, enum: ['admin', 'nutritionist'], required: true },

  // 'public' = shown in the open catalog, anyone can join
  // 'assigned' = only visible to the specific patient it was assigned to
  visibility:  { type: String, enum: ['public', 'assigned'], default: 'public' },
  assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Optional — links this challenge to a nutritionist's group
  groupId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },

  reward: {
    points: { type: Number, default: 0 },
    badge:  { type: String, default: null }, // references a badge id (global or group-custom)
  },

  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Challenge', challengeSchema);
