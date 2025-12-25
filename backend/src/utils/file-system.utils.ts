/**
 * File system utilities for download management
 */

import { promises as fs } from 'fs';
import path from 'path';
import dayjs from 'dayjs';
import { createError } from './error-handler.js';

/**
 * Check if a file or directory exists
 * @param filePath - Path to check
 * @returns True if exists, false otherwise
 */
export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the base download directory from environment or default
 */
export function getDownloadBasePath(): string {
  return process.env.DOWNLOAD_PATH || path.join(process.cwd(), 'downloads');
}

/**
 * Generate date-organized folder path (YYYY-MM-DD format)
 * @returns Absolute path to today's download folder
 */
export function generateDateFolderPath(): string {
  const basePath = getDownloadBasePath();
  const dateFolder = dayjs().format('YYYY-MM-DD');
  return path.join(basePath, dateFolder);
}

/**
 * Generate full path for a specific playlist download
 * @param playlistId - YouTube playlist ID
 * @returns Absolute path to playlist download folder
 */
export function generatePlaylistDownloadPath(playlistId: string): string {
  const dateFolder = generateDateFolderPath();
  return path.join(dateFolder, sanitizePlaylistId(playlistId));
}

/**
 * Sanitize playlist ID for use as folder name
 * Removes or replaces characters that are invalid in folder names
 */
function sanitizePlaylistId(playlistId: string): string {
  return playlistId.replace(/[<>:"/\\|?*]/g, '_');
}

/**
 * Ensure download directory exists, create if not
 * @param dirPath - Directory path to ensure exists
 */
export async function ensureDownloadDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw createError.internal(`Failed to create download directory: ${message}`, { dirPath });
  }
}

/**
 * Clean up a download directory (for failed downloads)
 * @param dirPath - Directory path to remove
 */
export async function cleanupDownloadDirectory(dirPath: string): Promise<void> {
  try {
    const exists = await pathExists(dirPath);
    if (exists) {
      await fs.rm(dirPath, { recursive: true, force: true });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to cleanup directory ${dirPath}:`, message);
    // Don't throw - cleanup failures shouldn't block the operation
  }
}

/**
 * Get file size in bytes
 * @param filePath - Path to file
 * @returns File size in bytes, or undefined if file doesn't exist
 */
export async function getFileSize(filePath: string): Promise<number | undefined> {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    return undefined;
  }
}

/**
 * Check if directory is empty
 * @param dirPath - Directory path to check
 * @returns True if directory is empty or doesn't exist
 */
export async function isDirectoryEmpty(dirPath: string): Promise<boolean> {
  try {
    const exists = await pathExists(dirPath);
    if (!exists) return true;

    const files = await fs.readdir(dirPath);
    return files.length === 0;
  } catch (error) {
    return true;
  }
}

/**
 * Generate output filename template for yt-dlp
 * @param downloadPath - Base download path
 * @returns Output template string for yt-dlp
 */
export function generateOutputTemplate(downloadPath: string): string {
  // Template: %(id)s_%(title)s.%(ext)s
  // Results in: videoId_VideoTitle.mp4
  return path.join(downloadPath, '%(id)s_%(title)s.%(ext)s');
}
