/**
 * Options for ZIP generation
 */
export interface ZipGenerationOptions {
  /**
   * Compression level (0-9)
   * For videos, we use 0 (store, no compression)
   */
  compressionLevel?: number;

  /**
   * Whether to include metadata file (info.json) in the ZIP
   * Future feature - could include playlist info, download date, etc.
   */
  includeMetadata?: boolean;
}

/**
 * Error information for ZIP generation failures
 */
export interface ZipError {
  downloadId: string;
  error: string;
  timestamp: Date;
}

/**
 * Statistics about ZIP archive contents
 */
export interface ZipStats {
  /**
   * Total number of video files in the ZIP
   */
  totalFiles: number;

  /**
   * Total size of all files in bytes (before compression)
   */
  totalSize: number;

  /**
   * Compressed size in bytes (if calculable)
   * For 'store' method, this will be similar to totalSize
   */
  compressedSize?: number;
}

/**
 * Response format for ZIP download endpoint
 */
export interface ZipDownloadResponse {
  /**
   * Success message
   */
  message: string;

  /**
   * Download ID
   */
  downloadId: string;

  /**
   * ZIP filename
   */
  filename: string;

  /**
   * Statistics about the ZIP contents
   */
  stats?: ZipStats;
}
