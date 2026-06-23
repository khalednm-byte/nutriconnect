const express     = require('express');
const MealPlan    = require('../models/MealPlan');
const SwapRequest = require('../models/SwapRequest');
const User        = require('../models/User');
const auth        = require('../middleware/auth');

const router = express.Router();

async function isNutritionistPatient(nutritionistId, patientId) {
  const patient = await User.findOne({
    _id: patientId,
    role: { $in: ['patient', 'user'] },
    $or: [
      { 'assignedNutritionist.id': nutritionistId },
      { 'assignedNutritionist': nutritionistId },
    ],
  });
  return !!patient;
}

// ── GET /api/mealplan ─────────────────────────────────────────────────────────
// Returns the user's meal plan. Creates a blank one if none exists yet.
router.get('/', auth, async (req, res) => {
  try {
    let mealPlan = await MealPlan.findOne({ userId: req.user.id });
    if (!mealPlan) {
      mealPlan = await MealPlan.create({ userId: req.user.id });
    }
    res.json({ plan: mealPlan.plan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/mealplan ─────────────────────────────────────────────────────────
// Saves the entire weekly plan. Uses upsert so it creates if not found.
router.put('/', auth, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!plan) return res.status(400).json({ message: 'Plan data is required' });

    const mealPlan = await MealPlan.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { plan } },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ plan: mealPlan.plan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/mealplan/patient/:patientId ────────────────────────────────────
// Nutritionist views a patient's meal plan
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'nutritionist' && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Only nutritionists can view patient meal plans' });

    const allowed = await isNutritionistPatient(req.user.id, req.params.patientId);
    if (!allowed && req.user.role !== 'admin')
      return res.status(403).json({ message: 'This patient is not assigned to you' });

    let mealPlan = await MealPlan.findOne({ userId: req.params.patientId });
    if (!mealPlan) {
      mealPlan = await MealPlan.create({ userId: req.params.patientId });
    }
    res.json({ plan: mealPlan.plan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/mealplan/patient/:patientId ─────────────────────────────────────
// Nutritionist saves a patient's meal plan
router.put('/patient/:patientId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'nutritionist' && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Only nutritionists can edit patient meal plans' });

    const allowed = await isNutritionistPatient(req.user.id, req.params.patientId);
    if (!allowed && req.user.role !== 'admin')
      return res.status(403).json({ message: 'This patient is not assigned to you' });

    const { plan } = req.body;
    if (!plan) return res.status(400).json({ message: 'Plan data is required' });

    const mealPlan = await MealPlan.findOneAndUpdate(
      { userId: req.params.patientId },
      { $set: { plan } },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ plan: mealPlan.plan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/mealplan/swap-requests ─────────────────────────────────────────
// Premium user submits a swap request to their assigned nutritionist
router.post('/swap-requests', auth, async (req, res) => {
  try {
    const { day, mealType, currentMeal, proposedMeal, nutritionistId } = req.body;
    if (!day || !mealType || !proposedMeal)
      return res.status(400).json({ message: 'day, mealType and proposedMeal are required' });

    // Look up the nutritionist's name
    const nutritionist = await User.findById(nutritionistId).select('name');
    if (!nutritionist)
      return res.status(404).json({ message: 'Nutritionist not found' });

    const request = await SwapRequest.create({
      userId:           req.user.id,
      userName:         req.user.name,
      nutritionistId,
      nutritionistName: nutritionist.name,
      day,
      mealType,
      currentMeal,
      proposedMeal,
    });

    res.status(201).json({ request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/mealplan/swap-requests ──────────────────────────────────────────
// Get all swap requests for the current user
router.get('/swap-requests', auth, async (req, res) => {
  try {
    const requests = await SwapRequest.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/mealplan/swap-requests/incoming ─────────────────────────────────
// Nutritionist sees swap requests assigned to them
router.get('/swap-requests/incoming', auth, async (req, res) => {
  try {
    if (req.user.role !== 'nutritionist' && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Only nutritionists can view incoming swap requests' });

    const requests = await SwapRequest.find({ nutritionistId: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/mealplan/swap-requests/:id ──────────────────────────────────────
// Nutritionist approves or rejects a swap request
// If approved, the meal plan is updated automatically
router.put('/swap-requests/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'nutritionist' && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Only nutritionists can review swap requests' });

    const { status, reviewNotes } = req.body;
    if (!['approved', 'rejected'].includes(status))
      return res.status(400).json({ message: 'Status must be approved or rejected' });

    const request = await SwapRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.nutritionistId.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'You can only review requests assigned to you' });

    request.status = status;
    request.reviewNotes = reviewNotes;
    request.reviewedAt = new Date();
    await request.save();

    // If approved — apply the swap to the user's meal plan automatically
    if (status === 'approved') {
      await MealPlan.findOneAndUpdate(
        { userId: request.userId },
        { $set: { [`plan.${request.day}.${request.mealType}`]: request.proposedMeal } },
        { upsert: true }
      );
    }

    res.json({ request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
