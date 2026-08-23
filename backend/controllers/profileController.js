const { User } = require('../models');

exports.updateProfilePicture = async (req, res) => {
  try {
    const { email, profilePicture } = req.body;
    
    if (!email || !profilePicture) {
      return res.status(400).json({ error: 'Email and profile picture are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Found user:', user.toJSON());
    console.log('Attempting to update profile picture for email:', email);
    
    const result = await User.update(
      { profilePicture },
      { where: { email } }
    );
    
    console.log('Update result:', result);

    if (result[0] === 0) {
      console.error('No rows were updated');
      return res.status(400).json({ error: 'Failed to update profile picture - no rows affected' });
    }

    res.json({ message: 'Profile picture updated successfully' });
  } catch (error) {
    console.error('Error updating profile picture:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: `Failed to update profile picture: ${error.message}` });
  }
};

exports.getProfilePicture = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ 
      where: { email },
      attributes: ['profilePicture']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ profilePicture: user.profilePicture });
  } catch (error) {
    console.error('Error fetching profile picture:', error);
    res.status(500).json({ error: 'Failed to fetch profile picture' });
  }
};
