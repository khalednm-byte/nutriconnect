import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiStar, FiUsers, FiCalendar, FiAward, FiTrendingUp, FiMessageSquare, FiBook } from 'react-icons/fi';
import { nutritionists } from '../data/users';
import './Landing.css';

const features = [
  { icon: FiUsers, title: 'Expert Nutritionists', desc: 'Connect with certified dietitians and nutrition coaches for personalized guidance.', color: 'var(--primary)' },
  { icon: FiCalendar, title: 'Smart Meal Planner', desc: 'AI-assisted weekly meal plans tailored to your goals, preferences, and dietary needs.', color: 'var(--secondary)' },
  { icon: FiMessageSquare, title: 'Community Feed', desc: 'Share meals, tips, and transformations with a supportive health-focused community.', color: 'var(--info)' },
  { icon: FiTrendingUp, title: 'Progress Tracking', desc: 'Visual charts and analytics to monitor weight, macros, streaks, and milestones.', color: 'var(--accent)' },
  { icon: FiAward, title: 'Challenges & Badges', desc: 'Stay motivated with gamified nutrition challenges and earn achievement badges.', color: 'var(--secondary)' },
  { icon: FiBook, title: 'Expert Content', desc: 'Access a library of evidence-based articles written by certified professionals.', color: 'var(--primary-light)' },
];

const stats = [
  { value: '50K+', label: 'Active Users' },
  { value: '200+', label: 'Nutritionists' },
  { value: '1M+', label: 'Meals Planned' },
  { value: '4.9', label: 'App Rating' },
];

const testimonials = [
  { name: 'Maria Garcia', text: 'NutriConnect completely transformed my approach to meal prep. Down 20 lbs and feeling incredible!', role: 'Lost 20 lbs in 3 months', rating: 5 },
  { name: 'James Wilson', text: 'The nutritionist consultations are game-changing. Dr. Roberts helped me optimize my marathon training diet.', role: 'Marathon Runner', rating: 5 },
  { name: 'Sarah Chen', text: 'Finally found a community that understands plant-based nutrition. The recipes and support are amazing!', role: 'Vegan Athlete', rating: 5 },
];

const plans = [
  { name: 'Free', price: '0', period: '/month', features: ['Basic meal tracking', 'Community access', '5 recipes/week', 'Basic progress charts'], cta: 'Get Started', popular: false },
  { name: 'Premium', price: '12', period: '/month', features: ['Unlimited meal plans', 'AI recommendations', '1 consultation/month', 'Advanced analytics', 'All challenges', 'Priority support'], cta: 'Start Free Trial', popular: true },
  { name: 'Pro', price: '29', period: '/month', features: ['Everything in Premium', 'Unlimited consultations', 'Custom diet programs', 'API access', 'Team management', 'White-label reports'], cta: 'Contact Sales', popular: false },
];

