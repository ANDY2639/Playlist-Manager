/**
 * Download Service
 * Handles individual video downloads using yt-dlp
 */

import { YtDlp } from 'ytdlp-nodejs';
import path from 'path';
import { promises as fs, accessSync, constants } from 'fs';
import { execSync } from 'child_process';
import {
  VideoDownloadResult,
  DownloadConfig,
  VideoDownloadInfo,
} from '../types/download.types.js';
import { createError } from '../utils/error-handler.js';
import { getFileSize } from '../utils/file-system.utils.js';

/**
 * Default download configuration
 */
const DEFAULT_CONFIG: DownloadConfig = {
  format: 'best[height<=720]', // Max 720p resolution
  outputTemplate: '%(id)s_%(title)s.%(ext)s',
  maxRetries: 3,
  timeout: 300000, // 5 minutes per video
};

/**
 * Service for downloading individual YouTube videos
 */
export class DownloadService {
  private ytDlp: YtDlp;
  private config: DownloadConfig;

  constructor(config: Partial<DownloadConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Find yt-dlp binary
    const binaryPath = this.findYtDlpBinary();

    // Initialize yt-dlp wrapper with found binary path
    try {
      this.ytDlp = binaryPath
        ? new YtDlp({ binaryPath })
        : new YtDlp();

      console.log(`yt-dlp initialized${binaryPath ? ` with binary at: ${binaryPath}` : ''}`);
    } catch (error) {
      console.error('Failed to initialize yt-dlp:', error);
      throw createError.downloadFailed(
        'Failed to initialize yt-dlp. Please ensure yt-dlp is installed.',
        { originalError: error }
      );
    }
  }

  /**
   * Find yt-dlp binary in common installation locations
   */
  private findYtDlpBinary(): string | undefined {
    // Try to find via 'which' command first
    try {
      const result = execSync('which yt-dlp 2>/dev/null', { encoding: 'utf8' }).trim();
      if (result) {
        console.log(`Found yt-dlp via 'which': ${result}`);
        return result;
      }
    } catch {
      // 'which' command failed, continue to check paths
    }

    // Common installation paths
    const possiblePaths = [
      '/usr/local/bin/yt-dlp',
      '/usr/bin/yt-dlp',
      `${process.env.HOME}/.local/bin/yt-dlp`,
      '/opt/render/.local/bin/yt-dlp',
    ];

    for (const binaryPath of possiblePaths) {
      try {
        accessSync(binaryPath, constants.X_OK);
        console.log(`Found yt-dlp at: ${binaryPath}`);
        return binaryPath;
      } catch {
        // Path doesn't exist or isn't executable
      }
    }

    console.warn('yt-dlp binary not found in common locations, using default behavior');
    return undefined;
  }

  /**
   * Download a single video
   * @param videoId - YouTube video ID
   * @param videoTitle - Video title for error messages
   * @param outputPath - Directory where video should be saved
   * @param onProgress - Optional progress callback
   * @returns Download result with file information
   */
  async downloadVideo(
    videoId: string,
    videoTitle: string,
    outputPath: string,
    onProgress?: (progress: number, info: Partial<VideoDownloadInfo>) => void
  ): Promise<VideoDownloadResult> {
    const startTime = Date.now();
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    try {
      // Prepare output path with template
      const outputTemplate = path.join(outputPath, this.config.outputTemplate);

      // Download video using downloadAsync with proper options
      await this.ytDlp.downloadAsync(videoUrl, {
        format: this.config.format,
        output: outputTemplate,
        noPlaylist: true,
        onProgress: (progressData: any) => {
          // Parse progress percentage from ytdlp-nodejs progress data
          const progress = this.parseProgressFromData(progressData);

          if (progress !== null && onProgress) {
            onProgress(progress, {
              videoId,
              videoTitle,
              status: 'downloading',
              progress,
            });
          }
        },
      });

      // Find the downloaded file
      const filePath = await this.findDownloadedFile(outputPath, videoId);
      const fileSize = await getFileSize(filePath);
      const duration = Date.now() - startTime;

      return {
        success: true,
        videoId,
        videoTitle,
        filePath,
        fileSize,
        duration,
      };
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = this.parseDownloadError(error);

      return {
        success: false,
        videoId,
        videoTitle,
        error: errorMessage,
        duration,
      };
    }
  }

