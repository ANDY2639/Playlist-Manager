# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Playlist Manager with download capabilities - a full-stack TypeScript application that allows users to manage YouTube playlists and download videos as ZIP archives.

**Tech Stack:**
- **Frontend:** Next.js with React 19 and TypeScript
- **Backend:** Node.js with TypeScript (Express or Fastify)
- **APIs:** YouTube Data API v3 (OAuth2), yt-dlp for video downloads

## Architecture

### Monorepo Structure
```
playlist-manager/
├── backend/     # Node.js + TypeScript API server
├── frontend/    # Next.js + React 19 application
```

### Backend Architecture

The backend handles three main responsibilities:

1. **YouTube API Integration** (`googleapis` package)
   - OAuth2 authentication flow
   - Playlist CRUD operations using `youtube.playlists.*` endpoints
   - Video management using `youtube.playlistItems.*` endpoints

2. **Video Download Service** (`ytdlp-nodejs` wrapper)
   - Downloads videos at 720p resolution: `yt-dlp -f "best[height<=720]"`
   - Organizes downloads by date: `./downloads/YYYY-MM-DD/VIDEO_ID.mp4`
   - Error handling for blocked/deleted videos

3. **ZIP Generation** (`archiver` package)
   - Creates ZIP archives from downloaded video folders
   - Exposes endpoint: `GET /api/download-playlist/:playlistId`
   - Streams ZIP as `application/zip`

### Frontend Architecture

- **State Management:** TanStack Query for async data fetching
- **API Communication:** axios or native fetch
- **Optional:** Zustand or Context for global state

### Key Technical Flows

**Playlist Management:**
1. OAuth2 authentication with YouTube
2. Create playlist: `youtube.playlists.insert`
3. Add videos: `playlistItems.insert`
4. Reorder: `playlistItems.update`
5. Delete: `playlistItems.delete` or `playlists.delete`

**Video Download & ZIP Creation:**
1. Receive playlistId from frontend
2. Fetch videoIds using YouTube Data API
3. Download each video with yt-dlp to date-organized folders
4. Generate ZIP archive with `archiver`
5. Stream ZIP to frontend for download

## Development Commands

### Backend
```bash
cd backend
npm install
npm run dev        # Start development server
npm run build      # Compile TypeScript
npm run test       # Run tests
```

### Frontend
```bash
cd frontend
npm install
npm run dev        # Start Next.js dev server (usually port 3000)
npm run build      # Build for production
npm run test       # Run tests
```

## Required Dependencies

### Backend
- `googleapis` - YouTube Data API v3 access
- `ytdlp-nodejs` - Video download wrapper (yt-dlp Node.js wrapper)
- `archiver` - ZIP file generation
- `dayjs` - Date/time handling
- `dotenv` - Environment variables
- `fs-extra` - Enhanced file system operations
- `fastify` - HTTP server
- `valibot` - Schema validation

### Frontend
- `@tanstack/react-query` - Async state management
- `axios` - HTTP client (or use fetch API)

## Environment Variables

Backend requires:
- `YOUTUBE_CLIENT_ID` - OAuth2 client ID
- `YOUTUBE_CLIENT_SECRET` - OAuth2 client secret
- `DOWNLOAD_PATH` - Base path for video downloads (default: `./downloads`)

## Important Notes

- This is a private/personal application - yt-dlp usage is for personal use only
- Videos are downloaded at 720p maximum resolution
- Downloads are organized by date (YYYY-MM-DD format)
- Consider implementing job queues (e.g., BullMQ) for handling large playlist downloads
- Error handling is critical for blocked/deleted videos
- OAuth2 tokens need proper refresh token handling
