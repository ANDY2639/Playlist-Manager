import { FastifyRequest, FastifyReply } from 'fastify';
import type { OAuth2Client } from 'google-auth-library';
import { getYouTubeAuthService } from '../services/youtube-auth.service.ts';
import { StoredTokens } from '../types/auth.types.ts';

/**
 * Authentication middleware
 * Verifies user is authenticated and attaches OAuth2 client to request
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authService = getYouTubeAuthService();

  try {
    // Check if user is authenticated
    const isAuth = await authService.isAuthenticated();

    if (!isAuth) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'You must be authenticated to access this resource',
        code: 'NOT_AUTHENTICATED',
      });
    }

    // Get authenticated client and attach to request
    const oauth2Client = await authService.getAuthenticatedClient();
    const tokens = await authService.getStoredTokens();

    // Extend request with auth data
    (request as any).oauth2Client = oauth2Client;
    (request as any).tokens = tokens;

    request.log.info('Request authenticated successfully');
  } catch (error: any) {
    request.log.error('Authentication middleware error:', error);

    return reply.status(401).send({
      error: 'Authentication Failed',
      message: error.message || 'Failed to authenticate request',
      code: 'AUTH_FAILED',
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches OAuth2 client to request if authenticated, but doesn't block request
 */
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const authService = getYouTubeAuthService();

  try {
    const isAuth = await authService.isAuthenticated();

    if (isAuth) {
      const oauth2Client = await authService.getAuthenticatedClient();
      const tokens = await authService.getStoredTokens();

      (request as any).oauth2Client = oauth2Client;
      (request as any).tokens = tokens;

      request.log.info('Optional auth: User authenticated');
    } else {
      request.log.info('Optional auth: User not authenticated');
    }
  } catch (error: any) {
    request.log.warn('Optional auth middleware error:', error);
    // Don't block the request, just log the error
  }
}

/**
 * Helper to get OAuth2 client from request
 * This should only be used after authMiddleware has validated authentication
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
