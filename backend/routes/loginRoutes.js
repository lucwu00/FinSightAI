const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { deleteUser } = require('../controllers/userController');

router.post("/signup", async (req, res) => {
  const { username, fullName, email, password } = req.body;
  if (!username || !fullName || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }
  try {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }
    const user = await User.create({ username, fullName, email, password });
    res.json({ id: user.id, username: user.username, email: user.email });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    // Note: In production, you should hash passwords and compare hashed versions
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    // Update last login
    await user.update({ lastLogin: new Date() });
    
    res.json({ 
      id: user.id,
      username: user.username, 
      email: user.email,
      status: user.status 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: "Database error" });
  }
});

async function createAdminIfNotExists() {
  try {
    const admin = await User.findOne({ 
      where: { email: 'admin@example.com' },
      attributes: ['id', 'username','fullName', 'email', 'status'] // Don't include lastLogin in admin check
    });
    if (!admin) {
      await User.create({
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
}

router.get("/users", async (req, res) => {
  try {
    const users = await User.findAll({ attributes: ['id', 'username', 'email'] });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/userManagement", async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'createdAt', 'status', 'lastLogin']
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

router.get('/users/me', async (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  try {
    const user = await User.findOne({
      where: { email },
      attributes: ['username', 'email', 'status', 'createdAt'] 
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// More specific routes should come before parameterized routes
router.delete('/users/deleteByEmail', async (req, res) => {
  const email = req.query.email;
  
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  
  try {
    console.log('Attempting to delete user with email:', email);
    
    // Check if user exists first
    const userExists = await User.findOne({ where: { email } });
    if (!userExists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete the user
    const deleted = await User.destroy({ where: { email } });
    
    if (deleted) {
      console.log('User deleted successfully:', email);
      res.json({ success: true, message: 'User deleted successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    console.error('Delete by email error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.delete('/users/:id', deleteUser);

router.put('/users/update-username', async (req, res) => {
  const { email, username } = req.body;
  if (!email || !username) {
    return res.status(400).json({ error: "Email and username are required" });
  }
  try {
    const [updated] = await User.update(
      { username },
      { where: { email } }
    );
    if (updated) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

router.put('/users/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['User', 'Admin'].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  try {
    const [updated] = await User.update({ status }, { where: { id } });
    if (updated) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});
module.exports = router;