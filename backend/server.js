const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ✅ Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());

// ✅ Routes
const policyRoutes = require('./routes/policyRoutes');
const clientRoutes = require('./routes/clientRoutes');
const importRoutes = require('./routes/importRoutes');
const genAIRoutes = require('./routes/genAI');

// ✅ Sequelize (SQLite) setup
const sequelize = require('./sequelize'); // Make sure you have sequelize.js properly configured

// Mount Routes
app.use('/api/policies', policyRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/import', importRoutes);
app.use('/api/genai', genAIRoutes);

// ✅ Start server after SQLite sync
const PORT = process.env.PORT || 5050;

sequelize.sync()  // use { force: true } or { alter: true } if needed for dev
  .then(() => {
    console.log('SQLite DB connected and models synced');
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('SQLite connection error:', err);
  });
