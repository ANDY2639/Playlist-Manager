# Deployment Guide - Playlist Manager

This guide provides step-by-step instructions for deploying the Playlist Manager application to various cloud platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Option 1: Vercel + Railway (Recommended)](#option-1-vercel--railway-recommended)
- [Option 2: Netlify + Render](#option-2-netlify--render)
- [Option 3: Fly.io (Fullstack)](#option-3-flyio-fullstack)
- [Option 4: DigitalOcean App Platform](#option-4-digitalocean-app-platform)
- [Post-Deployment Steps](#post-deployment-steps)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying to any platform, ensure you have:

### 1. Repository Setup

- [ ] Code pushed to GitHub/GitLab/Bitbucket
- [ ] `pnpm-lock.yaml` committed to repository
- [ ] All environment variable examples documented

### 2. YouTube OAuth2 Credentials

- [ ] Google Cloud Project created
- [ ] YouTube Data API v3 enabled
- [ ] OAuth 2.0 credentials created
- [ ] Authorized redirect URIs configured (will be updated after deployment)

Get credentials at: <https://console.cloud.google.com/apis/credentials>

### 3. Build Verification

Test that your application builds successfully:

```bash
# Test backend build
pnpm run build:backend

# Test frontend build
pnpm run build:frontend

# Test both
pnpm run build
```

---

## Option 1: Vercel + Railway (Recommended)

**Best for:** Quick deployment, zero-config Next.js, generous free tier

### Backend Deployment (Railway)

1. **Sign up/Login to Railway**
   - Visit <https://railway.app>
   - Connect your GitHub account

2. **Create New Project**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your `playlist-manager` repository
   - Railway will auto-detect the configuration from `railway.toml`

3. **Configure Environment Variables**

   Navigate to your project → Variables tab and add:

   ```bash
   NODE_ENV=production
   PORT=${{ PORT }}
   HOST=0.0.0.0

   # Update after deploying frontend
   FRONTEND_URL=https://your-frontend.vercel.app

   # YouTube OAuth2 credentials
   YOUTUBE_CLIENT_ID=your_client_id_here
   YOUTUBE_CLIENT_SECRET=your_client_secret_here
   OAUTH_REDIRECT_URI=${{ RAILWAY_PUBLIC_DOMAIN }}/api/auth/callback

   # Download configuration
   DOWNLOAD_PATH=/tmp/downloads
   CLEANUP_AFTER_ZIP=true
   MAX_VIDEO_HEIGHT=720
   ```

4. **Deploy**
   - Railway will automatically deploy on push to main branch
   - Copy the public URL (e.g., `https://playlist-manager-backend-production.up.railway.app`)

5. **Verify Deployment**

   ```bash
   curl https://your-backend-url.railway.app/health
   ```

   Should return: `{"status":"ok","timestamp":"...","uptime":...}`

### Frontend Deployment (Vercel)

1. **Sign up/Login to Vercel**
   - Visit <https://vercel.com>
   - Connect your GitHub account

2. **Import Project**
   - Click "Add New" → "Project"
   - Import your `playlist-manager` repository

3. **Configure Project**
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   - **Build Command:** `pnpm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `pnpm install`

4. **Environment Variables**

   Add in Vercel dashboard:

   ```bash
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   NEXT_PUBLIC_APP_NAME=Playlist Manager
   NEXT_PUBLIC_APP_VERSION=1.0.0
   ```

5. **Deploy**
   - Click "Deploy"
   - Copy the production URL (e.g., `https://playlist-manager.vercel.app`)

6. **Update Backend FRONTEND_URL**
   - Go back to Railway
   - Update `FRONTEND_URL` with your Vercel URL
   - Railway will automatically redeploy

### Update OAuth Redirect URIs

1. Go to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client ID
3. Add to Authorized redirect URIs:
   <https://your-backend.railway.app/api/auth/callback>
4. Add to Authorized JavaScript origins:
   <https://your-frontend.vercel.app>
   <https://your-backend.railway.app>

---

## Option 2: Netlify + Render

**Best for:** Fast builds, good Netlify CDN, Render's persistent services

### Backend Deployment (Render)

1. **Sign up to Render**
   - Visit <https://render.com>
   - Connect GitHub account

2. **Create New Web Service**
   - Dashboard → "New" → "Web Service"
   - Connect your repository
   - Render will detect `render.yaml` configuration

3. **Manual Configuration (if needed)**
   - **Name:** playlist-manager-backend
   - **Region:** Oregon (or your preferred region)
   - **Branch:** main
   - **Root Directory:** (leave empty for monorepo)
   - **Build Command:** `pnpm install && pnpm run build:backend`
   - **Start Command:** `pnpm --filter backend start`

4. **Environment Variables**

   Add in Render dashboard:

   ```bash
   NODE_ENV=production
   HOST=0.0.0.0
   PNPM_VERSION=8.15.0

   FRONTEND_URL=https://your-frontend.netlify.app

   YOUTUBE_CLIENT_ID=your_client_id_here
   YOUTUBE_CLIENT_SECRET=your_client_secret_here
   OAUTH_REDIRECT_URI=https://your-backend.onrender.com/api/auth/callback

   DOWNLOAD_PATH=/tmp/downloads
   CLEANUP_AFTER_ZIP=true
   MAX_VIDEO_HEIGHT=720
   ```

5. **Deploy & Get URL**
   - Render will deploy automatically
   - Copy your backend URL (e.g., <https://playlist-manager.onrender.com>)

### Frontend Deployment (Netlify)

1. **Sign up to Netlify**
   - Visit <https://netlify.com>
   - Connect GitHub account

2. **Import Project**
   - "Add new site" → "Import an existing project"
   - Choose your repository

3. **Build Settings**

   Netlify will read from `netlify.toml`, but verify:

   - **Base directory:** `frontend`
   - **Build command:** `pnpm install && pnpm run build`
   - **Publish directory:** `frontend/.next`

4. **Environment Variables**

   Add in Netlify dashboard:

   ```bash
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   NEXT_PUBLIC_APP_NAME=Playlist Manager
   NEXT_PUBLIC_APP_VERSION=1.0.0
   PNPM_VERSION=8.15.0
   ```

5. **Update netlify.toml**

   Edit `netlify.toml` and update the redirect URL:

   ```toml
   [[redirects]]
     from = "/api/*"
     to = "https://your-actual-backend.onrender.com/api/:splat"
     status = 200
     force = true
   ```

   Commit and push to trigger redeploy.

---

## Option 3: Fly.io (Fullstack)

**Best for:** Full control with Docker, cost predictability, single platform

### Prerequisites (Fly.io)

Install Fly CLI:

```bash
# macOS/Linux
curl -L https://fly.io/install.sh | sh

# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex
```

Login:

```bash
fly auth login
```

### Backend Deployment

1. **Launch Backend App**

   ```bash
   fly launch --config fly.toml --name playlist-manager-backend --no-deploy
   ```

2. **Set Secrets**

   ```bash
   fly secrets set \
     YOUTUBE_CLIENT_ID="your_client_id" \
     YOUTUBE_CLIENT_SECRET="your_client_secret" \
     OAUTH_REDIRECT_URI="https://playlist-manager-backend.fly.dev/api/auth/callback" \
     FRONTEND_URL="https://playlist-manager-frontend.fly.dev" \
     --app playlist-manager-backend
   ```

3. **Deploy**

   ```bash
   fly deploy --config fly.toml
   ```

4. **Verify**

   ```bash
   fly status --app playlist-manager-backend
   curl https://playlist-manager-backend.fly.dev/health
   ```

### Frontend Deployment

1. **Update Backend URL in fly.frontend.toml**

   Edit `fly.frontend.toml`:

   ```toml
   [build.args]
     NEXT_PUBLIC_API_URL = "https://playlist-manager-backend.fly.dev"
   ```

2. **Launch Frontend App**

   ```bash
   fly launch --config fly.frontend.toml --name playlist-manager-frontend --no-deploy
   ```

3. **Deploy**

   ```bash
   fly deploy --config fly.frontend.toml
   ```

4. **Verify**

   ```bash
   fly status --app playlist-manager-frontend
   ```

### Enable Auto-Deploy with GitHub Actions

1. **Get Fly API Token**

   ```bash
   fly tokens create deploy
   ```

2. **Add Secret to GitHub**
   - Go to your repo → Settings → Secrets and variables → Actions
   - Add new secret: `FLY_API_TOKEN` with the token from step 1

3. **GitHub Actions is already configured**
   - The workflow file is at `.github/workflows/fly-deploy.yml`
   - Push to main/master branch will trigger auto-deploy

---

## Option 4: DigitalOcean App Platform

**Best for:** Teams, predictable costs, DO ecosystem integration

### Deployment Steps

1. **Sign up to DigitalOcean**
   - Visit <https://cloud.digitalocean.com>
   - Connect GitHub account

2. **Create New App**
   - Apps → "Create App"
   - Choose GitHub as source
   - Select your repository and branch

3. **Import App Spec**
   - Choose "Edit App Spec"
   - Copy contents from `.do/app.yaml`
   - Update the following fields:

     ```yaml
     github:
       repo: your-github-username/playlist-manager  # Update this
       branch: main
     ```

4. **Configure Secrets**

   In the App Platform dashboard:

   - Go to Settings → App-Level Environment Variables
   - Add encrypted variables:
     - `YOUTUBE_CLIENT_ID`
     - `YOUTUBE_CLIENT_SECRET`

5. **Deploy**
   - Click "Create Resources"
   - DigitalOcean will build and deploy both services
   - The services will auto-reference each other using `${backend.PUBLIC_URL}` syntax

6. **Get URLs**
   - Backend: `https://playlist-manager-backend-xxxxx.ondigitalocean.app`
   - Frontend: `https://playlist-manager-frontend-xxxxx.ondigitalocean.app`

7. **Update OAuth Redirect URIs**
   - Add backend URL to Google Console authorized redirects

---

## Post-Deployment Steps

After deploying to any platform:

### 1. Update OAuth Redirect URIs in Google Cloud Console

1. Go to <https://console.cloud.google.com/apis/credentials>
2. Select your OAuth 2.0 Client ID
3. Add your backend URL to "Authorized redirect URIs":
   <https://your-backend-url/api/auth/callback>
4. Add both URLs to "Authorized JavaScript origins":
   <https://your-frontend-url>
   <https://your-backend-url>

### 2. Test the Deployment

1. **Test Health Endpoint**

   ```bash
   curl https://your-backend-url/health
   ```

   Expected response:

   ```json
   {
     "status": "ok",
     "timestamp": "2024-01-01T00:00:00.000Z",
     "uptime": 123.456,
     "environment": "production"
   }
   ```

2. **Test Frontend**
   - Visit your frontend URL
   - Should load without errors

3. **Test OAuth Flow**
   - Click "Login with YouTube" or similar
   - Should redirect to Google OAuth consent screen
   - After authorization, should redirect back to your app

4. **Test Full Workflow**
   - Create a test playlist
   - Add a video to the playlist
   - Try downloading the playlist
   - Verify ZIP file downloads correctly

### 3. Monitor Logs

**Vercel:**

```bash
vercel logs
```

**Railway:**

- Dashboard → Deployments → View Logs

**Render:**

- Dashboard → Logs tab

**Fly.io:**

```bash
fly logs --app playlist-manager-backend
fly logs --app playlist-manager-frontend
```

**DigitalOcean:**

- App Platform → Runtime Logs

---

## Troubleshooting

### Common Issues

#### 1. Build Fails with "pnpm: command not found"

**Solution:** Ensure `PNPM_VERSION` environment variable is set:

```bash
PNPM_VERSION=8.15.0
```

For platforms that don't support this, the Dockerfiles already include pnpm installation.

#### 2. CORS Errors

**Issue:** Frontend can't connect to backend

**Solution:**

- Verify `FRONTEND_URL` is correctly set in backend environment variables
- Check that it matches your actual frontend URL (no trailing slash)
- Verify CORS configuration in `backend/src/server.ts`

#### 3. OAuth Redirect Mismatch

**Error:** "redirect_uri_mismatch"

**Solution:**

- Exact match required in Google Console
- Format: `https://your-backend-url/api/auth/callback`
- No trailing slashes
- Must be HTTPS in production

#### 4. Build Timeout

**Issue:** Build takes too long and times out

**Solution:**

- For Docker builds, increase timeout in platform settings
- For Fly.io: `fly deploy --remote-only` (builds on Fly's servers)
- Consider splitting dependencies into separate build stage

#### 5. Download Files Not Persisting

**Expected Behavior:** Using ephemeral storage (`/tmp`)

**Verification:**

- Ensure `CLEANUP_AFTER_ZIP=true` is set
- Verify `DOWNLOAD_PATH=/tmp/downloads`
- Downloads are temporary and cleaned up after ZIP creation

#### 6. Health Check Failing

**Issue:** Platform reports app as unhealthy

**Solution:**

- Verify `/health` endpoint is accessible
- Check that `PORT` environment variable matches the service port
- Ensure `HOST=0.0.0.0` (not `localhost`)
- Test manually: `curl https://your-backend-url/health`

#### 7. Environment Variables Not Loading

**Solution:**

- Verify variables are set in platform dashboard
- For Next.js: Variables must be prefixed with `NEXT_PUBLIC_` to be accessible in browser
- Redeploy after adding/changing environment variables
- Check variable scope (build-time vs runtime)

### Getting Help

- **Vercel:** <https://vercel.com/docs>
- **Railway:** <https://docs.railway.app>
- **Netlify:** <https://docs.netlify.com>
- **Render:** <https://render.com/docs>
- **Fly.io:** <https://fly.io/docs>
- **DigitalOcean:** <https://docs.digitalocean.com/products/app-platform>

---

## Platform Comparison

| Feature | Vercel + Railway | Netlify + Render | Fly.io | DigitalOcean |
|---------|------------------|------------------|--------|--------------|
| **Setup Complexity** | Low | Low | Medium | Low |
| **Free Tier** | Generous | Good | Limited | Trial only |
| **Build Speed** | Fast | Fast | Medium | Medium |
| **Auto-deploy** | ✅ | ✅ | ✅ (with GH Actions) | ✅ |
| **Custom Domains** | ✅ | ✅ | ✅ | ✅ |
| **Logs & Monitoring** | Good | Good | Excellent | Good |
| **Scaling** | Auto | Auto | Manual/Auto | Manual |
| **Best For** | Quick start | Simple apps | Full control | Teams |

---

## Cost Estimates (Monthly)

### Hobby/Personal Projects

- **Vercel + Railway:** $0 - $10 (free tiers)
- **Netlify + Render:** $0 - $7 (free tiers with limitations)
- **Fly.io:** ~$5 - $15 (minimal resources)
- **DigitalOcean:** ~$12 - $24 (basic tier, no free tier)

### Production

- **Vercel + Railway:** $20 - $60
- **Netlify + Render:** $25 - $70
- **Fly.io:** $15 - $50
- **DigitalOcean:** $24 - $100

*Costs vary based on traffic, build minutes, and resource usage.*

---

## Next Steps

After successful deployment:

1. [ ] Set up custom domain (optional)
2. [ ] Configure monitoring and alerts
3. [ ] Set up automatic backups (if using persistent storage)
4. [ ] Document your specific environment variables
5. [ ] Create a runbook for your team
6. [ ] Set up staging environment (optional)
7. [ ] Configure CDN (if needed)

---

## Security Checklist

- [ ] All secrets stored in platform's encrypted storage (not in code)
- [ ] OAuth redirect URIs restricted to your domains only
- [ ] HTTPS enforced on all endpoints
- [ ] CORS configured to allow only your frontend domain
- [ ] Rate limiting enabled (already in `server.ts`)
- [ ] Helmet security headers enabled (already in `server.ts`)
- [ ] Environment variables not logged or exposed
- [ ] YouTube API quotas monitored

---

## Support

For issues specific to this application:

- Check the main README.md
- Review CLAUDE.md for architecture details
- Check application logs on your deployment platform

For platform-specific issues:

- Consult the respective platform's documentation
- Check platform status pages
- Contact platform support
