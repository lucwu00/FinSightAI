const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Google Calendar OAuth configuration
const CREDENTIALS_PATH = path.join(__dirname, '..', 'config', 'google-credentials.json');
const TOKEN_PATH = path.join(__dirname, '..', 'config', 'google-token.json');

// Scopes for Google Calendar API
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Initialize OAuth2 client
function getOAuth2Client() {
  try {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      console.log('Google credentials file not found. Please follow setup instructions in backend/config/README.md');
      return null;
    }
    
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const { client_secret, client_id, redirect_uris } = credentials.web || credentials.installed;
    
    if (!client_secret || !client_id) {
      console.log('Invalid Google credentials. Please check backend/config/google-credentials.json');
      return null;
    }
    
    return new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0] || 'http://localhost:3001/api/calendar/callback'
    );
  } catch (error) {
    console.error('Error loading Google credentials:', error);
    return null;
  }
}

// Utility function to get user-specific token file path
function getUserTokenPath(userId) {
  return path.join(__dirname, '..', 'config', `google-token-${userId}.json`);
}

// Utility function to load user-specific tokens
function loadUserTokens(userId) {
  try {
    const userTokenPath = getUserTokenPath(userId);
    if (fs.existsSync(userTokenPath)) {
      return JSON.parse(fs.readFileSync(userTokenPath, 'utf8'));
    }
    return null;
  } catch (error) {
    console.error(`Error loading tokens for user ${userId}:`, error);
    return null;
  }
}

