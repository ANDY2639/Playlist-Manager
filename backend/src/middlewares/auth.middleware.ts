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
    const oauth2Client = await authService.getAuthenticatedClient();

    // Inject OAuth2 client into request
    (request as any).oauth2Client = oauth2Client;
  } catch (error: any) {
    request.log.error('Backend authentication unavailable:', error);

    return reply.status(503).send({
      error: 'Service Unavailable',
      message: 'Backend is not authenticated with YouTube. Contact administrator.',
      code: 'BACKEND_NOT_AUTHENTICATED',
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
