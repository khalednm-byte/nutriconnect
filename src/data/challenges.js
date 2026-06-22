// NutriConnect — Challenge & Badge Definitions
// NOTE: earned/earnedDate are NOT stored here anymore.
// Badge earned status is derived dynamically from the user's completed challenges in the DB.
// participants is a fallback shown only before real counts load from the API.

export const challenges = [
  {
    id: 'ch1',
    title: '7-Day Hydration Challenge',
    description: 'Drink at least 8 glasses of water every day for 7 days straight.',
    icon: '💧',
    type: 'daily',
    duration: 7,
    participants: 0, // overridden by real DB count
    reward: { points: 150, badge: 'hydration_hero' },
    deadline: '2 days left',
    active: true,
  },
  {
    id: 'ch2',
    title: 'Protein Power Week',
    description: 'Hit your daily protein goal (at least 1.5g/kg) for 7 consecutive days.',
    icon: '💪',
    type: 'weekly',
    duration: 7,
    participants: 0,
    reward: { points: 200, badge: 'protein_pro' },
    deadline: '4 days left',
    active: true,
  },
  {
    id: 'ch3',
    title: 'Meal Prep Master',
    description: 'Plan and prep all meals for the entire week using the meal planner.',
    icon: '🍱',
    type: 'weekly',
    duration: 7,
    participants: 0,
    reward: { points: 250, badge: 'meal_prep_master' },
    deadline: '7 days left',
    active: true,
  },
  {
    id: 'ch4',
    title: 'Green Smoothie 30',
    description: 'Make a green smoothie with at least 2 servings of vegetables for 30 days.',
    icon: '🥬',
    type: 'monthly',
    duration: 30,
    participants: 0,
    reward: { points: 500, badge: 'green_machine' },
    deadline: '18 days left',
    active: true,
  },
  {
    id: 'ch5',
    title: 'Community Champion',
    description: 'Share 10 posts, give 50 likes, and leave 20 helpful comments this month.',
    icon: '🌟',
    type: 'monthly',
    duration: 30,
    participants: 0,
    reward: { points: 400, badge: 'community_champion' },
    deadline: '12 days left',
    active: true,
  },
];

// Badge definitions — no earned state here, derived from completed challenges
export const badges = [
  { id: 'early_adopter',      name: 'Early Adopter',       icon: '🚀', description: 'Joined NutriConnect in the first month' },
  { id: '7_day_streak',       name: '7-Day Streak',        icon: '🔥', description: 'Logged meals for 7 consecutive days' },
  { id: 'first_post',         name: 'First Post',          icon: '📝', description: 'Published your first community post' },
  { id: 'recipe_master',      name: 'Recipe Master',       icon: '👨‍🍳', description: 'Saved 25 recipes to your collection' },
  { id: 'hydration_hero',     name: 'Hydration Hero',      icon: '💧', description: 'Complete the 7-Day Hydration Challenge' },
  { id: 'protein_pro',        name: 'Protein Pro',         icon: '💪', description: 'Complete the Protein Power Week challenge' },
  { id: 'meal_prep_master',   name: 'Meal Prep Master',    icon: '🍱', description: 'Complete the Meal Prep Master challenge' },
  { id: '30_day_streak',      name: '30-Day Streak',       icon: '⚡', description: 'Logged meals for 30 consecutive days' },
  { id: 'green_machine',      name: 'Green Machine',       icon: '🥬', description: 'Complete the Green Smoothie 30 challenge' },
  { id: 'community_champion', name: 'Community Champion',  icon: '🌟', description: 'Complete the Community Champion challenge' },
  { id: 'weight_warrior',     name: 'Weight Warrior',      icon: '🏆', description: 'Reach your target weight goal' },
  { id: 'nutrition_nerd',     name: 'Nutrition Nerd',      icon: '📚', description: 'Read 50 expert articles' },
];

export const leaderboard = [
  { rank: 1,  userId: 'u4',  name: 'Maria Garcia',         points: 6800, level: 24, streak: 45 },
  { rank: 2,  userId: 'nu5', name: 'Coach Ryan Mitchell',  points: 5200, level: 21, streak: 38 },
  { rank: 3,  userId: 'u3',  name: 'James Wilson',         points: 4100, level: 18, streak: 30 },
  { rank: 4,  userId: 'u5',  name: 'David Kim',            points: 3900, level: 16, streak: 18 },
  { rank: 5,  userId: 'u2',  name: 'Sarah Chen',           points: 3200, level: 15, streak: 22 },
  { rank: 6,  userId: 'u1',  name: 'Alex Morgan',          points: 2480, level: 12, streak: 14 },
  { rank: 7,  userId: 'u7',  name: 'Olivia Brown',         points: 2100, level: 10, streak: 11 },
  { rank: 8,  userId: 'u8',  name: 'Ethan Davis',          points: 1850, level: 9,  streak: 8  },
  { rank: 9,  userId: 'u9',  name: 'Sophia Lee',           points: 1600, level: 8,  streak: 6  },
  { rank: 10, userId: 'u10', name: 'Noah Taylor',          points: 1200, level: 6,  streak: 4  },
];
