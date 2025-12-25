/**
 * Download Routes
 * RESTful endpoints for video download operations
 */

import * as v from 'valibot';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, getOAuth2ClientFromRequest } from '../middlewares/auth.middleware.ts';
import { getDownloadManagerService } from '../services/download-manager.service.ts';
import { StartDownloadSchema, DownloadIdSchema, ZipDownloadParamsSchema } from '../schemas/download.schema.ts';
import { AppError, formatErrorResponse } from '../utils/error-handler.ts';
import { zipService } from '../services/zip.service.ts';
import { cleanupDownloadDirectory } from '../utils/file-system.utils.ts';

/**
 * Register download routes
 */
export async function downloadRoutes(fastify: FastifyInstance) {
  // Apply authentication middleware to all routes
  fastify.addHook('preHandler', authMiddleware);

  const downloadManager = getDownloadManagerService();

  /**
   * POST /api/downloads/start
   * Start downloading a playlist
   */
  fastify.post('/start', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate request body
      const body = v.parse(StartDownloadSchema, request.body);

      const { oauth2Client } = getOAuth2ClientFromRequest(request);

      // Start download
      const { downloadId, status } = await downloadManager.startPlaylistDownload(
        body.playlistId,
        oauth2Client
      );

      return reply.status(202).send({
        success: true,
        data: {
          downloadId,
          message: 'Download started successfully',
          statusUrl: `/api/downloads/${downloadId}/status`,
        },
        status: status,
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
          message: 'Failed to start download',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
        },
      });
    }
  });

  /**
   * GET /api/downloads/:downloadId/status
   * Get status of a specific download
   */
  fastify.get(
    '/:downloadId/status',
    async (request: FastifyRequest<{ Params: { downloadId: string } }>, reply: FastifyReply) => {
      try {
        // Validate download ID
        const downloadId = v.parse(DownloadIdSchema, request.params.downloadId);

        const status = downloadManager.getDownloadStatus(downloadId);

        return reply.send({
          success: true,
          data: status,
        });
      } catch (error) {
        fastify.log.error(error);

        if (error instanceof v.ValiError) {
          return reply.status(400).send({
            error: {
              message: 'Invalid download ID',
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
            message: 'Failed to retrieve download status',
            code: 'INTERNAL_ERROR',
            statusCode: 500,
          },
        });
      }
    }
  );

  /**
   * GET /api/downloads/:downloadId/zip
   * Generate and download a ZIP file with all videos from the playlist
   */
  fastify.get(
    '/:downloadId/zip',
    async (request: FastifyRequest<{ Params: { downloadId: string } }>, reply: FastifyReply) => {
      try {
        // Validate params
        const params = v.parse(ZipDownloadParamsSchema, request.params);
        const { downloadId } = params;

        // Get download status
        const downloadStatus = downloadManager.getDownloadStatus(downloadId);

        // Validate that download is completed
        if (downloadStatus.status !== 'completed') {
          throw new AppError(
            `Download is still in progress or failed. Status: ${downloadStatus.status}`,
            400,
            'DOWNLOAD_NOT_COMPLETED'
          );
        }

        // Validate that there are completed videos
        if (downloadStatus.completedVideos === 0) {
          throw new AppError(
            'No videos were successfully downloaded',
            400,
            'NO_FILES_TO_ZIP'
          );
        }

        // Generate ZIP filename
        const zipFilename = zipService.generateZipFilename(downloadStatus.playlistTitle);

        // Create ZIP stream
        const zipStream = await zipService.createZipStream(
          downloadId,
          downloadStatus.downloadPath
        );

        // Configure response headers
        reply.header('Content-Type', 'application/zip');
        reply.header('Content-Disposition', `attachment; filename="${zipFilename}"`);
        reply.header('Transfer-Encoding', 'chunked');

        // Check if cleanup is enabled
        const cleanupAfterZip = process.env.CLEANUP_AFTER_ZIP === 'true';

        // Handle cleanup after ZIP streaming completes (if enabled)
        if (cleanupAfterZip) {
          zipStream.on('finish', async () => {
            try {
              fastify.log.info(
                `[DownloadRoutes] ZIP stream completed for ${downloadId}. Cleaning up files...`
              );
              await cleanupDownloadDirectory(downloadStatus.downloadPath);
              fastify.log.info(
                `[DownloadRoutes] Cleanup completed for download ${downloadId}`
              );
            } catch (cleanupError) {
              fastify.log.error({
                msg: `[DownloadRoutes] Failed to cleanup files for ${downloadId}`,
                error: cleanupError
              });
              // Don't fail the request if cleanup fails - ZIP already sent
            }
          });
        }

        // Handle stream errors
        zipStream.on('error', (error) => {
          fastify.log.error({
            msg: `[DownloadRoutes] ZIP stream error for ${downloadId}`,
            error
          });
          // If streaming hasn't started yet, send error response
          if (!reply.sent) {
            reply.status(500).send({
              error: {
                message: 'ZIP generation failed',
                code: 'ZIP_ERROR',
                statusCode: 500,
              },
            });
          }
        });

        fastify.log.info(
          `[DownloadRoutes] Streaming ZIP for download ${downloadId}: ${downloadStatus.completedVideos} videos`
        );

        // Send the stream
        return reply.send(zipStream);
      } catch (error) {
        fastify.log.error(error);

        if (error instanceof v.ValiError) {
          return reply.status(400).send({
            error: {
              message: 'Invalid download ID',
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
            message: 'Failed to generate ZIP',
            code: 'INTERNAL_ERROR',
            statusCode: 500,
          },
        });
      }
    }
  );

  /**
   * GET /api/downloads
   * List all active downloads
   */
  fastify.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const downloads = downloadManager.getAllDownloads();

      return reply.send({
        success: true,
        data: downloads,
        count: downloads.length,
      });
    } catch (error) {
      fastify.log.error(error);

      return reply.status(500).send({
        error: {
          message: 'Failed to retrieve downloads',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
        },
      });
    }
  });

  /**
   * DELETE /api/downloads/:downloadId
   * Cancel a download
   */
  fastify.delete(
    '/:downloadId',
    async (request: FastifyRequest<{ Params: { downloadId: string } }>, reply: FastifyReply) => {
      try {
        // Validate download ID
        const downloadId = v.parse(DownloadIdSchema, request.params.downloadId);

        await downloadManager.cancelDownload(downloadId);

        return reply.send({
          success: true,
          message: 'Download cancelled successfully',
        });
      } catch (error) {
        fastify.log.error(error);

        if (error instanceof v.ValiError) {
          return reply.status(400).send({
            error: {
              message: 'Invalid download ID',
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
            message: 'Failed to cancel download',
            code: 'INTERNAL_ERROR',
            statusCode: 500,
          },
        });
      }
    }
  );
}
