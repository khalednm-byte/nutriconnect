import express from 'express';
import { nutritionists, currentUser, users } from '../data/users.js';
import { recipes, weeklyMealPlan } from '../data/meals.js';
import { posts, groups } from '../data/posts.js';
import { challenges, badges, leaderboard } from '../data/challenges.js';

const router = express.Router();

/**
 * 
 * DASHBOARD / PROFILE 
 * 
 */

// Get current user profile (using u1 as the logged in user)
router.get('/profile', (req, res) => {
  res.json(currentUser);
});

/**
 * 
 * NUTRITIONISTS
 * 
 */
router.get('/nutritionists', (req, res) => {
  res.json(nutritionists);
});

router.get('/nutritionists/:id', (req, res) => {
  const nutritionist = nutritionists.find(n => n.id === req.params.id);
  if (nutritionist) {
    res.json(nutritionist);
  } else {
    res.status(404).json({ error: 'Nutritionist not found' });
  }
});

/**
 * 
 * MEALS & RECIPES
 * 
 */
router.get('/meals/recipes', (req, res) => {
  res.json(recipes);
});

router.get('/meals/plan', (req, res) => {
  res.json(weeklyMealPlan);
});

/**
 * 
 * COMMUNITY 
 * 
 */
router.get('/community/posts', (req, res) => {
  res.json(posts);
});

router.get('/community/groups', (req, res) => {
  res.json(groups);
});

/**
 * 
 * CHALLENGES & GAMIFICATION
 * 
 */
router.get('/challenges', (req, res) => {
  res.json({
    challenges: challenges.filter(c => c.active),
    completed: challenges.filter(c => c.completed),
    badges,
    leaderboard
  });
});

export default router;
