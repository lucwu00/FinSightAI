const { User } = require('../models');

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate user ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    console.log('Attempting to delete user with id:', id);
    
    // Check if user exists first
    const userExists = await User.findByPk(id);
    if (!userExists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete the user
    const deleted = await User.destroy({ where: { id: Number(id) } });
    
    if (deleted) {
      console.log('User deleted successfully:', id);
      res.json({ success: true, message: 'User deleted successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Database error' });
  }
}

exports.getLayoutPreference = async (req, res) => {
  // const userId = req.query.userId;
  const userId = 1; // hardcoded for testing
  const user = await User.findByPk(userId);

  let layoutPreferences = null;

  try {
    layoutPreferences = user.layoutPreferences;
  } catch {
    layoutPreferences = JSON.stringify([
      { i: "todo", x: 0, y: 0, w: 6, h: 2.5 },
      { i: "nudges", x: 6, y: 0, w: 6, h: 2.5 },
      { i: "recommendedPolicies", x: 0, y: 2, w: 12, h: 3 },
      { i: "queryClient", x: 0, y: 4, w: 6, h: 2.5 },
      { i: "recentActivity", x: 6, y: 4, w: 6, h: 2.5 },
    ]);
  }
  res.json({ userId, layoutPreferences });
}

exports.postLayoutPreference = async (req, res) => {
  const { userId, layoutPreferences } = req.body;
  try {
    await User.update(
      { layoutPreferences },
      { where: { id: userId } }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving layout preferences:', error);
    res.status(500).json({ error: 'Failed to save layout preferences' });
  }
}

