/**
 * Validation schemas for playlist operations using Valibot
 */

import * as v from 'valibot';

/**
 * Schema for creating a new playlist
 */
export const CreatePlaylistSchema = v.object({
  title: v.pipe(
    v.string('Title must be a string'),
    v.minLength(1, 'Title is required and cannot be empty'),
    v.maxLength(150, 'Title must be 150 characters or less')
  ),
  description: v.optional(
    v.pipe(
      v.string('Description must be a string'),
      v.maxLength(5000, 'Description must be 5000 characters or less')
    ),
    ''
  ),
  privacyStatus: v.optional(
    v.picklist(['private', 'public', 'unlisted'], 'Privacy status must be one of: private, public, unlisted'),
    'private'
  ),
});

/**
 * Schema for updating an existing playlist
 */
export const UpdatePlaylistSchema = v.object({
  title: v.optional(
    v.pipe(
      v.string('Title must be a string'),
      v.minLength(1, 'Title cannot be empty if provided'),
      v.maxLength(150, 'Title must be 150 characters or less')
    )
  ),
  description: v.optional(
    v.pipe(
      v.string('Description must be a string'),
      v.maxLength(5000, 'Description must be 5000 characters or less')
    )
  ),
  privacyStatus: v.optional(
    v.picklist(['private', 'public', 'unlisted'], 'Privacy status must be one of: private, public, unlisted')
  ),
});

/**
 * Schema for adding a video to a playlist
 */
export const AddVideoSchema = v.object({
  videoId: v.pipe(
    v.string('Video ID must be a string'),
    v.minLength(11, 'Invalid YouTube video ID - must be exactly 11 characters'),
    v.maxLength(11, 'Invalid YouTube video ID - must be exactly 11 characters'),
    v.regex(/^[a-zA-Z0-9_-]+$/, 'Invalid YouTube video ID format')
  ),
  position: v.optional(
    v.pipe(
      v.number('Position must be a number'),
      v.integer('Position must be an integer'),
      v.minValue(0, 'Position must be 0 or greater')
    )
  ),
});

/**
 * Schema for reordering a playlist item
 */
export const ReorderItemSchema = v.object({
  position: v.pipe(
    v.number('Position must be a number'),
    v.integer('Position must be an integer'),
    v.minValue(0, 'Position must be 0 or greater')
  ),
});

/**
 * Schema for validating playlist ID in route parameters
 */
export const PlaylistIdSchema = v.pipe(
  v.string('Playlist ID must be a string'),
  v.minLength(1, 'Playlist ID is required'),
  v.maxLength(100, 'Invalid playlist ID length')
);

/**
 * Schema for validating playlist item ID in route parameters
 */
export const PlaylistItemIdSchema = v.pipe(
  v.string('Playlist item ID must be a string'),
  v.minLength(1, 'Playlist item ID is required'),
  v.maxLength(100, 'Invalid playlist item ID length')
);

/**
 * Type exports for TypeScript inference
 */
export type CreatePlaylistInput = v.InferInput<typeof CreatePlaylistSchema>;
export type CreatePlaylistOutput = v.InferOutput<typeof CreatePlaylistSchema>;

export type UpdatePlaylistInput = v.InferInput<typeof UpdatePlaylistSchema>;
export type UpdatePlaylistOutput = v.InferOutput<typeof UpdatePlaylistSchema>;

export type AddVideoInput = v.InferInput<typeof AddVideoSchema>;
export type AddVideoOutput = v.InferOutput<typeof AddVideoSchema>;

export type ReorderItemInput = v.InferInput<typeof ReorderItemSchema>;
export type ReorderItemOutput = v.InferOutput<typeof ReorderItemSchema>;
