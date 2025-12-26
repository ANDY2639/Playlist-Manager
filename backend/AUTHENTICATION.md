# YouTube Authentication Setup

This document explains how to authenticate the backend with YouTube API in different environments.

## 🔑 Authentication Methods

### Method 1: Local Setup (Development)

Use the CLI script for local development:

```bash
npm run auth:setup
```

This will:

1. Check if already authenticated (skip if valid)
2. Open browser for Google OAuth
3. Save tokens to `backend/tokens/youtube-tokens.json`
4. Display success message

### Method 2: Remote Setup (Production - Render/Vercel/etc.)

For production environments where you can't run shell commands, use the web endpoint:

#### Step 1: Generate a Secret Token

Generate a strong random secret (keep this private!):

```bash
# Using OpenSSL
openssl rand -hex 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Step 2: Set Environment Variable in Render

Add to your Render environment variables:

```
AUTH_SETUP_SECRET=your_generated_secret_here
```

#### Step 3: Visit the Setup URL

Open your browser and visit:

```
https://your-render-app.onrender.com/api/auth/setup/start?secret=your_generated_secret_here
```

This will:

1. Validate your secret token
2. Redirect you to Google OAuth
3. After authorization, redirect back to `/api/auth/google/callback`
4. Save tokens and display success page
5. Server will start auto-refresh of tokens

#### Step 4: Verify Authentication

Check authentication status:

```
https://your-render-app.onrender.com/api/auth/status
```

Response when authenticated:

```json
{
  "authenticated": true,
  "user": {
    "email": "your-email@gmail.com",
    "name": "Your Name"
  },
  "expiresAt": 1735200000000
}
```

Response when NOT authenticated:

```json
{
  "authenticated": false,
  "user": null,
  "expiresAt": null,
  "message": "Not authenticated. Visit /api/auth/setup/start?secret=YOUR_SECRET to authenticate"
}
```

## 🔒 Security Best Practices

### Keep Your Secret Safe

- **NEVER** commit `AUTH_SETUP_SECRET` to Git
- **NEVER** share it publicly
- Use a strong random value (at least 32 characters)
- Rotate it periodically
- Store it securely in Render/Vercel environment variables

### OAuth Callback URL

Make sure your Google Cloud Console has the correct callback URL:

**Local Development:**

```
http://localhost:3001/api/auth/google/callback
```

**Production (Render):**

```
https://your-app.onrender.com/api/auth/google/callback
```

**Important:** Add BOTH URLs to Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs → Authorized redirect URIs

## 📝 Environment Variables

Required in `.env` or Render environment variables:

```bash
# YouTube OAuth2 Credentials (from Google Cloud Console)
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret

# OAuth Redirect URI (must match Google Console settings)
OAUTH_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# Googleapis URL
GOOGLEAPIS_URL=https://www.googleapis.com

# Authentication Setup Secret (for remote setup)
AUTH_SETUP_SECRET=your_generated_secret_here

# Optional: Skip auth check on startup (development)
SKIP_AUTH_CHECK=false

# Optional: Expected YouTube account email (validation)
YOUTUBE_ACCOUNT_EMAIL=your-expected-email@gmail.com
```

## 🚀 Quick Start Guide

### First Time Setup (Production)

1. **Deploy to Render** (server will start without auth)

2. **Set environment variables:**
   - `YOUTUBE_CLIENT_ID`
   - `YOUTUBE_CLIENT_SECRET`
   - `OAUTH_REDIRECT_URI` (use your Render URL)
   - `GOOGLEAPIS_URL=https://www.googleapis.com`
   - `AUTH_SETUP_SECRET` (generate a strong secret)

3. **Update Google Cloud Console:**
   - Add Render callback URL to authorized redirect URIs
   - Example: `https://your-app.onrender.com/api/auth/google/callback`

4. **Authenticate via web:**
   - Visit: `https://your-app.onrender.com/api/auth/setup/start?secret=YOUR_SECRET`
   - Authorize with Google
   - Done! Server is now authenticated

5. **Verify:**
   - Visit: `https://your-app.onrender.com/api/auth/status`
   - Should show `"authenticated": true`

### Re-authentication

If tokens expire or become invalid:

1. Visit the same setup URL again:

   ```
   https://your-app.onrender.com/api/auth/setup/start?secret=YOUR_SECRET
   ```

2. Authorize again with Google

3. New tokens will be saved

## 🛠️ Troubleshooting

### Error: "Invalid or missing secret"

- Check that `AUTH_SETUP_SECRET` is set in Render environment variables
- Verify you're using the correct secret in the URL
- Make sure there are no extra spaces or special characters

### Error: "redirect_uri_mismatch"

- Your callback URL doesn't match Google Cloud Console settings
- Add the correct URL to Google Cloud Console → OAuth 2.0 Client IDs → Authorized redirect URIs
- Format: `https://your-app.onrender.com/api/auth/google/callback`

### Error: "Backend is not authenticated with YouTube"

- You haven't authenticated yet
- Visit `/api/auth/setup/start?secret=YOUR_SECRET` to authenticate
- Check `/api/auth/status` to verify

### Server starts but APIs return 503

- Authentication is not configured
- Visit `/api/auth/setup/start?secret=YOUR_SECRET`
- Or set `SKIP_AUTH_CHECK=true` (not recommended for production)

## 📚 API Endpoints

### `GET /api/auth/status`

Check authentication status (public, no auth required)

### `GET /api/auth/setup/start?secret=YOUR_SECRET`

Initiate OAuth flow for remote authentication (protected by secret)

### `GET /api/auth/google/callback`

OAuth callback endpoint (called by Google after authorization)

### `POST /api/auth/refresh` (development only)

Manually refresh tokens

## 🔄 Token Auto-Refresh

Once authenticated, the server automatically:

- Refreshes access tokens every 50 minutes
- Uses refresh_token to get new access_token
- Logs refresh success/failure

No manual intervention needed!

## 📖 Additional Resources

- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [Render Environment Variables](https://render.com/docs/environment-variables)
