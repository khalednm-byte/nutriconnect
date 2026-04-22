import { useState, useEffect } from 'react';
import axios from 'axios';
import { dietFilters } from '../data/meals';
import { FiStar, FiClock, FiUsers } from 'react-icons/fi';
import './Recipes.css';

export default function Recipes() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/meals/recipes')
      .then(res => {
        setRecipes(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching recipes:', err);
        setLoading(false);
      });
  }, []);

  const filtered = recipes.filter(r => {
    const matchFilter = activeFilter === 'all' || r.dietType.includes(activeFilter);
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (loading) {
    return <div className="recipes-page" style={{ textAlign: 'center', padding: '50px' }}>Loading recipes...</div>;
  }

  return (
    <div className="recipes-page">
      <div className="recipes-header">
        <h2>Recipe Library</h2>
        <p>Discover delicious, nutritionist-approved recipes</p>
      </div>

      <div className="recipes-controls">
        <input
          type="text" placeholder="Search recipes..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="recipes-search"
        />
        <div className="recipes-filters">
          {dietFilters.map(f => (
            <button
              key={f.id}
              className={`tag ${activeFilter === f.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(f.id)}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="recipes-grid">
        {filtered.map(recipe => (
          <div key={recipe.id} className="recipe-card card card-interactive">
            <div className="recipe-image">
              <span className="recipe-emoji">
                {recipe.dietType.includes('vegan') ? '🥗' : recipe.dietType.includes('keto') ? '🥑' : recipe.dietType.includes('breakfast') ? '🥣' : '🍽️'}
              </span>
              <span className="recipe-difficulty badge badge-primary">{recipe.difficulty}</span>
            </div>
            <div className="recipe-content">
              <div className="recipe-tags-mini">
                {recipe.dietType.slice(0, 2).map(d => (
                  <span key={d} className="badge badge-info">{d.replace(/_/g, ' ')}</span>
                ))}
              </div>
              <h3>{recipe.name}</h3>
              <p className="recipe-author">by {recipe.authorName}</p>
              <div className="recipe-stats">
                <span><FiClock /> {recipe.prepTime + recipe.cookTime}min</span>
                <span><FiStar style={{ fill: 'var(--secondary)', color: 'var(--secondary)' }} /> {recipe.rating}</span>
                <span><FiUsers /> {recipe.servings} srv</span>
              </div>
              <div className="recipe-macros-mini">
                <div className="recipe-macro"><strong>{recipe.calories}</strong> cal</div>
                <div className="recipe-macro"><strong>{recipe.macros.protein}g</strong> protein</div>
                <div className="recipe-macro"><strong>{recipe.macros.carbs}g</strong> carbs</div>
                <div className="recipe-macro"><strong>{recipe.macros.fat}g</strong> fat</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
