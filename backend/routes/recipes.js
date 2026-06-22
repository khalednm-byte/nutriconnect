const express = require('express');
const Recipe  = require('../models/Recipe');
const auth    = require('../middleware/auth');

const router = express.Router();

// ── GET /api/recipes ──────────────────────────────────────────────────────────
// Public — anyone can browse recipes
router.get('/', async (req, res) => {
  try {
    const { diet, search } = req.query;
    const filter = {};
    if (diet)   filter.dietType = diet;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const recipes = await Recipe.find(filter).sort({ createdAt: -1 });
    res.json({ recipes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/recipes/:id ──────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    res.json({ recipe });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/recipes ─────────────────────────────────────────────────────────
// Admin or nutritionist only
router.post('/', auth, async (req, res) => {
  try {
    if (!['admin', 'nutritionist'].includes(req.user.role))
      return res.status(403).json({ message: 'Not authorized to create recipes' });

    const recipe = await Recipe.create({
      ...req.body,
      authorId:   req.user.id,
      authorName: req.user.name,
    });
    res.status(201).json({ recipe });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/recipes/:id ──────────────────────────────────────────────────────
// Admin can edit any recipe. Nutritionist can only edit their own.
router.put('/:id', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    const isAdmin        = req.user.role === 'admin';
    const isOwner        = recipe.authorId.toString() === req.user.id;
    const isNutritionist = req.user.role === 'nutritionist';

    if (!isAdmin && !(isNutritionist && isOwner))
      return res.status(403).json({ message: 'Not authorized to edit this recipe' });

    const updated = await Recipe.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    res.json({ recipe: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/recipes/:id ───────────────────────────────────────────────────
// Admin only
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ message: 'Only admins can delete recipes' });

    await Recipe.findByIdAndDelete(req.params.id);
    res.json({ message: 'Recipe deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
