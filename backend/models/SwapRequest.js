const mongoose = require('mongoose');

const swapRequestSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName:       { type: String, required: true },
  nutritionistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nutritionistName: { type: String, required: true },
  day:            { type: String, required: true },
  mealType:       { type: String, required: true },
  currentMeal: {
    name:     String,
    calories: Number,
  },
  proposedMeal: {
    mealId:   String,
    name:     String,
    calories: Number,
    macros:   { protein: Number, carbs: Number, fat: Number },
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  reviewedAt:  Date,
  reviewNotes: String,
}, { timestamps: true });

module.exports = mongoose.model('SwapRequest', swapRequestSchema);
