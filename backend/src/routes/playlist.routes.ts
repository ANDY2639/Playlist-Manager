/**
 * Playlist Routes
 * RESTful endpoints for YouTube playlist management
 */

import * as v from 'valibot';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, getOAuth2ClientFromRequest } from '../middlewares/auth.middleware';
import { YouTubeAPIService } from '../services/youtube-api.service';
import {
  CreatePlaylistSchema,
  UpdatePlaylistSchema,
  AddVideoSchema,
  ReorderItemSchema,
  PlaylistIdSchema,
  PlaylistItemIdSchema,
} from '../schemas/playlist.schema';
import { AppError, formatErrorResponse } from '../utils/error-handler';

/**
 * Register playlist routes
 */
export async function playlistRoutes(fastify: FastifyInstance) {
  // Apply authentication middleware to all routes
  fastify.addHook('preHandler', authMiddleware);

  /**
   * GET /api/playlists
   * List all playlists for authenticated user
   */
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { oauth2Client } = getOAuth2ClientFromRequest(request);
      const apiService = new YouTubeAPIService(oauth2Client);

      const playlists = await apiService.getUserPlaylists();

      return reply.send({
        success: true,
        data: playlists,
        count: playlists.length,
      });
    } catch (error) {
      fastify.log.error(error);

      if (error instanceof AppError) {
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      }

      return reply.status(500).send({
        error: {
          message: 'Failed to retrieve playlists',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
        },
      });
    }
  });

  /**
   * POST /api/playlists
   * Create a new playlist
   */
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate request body
      const body = v.parse(CreatePlaylistSchema, request.body);

      const { oauth2Client } = getOAuth2ClientFromRequest(request);
      const apiService = new YouTubeAPIService(oauth2Client);

      const playlist = await apiService.createPlaylist(
        body.title,
        body.description,
        body.privacyStatus
      );

      return reply.status(201).send({
        success: true,
        data: playlist,
      });
    } catch (error) {
      fastify.log.error(error);

      // Handle Valibot validation errors
      if (error instanceof v.ValiError) {
        return reply.status(400).send({
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            statusCode: 400,
            details: error.issues,
          },
        });
      }

      if (error instanceof AppError) {
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      }

      return reply.status(500).send({
        error: {
          message: 'Failed to create playlist',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
        },
      });
    }
  });

  /**
   * GET /api/playlists/:id
   * Get details of a specific playlist
   */
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      // Validate playlist ID
      const playlistId = v.parse(PlaylistIdSchema, request.params.id);

      const { oauth2Client } = getOAuth2ClientFromRequest(request);
      const apiService = new YouTubeAPIService(oauth2Client);

      const playlist = await apiService.getPlaylistById(playlistId);

      return reply.send({
        success: true,
        data: playlist,
      });
    } catch (error) {
      fastify.log.error(error);

      if (error instanceof v.ValiError) {
        return reply.status(400).send({
          error: {
            message: 'Invalid playlist ID',
            code: 'VALIDATION_ERROR',
            statusCode: 400,
            details: error.issues,
          },
        });
      }

      if (error instanceof AppError) {
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      }

      return reply.status(500).send({
        error: {
          message: 'Failed to retrieve playlist',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
        },
      });
    }
  });

  /**
   * PATCH /api/playlists/:id
   * Update playlist metadata
   */
  fastify.patch('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      // Validate playlist ID and body
      const playlistId = v.parse(PlaylistIdSchema, request.params.id);
      const updates = v.parse(UpdatePlaylistSchema, request.body);

      const { oauth2Client } = getOAuth2ClientFromRequest(request);
      const apiService = new YouTubeAPIService(oauth2Client);

      const playlist = await apiService.updatePlaylist(playlistId, updates);

      return reply.send({
        success: true,
        data: playlist,
      });
    } catch (error) {
      fastify.log.error(error);

      if (error instanceof v.ValiError) {
        return reply.status(400).send({
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            statusCode: 400,
            details: error.issues,
          },
        });
      }

      if (error instanceof AppError) {
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      }

      return reply.status(500).send({
        error: {
          message: 'Failed to update playlist',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
        },
      });
    }
  });

  /**
   * DELETE /api/playlists/:id
   * Delete a playlist
   */
  fastify.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      // Validate playlist ID
      const playlistId = v.parse(PlaylistIdSchema, request.params.id);

      const { oauth2Client } = getOAuth2ClientFromRequest(request);
      const apiService = new YouTubeAPIService(oauth2Client);

      await apiService.deletePlaylist(playlistId);

      return reply.send({
        success: true,
        message: 'Playlist deleted successfully',
      });
    } catch (error) {
      fastify.log.error(error);

      if (error instanceof v.ValiError) {
        return reply.status(400).send({
          error: {
            message: 'Invalid playlist ID',
            code: 'VALIDATION_ERROR',
            statusCode: 400,
            details: error.issues,
          },
        });
      }

      if (error instanceof AppError) {
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      }

      return reply.status(500).send({
        error: {
          message: 'Failed to delete playlist',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
        },
      });
    }
  });

  /**
   * GET /api/playlists/:id/items
   * Get all videos in a playlist
   */
  fastify.get('/:id/items', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      // Validate playlist ID
      const playlistId = v.parse(PlaylistIdSchema, request.params.id);

      const { oauth2Client } = getOAuth2ClientFromRequest(request);
      const apiService = new YouTubeAPIService(oauth2Client);

      const items = await apiService.getPlaylistItems(playlistId);

      return reply.send({
        success: true,
        data: items,
        count: items.length,
      });
    } catch (error) {
      fastify.log.error(error);

      if (error instanceof v.ValiError) {
        return reply.status(400).send({
          error: {
            message: 'Invalid playlist ID',
            code: 'VALIDATION_ERROR',
            statusCode: 400,
            details: error.issues,
          },
        });
      }

      if (error instanceof AppError) {
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      }

      return reply.status(500).send({
        error: {
          message: 'Failed to retrieve playlist items',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
        },
      });
    }
  });

  /**
   * POST /api/playlists/:id/items
   * Add a video to a playlist
   */
  fastify.post('/:id/items', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      // Validate playlist ID and body
      const playlistId = v.parse(PlaylistIdSchema, request.params.id);
      const body = v.parse(AddVideoSchema, request.body);

      const { oauth2Client } = getOAuth2ClientFromRequest(request);
      const apiService = new YouTubeAPIService(oauth2Client);

      const item = await apiService.addVideoToPlaylist(
        playlistId,
        body.videoId,
        body.position
      );

      return reply.status(201).send({
        success: true,
        data: item,
      });
    } catch (error) {
      fastify.log.error(error);

      if (error instanceof v.ValiError) {
        return reply.status(400).send({
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            statusCode: 400,
            details: error.issues,
          },
        });
      }

      if (error instanceof AppError) {
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      }

      return reply.status(500).send({
        error: {
          message: 'Failed to add video to playlist',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
        },
      });
    }
  });

  /**
   * DELETE /api/playlists/:id/items/:itemId
   * Remove a video from a playlist
   */
  fastify.delete(
    '/:id/items/:itemId',
    async (request: FastifyRequest<{ Params: { id: string; itemId: string } }>, reply: FastifyReply) => {
      try {
        // Validate item ID
        const itemId = v.parse(PlaylistItemIdSchema, request.params.itemId);

        const { oauth2Client } = getOAuth2ClientFromRequest(request);
        const apiService = new YouTubeAPIService(oauth2Client);

        await apiService.removeVideoFromPlaylist(itemId);

        return reply.send({
          success: true,
          message: 'Video removed from playlist successfully',
        });
      } catch (error) {
        fastify.log.error(error);

        if (error instanceof v.ValiError) {
          return reply.status(400).send({
            error: {
              message: 'Invalid playlist or item ID',
              code: 'VALIDATION_ERROR',
              statusCode: 400,
              details: error.issues,
            },
          });
        }

        if (error instanceof AppError) {
          return reply.status(error.statusCode).send(formatErrorResponse(error));
        }

        return reply.status(500).send({
          error: {
            message: 'Failed to remove video from playlist',
            code: 'INTERNAL_ERROR',
            statusCode: 500,
          },
        });
      }
    }
  );

  /**
   * PATCH /api/playlists/:id/items/:itemId
   * Reorder a video in a playlist
   */
  fastify.patch(
    '/:id/items/:itemId',
    async (request: FastifyRequest<{ Params: { id: string; itemId: string } }>, reply: FastifyReply) => {
      try {
        // Validate IDs and body
        const playlistId = v.parse(PlaylistIdSchema, request.params.id);
        const itemId = v.parse(PlaylistItemIdSchema, request.params.itemId);
        const body = v.parse(ReorderItemSchema, request.body);

        const { oauth2Client } = getOAuth2ClientFromRequest(request);
        const apiService = new YouTubeAPIService(oauth2Client);

        // First, get the current item to retrieve videoId
        const items = await apiService.getPlaylistItems(playlistId);
        const currentItem = items.find((item) => item.id === itemId);

        if (!currentItem) {
          return reply.status(404).send({
            error: {
              message: 'Playlist item not found',
              code: 'NOT_FOUND',
              statusCode: 404,
            },
          });
        }

        // Reorder the item with the videoId
        const updatedItem = await apiService.reorderPlaylistItem(
          itemId,
          playlistId,
          currentItem.videoId,
          body.position
        );

        return reply.send({
          success: true,
          data: updatedItem,
        });
      } catch (error) {
        fastify.log.error(error);

        if (error instanceof v.ValiError) {
          return reply.status(400).send({
            error: {
              message: 'Validation failed',
              code: 'VALIDATION_ERROR',
              statusCode: 400,
              details: error.issues,
            },
          });
        }

        if (error instanceof AppError) {
          return reply.status(error.statusCode).send(formatErrorResponse(error));
        }

        return reply.status(500).send({
          error: {
            message: 'Failed to reorder playlist item',
            code: 'INTERNAL_ERROR',
            statusCode: 500,
          },
        });
      }
    }
  );
}
