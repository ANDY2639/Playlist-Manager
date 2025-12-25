/**
 * Frontend download types matching backend DTOs
 * Backend source: backend/src/types/download.types.ts
 */

/**
 * Status of an individual video download
 */
export type VideoDownloadStatus =
  | 'pending'
  | 'downloading'
  | 'completed'
  | 'failed'
  | 'skipped';

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
  startedAt?: string; // ISO date string
  completedAt?: string; // ISO date string
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
  startedAt: string; // ISO date string
  completedAt?: string; // ISO date string
  error?: string;
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
