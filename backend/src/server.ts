import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from 'dotenv';
import * as v from 'valibot';
import { AppError, formatErrorResponse } from './utils/error-handler.js';
import { getYouTubeAuthService } from './services/youtube-auth.service.js';

// Load environment variables
config();

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: NODE_ENV === 'development' ? 'info' : 'warn',
    transport: NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    } : undefined,
  },
});

// Register plugins
await fastify.register(helmet, {
  contentSecurityPolicy: NODE_ENV === 'production',
});

await fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '15 minutes',
});

// Health check endpoint
fastify.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  };
});

// Import routes
import { authRoutes } from './routes/auth.routes.js';
import { playlistRoutes } from './routes/playlist.routes.js';
import { downloadRoutes } from './routes/download.routes.js';

// Register routes
await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(playlistRoutes, { prefix: '/api/playlists' });
await fastify.register(downloadRoutes, { prefix: '/api/downloads' });

// API routes will be registered here
fastify.get('/api', async () => {
  return {
    message: 'Playlist Manager API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      playlists: '/api/playlists/*',
      downloads: '/api/downloads/*',
    },
  };
});

// Global error handler
fastify.setErrorHandler((error, _request, reply) => {
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

  // Handle custom AppError instances
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send(formatErrorResponse(error));
  }

  // Handle generic errors
  return reply.status(error.statusCode || 500).send({
    error: {
      message: error.message || 'Internal Server Error',
      code: 'INTERNAL_ERROR',
      statusCode: error.statusCode || 500,
    },
  });
});

// Start server
const start = async () => {
  try {
    // Try to authenticate with YouTube (non-blocking)
    const authService = getYouTubeAuthService();
    const SKIP_AUTH_CHECK = process.env.SKIP_AUTH_CHECK === 'true';

    if (SKIP_AUTH_CHECK) {
      fastify.log.warn('⚠️  SKIP_AUTH_CHECK=true - YouTube authentication disabled');
    } else {
      const authResult = await authService.tryAuthenticate();

      if (authResult.authenticated) {
        fastify.log.info(`✓ YouTube authenticated as: ${authResult.email}`);
        // Start auto-refresh background job
        authService.startAutoRefresh();
      } else {
        fastify.log.warn('⚠️  YouTube not authenticated - API routes will require authentication');
        fastify.log.warn(`   ${authResult.error}`);
        fastify.log.warn('   Run: npm run auth:setup (locally) to authenticate');
      }
    }

    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`Server listening on http://${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
