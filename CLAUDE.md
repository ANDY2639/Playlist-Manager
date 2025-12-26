# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Playlist Manager with download capabilities - a full-stack TypeScript monorepo application that allows users to manage YouTube playlists and download videos as ZIP archives.

**Tech Stack:**

- **Frontend:** Next.js 15 with React 19, TailwindCSS 4, Radix UI
- **Backend:** Fastify with TypeScript (ESM modules)
- **Package Manager:** pnpm (workspaces)
- **APIs:** YouTube Data API v3 (OAuth2), yt-dlp for video downloads
- **Testing:** Vitest for both backend and frontend

## Development Commands

### Full Stack (Root)

```bash
pnpm install              # Install all dependencies for both workspaces
pnpm dev                  # Run both backend and frontend concurrently
pnpm build                # Build both projects
pnpm test                 # Run all tests
```

### Backend Only

```bash
pnpm dev:backend          # Start backend dev server (port 3001)
pnpm build:backend        # Compile TypeScript (includes yt-dlp installation)
pnpm test:backend         # Run backend tests with Vitest
pnpm --filter backend test:ui        # Run tests with UI
pnpm --filter backend test:coverage  # Run tests with coverage

# Authentication setup (required before first use)
pnpm --filter backend auth:setup     # Local OAuth setup (opens browser)
pnpm --filter backend auth:validate  # Validate stored tokens
```

### Frontend Only

```bash
pnpm dev:frontend         # Start Next.js dev server (port 3000)
pnpm build:frontend       # Build for production
pnpm test:frontend        # Run frontend tests
pnpm --filter frontend lint          # Run ESLint
```

### Adding Dependencies

```bash
# Add to backend
pnpm --filter backend add <package>
pnpm --filter backend add -D <package>  # Dev dependency

# Add to frontend
pnpm --filter frontend add <package>
```

## Architecture

### Monorepo Structure

```-
playlist-manager/
├── backend/
│   ├── src/
│   │   ├── server.ts              # Fastify server with routes
│   │   ├── routes/                # API route handlers
│   │   │   ├── auth.routes.ts     # OAuth & authentication
│   │   │   ├── playlist.routes.ts # Playlist CRUD
│   │   │   └── download.routes.ts # Video downloads & ZIP
│   │   ├── services/              # Business logic layer
│   │   │   ├── youtube-auth.service.ts        # OAuth2 token management
│   │   │   ├── youtube-api.service.ts         # YouTube API wrapper
│   │   │   ├── download-manager.service.ts    # Download orchestration
│   │   │   ├── download.service.ts            # yt-dlp wrapper
│   │   │   └── zip.service.ts                 # ZIP generation
│   │   ├── middlewares/           # Fastify middleware
│   │   ├── schemas/               # Valibot validation schemas
│   │   ├── scripts/               # CLI scripts (auth-setup, etc.)
│   │   └── utils/                 # Utilities
│   ├── tokens/                    # OAuth2 tokens (gitignored)
│   └── downloads/                 # Downloaded videos (gitignored)
├── frontend/
│   └── src/
│       ├── app/                   # Next.js App Router
│       │   ├── playlists/         # Playlist pages
│       │   └── providers.tsx      # React Query provider
│       ├── components/
│       │   ├── auth/              # Auth UI components
│       │   ├── layout/            # Header, nav, etc.
│       │   ├── playlists/         # Playlist components
│       │   ├── theme/             # Theme toggle (dark mode)
│       │   └── ui/                # Radix UI + shadcn components
│       ├── contexts/              # React contexts (theme)
│       ├── hooks/                 # Custom React hooks
│       ├── services/              # API client (axios)
│       └── schemas/               # Valibot schemas
└── docs/                          # Documentation
    ├── AUTHENTICATION.md          # OAuth setup guide
    └── PNPM_SETUP.md             # pnpm usage guide
```

### Backend Architecture

The backend uses **ES modules** (not CommonJS) with `.js` extensions in imports.

**Three Main Responsibilities:**

1. **YouTube API Integration** (`googleapis` package)
   - OAuth2 flow handled by `YouTubeAuthService`
   - Token storage in `backend/tokens/youtube-tokens.json`
   - Auto-refresh tokens every 50 minutes
   - API wrapper in `YouTubeAPIService`

2. **Video Download Service** (`ytdlp-nodejs` wrapper)
   - Downloads videos at 720p: `yt-dlp -f "best[height<=720]"`
   - Organizes by playlist: `./downloads/{playlistId}/`
   - Asynchronous download orchestration via `DownloadManagerService`
   - Real-time progress tracking with download status API

