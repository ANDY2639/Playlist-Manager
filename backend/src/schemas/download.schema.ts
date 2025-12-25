/**
 * Validation schemas for download operations using Valibot
 */

import * as v from 'valibot';

export const DownloadUuidSchema = v.pipe(
  v.string('Download ID must be a string'),
  v.uuid('Download ID must be a valid UUID')
);

/**
 * Schema for starting a playlist download
 */
export const StartDownloadSchema = v.object({
  playlistId: v.pipe(
    v.string('Playlist ID must be a string'),
    v.minLength(1, 'Playlist ID is required'),
    v.maxLength(100, 'Invalid playlist ID length')
  ),
});

/**
 * Schema for download ID in route parameters
 */
export const DownloadIdSchema = DownloadUuidSchema;

/**
 * Schema for ZIP download params
 */
export const ZipDownloadParamsSchema = v.object({
  downloadId: DownloadUuidSchema,
});

/**
 * Type exports for TypeScript inference
 */
export type StartDownloadInput = v.InferInput<typeof StartDownloadSchema>;
export type StartDownloadOutput = v.InferOutput<typeof StartDownloadSchema>;
export type ZipDownloadParams = v.InferOutput<typeof ZipDownloadParamsSchema>;
