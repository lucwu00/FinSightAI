const express = require('express');
const mongoose = require('mongoose');
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

// Mount Routes
app.use('/api/policies', policyRoutes);      // e.g., /api/policies/:id
app.use('/api/clients', clientRoutes);       // e.g., /api/clients/:id
app.use('/api/import', importRoutes);        // e.g., /api/import/preview
app.use('/api/genai', genAIRoutes);          // e.g., /api/genai/client-summary, /custom, etc.

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 5050;
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));
