/**
 * Type definitions for YouTube Playlist API
 * Based on YouTube Data API v3 response structures
 */

/**
 * YouTube API Thumbnail structure
 */
export interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface YouTubeThumbnails {
  default?: YouTubeThumbnail;
  medium?: YouTubeThumbnail;
  high?: YouTubeThumbnail;
  standard?: YouTubeThumbnail;
  maxres?: YouTubeThumbnail;
}

/**
 * YouTube API Playlist response structure
 */
export interface YouTubePlaylist {
  kind: 'youtube#playlist';
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: YouTubeThumbnails;
    channelTitle: string;
    tags?: string[];
    defaultLanguage?: string;
    localized?: {
      title: string;
      description: string;
    };
  };
  status?: {
    privacyStatus: 'private' | 'public' | 'unlisted';
  };
  contentDetails?: {
    itemCount: number;
  };
  player?: {
    embedHtml: string;
  };
  localizations?: Record<string, { title: string; description: string }>;
}

/**
 * YouTube API PlaylistItem response structure
 */
export interface YouTubePlaylistItem {
  kind: 'youtube#playlistItem';
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: YouTubeThumbnails;
    channelTitle: string;
    playlistId: string;
    position: number;
    resourceId: {
      kind: string;
      videoId: string;
    };
    videoOwnerChannelTitle?: string;
    videoOwnerChannelId?: string;
  };
  contentDetails?: {
    videoId: string;
    startAt?: string;
    endAt?: string;
    note?: string;
    videoPublishedAt: string;
  };
  status?: {
    privacyStatus: 'private' | 'public' | 'unlisted';
  };
}

/**
 * YouTube API error structure
 */
export interface YouTubeAPIError {
  code: number;
  message: string;
  errors: Array<{
    message: string;
    domain: string;
    reason: string;
    location?: string;
    locationType?: string;
  }>;
  status?: string;
}

/**
 * Simplified Playlist DTO for frontend consumption
 */
export interface PlaylistDTO {
  id: string;
  title: string;
  description: string;
  privacyStatus: 'private' | 'public' | 'unlisted';
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
  privacyStatus?: 'private' | 'public' | 'unlisted';
}

export interface UpdatePlaylistRequest {
  title?: string;
  description?: string;
  privacyStatus?: 'private' | 'public' | 'unlisted';
}

export interface AddVideoRequest {
  videoId: string;
  position?: number;
}

export interface ReorderItemRequest {
  position: number;
}

/**
 * Privacy status type
 */
export type PrivacyStatus = 'private' | 'public' | 'unlisted';
