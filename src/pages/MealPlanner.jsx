import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { weeklyMealPlan, recipes as mockRecipes } from '../data/meals';
import { mealPlanAPI, recipesAPI, challengeDefinitionsAPI } from '../services/api';
import { getInitials, getAvatarColor } from '../data/users';
import { FiPlus, FiX, FiCheck, FiClock, FiUser, FiArrowRight, FiSearch, FiTrash2, FiSave } from 'react-icons/fi';
import './MealPlanner.css';

const days      = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const mealTypes = ['breakfast','lunch','dinner','snack'];
const mealIcon  = { breakfast:'🌅', lunch:'☀️', dinner:'🌙', snack:'🍎' };
const plateEmoji= { breakfast:'🥣', lunch:'🥗', dinner:'🍽️', snack:'🍏' };
const statusStyle = {
  pending:  { background: 'var(--warning, #f5a623)', color: '#fff' },
  approved: { background: 'var(--primary)',          color: '#fff' },
  rejected: { background: 'var(--danger, #e8735a)',  color: '#fff' },
};

// Convert backend plan (may have missing days/slots) into the full 7-day shape
function normalizePlan(backendPlan) {
  const base = JSON.parse(JSON.stringify(weeklyMealPlan)); // start from mock defaults
  if (!backendPlan) return base;
  days.forEach(day => {
    if (backendPlan[day]) {
      mealTypes.forEach(type => {
        // null means explicitly cleared; undefined means not set yet (use default)
        if (backendPlan[day][type] !== undefined) {
          base[day][type] = backendPlan[day][type];
        }
      });
    }
  });
  return base;
}

function getMealFiber(meal, recipe) {
  if (meal?.macros?.fiber != null) return meal.macros.fiber;
  if (recipe?.macros?.fiber != null) return recipe.macros.fiber;
  const carbs = recipe?.macros?.carbs || meal?.macros?.carbs || 0;
  const dietBonus = (recipe?.dietType || []).some(t =>
    ['high_fiber', 'vegan', 'plant_based'].includes(t)
  ) ? 3 : 0;
  return Math.round(carbs * 0.12 + dietBonus);
}

