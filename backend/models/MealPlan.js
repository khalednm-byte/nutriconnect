const mongoose = require('mongoose');

// A single meal slot — can be null (cleared) or an object with meal info
const mealSlotSchema = new mongoose.Schema({
  mealId:   { type: String },   // recipe _id if from recipe library
  name:     { type: String, required: true },
  calories: { type: Number, default: 0 },
  macros: {
    protein: { type: Number, default: 0 },
    carbs:   { type: Number, default: 0 },
    fat:     { type: Number, default: 0 },
  },
}, { _id: false });

// One day's meals
const dayPlanSchema = new mongoose.Schema({
  breakfast: { type: mealSlotSchema, default: null },
  lunch:     { type: mealSlotSchema, default: null },
  dinner:    { type: mealSlotSchema, default: null },
  snack:     { type: mealSlotSchema, default: null },
}, { _id: false });

const mealPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // one plan per user
  },
  plan: {
    Monday:    { type: dayPlanSchema, default: () => ({}) },
    Tuesday:   { type: dayPlanSchema, default: () => ({}) },
    Wednesday: { type: dayPlanSchema, default: () => ({}) },
    Thursday:  { type: dayPlanSchema, default: () => ({}) },
    Friday:    { type: dayPlanSchema, default: () => ({}) },
    Saturday:  { type: dayPlanSchema, default: () => ({}) },
    Sunday:    { type: dayPlanSchema, default: () => ({}) },
  },
}, { timestamps: true });

module.exports = mongoose.model('MealPlan', mealPlanSchema);