  /**
   * Parse progress percentage from ytdlp-nodejs progress data
   * @param progressData - Progress data from ytdlp-nodejs onProgress callback
   * @returns Progress percentage (0-100) or null if not parseable
   */
  private parseProgressFromData(progressData: any): number | null {
    try {
      // ytdlp-nodejs progress data can come in different formats
      // Try to extract percentage from the data

      // If it's a string, parse it like before
      if (typeof progressData === 'string') {
        const match = progressData.match(/(\d+\.?\d*)%/);
        if (match && match[1]) {
          return Math.min(100, Math.max(0, parseFloat(match[1])));
        }
      }

      // If it's an object with a percent field
      if (progressData && typeof progressData === 'object') {
        if (progressData.percent !== undefined) {
          return Math.min(100, Math.max(0, parseFloat(progressData.percent)));
        }

        // Try to calculate from downloaded/total bytes
        if (progressData.downloaded !== undefined && progressData.total !== undefined) {
          const percent = (progressData.downloaded / progressData.total) * 100;
          return Math.min(100, Math.max(0, percent));
        }
      }

      return null;
    } catch (error) {
      console.error('Error parsing progress data:', error);
      return null;
    }
  }

  /**
   * Find the downloaded file in the output directory
   * @param outputPath - Directory where file was downloaded
   * @param videoId - Video ID to search for
   * @returns Full path to downloaded file
   */
  private async findDownloadedFile(outputPath: string, videoId: string): Promise<string> {
    const files = await fs.readdir(outputPath);

    // Find file that starts with videoId
    const videoFile = files.find((file) => file.startsWith(videoId));

    if (!videoFile) {
      throw createError.internal(`Downloaded file not found for video ${videoId}`);
    }

    return path.join(outputPath, videoFile);
  }

  /**
   * Parse and categorize download errors
   * @param error - Error from download attempt
   * @returns User-friendly error message
   */
  private parseDownloadError(error: unknown): string {
    if (!(error instanceof Error)) {
      return 'Unknown download error';
    }

    const errorMsg = error.message.toLowerCase();

    // Video unavailable/deleted
    if (
      errorMsg.includes('video unavailable') ||
      errorMsg.includes('video has been removed') ||
      errorMsg.includes('private video')
    ) {
      return 'Video is unavailable, private, or deleted';
    }

    // Copyright/blocked
    if (
      errorMsg.includes('copyright') ||
      errorMsg.includes('blocked') ||
      errorMsg.includes('not available in your country')
    ) {
      return 'Video is blocked or restricted';
    }

    // Network errors
    if (errorMsg.includes('timeout') || errorMsg.includes('network') || errorMsg.includes('connection')) {
      return 'Network error during download';
    }

    // Age-restricted
    if (errorMsg.includes('age')) {
      return 'Video is age-restricted';
    }

    // Generic error with original message
    return `Download failed: ${error.message}`;
  }

  /**
   * Validate video URL is accessible before attempting download
   * @param videoId - YouTube video ID
   * @returns True if video is accessible
   */
  async validateVideoAccess(videoId: string): Promise<boolean> {
    try {
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const info = await this.ytDlp.getInfoAsync(videoUrl);

      // Check if we got valid video info
      if (!info) {
        return false;
      }

      // If it's a playlist info, it's not a single video
      if (info._type === 'playlist') {
        return false;
      }

      // If it's a video, check it has essential properties
      if (info._type === 'video') {
        return !!info.id;
      }

      // If _type is not specified but we have an id, assume it's valid
      return !!(info as any).id;
    } catch (error) {
      console.error(`Failed to validate video ${videoId}:`, error);
      return false;
    }
  }
}
