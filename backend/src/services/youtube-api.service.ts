/**
 * YouTube API Service
 * Wrapper for YouTube Data API v3 operations
 */

import { google, youtube_v3 } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import {
  YouTubePlaylist,
  YouTubePlaylistItem,
  YouTubeThumbnails,
  PlaylistDTO,
  PlaylistItemDTO,
  PrivacyStatus,
} from '../types/playlist.types';
import { handleYouTubeAPIError, createError } from '../utils/error-handler';

export class YouTubeAPIService {
  private youtube: youtube_v3.Youtube;

  constructor(oauth2Client: OAuth2Client) {
    this.youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    });
  }

  /**
   * Get all playlists for the authenticated user
   */
  async getUserPlaylists(): Promise<PlaylistDTO[]> {
    try {
      const playlists: PlaylistDTO[] = [];
      let nextPageToken: string | undefined;

      do {
        const response = await this.youtube.playlists.list({
          part: ['snippet', 'status', 'contentDetails'],
          mine: true,
          maxResults: 50,
          pageToken: nextPageToken,
        });

        if (response.data.items) {
          for (const item of response.data.items) {
            playlists.push(this.transformPlaylistToDTO(item as any));
          }
        }

        nextPageToken = response.data.nextPageToken || undefined;
      } while (nextPageToken);

      return playlists;
    } catch (error) {
      throw handleYouTubeAPIError(error);
    }
  }

  /**
   * Create a new playlist
   */
  async createPlaylist(
    title: string,
    description: string = '',
    privacyStatus: PrivacyStatus = 'private'
  ): Promise<PlaylistDTO> {
    try {
      const response = await this.youtube.playlists.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title,
            description,
          },
          status: {
            privacyStatus,
          },
        },
      });

      if (!response.data) {
        throw createError.internal('Failed to create playlist - no response data');
      }

      return this.transformPlaylistToDTO(response.data as any);
    } catch (error) {
      throw handleYouTubeAPIError(error);
    }
  }

  /**
   * Get a specific playlist by ID
   */
  async getPlaylistById(playlistId: string): Promise<PlaylistDTO> {
    try {
      const response = await this.youtube.playlists.list({
        part: ['snippet', 'status', 'contentDetails'],
        id: [playlistId],
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw createError.notFound('Playlist', playlistId);
      }

      return this.transformPlaylistToDTO(response.data.items[0] as any);
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw error;
      }
      throw handleYouTubeAPIError(error);
    }
  }

  /**
   * Update an existing playlist
   */
  async updatePlaylist(
    playlistId: string,
    updates: {
      title?: string;
      description?: string;
      privacyStatus?: PrivacyStatus;
    }
  ): Promise<PlaylistDTO> {
    try {
      // First, get the current playlist to merge updates
      const currentPlaylist = await this.getPlaylistById(playlistId);

      const response = await this.youtube.playlists.update({
        part: ['snippet', 'status'],
        requestBody: {
          id: playlistId,
          snippet: {
            title: updates.title ?? currentPlaylist.title,
            description: updates.description ?? currentPlaylist.description,
          },
          status: {
            privacyStatus: updates.privacyStatus ?? currentPlaylist.privacyStatus,
          },
        },
      });

      if (!response.data) {
        throw createError.internal('Failed to update playlist - no response data');
      }

      return this.transformPlaylistToDTO(response.data as any);
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw error;
      }
      throw handleYouTubeAPIError(error);
    }
  }

  /**
   * Delete a playlist
   */
  async deletePlaylist(playlistId: string): Promise<void> {
    try {
      await this.youtube.playlists.delete({
        id: playlistId,
      });
    } catch (error) {
      throw handleYouTubeAPIError(error);
    }
  }

  /**
   * Get all videos in a playlist
   */
  async getPlaylistItems(playlistId: string): Promise<PlaylistItemDTO[]> {
    try {
      const items: PlaylistItemDTO[] = [];
      let nextPageToken: string | undefined;

      do {
        const response = await this.youtube.playlistItems.list({
          part: ['snippet', 'contentDetails'],
          playlistId: playlistId,
          maxResults: 50,
          pageToken: nextPageToken,
        });

        if (response.data.items) {
          for (const item of response.data.items) {
            items.push(this.transformPlaylistItemToDTO(item as any));
          }
        }

        nextPageToken = response.data.nextPageToken || undefined;
      } while (nextPageToken);

      return items;
    } catch (error) {
      throw handleYouTubeAPIError(error);
    }
  }

  /**
   * Add a video to a playlist
   */
  async addVideoToPlaylist(
    playlistId: string,
    videoId: string,
    position?: number
  ): Promise<PlaylistItemDTO> {
    try {
      const requestBody: any = {
        snippet: {
          playlistId,
          resourceId: {
            kind: 'youtube#video',
            videoId,
          },
        },
      };

      // Add position if specified
      if (position !== undefined) {
        requestBody.snippet.position = position;
      }

      const response = await this.youtube.playlistItems.insert({
        part: ['snippet', 'contentDetails'],
        requestBody,
      });

      if (!response.data) {
        throw createError.internal('Failed to add video to playlist - no response data');
      }

      return this.transformPlaylistItemToDTO(response.data as any);
    } catch (error) {
      throw handleYouTubeAPIError(error);
    }
  }

  /**
   * Remove a video from a playlist
   */
  async removeVideoFromPlaylist(playlistItemId: string): Promise<void> {
    try {
      await this.youtube.playlistItems.delete({
        id: playlistItemId,
      });
    } catch (error) {
      throw handleYouTubeAPIError(error);
    }
  }

  /**
   * Reorder a video in a playlist
   * Note: YouTube API requires full snippet including resourceId for updates
   */
  async reorderPlaylistItem(
    playlistItemId: string,
    playlistId: string,
    videoId: string,
    position: number
  ): Promise<PlaylistItemDTO> {
    try {
      const response = await this.youtube.playlistItems.update({
        part: ['snippet'],
        requestBody: {
          id: playlistItemId,
          snippet: {
            playlistId,
            position,
            resourceId: {
              kind: 'youtube#video',
              videoId,
            },
          },
        },
      });

      if (!response.data) {
        throw createError.internal('Failed to reorder playlist item - no response data');
      }

      return this.transformPlaylistItemToDTO(response.data as any);
    } catch (error) {
      throw handleYouTubeAPIError(error);
    }
  }

  /**
   * Transform YouTube API Playlist response to simplified DTO
   */
  private transformPlaylistToDTO(playlist: YouTubePlaylist): PlaylistDTO {
    return {
      id: playlist.id,
      title: playlist.snippet.title,
      description: playlist.snippet.description,
      privacyStatus: playlist.status?.privacyStatus || 'private',
      itemCount: playlist.contentDetails?.itemCount || 0,
      thumbnailUrl: this.getBestThumbnail(playlist.snippet.thumbnails),
      publishedAt: playlist.snippet.publishedAt,
      channelId: playlist.snippet.channelId,
      channelTitle: playlist.snippet.channelTitle,
    };
  }

  /**
   * Transform YouTube API PlaylistItem response to simplified DTO
   */
  private transformPlaylistItemToDTO(item: YouTubePlaylistItem): PlaylistItemDTO {
    return {
      id: item.id,
      videoId: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      position: item.snippet.position,
      thumbnailUrl: this.getBestThumbnail(item.snippet.thumbnails),
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      videoPublishedAt: item.contentDetails?.videoPublishedAt,
    };
  }

  /**
   * Get the best available thumbnail URL
   * Priority: maxres > standard > high > medium > default
   */
  private getBestThumbnail(thumbnails: YouTubeThumbnails | undefined): string | undefined {
    if (!thumbnails) return undefined;

    if (thumbnails.maxres) return thumbnails.maxres.url;
    if (thumbnails.standard) return thumbnails.standard.url;
    if (thumbnails.high) return thumbnails.high.url;
    if (thumbnails.medium) return thumbnails.medium.url;
    if (thumbnails.default) return thumbnails.default.url;

    return undefined;
  }
}
