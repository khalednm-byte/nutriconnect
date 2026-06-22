const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName:  { type: String, required: true },
  userEmail: { type: String, required: true },

  // Professional info
  title:             { type: String, required: true },
  bio:               { type: String, required: true },
  location:          { type: String, required: true },
  experience:        { type: Number, required: true },
  credentials:       { type: String, required: true },
  specializations:   [String],
  consultationRate:  { type: Number },
  consultationTypes: [String],
  languages:         { type: String },
  motivation:        { type: String, required: true },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },

  reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt:  { type: Date },
  reviewNotes: { type: String },

}, { timestamps: true });

module.exports = mongoose.model('NutritionistApplication', applicationSchema);
