/**
 * Type definitions for video download functionality
 */

/**
 * Status of an individual video download
 */
export type VideoDownloadStatus = 'pending' | 'downloading' | 'completed' | 'failed' | 'skipped';

/**
 * Information about a single video download attempt
 */
export interface VideoDownloadInfo {
  videoId: string;
  videoTitle: string;
  status: VideoDownloadStatus;
  progress: number; // 0-100
  error?: string;
  filePath?: string;
  fileSize?: number; // bytes
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Overall status of a playlist download operation
 */
export interface DownloadStatus {
  downloadId: string;
  playlistId: string;
  playlistTitle: string;
  status: 'initializing' | 'downloading' | 'completed' | 'failed' | 'cancelled';
  totalVideos: number;
  completedVideos: number;
  failedVideos: number;
  skippedVideos: number;
  currentVideoIndex: number;
  currentVideo?: VideoDownloadInfo;
  videos: VideoDownloadInfo[];
  downloadPath: string;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

/**
 * Result of a single video download operation
 */
export interface VideoDownloadResult {
  success: boolean;
  videoId: string;
  videoTitle: string;
  filePath?: string;
  fileSize?: number;
  error?: string;
  duration?: number; // milliseconds
}

/**
 * Configuration for yt-dlp download
 */
export interface DownloadConfig {
  format: string; // e.g., "best[height<=720]"
  outputTemplate: string;
  maxRetries: number;
  timeout: number; // milliseconds
}

/**
 * yt-dlp progress callback data
 */
export interface YtDlpProgress {
  percent: string;
  downloaded_bytes?: number;
  total_bytes?: number;
  eta?: string;
  speed?: string;
}

/**
 * Request to start a playlist download
 */
export interface StartDownloadRequest {
  playlistId: string;
}

/**
 * Response when download is started
 */
export interface StartDownloadResponse {
  downloadId: string;
  message: string;
  statusUrl: string;
}

/**
 * Response for download status query
 */
export interface DownloadStatusResponse {
  success: boolean;
  data: DownloadStatus;
}
