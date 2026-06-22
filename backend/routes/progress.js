const express     = require('express');
const ProgressLog = require('../models/ProgressLog');
const MealPlan    = require('../models/MealPlan');
const auth        = require('../middleware/auth');

const router = express.Router();

const DEFAULT_HABITS = [
  { name: '2L Water',       icon: '💧' },
  { name: '30min Exercise', icon: '🏃' },
  { name: '8h Sleep',       icon: '😴' },
  { name: 'No Sugar',       icon: '🚫' },
  { name: 'Meal Logging',   icon: '📝' },
  { name: 'Veggies 5/day',  icon: '🥦' },
];

// ── GET /api/progress ─────────────────────────────────────────────────────────
// Returns last 8 weeks of weight logs + today's habits + weekly calories from meal plan
router.get('/', auth, async (req, res) => {
  try {
    // Last 56 days of logs (8 weeks)
    const since = new Date();
    since.setDate(since.getDate() - 56);
    const sinceStr = since.toISOString().split('T')[0];

    const logs = await ProgressLog.find({
      userId: req.user.id,
      date:   { $gte: sinceStr },
    }).sort({ date: 1 });

    // Today's log (for habit tracker)
    const today = new Date().toISOString().split('T')[0];
    let todayLog = logs.find(l => l.date === today);
    if (!todayLog) {
      // Create today's log with default habits if it doesn't exist
      todayLog = await ProgressLog.create({
        userId: req.user.id,
        date:   today,
        habits: DEFAULT_HABITS.map(h => ({ ...h, completed: false })),
      });
    }

    // Weekly calories from meal plan
    let weeklyCalories = null;
    const mealPlan = await MealPlan.findOne({ userId: req.user.id });
    if (mealPlan?.plan) {
      const dayOrder = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
      const dayShort = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      weeklyCalories = dayOrder.map((day, i) => {
        const dayData = mealPlan.plan[day] || {};
        const total   = Object.values(dayData).reduce((sum, m) => sum + (m?.calories || 0), 0);
        return { day: dayShort[i], value: total };
      });
    }

    // Weight history — group by week for the chart
    const weightHistory = logs
      .filter(l => l.weight !== null)
      .map((l, i) => ({
        week:  `W${i + 1}`,
        date:  l.date,
        value: l.weight,
      }));

    res.json({ logs, todayLog, weightHistory, weeklyCalories });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/progress/weight ─────────────────────────────────────────────────
// Log today's weight (upserts today's document)
router.post('/weight', auth, async (req, res) => {
  try {
    const { weight, date, notes, waterIntake } = req.body;
    if (!weight || weight <= 0)
      return res.status(400).json({ message: 'Valid weight is required' });

    const logDate = date || new Date().toISOString().split('T')[0];

    const log = await ProgressLog.findOneAndUpdate(
      { userId: req.user.id, date: logDate },
      { $set: { weight, notes: notes || '', waterIntake: waterIntake || 0 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Ensure default habits exist if this is a new log
    if (!log.habits || log.habits.length === 0) {
      log.habits = DEFAULT_HABITS.map(h => ({ ...h, completed: false }));
      await log.save();
    }

    res.json({ log });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/progress/habits ──────────────────────────────────────────────────
// Toggle a habit's completion for today
router.put('/habits', auth, async (req, res) => {
  try {
    const { habitName, completed } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const log = await ProgressLog.findOneAndUpdate(
      { userId: req.user.id, date: today, 'habits.name': habitName },
      { $set: { 'habits.$.completed': completed } },
      { new: true }
    );

    if (!log) {
      // Today's log doesn't exist yet — create it with this habit toggled
      const newLog = await ProgressLog.create({
        userId: req.user.id,
        date:   today,
        habits: DEFAULT_HABITS.map(h => ({
          ...h,
          completed: h.name === habitName ? completed : false,
        })),
      });
      return res.json({ log: newLog });
    }

    res.json({ log });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