// Utility function to save user-specific tokens
function saveUserTokens(userId, tokens) {
  try {
    const userTokenPath = getUserTokenPath(userId);
    const tokenData = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expiry_date: tokens.expiry_date
    };
    fs.writeFileSync(userTokenPath, JSON.stringify(tokenData, null, 2));
    console.log(`Tokens saved successfully for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`Error saving tokens for user ${userId}:`, error);
    return false;
  }
}

// Check if user has valid Google Calendar token
router.get('/status', async (req, res) => {
  try {
    const oAuth2Client = getOAuth2Client();
    const userId = req.query.userId || req.session?.userId || 'default';
    
    if (!oAuth2Client) {
      return res.json({ 
        connected: false, 
        configured: false,
        message: 'Google Calendar not configured. Please set up credentials first.' 
      });
    }
    
    // Load user-specific tokens
    const tokens = loadUserTokens(userId);
    
    if (tokens && tokens.access_token) {
      // Set the credentials
      oAuth2Client.setCredentials(tokens);
      
      // Try to get user info to show connected account
      let googleEmail = '';
      try {
        const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });
        const userInfo = await oauth2.userinfo.get();
        googleEmail = userInfo.data.email || '';
      } catch (error) {
        console.log('Could not fetch user info:', error.message);
      }
      
      return res.json({ 
        connected: true, 
        configured: true,
        message: 'Google Calendar connected and ready to use.',
        userId: userId,
        googleEmail: googleEmail,
        token: true
      });
    } else {
      res.json({ 
        connected: false, 
        configured: true,
        message: 'Google Calendar configured but not connected. Please authenticate.',
        userId: userId
      });
    }
  } catch (error) {
    console.error('Error checking calendar status:', error);
    res.json({ 
      connected: false, 
      configured: false,
      message: 'Error checking Google Calendar status' 
    });
  }
});

// Start Google OAuth flow
router.get('/auth', (req, res) => {
  const oAuth2Client = getOAuth2Client();
  
  if (!oAuth2Client) {
    return res.status(500).json({ error: 'Google Calendar not configured' });
  }

  // Get userId from query params or session
  const userId = req.query.userId || req.session?.userId || 'default';
  const forceSelect = req.query.force_select === 'true';

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: forceSelect ? 'select_account' : 'consent', // Force account selection if requested
    include_granted_scopes: true,
    state: userId // Pass userId through the OAuth flow
  });

  console.log('Generated auth URL:', authUrl);
  res.redirect(authUrl);
});

// Handle OAuth callback
router.get('/callback', async (req, res) => {
  const { code, error, state } = req.query;
  
  // Extract userId from state parameter
  const userId = state || 'default';
  
  if (error) {
    console.error('OAuth error:', error);
    return res.status(400).send(`
      <html>
        <head>
          <title>Connection Failed</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
              color: white;
            }
            .container {
              text-align: center;
              background: rgba(255, 255, 255, 0.1);
              padding: 2rem;
              border-radius: 10px;
              backdrop-filter: blur(10px);
              box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
            }
            .error-icon {
              font-size: 3rem;
              color: #ffeb3b;
              margin-bottom: 1rem;
            }
            h2 { margin-bottom: 1rem; }
            p { margin-bottom: 0.5rem; opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">⚠</div>
            <h2>Connection Failed</h2>
            <p>Error: ${error}</p>
            <p>Please try again or check your configuration.</p>
            <p>This window will close automatically...</p>
          </div>
          <script>
            setTimeout(() => {
              window.close();
            }, 4000);
          </script>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send(`
      <html>
        <head>
          <title>Connection Failed</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
              color: white;
            }
            .container {
              text-align: center;
              background: rgba(255, 255, 255, 0.1);
              padding: 2rem;
              border-radius: 10px;
              backdrop-filter: blur(10px);
              box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
            }
            .error-icon {
              font-size: 3rem;
              color: #ffeb3b;
              margin-bottom: 1rem;
            }
            h2 { margin-bottom: 1rem; }
            p { margin-bottom: 0.5rem; opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">⚠</div>
            <h2>Connection Failed</h2>
            <p>No authorization code received.</p>
            <p>Please try the connection process again.</p>
            <p>This window will close automatically...</p>
          </div>
          <script>
            setTimeout(() => {
              window.close();
            }, 4000);
          </script>
        </body>
      </html>
    `);
  }

  const oAuth2Client = getOAuth2Client();

  if (!oAuth2Client) {
    return res.status(500).send(`
      <html>
        <head>
          <title>Configuration Error</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
              color: white;
            }
            .container {
              text-align: center;
              background: rgba(255, 255, 255, 0.1);
              padding: 2rem;
              border-radius: 10px;
              backdrop-filter: blur(10px);
              box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
            }
            .warning-icon {
              font-size: 3rem;
              color: #ffeb3b;
              margin-bottom: 1rem;
            }
            h2 { margin-bottom: 1rem; }
            p { margin-bottom: 0.5rem; opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="warning-icon">⚙</div>
            <h2>Configuration Error</h2>
            <p>Google Calendar not properly configured on server.</p>
            <p>Please check the setup documentation.</p>
            <p>This window will close automatically...</p>
          </div>
          <script>
            setTimeout(() => {
              window.close();
            }, 4000);
          </script>
        </body>
      </html>
    `);
  }

  try {
    console.log('Exchanging authorization code for tokens...');
    
    // Exchange the authorization code for tokens
    const tokenResponse = await oAuth2Client.getToken(code);
    console.log('Token response received:', !!tokenResponse.tokens);
    
    if (!tokenResponse.tokens) {
      throw new Error('No tokens received from Google');
    }

    const tokens = tokenResponse.tokens;
    
    // Ensure we have the required tokens
    if (!tokens.access_token) {
      throw new Error('No access token received');
    }

    // Set credentials on the client
    oAuth2Client.setCredentials(tokens);

    // Save tokens to user-specific file
    const saved = saveUserTokens(userId, tokens);
    
    if (!saved) {
      throw new Error('Failed to save tokens');
    }

    res.send(`
      <html>
        <head>
          <title>Google Calendar Connected</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              background: rgba(255, 255, 255, 0.1);
              padding: 2rem;
              border-radius: 10px;
              backdrop-filter: blur(10px);
              box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
            }
            .checkmark {
              font-size: 3rem;
              color: #4caf50;
              margin-bottom: 1rem;
            }
            h2 { margin-bottom: 1rem; }
            p { margin-bottom: 0.5rem; opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="checkmark">✓</div>
            <h2>Google Calendar Connected Successfully!</h2>
            <p>Your calendar integration is now active.</p>
            <p>This window will close automatically...</p>
          </div>
          <script>
            setTimeout(() => {
              window.close();
            }, 2000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error during token exchange:', error);
    res.status(500).send(`
      <html>
        <head>
          <title>Connection Error</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
              color: white;
            }
            .container {
              text-align: center;
              background: rgba(255, 255, 255, 0.1);
              padding: 2rem;
              border-radius: 10px;
              backdrop-filter: blur(10px);
              box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
            }
            .error-icon {
              font-size: 3rem;
              color: #ffeb3b;
              margin-bottom: 1rem;
            }
            h2 { margin-bottom: 1rem; }
            p { margin-bottom: 0.5rem; opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">❌</div>
            <h2>Connection Error</h2>
            <p>Failed to complete the authentication process.</p>
            <p>Error: ${error.message}</p>
            <p>Please try again or check the server logs.</p>
            <p>This window will close automatically...</p>
          </div>
          <script>
            setTimeout(() => {
              window.close();
            }, 4000);
          </script>
        </body>
      </html>
    `);
  }
});

// Create a calendar event
router.post('/events', async (req, res) => {
  try {
    const oAuth2Client = getOAuth2Client();
    
    if (!oAuth2Client) {
      // Fallback: Create local event when Google Calendar not configured
      return createLocalEvent(req, res);
    }

    // Get userId from request body
    const userId = req.body.userId || 'default';

    // Load user-specific saved token
    const token = loadUserTokens(userId);
    if (!token) {
      return res.status(401).json({ error: 'Google Calendar not connected for this user' });
    }

    oAuth2Client.setCredentials(token);

    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    const {
      title,
      description,
      startDateTime,
      endDateTime,
      location,
      clientEmail,
      attendees = []
    } = req.body;

    // Create event object
    const event = {
      summary: title,
      description: description,
      location: location,
      start: {
        dateTime: new Date(startDateTime).toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(endDateTime).toISOString(),
        timeZone: 'UTC',
      },
      attendees: attendees.length > 0 ? attendees : (clientEmail ? [{ email: clientEmail }] : []),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 }, // 30 minutes before
        ],
      },
    };

    // Create the event
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendUpdates: 'all', // Send email invitations
    });

    res.json({
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
      event: response.data
    });

  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ 
      error: 'Failed to create calendar event',
      details: error.message 
    });
  }
});

// Fallback function to create local events
function createLocalEvent(req, res) {
  try {
    const {
      title,
      description,
      startDateTime,
      endDateTime,
      location,
      clientEmail,
      clientId,
      clientName
    } = req.body;

    // Create a simple local event object
    const localEvent = {
      id: `local_${Date.now()}`,
      title,
      description,
      startDateTime,
      endDateTime,
      location,
      clientId,
      clientName,
      clientEmail,
      createdAt: new Date().toISOString(),
      type: 'local'
    };

    // In a real implementation, you would save this to your database
    // For now, we'll just return success
    console.log('Local event created:', localEvent);

    res.json({
      success: true,
      eventId: localEvent.id,
      event: localEvent,
      message: 'Event created locally. Configure Google Calendar for full integration.'
    });

  } catch (error) {
    console.error('Error creating local event:', error);
    res.status(500).json({ 
      error: 'Failed to create local event',
      details: error.message 
    });
  }
}

// Get upcoming events
router.get('/events', async (req, res) => {
  try {
    const oAuth2Client = getOAuth2Client();
    
    if (!oAuth2Client) {
      return res.status(500).json({ error: 'Google Calendar not configured' });
    }

    // Get userId from query params
    const userId = req.query.userId || 'default';

    // Load user-specific saved token
    const token = loadUserTokens(userId);
    if (!token) {
      return res.status(401).json({ error: 'Google Calendar not connected for this user' });
    }

    oAuth2Client.setCredentials(token);

    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    res.json({
      success: true,
      events: response.data.items || []
    });

  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ 
      error: 'Failed to fetch calendar events',
      details: error.message 
    });
  }
});

// Disconnect Google Calendar
router.post('/disconnect', (req, res) => {
  try {
    const userId = req.query.userId || req.body.userId || req.session?.userId || 'default';
    const userTokenPath = getUserTokenPath(userId);
    
    if (fs.existsSync(userTokenPath)) {
      fs.unlinkSync(userTokenPath);
      console.log(`Disconnected Google Calendar for user ${userId}`);
    }
    
    res.json({ 
      success: true, 
      message: 'Google Calendar disconnected successfully',
      userId: userId
    });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    res.status(500).json({ 
      error: 'Failed to disconnect Google Calendar',
      details: error.message
    });
  }
});

module.exports = router;
