# Download Setup Guide

This guide explains how to set up the video download functionality for the Playlist Manager.

## Prerequisites

### System Requirements

The download service requires `yt-dlp` to be installed on your system. This is a command-line tool that handles the actual video downloads.

## Installing yt-dlp

Choose the installation method for your operating system:

### Windows

**Option 1: Using npm (Recommended)**
```bash
npm install -g yt-dlp
```

**Option 2: Using Scoop**
```bash
scoop install yt-dlp
```

**Option 3: Manual Installation**
1. Download the latest `yt-dlp.exe` from [GitHub Releases](https://github.com/yt-dlp/yt-dlp/releases)
2. Place it in a directory included in your PATH (e.g., `C:\Windows\System32`)

### macOS

**Using Homebrew (Recommended)**
```bash
brew install yt-dlp
```

**Using pip**
```bash
pip install yt-dlp
```

### Linux

**Ubuntu/Debian**
```bash
sudo apt update
sudo apt install yt-dlp
```

**Fedora/RHEL**
```bash
sudo dnf install yt-dlp
```

**Arch Linux**
```bash
sudo pacman -S yt-dlp
```

**Using pip (Universal)**
```bash
pip install yt-dlp
```

## Verifying Installation

After installation, verify that yt-dlp is accessible:

```bash
yt-dlp --version
```

You should see version information. If you get "command not found", ensure yt-dlp is in your PATH.

## Environment Configuration

Configure the download settings in your `.env` file:

```bash
# Download Configuration
DOWNLOAD_PATH=./downloads

# Optional: Cleanup after ZIP creation (Phase 4)
CLEANUP_AFTER_ZIP=false

# Optional: Max video resolution (default: 720p)
MAX_VIDEO_HEIGHT=720
```

### Configuration Options

- **DOWNLOAD_PATH**: Directory where videos will be downloaded
  - Default: `./downloads`
  - Videos are organized by date: `./downloads/YYYY-MM-DD/playlistId/`

- **CLEANUP_AFTER_ZIP**: Whether to delete source videos after creating ZIP
  - Default: `false`
  - Set to `true` to save disk space

- **MAX_VIDEO_HEIGHT**: Maximum video resolution
  - Default: `720`
  - Higher values may result in larger file sizes and longer downloads

## Download Directory Structure

Videos are automatically organized by date:

```
downloads/
├── 2025-12-04/
│   ├── PLxxx123/
│   │   ├── videoId1_VideoTitle1.mp4
│   │   ├── videoId2_VideoTitle2.mp4
│   │   └── ...
│   └── PLyyy456/
│       └── videoId3_VideoTitle3.mp4
├── 2025-12-05/
│   └── PLzzz789/
│       └── videoId4_VideoTitle4.mp4
└── ...
```

## API Endpoints

### Start Playlist Download

```http
POST /api/downloads/start
Content-Type: application/json
Authorization: Bearer <token>

{
  "playlistId": "PLxxx123456"
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "downloadId": "uuid-v4",
    "message": "Download started successfully",
    "statusUrl": "/api/downloads/uuid-v4/status"
  },
  "status": {
    "downloadId": "uuid-v4",
    "playlistId": "PLxxx123456",
    "playlistTitle": "My Awesome Playlist",
    "status": "initializing",
    "totalVideos": 10,
    "completedVideos": 0,
    "failedVideos": 0,
    "videos": [...],
    "downloadPath": "./downloads/2025-12-04/PLxxx123456",
    "startedAt": "2025-12-04T10:00:00.000Z"
  }
}
```

### Get Download Status

```http
GET /api/downloads/:downloadId/status
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "downloadId": "uuid-v4",
    "status": "downloading",
    "totalVideos": 10,
    "completedVideos": 5,
    "failedVideos": 1,
    "currentVideoIndex": 5,
    "currentVideo": {
      "videoId": "abc123",
      "videoTitle": "Current Video",
      "status": "downloading",
      "progress": 67.5
    },
    "videos": [...],
    "startedAt": "2025-12-04T10:00:00.000Z"
  }
}
```

### List All Downloads

```http
GET /api/downloads
Authorization: Bearer <token>
```

### Cancel Download

```http
DELETE /api/downloads/:downloadId
Authorization: Bearer <token>
```

## Download States

### Playlist Download States
- `initializing` - Fetching playlist information
- `downloading` - Actively downloading videos
- `completed` - All videos processed (some may have failed)
- `failed` - Download process failed
- `cancelled` - Manually cancelled by user

### Individual Video States
- `pending` - Queued for download
- `downloading` - Currently downloading
- `completed` - Successfully downloaded
- `failed` - Download failed (video unavailable, blocked, etc.)
- `skipped` - Skipped due to restrictions

## Error Handling

The download service handles various error scenarios:

### Video-Level Errors (Download continues)
- **Video unavailable**: Private, deleted, or removed videos
- **Blocked content**: Copyright or region-restricted videos
- **Age-restricted**: Videos requiring age verification
- **Network errors**: Temporary connection issues (retried up to 3 times)

### Playlist-Level Errors (Download fails)
- **Empty playlist**: Playlist contains no videos
- **Playlist not found**: Invalid playlist ID
- **Authentication failed**: YouTube API access denied
- **Quota exceeded**: YouTube API daily limit reached

## Troubleshooting

### "yt-dlp: command not found"
- Ensure yt-dlp is installed and in your PATH
- Try restarting your terminal/command prompt
- Verify installation: `yt-dlp --version`

### Downloads are very slow
- Check your internet connection
- Consider lowering MAX_VIDEO_HEIGHT
- Network throttling may be occurring

### "Permission denied" errors
- Ensure the DOWNLOAD_PATH directory is writable
- Check filesystem permissions
- Try running with appropriate permissions

### Videos fail with "Video unavailable"
- Some videos may be private, deleted, or region-restricted
- The download will continue with remaining videos
- Check the failed videos list in the status response

### High disk usage
- Enable CLEANUP_AFTER_ZIP=true (after Phase 4 implementation)
- Manually delete old downloads from the downloads/ directory
- Consider using a separate disk for downloads

## Performance Considerations

### Sequential Downloads
- Videos are downloaded one at a time (MVP implementation)
- Prevents overwhelming the system and network
- 1-second delay between videos to avoid rate limiting

### Progress Tracking
- Real-time progress updates via status endpoint
- Poll `/api/downloads/:downloadId/status` every 2-3 seconds
- Progress is tracked per-video (0-100%)

### Memory Usage
- Download tracking is in-memory (Map-based)
- Each download status is ~1-5KB in memory
- Restart clears download history (future: persist to database)

## Next Steps

After Phase 3 is complete, Phase 4 will add:
- ZIP file generation from downloaded videos
- Streaming ZIP downloads to client
- Optional automatic cleanup after ZIP creation

## Support

For issues or questions:
1. Check the server logs for detailed error messages
2. Verify yt-dlp is properly installed and updated
3. Ensure environment variables are correctly set
4. Check YouTube API quota limits in Google Cloud Console
