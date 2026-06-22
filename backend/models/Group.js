const mongoose = require('mongoose');

// A nutritionist-managed group of patients.
// Groups have their own custom badges, assigned challenges, and a leaderboard
// scoped only to their members.
const groupSchema = new mongoose.Schema({
  nutritionistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:           { type: String, required: true, trim: true },
  description:    { type: String, default: '' },

  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  challengeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' }],

  // Custom badges defined specifically for this group — separate from the
  // global badge catalog. Each one can have its own point threshold.
  badges: [
    {
      name:            { type: String, required: true },
      icon:            { type: String, default: '🏅' },
      description:     { type: String, default: '' },
      pointsThreshold: { type: Number, default: 0 }, // points needed to earn it
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);
