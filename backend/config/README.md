# Google Calendar Integration Setup

## Prerequisites
1. Google Cloud Console project with Calendar API enabled
2. OAuth 2.0 credentials configured

## Setup Instructions

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Calendar API
4. Go to "Credentials" and create OAuth 2.0 Client ID
5. Configure the OAuth consent screen first (if prompted)
6. Set the following URIs:
   - **Authorised JavaScript origins**: `http://localhost:3000`
   - **Authorised redirect URIs**: `http://localhost:3001/api/calendar/callback`

### 2. Configure Credentials
1. Download the OAuth 2.0 credentials JSON file
2. Rename it to `google-credentials.json`
3. Place it in the `backend/config/` directory
4. Or copy the example file and fill in your credentials:
   ```bash
   cp google-credentials.json.example google-credentials.json
   ```

### 3. Environment Setup
Make sure your frontend is running on port 3000 and backend server is running on port 3001 to match the configured URIs.

### 4. First Time Setup
1. Start the backend server
2. In the application, click the calendar icon for any client
3. Click "Connect" to link Google Calendar
4. Complete the OAuth flow in the browser
5. The token will be saved automatically

## Features
- ✅ Create calendar events for client meetings
- ✅ Automatic email invitations to clients
- ✅ Multiple event types (meeting, consultation, review, etc.)
- ✅ Meeting type selection (in-person, video call, phone)
- ✅ Smart scheduling with date/time pickers
- ✅ Event reminders (email + popup)
- ✅ Integration with client data

## API Endpoints
- `GET /api/calendar/status` - Check connection status
- `GET /api/calendar/auth` - Start OAuth flow
- `GET /api/calendar/callback` - OAuth callback
- `POST /api/calendar/events` - Create new event
- `GET /api/calendar/events` - List upcoming events
- `DELETE /api/calendar/disconnect` - Disconnect account

## Security Notes
- Tokens are stored locally in `backend/config/google-token.json`
- Never commit credential files to version control
- Add `*.json` to `.gitignore` for the config directory

## Troubleshooting

### Common Issues

1. **"No refresh token" error**
   - Make sure you're using `prompt: 'consent'` in the OAuth flow
   - Clear any existing tokens and re-authenticate
   - Ensure your OAuth consent screen is properly configured

2. **"Cannot destructure property 'tokens'" error**
   - Check that your `google-credentials.json` file is valid JSON
   - Verify the client_id and client_secret are correct
   - Make sure the redirect URI matches exactly: `http://localhost:3001/api/calendar/callback`

3. **"Google Calendar not configured" error**
   - Ensure `google-credentials.json` exists in `backend/config/`
   - Check that the file contains valid OAuth 2.0 credentials
   - Verify the Google Calendar API is enabled in your Google Cloud project

4. **OAuth consent screen issues**
   - Make sure your OAuth consent screen is configured
   - Add your email as a test user if the app is in testing mode
   - Verify the authorized domains include `localhost`

### Reset Instructions
If you encounter persistent issues:
1. Delete `backend/config/google-token.json` (if it exists)
2. Restart the backend server
3. Try the OAuth flow again
4. Check the server console for detailed error messages
