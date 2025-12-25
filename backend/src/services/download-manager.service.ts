/**
 * Download Manager Service
 * Orchestrates playlist downloads and tracks download status
 */

import { randomUUID } from 'crypto';
import type { OAuth2Client } from 'google-auth-library';
import { DownloadStatus, VideoDownloadResult } from '../types/download.types.ts';
import { YouTubeAPIService } from './youtube-api.service.ts';
import { DownloadService } from './download.service.ts';
import {
  generatePlaylistDownloadPath,
  ensureDownloadDirectory,
  cleanupDownloadDirectory,
  isDirectoryEmpty,
} from '../utils/file-system.utils.ts';
import { createError } from '../utils/error-handler.ts';

/**
 * Download Manager - Singleton service for orchestrating playlist downloads
 */
export class DownloadManagerService {
  private downloads: Map<string, DownloadStatus>;
  private downloadService: DownloadService;

  constructor() {
    this.downloads = new Map();
    this.downloadService = new DownloadService();
  }

  /**
   * Start downloading a playlist
   * @param playlistId - YouTube playlist ID
   * @param oauth2Client - Authenticated OAuth2 client for YouTube API access
   * @returns Download ID and initial status
   */
  async startPlaylistDownload(
    playlistId: string,
    oauth2Client: OAuth2Client
  ): Promise<{ downloadId: string; status: DownloadStatus }> {
    // Generate unique download ID
    const downloadId = randomUUID();

    // Fetch playlist information
    const youtubeService = new YouTubeAPIService(oauth2Client);
    const playlist = await youtubeService.getPlaylistById(playlistId);
    const playlistItems = await youtubeService.getPlaylistItems(playlistId);

    if (playlistItems.length === 0) {
      throw createError.badRequest('Playlist is empty - no videos to download');
    }

    // Generate download path
    const downloadPath = generatePlaylistDownloadPath(playlistId);
    await ensureDownloadDirectory(downloadPath);

    // Initialize download status
    const downloadStatus: DownloadStatus = {
      downloadId,
      playlistId,
      playlistTitle: playlist.title,
      status: 'initializing',
      totalVideos: playlistItems.length,
      completedVideos: 0,
      failedVideos: 0,
      skippedVideos: 0,
      currentVideoIndex: 0,
      videos: playlistItems.map((item) => ({
        videoId: item.videoId,
        videoTitle: item.title,
        status: 'pending',
        progress: 0,
      })),
      downloadPath,
      startedAt: new Date(),
    };

    // Store status
    this.downloads.set(downloadId, downloadStatus);

    // Start download process asynchronously (don't await)
    this.executePlaylistDownload(downloadId, playlistItems, downloadPath).catch((error) => {
      console.error(`Error in playlist download ${downloadId}:`, error);
      this.markDownloadFailed(downloadId, error.message);
    });

    return { downloadId, status: downloadStatus };
  }

  /**
   * Get download status by ID
   * @param downloadId - Unique download ID
   * @returns Current download status
   */
  getDownloadStatus(downloadId: string): DownloadStatus {
    const status = this.downloads.get(downloadId);

    if (!status) {
      throw createError.notFound('Download', downloadId);
    }

    return status;
  }

  /**
   * Get all active downloads
   * @returns Array of all download statuses
   */
  getAllDownloads(): DownloadStatus[] {
    return Array.from(this.downloads.values());
  }

  /**
   * Cancel a download
   * @param downloadId - Download ID to cancel
   */
  async cancelDownload(downloadId: string): Promise<void> {
    const status = this.downloads.get(downloadId);

    if (!status) {
      throw createError.notFound('Download', downloadId);
    }

    if (status.status === 'completed' || status.status === 'failed') {
      throw createError.badRequest('Cannot cancel a completed or failed download');
    }

    status.status = 'cancelled';
    status.completedAt = new Date();

    // Cleanup partial downloads
    if (await isDirectoryEmpty(status.downloadPath)) {
      await cleanupDownloadDirectory(status.downloadPath);
    }
  }

  /**
   * Remove download from tracking (cleanup)
   * @param downloadId - Download ID to remove
   */
  removeDownload(downloadId: string): void {
    this.downloads.delete(downloadId);
  }

  /**
   * Execute the playlist download process
   * Downloads videos sequentially with error resilience
   */
  private async executePlaylistDownload(
    downloadId: string,
    playlistItems: Array<{ videoId: string; title: string }>,
    downloadPath: string
  ): Promise<void> {
    const status = this.downloads.get(downloadId);
    if (!status) return;

    status.status = 'downloading';

    for (let i = 0; i < playlistItems.length; i++) {
      // Check if download was cancelled (get fresh status from map)
      const currentStatus = this.downloads.get(downloadId);
      if (currentStatus && currentStatus.status === 'cancelled') {
        break;
      }

      const item = playlistItems[i];
      status.currentVideoIndex = i;
      status.currentVideo = {
        videoId: item.videoId,
        videoTitle: item.title,
        status: 'downloading',
        progress: 0,
      };

      // Update video status in array
      status.videos[i].status = 'downloading';
      status.videos[i].startedAt = new Date();

      // Download video with progress tracking
      const result = await this.downloadService.downloadVideo(
        item.videoId,
        item.title,
        downloadPath,
        (progress) => {
          // Update progress in real-time
          if (status.currentVideo) {
            status.currentVideo.progress = progress;
          }
          status.videos[i].progress = progress;
        }
      );

      // Update video status based on result
      await this.updateVideoStatus(downloadId, i, result);

      // Small delay between downloads to avoid rate limiting
      await this.sleep(1000);
    }

    // Mark download as completed
    this.markDownloadCompleted(downloadId);
  }

  /**
   * Update video status after download attempt
   */
  private async updateVideoStatus(
    downloadId: string,
    videoIndex: number,
    result: VideoDownloadResult
  ): Promise<void> {
    const status = this.downloads.get(downloadId);
    if (!status) return;

    const video = status.videos[videoIndex];
    video.completedAt = new Date();

    if (result.success) {
      video.status = 'completed';
      video.progress = 100;
      video.filePath = result.filePath;
      video.fileSize = result.fileSize;
      status.completedVideos++;
    } else {
      video.status = 'failed';
      video.error = result.error;
      status.failedVideos++;
    }
  }

  /**
   * Mark download as completed
   */
  private markDownloadCompleted(downloadId: string): void {
    const status = this.downloads.get(downloadId);
    if (!status) return;

    status.status = 'completed';
    status.completedAt = new Date();
    status.currentVideo = undefined;

    console.log(
      `Download ${downloadId} completed: ${status.completedVideos}/${status.totalVideos} successful`
    );
  }

  /**
   * Mark download as failed
   */
  private markDownloadFailed(downloadId: string, errorMessage: string): void {
    const status = this.downloads.get(downloadId);
    if (!status) return;

    status.status = 'failed';
    status.error = errorMessage;
    status.completedAt = new Date();
    status.currentVideo = undefined;
  }

  /**
   * Sleep utility for delays between downloads
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
let downloadManagerInstance: DownloadManagerService | null = null;

/**
 * Get or create DownloadManagerService singleton instance
 */
export function getDownloadManagerService(): DownloadManagerService {
  if (!downloadManagerInstance) {
    downloadManagerInstance = new DownloadManagerService();
  }
  return downloadManagerInstance;
}