export default function Landing() {
  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero" id="hero">
        <div className="hero-bg-effects">
          <div className="hero-orb hero-orb-1"></div>
          <div className="hero-orb hero-orb-2"></div>
          <div className="hero-grid-overlay"></div>
        </div>
        <div className="container hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <FiStar /> <span>Rated #1 Nutrition Platform 2026</span>
            </div>
            <h1>Transform Your Health With <span className="gradient-text">Expert Nutrition</span></h1>
            <p className="hero-description">
              Connect with certified nutritionists, plan personalized meals, track your progress, and join a thriving wellness community — all in one beautiful platform.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Get Started Free <FiArrowRight />
              </Link>
              <Link to="/nutritionists" className="btn btn-secondary btn-lg">
                Browse Experts
              </Link>
            </div>
            <div className="hero-trust">
              <div className="hero-avatars">
                {['A', 'S', 'J', 'M', 'D'].map((l, i) => (
                  <div key={i} className="hero-avatar" style={{ background: `hsl(${i * 60 + 140}, 60%, 40%)` }}>{l}</div>
                ))}
              </div>
              <span className="hero-trust-text"><strong>50,000+</strong> members already joined</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card-stack">
              <div className="hero-float-card card-1">
                <div className="mini-avatar" style={{ background: 'var(--primary)' }}>🥗</div>
                <div>
                  <strong>520 cal</strong>
                  <span>Chicken Power Bowl</span>
                </div>
              </div>
              <div className="hero-float-card card-2">
                <div className="mini-avatar" style={{ background: 'var(--secondary)' }}>🔥</div>
                <div>
                  <strong>14 day streak!</strong>
                  <span>Keep it up, Alex!</span>
                </div>
              </div>
              <div className="hero-float-card card-3">
                <div className="mini-avatar" style={{ background: 'var(--info)' }}>📊</div>
                <div>
                  <strong>-6 lbs</strong>
                  <span>This month's progress</span>
                </div>
              </div>
              <div className="hero-phone-mockup">
                <div className="phone-inner">
                  <div className="phone-header">
                    <span className="phone-greeting">Good morning, Alex 👋</span>
                    <span className="phone-subtitle">Today's nutrition overview</span>
                  </div>
                  <div className="phone-macros">
                    <div className="phone-macro">
                      <div className="macro-ring protein"><span>45g</span></div>
                      <span>Protein</span>
                    </div>
                    <div className="phone-macro">
                      <div className="macro-ring carbs"><span>82g</span></div>
                      <span>Carbs</span>
                    </div>
                    <div className="phone-macro">
                      <div className="macro-ring fat"><span>28g</span></div>
                      <span>Fat</span>
                    </div>
                  </div>
                  <div className="phone-calories">
                    <span className="cal-consumed">1,340</span>
                    <span className="cal-label">/ 2,200 cal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-bar">
        <div className="container stats-grid">
          {stats.map((s, i) => (
            <div key={i} className="stat-item">
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Features</span>
            <h2>Everything You Need for a <span className="gradient-text">Healthier Life</span></h2>
            <p>From meal planning to community support — we've built the complete nutrition platform.</p>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card card">
                <div className="feature-icon" style={{ background: `${f.color}15`, color: f.color }}>
                  <f.icon />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Nutritionists */}
      <section className="top-nutritionists">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Experts</span>
            <h2>Top-Rated <span className="gradient-text">Nutritionists</span></h2>
            <p>Connect with certified professionals ready to help you achieve your goals.</p>
          </div>
          <div className="nutritionists-row">
            {nutritionists.slice(0, 3).map(n => (
              <div key={n.id} className="nutritionist-preview card card-interactive">
                <div className="np-avatar" style={{ background: `hsl(${n.id.charCodeAt(1) * 40}, 50%, 35%)` }}>
                  {n.name.split(' ').map(w => w[0]).join('')}
                </div>
                <div className="np-verified">✓ Verified</div>
                <h4>{n.name}</h4>
                <p className="np-title">{n.title}</p>
                <div className="np-rating">
                  <FiStar style={{ fill: 'var(--secondary)', color: 'var(--secondary)' }} />
                  <span>{n.rating}</span>
                  <span className="np-reviews">({n.reviewCount} reviews)</span>
                </div>
                <div className="np-tags">
                  {n.specializations.slice(0, 2).map(s => (
                    <span key={s} className="tag">{s.replace(/_/g, ' ')}</span>
                  ))}
                </div>
                <div className="np-price">
                  <span className="np-rate">${n.consultationRate}</span>
                  <span className="np-per">/session</span>
                </div>
                <Link to={`/nutritionists/${n.id}`} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                  View Profile
                </Link>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 'var(--space-2xl)' }}>
            <Link to="/nutritionists" className="btn btn-secondary">View All Nutritionists <FiArrowRight /></Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Testimonials</span>
            <h2>Loved by <span className="gradient-text">Thousands</span></h2>
            <p>See what our community members have to say about NutriConnect.</p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card card">
                <div className="testimonial-stars">
                  {[...Array(t.rating)].map((_, j) => (
                    <FiStar key={j} style={{ fill: 'var(--secondary)', color: 'var(--secondary)' }} />
                  ))}
                </div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="avatar" style={{ background: `hsl(${i * 80 + 120}, 50%, 40%)` }}>
                    {t.name.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="pricing" id="pricing">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Pricing</span>
            <h2>Simple, Transparent <span className="gradient-text">Pricing</span></h2>
            <p>Start free and upgrade as your nutrition journey evolves.</p>
          </div>
          <div className="pricing-grid">
            {plans.map((p, i) => (
              <div key={i} className={`pricing-card card ${p.popular ? 'popular' : ''}`}>
                {p.popular && <div className="popular-badge">Most Popular</div>}
                <h3>{p.name}</h3>
                <div className="pricing-price">
                  <span className="price-currency">$</span>
                  <span className="price-value">{p.price}</span>
                  <span className="price-period">{p.period}</span>
                </div>
                <ul className="pricing-features">
                  {p.features.map((f, j) => (
                    <li key={j}><FiCheck /> {f}</li>
                  ))}
                </ul>
                <Link to="/register" className={`btn ${p.popular ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%' }}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="container">
          <div className="cta-card">
            <h2>Ready to Transform Your Nutrition?</h2>
            <p>Join 50,000+ members already achieving their health goals with NutriConnect.</p>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-primary btn-lg">Get Started Free <FiArrowRight /></Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
