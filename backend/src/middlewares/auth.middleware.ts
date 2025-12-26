import { FastifyRequest, FastifyReply } from 'fastify';
import type { OAuth2Client } from 'google-auth-library';
import { getYouTubeAuthService } from '../services/youtube-auth.service.js';
import type { StoredTokens } from '../types/auth.types.js';

/**
 * Simplified authentication middleware
 * Injects pre-authenticated OAuth2 client from backend singleton
 * No per-request authentication - assumes backend is already authenticated at startup
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authService = getYouTubeAuthService();

    // Check if authenticated first
    const isAuth = await authService.isAuthenticated();

    if (!isAuth) {
      request.log.warn('YouTube authentication required but not configured');
      return reply.status(503).send({
        error: 'Service Unavailable',
        message: 'YouTube API is not authenticated. Administrator needs to run: npm run auth:setup',
        code: 'YOUTUBE_NOT_AUTHENTICATED',
      });
    }

    const oauth2Client = await authService.getAuthenticatedClient();

    // Inject OAuth2 client into request
    (request as any).oauth2Client = oauth2Client;
  } catch (error: any) {
    request.log.error('Backend authentication error:', error);

    return reply.status(503).send({
      error: 'Service Unavailable',
      message: 'YouTube authentication failed. Contact administrator.',
      code: 'YOUTUBE_AUTH_ERROR',
      details: error.message,
    });
  }
}

/**
 * Helper to get OAuth2 client from request
 * This should only be used after authMiddleware has injected the client
 */
export function getOAuth2ClientFromRequest(
  request: FastifyRequest
): { oauth2Client: OAuth2Client; tokens?: StoredTokens } {
  const authReq = request as any;

  if (!authReq.oauth2Client) {
    throw new Error('OAuth2 client not found in request. Did you use authMiddleware?');
  }

  return {
    oauth2Client: authReq.oauth2Client as OAuth2Client,
    tokens: authReq.tokens,
  };
}