3. **ZIP Generation** (`archiver` package)
   - Creates ZIP archives from downloaded folders
   - Streams ZIP to client as `application/zip`

**Key Services:**

- `youtube-auth.service.ts` - OAuth2 token management, auto-refresh
- `youtube-api.service.ts` - YouTube Data API wrapper (playlists, videos)
- `download-manager.service.ts` - Download orchestration, status tracking
- `download.service.ts` - yt-dlp wrapper with progress callbacks
- `zip.service.ts` - ZIP archive generation

### Frontend Architecture

- **Framework:** Next.js 15 with App Router
- **Styling:** TailwindCSS 4 with custom design system
- **State Management:** TanStack Query v5 for server state
- **UI Components:** Radix UI primitives + custom components
- **Theme:** Dark mode support via Context API
- **API Client:** axios with typed services

**Key Patterns:**

- Server state via `@tanstack/react-query`
- Theme context for dark mode (`theme-context.tsx`)
- Valibot for runtime validation
- Custom hooks in `hooks/` directory

### Authentication Flow

**Local Development:**

1. Run `pnpm --filter backend auth:setup`
2. Browser opens to Google OAuth consent screen
3. Authorize YouTube access
4. Tokens saved to `backend/tokens/youtube-tokens.json`
5. Server starts with auto-refresh enabled

**Production (Render/Vercel):**

1. Set `AUTH_SETUP_SECRET` environment variable
2. Visit `/api/auth/setup/start?secret=YOUR_SECRET`
3. Complete OAuth flow in browser
4. Tokens stored, server authenticated
5. Verify at `/api/auth/status`

See `backend/docs/AUTHENTICATION.md` for detailed setup instructions.

### Download Flow

1. Frontend requests playlist download: `POST /api/downloads/playlists/:playlistId`
2. Backend creates download job with unique ID
3. Download manager fetches playlist metadata from YouTube API
4. Videos downloaded sequentially via yt-dlp to `downloads/{playlistId}/`
5. Frontend polls download status: `GET /api/downloads/:downloadId/status`
6. When complete, frontend requests ZIP: `GET /api/downloads/:downloadId/zip`
7. Backend streams ZIP archive to client

## Environment Variables

### Backend (`backend/.env`)

```bash
# Required
YOUTUBE_CLIENT_ID=...              # Google OAuth2 client ID
YOUTUBE_CLIENT_SECRET=...          # Google OAuth2 client secret
OAUTH_REDIRECT_URI=...             # OAuth callback URL
GOOGLEAPIS_URL=https://www.googleapis.com

# Optional
PORT=3001                          # Backend server port
HOST=0.0.0.0                       # Server host
NODE_ENV=development               # Environment
FRONTEND_URL=http://localhost:3000 # CORS origin
DOWNLOAD_PATH=./downloads          # Video download directory
AUTH_SETUP_SECRET=...              # Secret for remote auth setup
SKIP_AUTH_CHECK=false              # Skip auth on startup (dev only)
YOUTUBE_ACCOUNT_EMAIL=...          # Expected YouTube account (validation)
```

Copy `backend/.env.example` to `backend/.env` and fill in values.

### Frontend

Frontend uses environment variables via `process.env.NEXT_PUBLIC_*` if needed (currently uses default API URL).

## Key Technical Details

### Module System

- Backend uses **ES modules** (`"type": "module"` in package.json)
- All imports must include `.js` extension: `import { foo } from './bar.js'`
- Use `import.meta.url` for `__dirname` equivalent

### Validation

- Both frontend and backend use **Valibot** for schema validation
- Backend: `valibot` v1.2.0
- Frontend: `valibot` v0.24.1 (may need alignment)
- Schemas in `schemas/` directories

### Error Handling

- Custom `AppError` class in `utils/error-handler.ts`
- Valibot validation errors handled globally in Fastify
- Structured error responses with `code`, `message`, `statusCode`

### Testing

- Both projects use **Vitest**
- Run tests with `pnpm test` (root) or workspace-specific commands
- UI mode available: `pnpm --filter backend test:ui`

## Important Notes

- This is a **personal/private application** - yt-dlp usage is for personal use only
- Videos downloaded at **720p maximum** resolution
- pnpm **required** - do not use npm/yarn (see `docs/PNPM_SETUP.md`)
- OAuth2 tokens auto-refresh every 50 minutes in background
- Download status tracked in-memory (resets on server restart)
- Large playlist downloads should be handled asynchronously (already implemented)
