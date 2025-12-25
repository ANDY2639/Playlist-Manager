/**
 * Error handling utilities for the application
 */

import { YouTubeAPIError as YouTubeAPIErrorType } from '../types/playlist.types';

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(message: string, statusCode: number, code: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);

    // Set the prototype explicitly
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * YouTube API specific error class
 */
export class YouTubeAPIError extends AppError {
  public readonly originalError: any;

  constructor(message: string, statusCode: number, code: string, originalError: any, details?: any) {
    super(message, statusCode, code, details);
    this.originalError = originalError;

    Object.setPrototypeOf(this, YouTubeAPIError.prototype);
  }
}

/**
 * Error codes for common application errors
 */
export const ErrorCodes = {
  // Client errors (4xx)
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',

  // YouTube API specific errors
  YOUTUBE_QUOTA_EXCEEDED: 'YOUTUBE_QUOTA_EXCEEDED',
  YOUTUBE_FORBIDDEN: 'YOUTUBE_FORBIDDEN',
  YOUTUBE_NOT_FOUND: 'YOUTUBE_NOT_FOUND',
  YOUTUBE_BAD_REQUEST: 'YOUTUBE_BAD_REQUEST',
  YOUTUBE_UNAUTHORIZED: 'YOUTUBE_UNAUTHORIZED',

  // Download specific errors
  DOWNLOAD_FAILED: 'DOWNLOAD_FAILED',
  VIDEO_UNAVAILABLE: 'VIDEO_UNAVAILABLE',
  DOWNLOAD_TIMEOUT: 'DOWNLOAD_TIMEOUT',
  DOWNLOAD_NOT_FOUND: 'DOWNLOAD_NOT_FOUND',

  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

/**
 * Parse and convert YouTube API errors to AppError
 */
export function handleYouTubeAPIError(error: any): AppError {
  // Check if error has response data from YouTube API
  if (error.response?.data?.error) {
    const youtubeError: YouTubeAPIErrorType = error.response.data.error;
    const statusCode = youtubeError.code || error.response.status || 500;
    const errorReason = youtubeError.errors?.[0]?.reason || 'unknown';

    // Map YouTube error reasons to specific error codes and messages
    switch (statusCode) {
      case 400:
        return new YouTubeAPIError(
          youtubeError.message || 'Invalid request to YouTube API',
          400,
          ErrorCodes.YOUTUBE_BAD_REQUEST,
          error,
          { reason: errorReason, errors: youtubeError.errors }
        );

      case 401:
        return new YouTubeAPIError(
          'YouTube API authentication failed. Please re-authenticate.',
          401,
          ErrorCodes.YOUTUBE_UNAUTHORIZED,
          error,
          { reason: errorReason }
        );

      case 403:
        // Check specific forbidden reasons
        if (errorReason === 'quotaExceeded' || errorReason === 'dailyLimitExceeded') {
          return new YouTubeAPIError(
            'YouTube API quota exceeded. Please try again later.',
            403,
            ErrorCodes.YOUTUBE_QUOTA_EXCEEDED,
            error,
            { reason: errorReason }
          );
        }

        if (errorReason === 'forbidden' || errorReason === 'insufficientPermissions') {
          return new YouTubeAPIError(
            'Insufficient permissions to perform this operation on YouTube.',
            403,
            ErrorCodes.YOUTUBE_FORBIDDEN,
            error,
            { reason: errorReason }
          );
        }

        return new YouTubeAPIError(
          youtubeError.message || 'Access forbidden by YouTube API',
          403,
          ErrorCodes.YOUTUBE_FORBIDDEN,
          error,
          { reason: errorReason, errors: youtubeError.errors }
        );

      case 404:
        return new YouTubeAPIError(
          'The requested YouTube resource was not found',
          404,
          ErrorCodes.YOUTUBE_NOT_FOUND,
          error,
          { reason: errorReason }
        );

      default:
        return new YouTubeAPIError(
          youtubeError.message || 'YouTube API error occurred',
          statusCode,
          ErrorCodes.INTERNAL_ERROR,
          error,
          { reason: errorReason, errors: youtubeError.errors }
        );
    }
  }

  // Handle network errors or other non-YouTube API errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return new AppError(
      'Unable to connect to YouTube API. Please check your internet connection.',
      503,
      ErrorCodes.SERVICE_UNAVAILABLE,
      { originalCode: error.code }
    );
  }

  // Generic error fallback
  return new AppError(
    error.message || 'An unexpected error occurred',
    error.statusCode || 500,
    ErrorCodes.INTERNAL_ERROR,
    { originalError: error.message }
  );
}

/**
 * Format error response for consistent API responses
 */
export function formatErrorResponse(error: Error | AppError) {
  if (error instanceof AppError) {
    return {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        ...(error.details && { details: error.details }),
      },
    };
  }

  // Fallback for non-AppError errors
  return {
    error: {
      message: error.message || 'Internal server error',
      code: ErrorCodes.INTERNAL_ERROR,
      statusCode: 500,
    },
  };
}

/**
 * Check if error is operational (expected) or programming error
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Common error factory functions
 */
export const createError = {
  badRequest: (message: string, details?: any) =>
    new AppError(message, 400, ErrorCodes.BAD_REQUEST, details),

  unauthorized: (message: string = 'Unauthorized access') =>
    new AppError(message, 401, ErrorCodes.UNAUTHORIZED),

  notAuthenticated: (message: string = 'You must be authenticated to access this resource') =>
    new AppError(message, 401, ErrorCodes.NOT_AUTHENTICATED),

  forbidden: (message: string = 'Access forbidden') =>
    new AppError(message, 403, ErrorCodes.FORBIDDEN),

  notFound: (resource: string, id?: string) =>
    new AppError(
      id ? `${resource} with id '${id}' not found` : `${resource} not found`,
      404,
      ErrorCodes.NOT_FOUND
    ),

  conflict: (message: string) =>
    new AppError(message, 409, ErrorCodes.CONFLICT),

  internal: (message: string = 'Internal server error', details?: any) =>
    new AppError(message, 500, ErrorCodes.INTERNAL_ERROR, details),

  downloadFailed: (message: string, details?: any) =>
    new AppError(message, 500, ErrorCodes.DOWNLOAD_FAILED, details),

  videoUnavailable: (videoId: string) =>
    new AppError(
      `Video ${videoId} is unavailable, private, or deleted`,
      404,
      ErrorCodes.VIDEO_UNAVAILABLE,
      { videoId }
    ),
};
