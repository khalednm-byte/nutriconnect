const mongoose = require('mongoose');

// One document per user per day — stores weight and habit completions
const progressLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String, // stored as 'YYYY-MM-DD' for easy querying and grouping
    required: true,
  },
  weight:       { type: Number, default: null }, // kg
  waterIntake:  { type: Number, default: 0 },    // litres
  habits: [
    {
      name:      { type: String, required: true },
      icon:      { type: String },
      completed: { type: Boolean, default: false },
    }
  ],
  notes: { type: String, default: '' },
}, { timestamps: true });

// One log per user per day
progressLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('ProgressLog', progressLogSchema);
