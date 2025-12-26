# Authentication Setup and Testing Guide

## ✅ Phase 1: OAuth2 with YouTube - COMPLETED

The authentication system has been successfully implemented with the following components:

### Implemented Components

1. **Types** (`src/types/auth.types.ts`)
   - StoredTokens interface
   - AuthStatus interface
   - AuthenticatedRequest interface
   - OAuth2Config interface

2. **YouTube Auth Service** (`src/services/youtube-auth.service.ts`)
   - OAuth2Client initialization
   - Authorization URL generation
   - Token exchange and storage
   - Automatic token refresh
   - User info retrieval
   - Logout functionality

3. **Authentication Routes** (`src/routes/auth.routes.ts`)
   - `GET /api/auth/login` - Generate OAuth URL
   - `GET /api/auth/google/callback` - Handle OAuth callback
   - `GET /api/auth/status` - Check authentication status
   - `POST /api/auth/logout` - Logout user
   - `GET /api/auth/tokens` - Debug endpoint (dev only)

4. **Authentication Middleware** (`src/middlewares/auth.middleware.ts`)
   - authMiddleware - Protect routes requiring authentication
   - optionalAuthMiddleware - Optional authentication
   - Helper functions for request handling

5. **Token Storage**
   - Directory: `backend/tokens/`
   - File: `youtube-tokens.json` (gitignored)

---

## Testing the OAuth Flow

### Prerequisites

Before testing, ensure you have:

1. ✅ Created a Google Cloud Project
2. ✅ Enabled YouTube Data API v3
3. ✅ Created OAuth2 credentials
4. ✅ Configured authorized redirect URI: `http://localhost:3001/api/auth/google/callback`
5. ✅ Added credentials to `backend/.env`:
   - `YOUTUBE_CLIENT_ID`
   - `YOUTUBE_CLIENT_SECRET`
   - `OAUTH_REDIRECT_URI`

### Manual Testing Steps

#### 1. Start the Backend Server

```bash
cd backend
npm run dev
```

The server should start on `http://localhost:3001`

#### 2. Check Server Health

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-04T20:00:00.000Z",
  "uptime": 10.5,
  "environment": "development"
}
```

#### 3. Check Authentication Status (Before Login)

```bash
curl http://localhost:3001/api/auth/status
```

Expected response:
```json
{
  "authenticated": false
}
```

#### 4. Get OAuth Authorization URL

```bash
curl http://localhost:3001/api/auth/login
```

Expected response:
```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "message": "Redirect user to this URL to authorize the application"
}
```

#### 5. Complete OAuth Flow in Browser

1. Copy the `authUrl` from the previous response
2. Open it in your browser
3. Select your Google account
4. Grant the requested permissions:
   - View and manage your YouTube account
   - View your YouTube account
   - See your primary Google Account email address
   - See your personal info
5. After authorization, you'll be redirected to:
   - Success: `http://localhost:3000?auth=success`
   - Denied: `http://localhost:3000?auth=denied`
   - Error: `http://localhost:3000?auth=error&error=...`

#### 6. Verify Token Storage

Check if tokens were saved:

```bash
# Windows
dir backend\tokens

# Linux/Mac
ls -la backend/tokens/
```

You should see a `youtube-tokens.json` file.

#### 7. Check Authentication Status (After Login)

```bash
curl http://localhost:3001/api/auth/status
```

Expected response:
```json
{
  "authenticated": true,
  "user": {
    "email": "your-email@gmail.com",
    "name": "Your Name"
  },
  "expiresAt": 1733347200000
}
```

#### 8. Test Debug Endpoint (Dev Only)

```bash
curl http://localhost:3001/api/auth/tokens
```

Expected response:
```json
{
  "success": true,
  "tokens": {
    "hasAccessToken": true,
    "hasRefreshToken": true,
    "expiryDate": 1733347200000,
    "scope": "https://www.googleapis.com/auth/youtube ...",
    "tokenType": "Bearer"
  }
}
```

#### 9. Test Logout

```bash
curl -X POST http://localhost:3001/api/auth/logout
```

Expected response:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### 10. Verify Token Deletion

```bash
curl http://localhost:3001/api/auth/status
```

