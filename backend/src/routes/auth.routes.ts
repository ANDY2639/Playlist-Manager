import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getYouTubeAuthService } from '../services/youtube-auth.service.js';
import { AuthStatus } from '../types/auth.types.js';

/**
 * Simplified authentication routes
 * Backend is pre-authenticated - no user login/logout endpoints
 */
export async function authRoutes(fastify: FastifyInstance) {
  const authService = getYouTubeAuthService();

  /**
   * GET /api/auth/status
   * Returns current backend authentication status
   * Always authenticated if server is running successfully
   */
  fastify.get('/status', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userInfo = await authService.getUserInfo();
      const tokens = await authService.getStoredTokens();

      const response: AuthStatus = {
        authenticated: true,
        user: userInfo,
        expiresAt: tokens?.expiry_date,
      };

      return reply.send(response);
    } catch (error: any) {
      // If this fails, something is seriously wrong with backend auth
      fastify.log.error('Failed to get auth status:', error);

      const response: AuthStatus = {
        authenticated: false,
        user: undefined,
        expiresAt: undefined,
      };

      return reply.status(503).send({
        ...response,
        error: 'Backend authentication failed',
        message: 'Contact administrator to re-run: npm run auth:setup',
      });
    }
  });

  /**
   * POST /api/auth/refresh
   * Manually trigger token refresh (development/debugging only)
   */
  if (process.env.NODE_ENV === 'development') {
    fastify.post('/refresh', async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        await authService.refreshAccessToken();

        fastify.log.info('Tokens manually refreshed');

        return reply.send({
          success: true,
          message: 'Tokens refreshed successfully',
        });
      } catch (error: any) {
        fastify.log.error('Failed to refresh tokens:', error);

        return reply.status(500).send({
          success: false,
          error: 'Failed to refresh tokens',
          message: error.message,
        });
      }
    });
  }
}
