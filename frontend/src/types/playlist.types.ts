/**
 * Frontend playlist types matching backend DTOs
 * Backend source: backend/src/types/playlist.types.ts
 */

/**
 * Privacy status type
 */
export type PrivacyStatus = 'private' | 'public' | 'unlisted';

/**
 * YouTube Thumbnail structure
 */
export interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

/**
 * Simplified Playlist DTO for frontend consumption
 */
export interface PlaylistDTO {
  id: string;
  title: string;
  description: string;
  privacyStatus: PrivacyStatus;
  itemCount: number;
  thumbnailUrl?: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
}

/**
 * Simplified PlaylistItem DTO for frontend consumption
 */
export interface PlaylistItemDTO {
  id: string;
  videoId: string;
  title: string;
  description: string;
  position: number;
  thumbnailUrl?: string;
  channelTitle: string;
  publishedAt: string;
  videoPublishedAt?: string;
}

/**
 * Request types for creating/updating playlists
 */
export interface CreatePlaylistRequest {
  title: string;
  description?: string;
  privacyStatus?: PrivacyStatus;
}

export interface UpdatePlaylistRequest {
  title?: string;
  description?: string;
  privacyStatus?: PrivacyStatus;
}

export interface AddVideoRequest {
  videoId: string;
  position?: number;
}

export interface ReorderItemRequest {
  position: number;
}
