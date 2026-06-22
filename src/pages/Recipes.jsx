import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { dietFilters } from '../data/meals'; // filter labels stay static
import { recipesAPI } from '../services/api';
import {
  FiStar, FiClock, FiUsers, FiX, FiEdit2, FiYoutube,
  FiChevronLeft, FiAlertCircle, FiPlus, FiTrash2,
} from 'react-icons/fi';
import './Recipes.css';

// ─── Markdown renderer (unchanged) ───────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let listBuffer = [];
  const flushList = (key) => {
    if (!listBuffer.length) return;
    elements.push(<ul key={`ul-${key}`} className="recipe-instruction-list">{listBuffer.map((item, i) => <li key={i}>{inlineFormat(item)}</li>)}</ul>);
    listBuffer = [];
  };
  lines.forEach((line, i) => {
    if (line.startsWith('## '))           { flushList(i); elements.push(<h4 key={i} className="recipe-md-heading">{line.slice(3)}</h4>); }
    else if (line.startsWith('- '))       { listBuffer.push(line.slice(2)); }
    else if (/^!\[.*?\]\(.*?\)$/.test(line.trim())) {
      flushList(i);
      const alt = line.match(/!\[(.*?)\]/)?.[1] || '';
      const url = line.match(/\((.*?)\)/)?.[1] || '';
      elements.push(<img key={i} src={url} alt={alt} className="recipe-md-image" onError={e => { e.target.style.display='none'; }} />);
    }
    else if (line.trim() === '')          { flushList(i); }
    else                                  { flushList(i); elements.push(<p key={i} className="recipe-md-p">{inlineFormat(line)}</p>); }
  });
  flushList('end');
  return elements;
}
function inlineFormat(text) {
  return text.split(/(\*\*.*?\*\*)/g).map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2,-2)}</strong> : p
  );
}

function recipeEmoji(recipe) {
  if (recipe.dietType?.includes('vegan'))     return '🥗';
  if (recipe.dietType?.includes('keto'))      return '🥑';
  if (recipe.dietType?.includes('breakfast')) return '🥣';
  return '🍽️';
}

