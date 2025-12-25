import * as v from 'valibot';

/**
 * Schema for creating a new playlist
 */
export const CreatePlaylistSchema = v.object({
  title: v.string([
    v.minLength(1, 'Title is required'),
    v.maxLength(150, 'Title must be less than 150 characters'),
  ]),
  description: v.optional(
    v.string([v.maxLength(5000, 'Description must be less than 5000 characters')]),
    ''
  ),
  privacyStatus: v.picklist(['public', 'private', 'unlisted'], 'Invalid privacy setting'),
});

export type CreatePlaylistInput = v.Input<typeof CreatePlaylistSchema>;
export type CreatePlaylistOutput = v.Output<typeof CreatePlaylistSchema>;

/**
 * Schema for updating an existing playlist
 */
export const UpdatePlaylistSchema = v.object({
  title: v.optional(
    v.string([
      v.minLength(1, 'Title cannot be empty'),
      v.maxLength(150, 'Title must be less than 150 characters'),
    ])
  ),
  description: v.optional(
    v.string([v.maxLength(5000, 'Description must be less than 5000 characters')])
  ),
  privacyStatus: v.optional(
    v.picklist(['public', 'private', 'unlisted'], 'Invalid privacy setting')
  ),
});

export type UpdatePlaylistInput = v.Input<typeof UpdatePlaylistSchema>;
export type UpdatePlaylistOutput = v.Output<typeof UpdatePlaylistSchema>;

/**
 * Schema for adding a video to a playlist
 */
export const AddVideoSchema = v.object({
  videoId: v.string([v.minLength(1, 'Video ID or URL is required')]),
  position: v.optional(v.number([v.integer(), v.minValue(0)])),
});

export type AddVideoInput = v.Input<typeof AddVideoSchema>;
export type AddVideoOutput = v.Output<typeof AddVideoSchema>;

/**
 * Schema for reordering a video in a playlist
 */
export const ReorderVideoSchema = v.object({
  position: v.number([v.integer(), v.minValue(0)]),
});

export type ReorderVideoInput = v.Input<typeof ReorderVideoSchema>;
export type ReorderVideoOutput = v.Output<typeof ReorderVideoSchema>;