Expected response:
```json
{
  "authenticated": false
}
```

The `youtube-tokens.json` file should be deleted.

---

## Testing the Authentication Middleware

The middleware will be used to protect playlist and download endpoints in the next phases.

Example usage in a route:

```typescript
import { authMiddleware } from '../middlewares/auth.middleware.ts';

// Protected route
fastify.get(
  '/protected',
  { preHandler: authMiddleware },
  async (request, reply) => {
    return { message: 'You are authenticated!' };
  }
);
```

Test protected route:
```bash
# Without authentication (should fail)
curl http://localhost:3001/api/protected

# With authentication (should succeed)
# First complete OAuth flow, then:
curl http://localhost:3001/api/protected
```

---

## Common Issues

### Issue: "Missing OAuth2 configuration"

**Solution:** Ensure all environment variables are set in `backend/.env`:
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `OAUTH_REDIRECT_URI`

### Issue: OAuth callback shows "redirect_uri_mismatch"

**Solution:**
1. Go to Google Cloud Console
2. Navigate to APIs & Services > Credentials
3. Edit your OAuth2 credentials
4. Add `http://localhost:3001/api/auth/google/callback` to Authorized redirect URIs
5. Save changes

### Issue: Token refresh fails

**Solution:**
- Delete `backend/tokens/youtube-tokens.json`
- Complete OAuth flow again
- Ensure `prompt: 'consent'` is set in `getAuthUrl()` to always get refresh token

### Issue: CORS errors in browser

**Solution:** The backend already has CORS configured to allow `http://localhost:3000`. If using a different frontend URL, update `FRONTEND_URL` in `.env`.

---

## Token Refresh Flow

The authentication service automatically handles token refresh:

1. Before each API call, middleware checks token expiry
2. If token is expired but refresh token exists:
   - Automatically calls `refreshAccessToken()`
   - Updates stored tokens
   - Continues with the request
3. If refresh fails:
   - Returns 401 Unauthorized
   - User must re-authenticate

You can test this by:
1. Manually editing `backend/tokens/youtube-tokens.json`
2. Set `expiry_date` to a past timestamp
3. Make an authenticated request
4. Check logs - should see "Access token refreshed successfully"

---

## Security Considerations

### Production Checklist

- [ ] Remove `/api/auth/tokens` debug endpoint
- [ ] Use HTTPS for all OAuth redirects
- [ ] Store tokens in a secure database instead of file system
- [ ] Implement rate limiting on auth endpoints
- [ ] Add request logging and monitoring
- [ ] Use environment-specific OAuth credentials
- [ ] Implement token rotation
- [ ] Add security headers with `@fastify/helmet`

### Current Implementation (Development)

✅ Tokens stored in file system (gitignored)
✅ CORS configured for localhost
✅ Rate limiting enabled (100 requests per 15 minutes)
✅ Helmet security headers enabled
✅ Error logging with Pino

---

## Next Steps: Phase 2

With authentication complete, you can now proceed to **Phase 2: Playlist Management API**

This will include:
- YouTube API service wrapper
- Playlist CRUD operations
- Video management endpoints
- Valibot validation schemas

All playlist endpoints will use `authMiddleware` to ensure only authenticated users can manage playlists.

---

## Quick Reference

### Available Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Server health check | No |
| GET | `/api` | API information | No |
| GET | `/api/auth/login` | Get OAuth URL | No |
| GET | `/api/auth/google/callback` | OAuth callback | No |
| GET | `/api/auth/status` | Check auth status | No |
| POST | `/api/auth/logout` | Logout user | No |
| GET | `/api/auth/tokens` | Debug tokens (dev only) | No |

### Environment Variables

```env
PORT=3001
HOST=0.0.0.0
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

YOUTUBE_CLIENT_ID=your-client-id
YOUTUBE_CLIENT_SECRET=your-client-secret
OAUTH_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

DOWNLOAD_PATH=./downloads
CLEANUP_AFTER_ZIP=false
MAX_VIDEO_HEIGHT=720
```

---

**Phase 1 Status:** ✅ **COMPLETE**

All authentication functionality has been implemented and tested successfully!
