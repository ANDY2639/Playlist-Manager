import archiver, { Archiver } from 'archiver';
import { promises as fs } from 'fs';
import * as path from 'path';
import dayjs from 'dayjs';
import { AppError } from '../utils/error-handler.js';
import { pathExists } from '../utils/file-system.utils.js';

/**
 * Service for generating ZIP archives from downloaded videos
 */
export class ZipService {
  /**
   * Generates a ZIP file stream from a playlist download directory
   * @param downloadId - The ID of the completed download
   * @param playlistTitle - The title of the playlist (used for filename)
   * @param downloadPath - The absolute path to the directory containing videos
   * @returns A stream of the ZIP archive
   * @throws AppError if directory doesn't exist or contains no video files
   */
  async createZipStream(
    downloadId: string,
    downloadPath: string
  ): Promise<Archiver> {
    // Validate that the directory exists
    const dirExists = await pathExists(downloadPath);
    if (!dirExists) {
      throw new AppError(
        `Download directory does not exist: ${downloadPath}`,
        500,
        'DIRECTORY_NOT_FOUND'
      );
    }

    // Read all files in the directory
    const allFiles = await fs.readdir(downloadPath);

    // Filter for video files (mp4, webm, mkv, avi, mov)
    const videoFiles = allFiles.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return ['.mp4', '.webm', '.mkv', '.avi', '.mov'].includes(ext);
    });

    // Validate that there are video files to zip
    if (videoFiles.length === 0) {
      throw new AppError(
        `No video files found in download directory: ${downloadPath}`,
        400,
        'NO_FILES_TO_ZIP'
      );
    }

    // Create archiver instance
    // Use 'store' method (no compression) for video files since they're already compressed
    const archive = archiver('zip', {
      store: true, // No compression, just packaging
      zlib: { level: 0 } // Compression level 0 (fastest, no compression)
    });

    // Handle archiver warnings
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn(`[ZipService] Warning during ZIP creation for ${downloadId}:`, err);
      } else {
        // Throw error for other warnings
        console.error(`[ZipService] Error during ZIP creation for ${downloadId}:`, err);
        throw err;
      }
    });

    // Handle archiver errors
    archive.on('error', (err) => {
      console.error(`[ZipService] Fatal error during ZIP creation for ${downloadId}:`, err);
      throw new AppError(
        `Failed to create ZIP archive: ${err.message}`,
        500,
        'ZIP_GENERATION_FAILED'
      );
    });

    // Add video files to the archive
    for (const videoFile of videoFiles) {
      const filePath = path.join(downloadPath, videoFile);

      // Add file with just its name (no subdirectories in ZIP)
      archive.file(filePath, { name: videoFile });
    }

    // Finalize the archive (trigger streaming)
    // This is async, but we don't await - the stream will handle it
    archive.finalize();

    console.log(
      `[ZipService] Created ZIP stream for download ${downloadId}: ${videoFiles.length} files`
    );

    return archive;
  }

  /**
   * Generates a sanitized filename for the ZIP archive
   * @param playlistTitle - The title of the playlist
   * @returns Sanitized filename in format: "Title_YYYY-MM-DD.zip"
   */
  generateZipFilename(playlistTitle: string): string {
    // Get current date in YYYY-MM-DD format
    const dateStr = dayjs().format('YYYY-MM-DD');

    // Sanitize the playlist title
    // Remove invalid characters for Windows: < > : " / \ | ? *
    // Also remove control characters and limit length
    let sanitized = playlistTitle
      .replace(/[<>:"\/\\|?*\x00-\x1F]/g, '_') // Replace invalid chars with underscore
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_+/g, '_') // Collapse multiple underscores
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores

    // Limit length to 200 characters to avoid filesystem issues
    if (sanitized.length > 200) {
      sanitized = sanitized.substring(0, 200);
    }

    // If sanitization resulted in empty string, use a default
    if (!sanitized) {
      sanitized = 'playlist';
    }

    // Format: "PlaylistTitle_2025-12-04.zip"
    return `${sanitized}_${dateStr}.zip`;
  }

  /**
   * Gets statistics about files in a directory
   * @param downloadPath - Path to the download directory
   * @returns Object with totalFiles and totalSize
   */
  async getDirectoryStats(downloadPath: string): Promise<{
    totalFiles: number;
    totalSize: number;
  }> {
    const dirExists = await pathExists(downloadPath);
    if (!dirExists) {
      return { totalFiles: 0, totalSize: 0 };
    }

    const allFiles = await fs.readdir(downloadPath);
    const videoFiles = allFiles.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return ['.mp4', '.webm', '.mkv', '.avi', '.mov'].includes(ext);
    });

    let totalSize = 0;
    for (const file of videoFiles) {
      const filePath = path.join(downloadPath, file);
      const stats = await fs.stat(filePath);
      totalSize += stats.size;
    }

    return {
      totalFiles: videoFiles.length,
      totalSize
    };
  }
}

// Export singleton instance
export const zipService = new ZipService();
