import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getYouTubeAuthService } from '../services/youtube-auth.service';
import { AuthStatus } from '../types/auth.types';

/**
 * Authentication routes for OAuth2 flow with YouTube
 */
export async function authRoutes(fastify: FastifyInstance) {
  const authService = getYouTubeAuthService();

  /**
   * GET /api/auth/login
   * Generate OAuth2 authorization URL and redirect user to Google consent screen
   */
  fastify.get('/login', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authUrl = authService.getAuthUrl();

      fastify.log.info('Generated authorization URL');

      // Return the URL as JSON for frontend to handle redirect
      return reply.send({
        success: true,
        authUrl,
        message: 'Redirect user to this URL to authorize the application',
      });
    } catch (error: any) {
      fastify.log.error('Error generating auth URL:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to generate authorization URL',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/auth/google/callback
   * Handle OAuth2 callback from Google
   * Exchange authorization code for tokens
   */
  fastify.get(
    '/google/callback',
    async (
      request: FastifyRequest<{
        Querystring: { code?: string; error?: string };
      }>,
      reply: FastifyReply
    ) => {
      const { code, error } = request.query;

      // Check if user denied authorization
      if (error) {
        fastify.log.warn({ error }, 'User denied authorization');
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return reply.redirect(`${frontendUrl}?auth=denied&error=${encodeURIComponent(error)}`);
      }

      // Check if code is present
      if (!code) {
        fastify.log.error('No authorization code received');
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return reply.redirect(`${frontendUrl}?auth=error&error=no_code`);
      }

      try {
        // Exchange code for tokens
        await authService.getTokensFromCode(code);

        fastify.log.info('Successfully authenticated user');

        // Redirect to frontend with success message
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return reply.redirect(`${frontendUrl}?auth=success`);
      } catch (error: any) {
        fastify.log.error('Error during OAuth callback:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return reply.redirect(
          `${frontendUrl}?auth=error&error=${encodeURIComponent(error.message)}`
        );
      }
    }
  );

  /**
   * GET /api/auth/status
   * Check if user is authenticated and return user info
   */
  fastify.get('/status', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const isAuth = await authService.isAuthenticated();

      if (!isAuth) {
        const response: AuthStatus = {
          authenticated: false,
        };
        return reply.send(response);
      }

      // Get user info
      try {
        const userInfo = await authService.getUserInfo();
        const tokens = await authService.getStoredTokens();

        const response: AuthStatus = {
          authenticated: true,
          user: userInfo,
          expiresAt: tokens?.expiry_date,
        };

        return reply.send(response);
      } catch (error) {
        // If we can't get user info but tokens exist, still return authenticated
        fastify.log.warn({ error }, 'Could not fetch user info');
        const response: AuthStatus = {
          authenticated: true,
        };
        return reply.send(response);
      }
    } catch (error: any) {
      fastify.log.error('Error checking auth status:', error);
      return reply.status(500).send({
        authenticated: false,
        error: 'Failed to check authentication status',
        message: error.message,
      });
    }
  });

  /**
   * POST /api/auth/logout
   * Logout user and delete stored tokens
   */
  fastify.post('/logout', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      await authService.logout();

      fastify.log.info('User logged out successfully');

      return reply.send({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error: any) {
      fastify.log.error('Error during logout:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to logout',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/auth/tokens
   * Get current stored tokens (for debugging - remove in production)
   */
  if (process.env.NODE_ENV === 'development') {
    fastify.get('/tokens', async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tokens = await authService.getStoredTokens();

        if (!tokens) {
          return reply.status(404).send({
            success: false,
            message: 'No tokens found',
          });
        }

        // Hide sensitive data
        return reply.send({
          success: true,
          tokens: {
            hasAccessToken: !!tokens.access_token,
            hasRefreshToken: !!tokens.refresh_token,
            expiryDate: tokens.expiry_date,
            scope: tokens.scope,
            tokenType: tokens.token_type,
          },
        });
      } catch (error: any) {
        fastify.log.error('Error fetching tokens:', error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to fetch tokens',
          message: error.message,
        });
      }
    });
  }
}