function recipeToForm(recipe) {
  return {
    name:         recipe.name        || '',
    authorName:   recipe.authorName  || '',
    difficulty:   recipe.difficulty  || 'Easy',
    prepTime:     recipe.prepTime    || 0,
    cookTime:     recipe.cookTime    || 0,
    servings:     recipe.servings    || 1,
    calories:     recipe.calories    || 0,
    protein:      recipe.macros?.protein || 0,
    carbs:        recipe.macros?.carbs   || 0,
    fat:          recipe.macros?.fat     || 0,
    rating:       recipe.rating      || 0,
    dietType:     (recipe.dietType || []).join(', '),
    ingredients:  (recipe.ingredients || []).join('\n'),
    instructions: Array.isArray(recipe.instructions)
      ? recipe.instructions.map(s => `- ${s}`).join('\n')
      : (recipe.instructions || ''),
    videoUrl:     recipe.videoUrl    || '',
  };
}

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export default function Recipes() {
  const { user } = useAuth();
  const isAdmin        = user?.role === 'admin';
  const isNutritionist = user?.role === 'nutritionist';
  const canAdd         = isAdmin || isNutritionist;
  const canEdit        = (recipe) =>
    isAdmin || (isNutritionist && recipe.authorId === user?._id);

  const [recipeList, setRecipeList]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch]             = useState('');
  const [selected, setSelected]         = useState(null);
  const [editing, setEditing]           = useState(false);
  const [isAdding, setIsAdding]         = useState(false);
  const [form, setForm]                 = useState({});
  const [formError, setFormError]       = useState('');
  const [saving, setSaving]             = useState(false);

  // ── Fetch recipes ──
  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      try {
        const params = {};
        if (activeFilter !== 'all') params.diet = activeFilter;
        if (search) params.search = search;
        const { recipes } = await recipesAPI.getAll(params);
        setRecipeList(recipes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    // Debounce search by 400ms
    const timer = setTimeout(fetch_, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [activeFilter, search]);

  const openEdit = (recipe) => { setForm(recipeToForm(recipe)); setFormError(''); setIsAdding(false); setEditing(true); };
  const openAddNew = () => {
    setForm(recipeToForm({ name:'', authorName: user?.name||'', difficulty:'Easy', prepTime:0, cookTime:0, servings:1, calories:0, macros:{protein:0,carbs:0,fat:0}, rating:0, dietType:[], ingredients:[], instructions:'', videoUrl:'' }));
    setFormError(''); setIsAdding(true); setEditing(true);
  };
  const handleField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.name.trim())       return setFormError('Recipe name is required.');
    if (!form.authorName.trim()) return setFormError('Author name is required.');
    setSaving(true);
    const payload = {
      name: form.name.trim(), authorName: form.authorName.trim(),
      difficulty: form.difficulty,
      prepTime: Number(form.prepTime)||0, cookTime: Number(form.cookTime)||0,
      servings: Number(form.servings)||1, calories: Number(form.calories)||0,
      macros: { protein: Number(form.protein)||0, carbs: Number(form.carbs)||0, fat: Number(form.fat)||0 },
      rating: Math.min(5, Math.max(0, Number(form.rating)||0)),
      dietType: form.dietType.split(',').map(s => s.trim().replace(/ /g,'_')).filter(Boolean),
      ingredients: form.ingredients.split('\n').map(s => s.trim()).filter(Boolean),
      instructions: form.instructions,
      videoUrl: form.videoUrl.trim(),
    };
    try {
      if (isAdding) {
        const { recipe } = await recipesAPI.create(payload);
        setRecipeList(prev => [recipe, ...prev]);
        setSelected(recipe);
      } else {
        const { recipe } = await recipesAPI.update(selected._id, payload);
        setRecipeList(prev => prev.map(r => r._id === selected._id ? recipe : r));
        setSelected(recipe);
      }
      setEditing(false); setIsAdding(false); setFormError('');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getYouTubeEmbed = (url) => {
    if (!url) return null;
    const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  return (
    <div className="recipes-page">
      <div className={`recipes-main ${selected ? 'detail-open' : ''}`}>
        <div className="recipes-header">
          <div>
            <h2>Recipe Library</h2>
            <p>Discover delicious, nutritionist-approved recipes</p>
          </div>
          {canAdd && (
            <button className="btn btn-primary btn-sm" onClick={openAddNew}>
              <FiPlus /> Add Recipe
            </button>
          )}
        </div>

        <div className="recipes-controls">
          <input type="text" placeholder="Search recipes..." value={search}
            onChange={e => setSearch(e.target.value)} className="recipes-search" />
          <div className="recipes-filters">
            {dietFilters.map(f => (
              <button key={f.id} className={`tag ${activeFilter === f.id ? 'active' : ''}`}
                onClick={() => setActiveFilter(f.id)}>
                {f.icon} {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', padding: 'var(--space-2xl)' }}>Loading recipes...</p>
        ) : (
          <div className="recipes-grid">
            {recipeList.length === 0 && (
              <p style={{ color: 'var(--text-muted)', gridColumn: '1/-1' }}>No recipes found.</p>
            )}
            {recipeList.map(recipe => (
              <div key={recipe._id}
                className={`recipe-card card card-interactive ${selected?._id === recipe._id ? 'recipe-card-active' : ''}`}
                onClick={() => { setSelected(recipe); setEditing(false); }}>
                <div className="recipe-image">
                  <span className="recipe-emoji">{recipeEmoji(recipe)}</span>
                  <span className="recipe-difficulty badge badge-primary">{recipe.difficulty}</span>
                </div>
                <div className="recipe-content">
                  <div className="recipe-tags-mini">
                    {recipe.dietType?.slice(0,2).map(d => (
                      <span key={d} className="badge badge-info">{d.replace(/_/g,' ')}</span>
                    ))}
                  </div>
                  <h3>{recipe.name}</h3>
                  <p className="recipe-author">by {recipe.authorName}</p>
                  <div className="recipe-stats">
                    <span><FiClock /> {recipe.prepTime + recipe.cookTime}min</span>
                    <span><FiStar style={{ fill:'var(--secondary)', color:'var(--secondary)' }} /> {recipe.rating}</span>
                    <span><FiUsers /> {recipe.servings} srv</span>
                  </div>
                  <div className="recipe-macros-mini">
                    <div className="recipe-macro"><strong>{recipe.calories}</strong> cal</div>
                    <div className="recipe-macro"><strong>{recipe.macros?.protein}g</strong> protein</div>
                    <div className="recipe-macro"><strong>{recipe.macros?.carbs}g</strong> carbs</div>
                    <div className="recipe-macro"><strong>{recipe.macros?.fat}g</strong> fat</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="recipe-detail-panel">
          <div className="recipe-detail-inner">
            <div className="detail-topbar">
              <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(null); setEditing(false); }}>
                <FiChevronLeft /> Back
              </button>
              {canEdit(selected) && (
                <button className="btn btn-primary btn-sm" onClick={() => openEdit(selected)}>
                  <FiEdit2 /> Edit Recipe
                </button>
              )}
            </div>
            <div className="detail-hero">
              <span className="detail-hero-emoji">{recipeEmoji(selected)}</span>
              <div className="detail-hero-tags">
                {selected.dietType?.map(d => <span key={d} className="badge badge-info">{d.replace(/_/g,' ')}</span>)}
              </div>
            </div>
            <div className="detail-body">
              <div className="detail-title-row">
                <div>
                  <h2>{selected.name}</h2>
                  <p className="recipe-author">by {selected.authorName}</p>
                </div>
                <span className="badge badge-primary">{selected.difficulty}</span>
              </div>
              <div className="detail-stats">
                <div className="detail-stat"><FiClock /><div><strong>{selected.prepTime + selected.cookTime} min</strong><span>Total time</span></div></div>
                <div className="detail-stat"><FiUsers /><div><strong>{selected.servings}</strong><span>Servings</span></div></div>
                <div className="detail-stat"><FiStar style={{ fill:'var(--secondary)', color:'var(--secondary)' }} /><div><strong>{selected.rating}</strong><span>{selected.reviewCount} reviews</span></div></div>
              </div>
              <div className="detail-macros">
                {[{label:'Calories',value:selected.calories,unit:''},{label:'Protein',value:selected.macros?.protein,unit:'g'},{label:'Carbs',value:selected.macros?.carbs,unit:'g'},{label:'Fat',value:selected.macros?.fat,unit:'g'}].map(m => (
                  <div key={m.label} className="detail-macro-pill">
                    <strong>{m.value}{m.unit}</strong><span>{m.label}</span>
                  </div>
                ))}
              </div>
              {selected.videoUrl && getYouTubeEmbed(selected.videoUrl) && (
                <div className="detail-section">
                  <h4><FiYoutube /> Recipe Video</h4>
                  <div className="detail-video-wrapper">
                    <iframe src={getYouTubeEmbed(selected.videoUrl)} title="Recipe video" frameBorder="0" allowFullScreen />
                  </div>
                </div>
              )}
              {selected.ingredients?.length > 0 && (
                <div className="detail-section">
                  <h4>Ingredients</h4>
                  <ul className="detail-ingredients">{selected.ingredients.map((ing,i) => <li key={i}>{ing}</li>)}</ul>
                </div>
              )}
              {selected.instructions && (
                <div className="detail-section">
                  <h4>Instructions</h4>
                  <div className="detail-instructions">
                    {Array.isArray(selected.instructions)
                      ? <ol className="recipe-instruction-list recipe-instruction-ol">{selected.instructions.map((s,i) => <li key={i}>{s}</li>)}</ol>
                      : renderMarkdown(selected.instructions)
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && canAdd && (
        <div className="modal-overlay" onClick={() => setEditing(false)}>
          <div className="modal edit-recipe-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{isAdding ? 'Add New Recipe' : 'Edit Recipe'}</h3>
                <p className="modal-subtitle">{isAdding ? 'Fill in the details below' : selected?.name}</p>
              </div>
              <button className="modal-close" onClick={() => setEditing(false)}><FiX /></button>
            </div>
            <div className="edit-modal-body">
              {formError && <div className="edit-error"><FiAlertCircle /> {formError}</div>}
              <section className="edit-section">
                <h4 className="edit-section-title">Basic Info</h4>
                <div className="edit-field-grid">
                  <label className="edit-field edit-field-full"><span>Recipe Name *</span><input value={form.name} onChange={e => handleField('name', e.target.value)} /></label>
                  <label className="edit-field edit-field-full"><span>Author Name *</span><input value={form.authorName} onChange={e => handleField('authorName', e.target.value)} /></label>
                  <label className="edit-field"><span>Difficulty</span><select value={form.difficulty} onChange={e => handleField('difficulty', e.target.value)}>{DIFFICULTIES.map(d => <option key={d}>{d}</option>)}</select></label>
                  <label className="edit-field"><span>Rating (0–5)</span><input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={e => handleField('rating', e.target.value)} /></label>
                  <label className="edit-field"><span>Prep Time (min)</span><input type="number" min="0" value={form.prepTime} onChange={e => handleField('prepTime', e.target.value)} /></label>
                  <label className="edit-field"><span>Cook Time (min)</span><input type="number" min="0" value={form.cookTime} onChange={e => handleField('cookTime', e.target.value)} /></label>
                  <label className="edit-field"><span>Servings</span><input type="number" min="1" value={form.servings} onChange={e => handleField('servings', e.target.value)} /></label>
                  <label className="edit-field edit-field-full"><span>Diet Types (comma-separated)</span><input value={form.dietType} onChange={e => handleField('dietType', e.target.value)} placeholder="e.g. vegan, high_protein" /></label>
                </div>
              </section>
              <section className="edit-section">
                <h4 className="edit-section-title">Nutrition (per serving)</h4>
                <div className="edit-field-grid">
                  {[{key:'calories',label:'Calories'},{key:'protein',label:'Protein (g)'},{key:'carbs',label:'Carbs (g)'},{key:'fat',label:'Fat (g)'}].map(({key,label}) => (
                    <label key={key} className="edit-field"><span>{label}</span><input type="number" min="0" value={form[key]} onChange={e => handleField(key, e.target.value)} /></label>
                  ))}
                </div>
              </section>
              <section className="edit-section">
                <h4 className="edit-section-title">Ingredients</h4>
                <p className="edit-hint">One ingredient per line.</p>
                <textarea className="edit-textarea" rows={6} value={form.ingredients} onChange={e => handleField('ingredients', e.target.value)} placeholder="200g chicken breast" />
              </section>
              <section className="edit-section">
                <h4 className="edit-section-title">Instructions</h4>
                <div className="edit-hint edit-markdown-hints">
                  <span><code>- text</code> bullet</span>
                  <span><code>## text</code> heading</span>
                  <span><code>**text**</code> bold</span>
                  <span><code>![alt](url)</code> image</span>
                </div>
                <textarea className="edit-textarea edit-textarea-tall" rows={10} value={form.instructions} onChange={e => handleField('instructions', e.target.value)} />
              </section>
              <section className="edit-section">
                <h4 className="edit-section-title"><FiYoutube /> Video Link <span className="edit-optional">(Optional)</span></h4>
                <input className="edit-url-input" type="url" value={form.videoUrl} onChange={e => handleField('videoUrl', e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
              </section>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : isAdding ? 'Add Recipe' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
