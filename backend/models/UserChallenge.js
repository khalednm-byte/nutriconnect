const mongoose = require('mongoose');

// Tracks a user's participation in a challenge.
// challengeId now references a real Challenge document (or a mock catalog id
// as a string, for backward compatibility with the original static catalog).
const userChallengeSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Can be a real Challenge ObjectId (as string) or a legacy mock id like 'ch1'
  challengeId: { type: String, required: true },
  challengeRef:{ type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', default: null },

  title:       { type: String, required: true },
  icon:        { type: String },
  duration:    { type: Number, required: true },
  progress:    { type: Number, default: 0 },
  completed:   { type: Boolean, default: false },
  completedAt: { type: Date },
  lastCheckIn: { type: Date },

  // Group scoping — set when the challenge was joined via a group assignment
  groupId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },

  reward: {
    points: { type: Number, default: 0 },
    badge:  { type: String },
  },
}, { timestamps: true });

userChallengeSchema.index({ userId: 1, challengeId: 1 }, { unique: true });

module.exports = mongoose.model('UserChallenge', userChallengeSchema);
