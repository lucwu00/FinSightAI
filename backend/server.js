const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '.env.development' }); // Keep this line

const db = require('./models')
const app = express();

// ✅ Updated CORS Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// Handle preflight requests
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));


// ✅ Routes (unchanged)
const policyRoutes = require('./routes/policyRoutes');
const clientRoutes = require('./routes/clientRoutes');
const importRoutes = require('./routes/importRoutes');
const genAIRoutes = require('./routes/genAI');
const geminiDirectRoutes = require('./routes/geminiDirect');
const loginRoutes = require('./routes/loginRoutes');
const meetingRoutes = require('./routes/Meeting');
const nudgesRoutes = require('./routes/nudges')
const todoRoutes = require('./routes/todo')
const userRoutes = require('./routes/user');
const profileRoutes = require('./routes/profileRoutes');
const calendarRoutes = require('./routes/calendarRoutes');

// Mount Routes
app.use('/api/policies', policyRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/import', importRoutes);
app.use('/api/genai', genAIRoutes);
app.use('/api/gemini-direct', geminiDirectRoutes);
app.use('/api', loginRoutes);
app.use('/api', meetingRoutes);
app.use('/api/nudges', nudgesRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);

// Route to automatically get and display local storage from browser
app.get('/api/localstorage', (req, res) => {
  const htmlPage = `
<!DOCTYPE html>
<html>
<head>
    <title>Local Storage Viewer</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 40px; 
            background-color: #f5f5f5; 
        }
        .container { 
            background: white; 
            padding: 30px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        h1 { color: #333; }
        pre { 
            background: #f8f8f8; 
            padding: 20px; 
            border-radius: 5px; 
            border-left: 4px solid #007acc;
            overflow-x: auto;
            white-space: pre-wrap;
        }
        .empty { color: #666; font-style: italic; }
        .timestamp { color: #888; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🗄️ Local Storage Viewer</h1>
        <div class="timestamp">Loaded at: <span id="timestamp"></span></div>
        <h3>Current Local Storage Data:</h3>
        <pre id="localStorage"></pre>
    </div>

    <script>
        // Get current timestamp
        document.getElementById('timestamp').textContent = new Date().toLocaleString();
        
        // Get all localStorage data
        const localStorageData = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            localStorageData[key] = value;
        }
        
        // Display the data
        const preElement = document.getElementById('localStorage');
        if (Object.keys(localStorageData).length === 0) {
            preElement.innerHTML = '<span class="empty">Local storage is empty</span>';
        } else {
            preElement.textContent = JSON.stringify(localStorageData, null, 2);
        }
    </script>
</body>
</html>`;

  res.send(htmlPage);
});

app.post('/api/localstorage', (req, res) => {
  const { localStorage } = req.body;
  
  if (!localStorage) {
    return res.json({
      error: 'No localStorage data provided',
      instruction: 'Send localStorage data in request body',
      example: {
        localStorage: {
          key1: 'value1',
          key2: 'value2'
        }
      }
    });
  }

  // Return pretty formatted JSON
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    count: Object.keys(localStorage).length,
    localStorage: localStorage
  });
});

db.sequelize.sync({ force: false })
 .then(async () => {
   console.log('Connected to SQLite database');
   try {
     const admin = await db.User.findOne({
       where: { email: 'admin@example.com' },
       attributes: ['id', 'username','fullName', 'email', 'status']
     });
     if (!admin) {
       await db.User.create({
         username: 'Admin',
         fullName: 'Admin123',
         email: 'admin@example.com',
         password: 'adminpassword',
         status: 'Admin'
       });
       console.log('Admin user created');
     } else {
       console.log('Admin user already exists');
     }
   } catch (err) {
     console.error('Error checking/creating admin user:', err);
   }
   
   const PORT = process.env.PORT || 3001; // Add fallback just in case
   app.listen(PORT, () => {
     console.log(`Server running at http://localhost:${PORT}`);
   });
 })
 .catch(err => console.error('❌ SQLite connection error:', err));