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
   * Works even if not authenticated - useful for checking setup state
   */
  fastify.get('/status', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const isAuth = await authService.isAuthenticated();

      if (!isAuth) {
        const response: AuthStatus = {
          authenticated: false,
          user: undefined,
          expiresAt: undefined,
        };

        return reply.send({
          ...response,
          message: 'Not authenticated. Visit /api/auth/setup/start?secret=YOUR_SECRET to authenticate',
        });
      }

      const userInfo = await authService.getUserInfo();
      const tokens = await authService.getStoredTokens();

      const response: AuthStatus = {
        authenticated: true,
        user: userInfo,
        expiresAt: tokens?.expiry_date,
      };

      return reply.send(response);
    } catch (error: any) {
      fastify.log.error('Failed to get auth status:', error);

      const response: AuthStatus = {
        authenticated: false,
        user: undefined,
        expiresAt: undefined,
      };

      return reply.send({
        ...response,
        error: 'Failed to check authentication status',
        message: error.message,
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

  /**
   * GET /api/auth/setup/start?secret=YOUR_SECRET
   * Initiates OAuth flow for remote authentication
   * Protected by AUTH_SETUP_SECRET environment variable
   */
  fastify.get('/setup/start', async (request: FastifyRequest, reply: FastifyReply) => {
    const { secret } = request.query as { secret?: string };
    const AUTH_SETUP_SECRET = process.env.AUTH_SETUP_SECRET;

    // Check if setup secret is configured
    if (!AUTH_SETUP_SECRET) {
      fastify.log.error('AUTH_SETUP_SECRET not configured');
      return reply.status(503).send({
        error: 'Service not configured',
        message: 'AUTH_SETUP_SECRET environment variable is not set',
      });
    }

    // Validate secret
    if (!secret || secret !== AUTH_SETUP_SECRET) {
      fastify.log.warn('Unauthorized auth setup attempt');
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Invalid or missing secret',
      });
    }

    // Generate auth URL and redirect user to Google OAuth
    try {
      const authUrl = authService.getAuthUrl();

      fastify.log.info('Auth setup initiated via web endpoint');

      // Redirect to Google OAuth
      return reply.redirect(authUrl);
    } catch (error: any) {
      fastify.log.error('Failed to generate auth URL:', error);

      return reply.status(500).send({
        error: 'Failed to start authentication',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/auth/google/callback
   * OAuth callback endpoint - handles the redirect from Google
   * This completes the authentication flow started by /setup/start
   */
  fastify.get('/google/callback', async (request: FastifyRequest, reply: FastifyReply) => {
    const { code, error } = request.query as { code?: string; error?: string };

    // Handle OAuth error
    if (error) {
      fastify.log.error(`OAuth error: ${error}`);
      return reply.type('text/html').send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authentication Failed</title>
            <meta charset="utf-8">
          </head>
          <body>
            <h1>❌ Authentication Failed</h1>
            <p>Error: ${error}</p>
            <p>You can close this window and try again.</p>
          </body>
        </html>
      `);
    }

    // Handle missing code
    if (!code) {
      fastify.log.error('No authorization code received');
      return reply.status(400).type('text/html').send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authentication Failed</title>
            <meta charset="utf-8">
          </head>
          <body>
            <h1>❌ Authentication Failed</h1>
            <p>No authorization code received</p>
            <p>You can close this window and try again.</p>
          </body>
        </html>
      `);
    }

    // Exchange code for tokens
    try {
      fastify.log.info('Processing OAuth callback...');
      const tokens = await authService.getTokensFromCode(code);

      // Get user info to display
      const userInfo = await authService.getUserInfo();

      fastify.log.info(`✓ Authentication successful: ${userInfo.email}`);

      // Start auto-refresh if not already running
      authService.startAutoRefresh();

      // Return success page
      return reply.type('text/html').send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authentication Successful</title>
            <meta charset="utf-8">
          </head>
          <body>
            <h1>✓ Authentication Successful!</h1>
            <p>Authenticated as: <strong>${userInfo.email}</strong></p>
            <p>Token expires: ${new Date(tokens.expiry_date || 0).toLocaleString()}</p>
            <p><strong>You can close this window now.</strong></p>
            <p>The server is now authenticated and ready to use.</p>
            <script>
              // Auto-close after 3 seconds
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `);
    } catch (error: any) {
      fastify.log.error('Failed to exchange code for tokens:', error);

      return reply.status(500).type('text/html').send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authentication Failed</title>
            <meta charset="utf-8">
          </head>
          <body>
            <h1>❌ Authentication Failed</h1>
            <p>Error: ${error.message}</p>
            <p>You can close this window and try again.</p>
          </body>
        </html>
      `);
    }
  });
}