export default function MealPlanner() {
  const { user } = useAuth();
  const isNutritionist = user?.role === 'nutritionist';
  const isPremium    = (user?.subscription === 'premium' || user?.subscription === 'pro') && user?.role !== 'admin';
  const nutritionist = isPremium ? user?.assignedNutritionist : null;

  const [plan, setPlan]               = useState(null);
  const [recipes, setRecipes]         = useState(mockRecipes);
  const [tickets, setTickets]         = useState([]);
  const [patients, setPatients]       = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [incomingTickets, setIncomingTickets] = useState([]);
  const [reviewingId, setReviewingId] = useState(null);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [swapTarget, setSwapTarget]   = useState(null);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [toast, setToast]             = useState(null);
  const [saving, setSaving]           = useState(false);
  const saveTimerRef                  = useRef(null);

  // ── Load plan and swap requests on mount ──
  useEffect(() => {
    const load = async () => {
      try {
        const recipesRes = await recipesAPI.getAll();
        if (recipesRes.recipes?.length > 0) setRecipes(recipesRes.recipes);

        if (isNutritionist) {
          const [patientsRes, incomingRes] = await Promise.all([
            challengeDefinitionsAPI.getMyPatients(),
            mealPlanAPI.getIncomingSwapRequests(),
          ]);
          const patientList = patientsRes.patients || [];
          setPatients(patientList);
          setIncomingTickets(incomingRes.requests || []);
          if (patientList.length > 0) {
            setSelectedPatient(patientList[0]);
          } else {
            setPlan(normalizePlan(null));
          }
        } else {
          const [planRes, swapRes] = await Promise.all([
            mealPlanAPI.get(),
            mealPlanAPI.getSwapRequests(),
          ]);
          setPlan(normalizePlan(planRes.plan));
          setTickets(swapRes.requests || []);
        }
      } catch (err) {
        console.error(err);
        if (!isNutritionist) setPlan(normalizePlan(null));
      }
    };
    load();
  }, [isNutritionist]);

  // ── Load selected patient's plan (nutritionist) ──
  useEffect(() => {
    if (!isNutritionist || !selectedPatient) return;
    const loadPatientPlan = async () => {
      try {
        const { plan: patientPlan } = await mealPlanAPI.getPatientPlan(selectedPatient._id);
        setPlan(normalizePlan(patientPlan));
      } catch (err) {
        console.error(err);
        setPlan(normalizePlan(null));
      }
    };
    loadPatientPlan();
  }, [isNutritionist, selectedPatient]);

  // ── Auto-save plan to backend 1s after any change ──
  const savePlan = useCallback(async (updatedPlan) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        if (isNutritionist && selectedPatient) {
          await mealPlanAPI.savePatientPlan(selectedPatient._id, updatedPlan);
        } else {
          await mealPlanAPI.save(updatedPlan);
        }
      } catch (err) {
        console.error('Auto-save failed:', err);
      } finally {
        setSaving(false);
      }
    }, 1000);
  }, [isNutritionist, selectedPatient]);

  const updatePlan = (updater) => {
    setPlan(prev => {
      const next = updater(prev);
      savePlan(next);
      return next;
    });
  };

  // ── Derived values ──
  const dayPlan = plan?.[selectedDay] || {};
  const dailyGoal = 2200;

  const recipeMap = useMemo(() => {
    const map = {};
    recipes.forEach(r => { map[r._id || r.id] = r; });
    return map;
  }, [recipes]);

  const dailyNutrition = useMemo(() => {
    return Object.values(dayPlan).reduce((totals, meal) => {
      if (!meal) return totals;
      const recipe = meal.mealId ? recipeMap[meal.mealId] : null;
      return {
        calories: totals.calories + (meal.calories || 0),
        protein:  totals.protein  + (recipe?.macros?.protein || meal?.macros?.protein || 0),
        carbs:    totals.carbs    + (recipe?.macros?.carbs   || meal?.macros?.carbs   || 0),
        fat:      totals.fat      + (recipe?.macros?.fat     || meal?.macros?.fat     || 0),
        fiber:    totals.fiber    + getMealFiber(meal, recipe),
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  }, [dayPlan, recipeMap]);

  const filteredRecipes = recipes.filter(r =>
    (r.name || '').toLowerCase().includes(recipeSearch.toLowerCase())
  );

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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

  const clearMeal = (day, type) => {
    updatePlan(prev => ({
      ...prev,
      [day]: { ...prev[day], [type]: null },
    }));
    showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} removed.`);
  };

  const handleConfirmSwap = async () => {
    if (!selectedRecipe || !swapTarget) return;

    const newMeal = {
      mealId:   selectedRecipe._id || selectedRecipe.id,
      name:     selectedRecipe.name,
      calories: selectedRecipe.calories,
      macros:   selectedRecipe.macros || { protein: 0, carbs: 0, fat: 0 },
    };

    if (isPremium && nutritionist && !isNutritionist) {
      try {
        const { request } = await mealPlanAPI.submitSwapRequest({
          day:          swapTarget.day,
          mealType:     swapTarget.type,
          currentMeal:  swapTarget.currentMeal,
          proposedMeal: newMeal,
          nutritionistId: nutritionist.id || nutritionist._id,
        });
        setTickets(prev => [request, ...prev]);
        showToast(`Swap request sent to ${nutritionist.name} for review.`);
      } catch (err) {
        showToast(err.message, 'error');
      }
    } else {
      updatePlan(prev => ({
        ...prev,
        [swapTarget.day]: {
          ...prev[swapTarget.day],
          [swapTarget.type]: newMeal,
        },
      }));
      showToast(`${swapTarget.type.charAt(0).toUpperCase() + swapTarget.type.slice(1)} swapped to ${selectedRecipe.name}.`);
    }
    closeModal();
  };

  const handleReviewTicket = async (ticketId, status) => {
    setReviewingId(ticketId);
    try {
      const { request } = await mealPlanAPI.reviewSwapRequest(ticketId, status);
      setIncomingTickets(prev => prev.map(t =>
        (t._id || t.id) === ticketId ? request : t
      ));
      if (status === 'approved' && selectedPatient?._id === request.userId) {
        const { plan: patientPlan } = await mealPlanAPI.getPatientPlan(selectedPatient._id);
        setPlan(normalizePlan(patientPlan));
      }
      showToast(`Swap request ${status}.`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setReviewingId(null);
    }
  };

  // Loading state
  if (!plan && !(isNutritionist && patients.length === 0)) {
    return (
      <div className="meal-planner-page">
        <p style={{ color: 'var(--text-muted)', padding: 'var(--space-2xl)' }}>Loading your meal plan...</p>
      </div>
    );
  }

  return (
    <div className="meal-planner-page">

      {toast && (
        <div className={`planner-toast planner-toast-${toast.type}`}>
          <FiCheck /> {toast.message}
        </div>
      )}

      <div className="planner-header">
        <div>
          <h2>{isNutritionist ? 'Patient Meal Plans' : 'Weekly Meal Plan'}</h2>
          <p>
            {isNutritionist
              ? 'Review patient plans and approve meal swap requests'
              : 'Plan and optimize your meals for the entire week'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          {saving && (
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <FiSave /> Saving...
            </span>
          )}
          <div className="planner-summary">
            <div className="planner-cal-ring">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="var(--surface)" strokeWidth="6" />
                <circle cx="40" cy="40" r="34" fill="none" stroke="var(--primary)" strokeWidth="6"
                  strokeDasharray={`${Math.min((dailyNutrition.calories / dailyGoal), 1) * 213.6} 213.6`}
                  strokeLinecap="round" transform="rotate(-90 40 40)"
                  style={{ transition: 'stroke-dasharray 0.5s ease' }} />
              </svg>
              <div className="planner-cal-text">
                <strong>{dailyNutrition.calories}</strong>
                <span>/ {dailyGoal}</span>
              </div>
            </div>
            <span className="planner-cal-label">Daily Calories</span>
          </div>
        </div>
      </div>

      {isNutritionist && (
        <div className="planner-patients card">
          <h3>Your Patients</h3>
          {patients.length === 0 ? (
            <p className="tickets-subtitle">No patients assigned to you yet.</p>
          ) : (
            <div className="patient-list">
              {patients.map(p => (
                <button
                  key={p._id}
                  className={`patient-chip ${selectedPatient?._id === p._id ? 'active' : ''}`}
                  onClick={() => setSelectedPatient(p)}
                >
                  <div className="avatar avatar-sm" style={{ background: getAvatarColor(p._id) }}>
                    {getInitials(p.name)}
                  </div>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isNutritionist && incomingTickets.length > 0 && (
        <div className="planner-tickets card">
          <h3>Incoming Swap Requests</h3>
          <p className="tickets-subtitle">Review and approve meal changes from your patients</p>
          <div className="tickets-list">
            {incomingTickets.map(ticket => (
              <div key={ticket._id || ticket.id} className="ticket-card">
                <div className="ticket-header">
                  <div className="ticket-meta">
                    <span className="ticket-label">
                      {ticket.userName} · {ticket.day} · {ticket.mealType?.charAt(0).toUpperCase() + ticket.mealType?.slice(1)}
                    </span>
                    <span className="ticket-time">
                      <FiClock /> {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="ticket-status" style={statusStyle[ticket.status]}>
                    {ticket.status?.charAt(0).toUpperCase() + ticket.status?.slice(1)}
                  </span>
                </div>
                <div className="ticket-meals">
                  <div className="ticket-meal">
                    <span className="ticket-meal-label">Current</span>
                    <strong>{ticket.currentMeal?.name || '—'}</strong>
                    <span>{ticket.currentMeal?.calories || 0} cal</span>
                  </div>
                  <FiArrowRight className="ticket-arrow" />
                  <div className="ticket-meal">
                    <span className="ticket-meal-label">Proposed</span>
                    <strong>{ticket.proposedMeal?.name}</strong>
                    <span>{ticket.proposedMeal?.calories} cal</span>
                  </div>
                </div>
                {ticket.status === 'pending' && (
                  <div className="ticket-actions">
                    <button
                      className="btn btn-sm btn-primary"
                      disabled={reviewingId === (ticket._id || ticket.id)}
                      onClick={() => handleReviewTicket(ticket._id || ticket.id, 'approved')}
                    >
                      <FiCheck /> Approve
                    </button>
                    <button
                      className="btn btn-sm btn-ghost"
                      disabled={reviewingId === (ticket._id || ticket.id)}
                      onClick={() => handleReviewTicket(ticket._id || ticket.id, 'rejected')}
                    >
                      <FiX /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isNutritionist && patients.length === 0 ? (
        <div className="card" style={{ padding: 'var(--space-2xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
          Assign patients to your account to manage their meal plans here.
        </div>
      ) : (
        <>
      {isNutritionist && selectedPatient && (
        <div className="planner-nutritionist-badge card">
          <FiUser />
          <span>Editing meal plan for <strong>{selectedPatient.name}</strong></span>
        </div>
      )}

      {isPremium && nutritionist && !isNutritionist && (
        <div className="planner-nutritionist-badge card">
          <FiUser />
          <span>Your nutritionist <strong>{nutritionist.name}</strong> will review meal swap requests before they're applied.</span>
        </div>
      )}

      {/* Day Selector */}
      <div className="day-selector">
        {days.map(day => (
          <button key={day}
            className={`day-btn ${selectedDay === day ? 'active' : ''}`}
            onClick={() => setSelectedDay(day)}>
            <span className="day-short">{day.slice(0, 3)}</span>
            <span className="day-cal">
              {Object.values(plan[day] || {}).reduce((s, m) => s + (m?.calories || 0), 0)} cal
            </span>
          </button>
        ))}
      </div>

      {/* Meals */}
      <div className="planner-meals">
        {mealTypes.map(type => {
          const meal    = dayPlan[type];
          const isEmpty = meal === null || meal === undefined;
          return (
            <div key={type} className={`planner-meal-card card ${isEmpty ? 'meal-empty' : ''}`}>
              <div className="planner-meal-header">
                <span className="planner-meal-icon">{mealIcon[type]}</span>
                <h4>{type.charAt(0).toUpperCase() + type.slice(1)}</h4>
                {!isEmpty && (
                  <button className="meal-clear-btn" onClick={() => clearMeal(selectedDay, type)} title="Remove meal">
                    <FiTrash2 />
                  </button>
                )}
              </div>
              {isEmpty ? (
                <div className="planner-meal-empty">
                  <span className="meal-empty-icon">🚫</span>
                  <span className="meal-empty-label">No meal planned</span>
                </div>
              ) : (
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
                disabled={isNutritionist && !selectedPatient}
              >
                <FiPlus /> {isEmpty ? 'Add Meal' : (isPremium && nutritionist && !isNutritionist ? 'Request Swap' : 'Swap Meal')}
              </button>
            </div>
          );
        })}
      </div>

      {/* Macro Summary */}
      <div className="planner-macros card">
        <h3>Daily Macros Estimate</h3>
        <p className="macros-note">Calculated from meals with recipe data.</p>
        <div className="planner-macro-bars">
          {[
            { label: 'Protein', value: dailyNutrition.protein, target: 150, unit: 'g', color: 'var(--primary)' },
            { label: 'Carbs',   value: dailyNutrition.carbs,   target: 250, unit: 'g', color: 'var(--secondary)' },
            { label: 'Fat',     value: dailyNutrition.fat,     target: 65,  unit: 'g', color: 'var(--accent)' },
            { label: 'Fiber',   value: dailyNutrition.fiber, target: 30, unit: 'g', color: 'var(--info)', estimated: true },
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
        <p className="macros-estimated-note">* Fiber is estimated.</p>
      </div>

      {/* Swap Request Tickets */}
      {isPremium && tickets.length > 0 && (
        <div className="planner-tickets card">
          <h3>Swap Requests</h3>
          <p className="tickets-subtitle">Submitted to your nutritionist — pending review</p>
          <div className="tickets-list">
            {tickets.map(ticket => (
              <div key={ticket._id || ticket.id} className="ticket-card">
                <div className="ticket-header">
                  <div className="ticket-meta">
                    <span className="ticket-label">
                      {ticket.day} · {ticket.mealType?.charAt(0).toUpperCase() + ticket.mealType?.slice(1)}
                    </span>
                    <span className="ticket-time">
                      <FiClock /> {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="ticket-status" style={statusStyle[ticket.status]}>
                    {ticket.status?.charAt(0).toUpperCase() + ticket.status?.slice(1)}
                  </span>
                </div>
                <div className="ticket-meals">
                  <div className="ticket-meal">
                    <span className="ticket-meal-label">Current</span>
                    <strong>{ticket.currentMeal?.name || '—'}</strong>
                    <span>{ticket.currentMeal?.calories || 0} cal</span>
                  </div>
                  <FiArrowRight className="ticket-arrow" />
                  <div className="ticket-meal">
                    <span className="ticket-meal-label">Proposed</span>
                    <strong>{ticket.proposedMeal?.name}</strong>
                    <span>{ticket.proposedMeal?.calories} cal</span>
                  </div>
                </div>
                <div className="ticket-nutritionist">
                  <FiUser /> Sent to <strong>{ticket.nutritionistName}</strong>
                  {ticket.reviewNotes && (
                    <span style={{ marginLeft: 'var(--space-md)', color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>
                      Note: {ticket.reviewNotes}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

        </>
      )}

      {/* Swap Modal */}
      {swapTarget && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal swap-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{isPremium && nutritionist && !isNutritionist ? 'Request Meal Swap' : 'Swap Meal'}</h3>
                <p className="modal-subtitle">
                  {swapTarget.currentMeal
                    ? <>Replacing <strong>{swapTarget.currentMeal.name}</strong> on {swapTarget.day}</>
                    : <>Adding a meal for {swapTarget.type} on {swapTarget.day}</>
                  }
                </p>
              </div>
              <button className="modal-close" onClick={closeModal}><FiX /></button>
            </div>
            {isPremium && nutritionist && !isNutritionist && (
              <div className="modal-premium-notice">
                Your request will be sent to <strong>{nutritionist.name}</strong> for approval before the swap takes effect.
              </div>
            )}
            <div className="modal-search">
              <FiSearch />
              <input type="text" placeholder="Search recipes..."
                value={recipeSearch} onChange={e => setRecipeSearch(e.target.value)} autoFocus />
            </div>
            <div className="modal-recipe-list">
              {filteredRecipes.length === 0 && (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-xl)' }}>
                  No recipes match your search.
                </p>
              )}
              {filteredRecipes.map(recipe => {
                const id = recipe._id || recipe.id;
                const selId = selectedRecipe?._id || selectedRecipe?.id;
                return (
                  <div key={id}
                    className={`modal-recipe-item ${selId === id ? 'selected' : ''}`}
                    onClick={() => setSelectedRecipe(recipe)}>
                    <div className="modal-recipe-emoji">🍽️</div>
                    <div className="modal-recipe-info">
                      <strong>{recipe.name}</strong>
                      <span>{recipe.calories} cal · {recipe.macros?.protein || 0}g protein · {(recipe.prepTime || 0) + (recipe.cookTime || 0)} min</span>
                      <div className="modal-recipe-tags">
                        {(recipe.dietType || []).slice(0, 2).map(t => (
                          <span key={t} className="tag">{t.replace('_', ' ')}</span>
                        ))}
                      </div>
                    </div>
                    {selId === id && <FiCheck className="modal-recipe-check" />}
                  </div>
                );
              })}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" disabled={!selectedRecipe} onClick={handleConfirmSwap}>
                {isPremium && nutritionist && !isNutritionist ? 'Send Request' : 'Swap Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
