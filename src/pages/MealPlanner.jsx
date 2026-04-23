import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { weeklyMealPlan, recipes } from '../data/meals';
import { FiPlus, FiX, FiCheck, FiClock, FiUser, FiArrowRight, FiSearch, FiTrash2 } from 'react-icons/fi';
import './MealPlanner.css';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

const mealIcon   = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };
const plateEmoji = { breakfast: '🥣', lunch: '🥗', dinner: '🍽️', snack: '🍏' };

// Ticket status badge colours — maps to CSS classes we'll add
const statusStyle = {
  pending:  { background: 'var(--warning, #f5a623)', color: '#fff' },
  approved: { background: 'var(--primary)',          color: '#fff' },
  rejected: { background: 'var(--danger, #e8735a)',  color: '#fff' },
};

export default function MealPlanner() {
  const { user } = useAuth();
  const isPremium = (user?.subscription === 'premium' || user?.subscription === 'pro') && user?.role !== 'admin';
  const nutritionist = isPremium ? user?.assignedNutritionist : null;

  const [selectedDay, setSelectedDay]   = useState('Monday');
  const [plan, setPlan]                 = useState(weeklyMealPlan);

  // --- Swap modal state ---
  // swapTarget: { day, type, currentMeal } — what we're swapping
  const [swapTarget, setSwapTarget]     = useState(null);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null); // recipe the user picked in the modal

  // --- Tickets (premium only) ---
  const [tickets, setTickets]           = useState([]);

  // --- Confirmation toast ---
  const [toast, setToast]               = useState(null); // { message, type }

  const dayPlan   = plan[selectedDay];
  const dailyGoal = 2200;

  // Build a lookup map from recipe id → recipe object for O(1) access
  const recipeMap = useMemo(() =>
    Object.fromEntries(recipes.map(r => [r.id, r])),
  []);

  // Compute calories and macros dynamically from whatever is in the plan.
  // Null slots (cleared meals) contribute nothing.
  // Snacks without a mealId have calories but no macro data — we count
  // their calories and treat their macros as 0 until real data exists.
  const dailyNutrition = useMemo(() => {
    return Object.values(dayPlan).reduce((totals, meal) => {
      if (!meal) return totals; // empty slot — skip
      const recipe = meal.mealId ? recipeMap[meal.mealId] : null;
      return {
        calories: totals.calories + (meal.calories || 0),
        protein:  totals.protein  + (recipe?.macros?.protein || 0),
        carbs:    totals.carbs    + (recipe?.macros?.carbs   || 0),
        fat:      totals.fat      + (recipe?.macros?.fat     || 0),
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [dayPlan, recipeMap]);

  const dailyCals = dailyNutrition.calories;

  const filteredRecipes = recipes.filter(r =>
    r.name.toLowerCase().includes(recipeSearch.toLowerCase())
  );

  // --- Open the modal for a specific meal slot ---
  const openSwapModal = (day, type) => {
    setSwapTarget({ day, type, currentMeal: plan[day][type] });
    setSelectedRecipe(null);
    setRecipeSearch('');
  };

  const closeModal = () => {
    setSwapTarget(null);
    setSelectedRecipe(null);
    setRecipeSearch('');
  };

  // --- Clear a meal slot (set to null) ---
  // The day selector and macro calculator both handle null gracefully.
  const clearMeal = (day, type) => {
    setPlan(prev => ({
      ...prev,
      [day]: { ...prev[day], [type]: null },
    }));
    showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} removed.`);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- Called when user confirms their recipe choice ---
  const handleConfirmSwap = () => {
    if (!selectedRecipe || !swapTarget) return;

    if (isPremium && nutritionist) {
      // PREMIUM: create a ticket instead of swapping immediately
      const ticket = {
        id: `t${Date.now()}`,
        userName:         user?.name || 'Alex Morgan',
        nutritionist:     nutritionist.name,
        day:              swapTarget.day,
        mealType:         swapTarget.type,
        currentMeal:      swapTarget.currentMeal,
        proposedMeal: {
          mealId:   selectedRecipe.id,
          name:     selectedRecipe.name,
          calories: selectedRecipe.calories,
          macros:   selectedRecipe.macros,
        },
        status:    'pending',
        createdAt: new Date().toLocaleString(),
      };
      setTickets(prev => [ticket, ...prev]);
      showToast(`Swap request sent to ${nutritionist.name} for review.`);
    } else {
      // FREE: swap the meal directly in the plan
      setPlan(prev => ({
        ...prev,
        [swapTarget.day]: {
          ...prev[swapTarget.day],
          [swapTarget.type]: {
            mealId:   selectedRecipe.id,
            name:     selectedRecipe.name,
            calories: selectedRecipe.calories,
          },
        },
      }));
      showToast(`${swapTarget.type.charAt(0).toUpperCase() + swapTarget.type.slice(1)} swapped to ${selectedRecipe.name}.`);
    }

    closeModal();
  };

  return (
    <div className="meal-planner-page">

      {/* ── Toast ── */}
      {toast && (
        <div className={`planner-toast planner-toast-${toast.type}`}>
          <FiCheck /> {toast.message}
        </div>
      )}

      <div className="planner-header">
        <div>
          <h2>Weekly Meal Plan</h2>
          <p>Plan and optimize your meals for the entire week</p>
        </div>
        <div className="planner-summary">
          <div className="planner-cal-ring">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="var(--surface)" strokeWidth="6" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="var(--primary)" strokeWidth="6"
                strokeDasharray={`${Math.min((dailyCals / dailyGoal), 1) * 213.6} 213.6`}
                strokeLinecap="round" transform="rotate(-90 40 40)"
                style={{ transition: 'stroke-dasharray 0.5s ease' }} />
            </svg>
            <div className="planner-cal-text">
              <strong>{dailyCals}</strong>
              <span>/ {dailyGoal}</span>
            </div>
          </div>
          <span className="planner-cal-label">Daily Calories</span>
        </div>
      </div>

      {/* Premium badge */}
      {isPremium && nutritionist && (
        <div className="planner-nutritionist-badge card">
          <FiUser />
          <span>Your nutritionist <strong>{nutritionist.name}</strong> will review meal swap requests before they're applied.</span>
        </div>
      )}

      {/* ── Day Selector ── */}
      <div className="day-selector">
        {days.map(day => (
          <button
            key={day}
            className={`day-btn ${selectedDay === day ? 'active' : ''}`}
            onClick={() => setSelectedDay(day)}
          >
            <span className="day-short">{day.slice(0, 3)}</span>
            <span className="day-cal">{Object.values(plan[day]).reduce((s, m) => s + (m?.calories || 0), 0)} cal</span>
          </button>
        ))}
      </div>

      {/* ── Meals ── */}
      <div className="planner-meals">
        {mealTypes.map(type => {
          const meal = dayPlan[type];
          const isEmpty = meal === null;

          return (
            <div key={type} className={`planner-meal-card card ${isEmpty ? 'meal-empty' : ''}`}>
              <div className="planner-meal-header">
                <span className="planner-meal-icon">{mealIcon[type]}</span>
                <h4>{type.charAt(0).toUpperCase() + type.slice(1)}</h4>
                {/* Clear button — only shown when the slot has a meal */}
                {!isEmpty && (
                  <button
                    className="meal-clear-btn"
                    onClick={() => clearMeal(selectedDay, type)}
                    title="Remove meal"
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>

              {isEmpty ? (
                /* ── Empty slot ── */
                <div className="planner-meal-empty">
                  <span className="meal-empty-icon">🚫</span>
                  <span className="meal-empty-label">No meal planned</span>
                </div>
              ) : (
                /* ── Filled slot ── */
                <div className="planner-meal-body">
                  <div className="planner-meal-plate">
                    <span className="plate-emoji">{plateEmoji[type]}</span>
                  </div>
                  <div className="planner-meal-info">
                    <strong>{meal.name}</strong>
                    <span className="planner-meal-cal">{meal.calories} calories</span>
                  </div>
                </div>
              )}

              <button
                className={`btn btn-sm ${isEmpty ? 'btn-primary' : 'btn-ghost'}`}
                style={{ width: '100%', marginTop: 'var(--space-md)' }}
                onClick={() => openSwapModal(selectedDay, type)}
              >
                <FiPlus /> {isEmpty ? 'Add Meal' : (isPremium && nutritionist ? 'Request Swap' : 'Swap Meal')}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Macro Summary ── */}
      <div className="planner-macros card">
        <h3>Daily Macros Estimate</h3>
        <p className="macros-note">Calculated from meals with recipe data. Snacks without recipes are excluded from macros.</p>
        <div className="planner-macro-bars">
          {[
            { label: 'Protein', value: dailyNutrition.protein, target: 150, unit: 'g', color: 'var(--primary)' },
            { label: 'Carbs',   value: dailyNutrition.carbs,   target: 250, unit: 'g', color: 'var(--secondary)' },
            { label: 'Fat',     value: dailyNutrition.fat,     target: 65,  unit: 'g', color: 'var(--accent)' },
            { label: 'Fiber',   value: 24,                     target: 30,  unit: 'g', color: 'var(--info)', estimated: true },
          ].map(m => (
            <div key={m.label} className="planner-macro-item">
              <div className="planner-macro-header">
                <span>{m.label}{m.estimated ? ' *' : ''}</span>
                <span>{m.value}{m.unit} / {m.target}{m.unit}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${Math.min((m.value / m.target) * 100, 100)}%`, background: m.color }} />
              </div>
            </div>
          ))}
        </div>
        <p className="macros-estimated-note">* Fiber is estimated — recipe data does not include fiber values yet.</p>
      </div>

      {/* ── Pending Tickets (premium only) ── */}
      {isPremium && tickets.length > 0 && (
        <div className="planner-tickets card">
          <h3>Swap Requests</h3>
          <p className="tickets-subtitle">Submitted to your nutritionist — pending review</p>
          <div className="tickets-list">
            {tickets.map(ticket => (
              <div key={ticket.id} className="ticket-card">
                <div className="ticket-header">
                  <div className="ticket-meta">
                    <span className="ticket-label">
                      {ticket.day} · {ticket.mealType.charAt(0).toUpperCase() + ticket.mealType.slice(1)}
                    </span>
                    <span className="ticket-time"><FiClock /> {ticket.createdAt}</span>
                  </div>
                  <span className="ticket-status" style={statusStyle[ticket.status]}>
                    {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                  </span>
                </div>
                <div className="ticket-meals">
                  <div className="ticket-meal">
                    <span className="ticket-meal-label">Current</span>
                    <strong>{ticket.currentMeal.name}</strong>
                    <span>{ticket.currentMeal.calories} cal</span>
                  </div>
                  <FiArrowRight className="ticket-arrow" />
                  <div className="ticket-meal">
                    <span className="ticket-meal-label">Proposed</span>
                    <strong>{ticket.proposedMeal.name}</strong>
                    <span>{ticket.proposedMeal.calories} cal</span>
                  </div>
                </div>
                <div className="ticket-nutritionist">
                  <FiUser /> Sent to <strong>{ticket.nutritionist}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Swap Modal ── */}
      {swapTarget && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal swap-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>
                  {isPremium && nutritionist ? 'Request Meal Swap' : 'Swap Meal'}
                </h3>
                <p className="modal-subtitle">
                  {swapTarget.currentMeal
                    ? <>Replacing <strong>{swapTarget.currentMeal.name}</strong> on {swapTarget.day}</>
                    : <>Adding a meal for {swapTarget.type} on {swapTarget.day}</>
                  }
                </p>
              </div>
              <button className="modal-close" onClick={closeModal}><FiX /></button>
            </div>

            {isPremium && nutritionist && (
              <div className="modal-premium-notice">
                Your request will be sent to <strong>{nutritionist.name}</strong> for approval before the swap takes effect.
              </div>
            )}

            {/* Recipe search */}
            <div className="modal-search">
              <FiSearch />
              <input
                type="text"
                placeholder="Search recipes..."
                value={recipeSearch}
                onChange={e => setRecipeSearch(e.target.value)}
                autoFocus
              />
            </div>

            {/* Recipe list */}
            <div className="modal-recipe-list">
              {filteredRecipes.length === 0 && (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-xl)' }}>
                  No recipes match your search.
                </p>
              )}
              {filteredRecipes.map(recipe => (
                <div
                  key={recipe.id}
                  className={`modal-recipe-item ${selectedRecipe?.id === recipe.id ? 'selected' : ''}`}
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <div className="modal-recipe-emoji">🍽️</div>
                  <div className="modal-recipe-info">
                    <strong>{recipe.name}</strong>
                    <span>{recipe.calories} cal · {recipe.macros.protein}g protein · {recipe.prepTime + recipe.cookTime} min</span>
                    <div className="modal-recipe-tags">
                      {recipe.dietType.slice(0, 2).map(t => (
                        <span key={t} className="tag">{t.replace('_', ' ')}</span>
                      ))}
                    </div>
                  </div>
                  {selectedRecipe?.id === recipe.id && (
                    <FiCheck className="modal-recipe-check" />
                  )}
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={!selectedRecipe}
                onClick={handleConfirmSwap}
              >
                {isPremium && nutritionist ? 'Send Request' : 'Swap Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
