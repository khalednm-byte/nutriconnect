const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');

// Hardcoded for local development — move to .env when deploying
process.env.PORT        = process.env.PORT        || '5000';
process.env.MONGO_URI   = process.env.MONGO_URI   || 'mongodb://127.0.0.1:27017/nutriconnect';
process.env.JWT_SECRET  = process.env.JWT_SECRET  || 'nutriconnect_jwt_secret_change_in_production';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/users',        require('./routes/users'));
app.use('/api/recipes',      require('./routes/recipes'));
app.use('/api/posts',        require('./routes/posts'));
app.use('/api/messages',     require('./routes/messages'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/mealplan',     require('./routes/mealplan'));
app.use('/api/progress',     require('./routes/progress'));
app.use('/api/challenges',   require('./routes/challenges'));
app.use('/api/challenge-definitions', require('./routes/challengeDefinitions'));
app.use('/api/groups',       require('./routes/groups'));
app.use('/api/setup',        require('./routes/setup'));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong', error: err.message });
});

// ── Connect to MongoDB then start server ──────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${process.env.PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
