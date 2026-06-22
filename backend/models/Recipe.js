const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  authorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
  prepTime:   { type: Number, default: 0 },
  cookTime:   { type: Number, default: 0 },
  servings:   { type: Number, default: 1 },
  calories:   { type: Number, default: 0 },
  macros: {
    protein: { type: Number, default: 0 },
    carbs:   { type: Number, default: 0 },
    fat:     { type: Number, default: 0 },
  },
  rating:       { type: Number, default: 0, min: 0, max: 5 },
  reviewCount:  { type: Number, default: 0 },
  dietType:     [String],
  ingredients:  [String],
  instructions: { type: String, default: '' }, // Markdown string
  videoUrl:     { type: String, default: '' },
  imageUrl:     { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Recipe', recipeSchema);
