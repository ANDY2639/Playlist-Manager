#!/usr/bin/env node

/**
 * Authentication Setup Script
 * One-time CLI tool for admin to authenticate with Google OAuth
 * Opens browser, handles OAuth callback, saves tokens
 */

import { OAuth2Client } from 'google-auth-library';
import http from 'http';
import { URL } from 'url';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import open from 'open';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
dotenv.config({ path: path.join(rootDir, '.env') });

// OAuth2 Configuration
const OAUTH_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const OAUTH_REDIRECT_URI = process.env.OAUTH_REDIRECT_URI;
const EXPECTED_EMAIL = process.env.YOUTUBE_ACCOUNT_EMAIL;
const TOKENS_PATH = path.join(rootDir, 'tokens', 'youtube-tokens.json');

// OAuth2 Scopes
const SCOPES = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Validate required environment variables
 */
function validateEnvVars(): void {
  if (!OAUTH_CLIENT_ID || !OAUTH_CLIENT_SECRET) {
    log('\n❌ Error: Missing required environment variables', colors.red);
    log('\nPlease set the following in your .env file:', colors.yellow);
    log('  - YOUTUBE_CLIENT_ID', colors.yellow);
    log('  - YOUTUBE_CLIENT_SECRET', colors.yellow);
    log(`  - OAUTH_REDIRECT_URI (optional, defaults to ${OAUTH_REDIRECT_URI})\n`, colors.yellow);
    process.exit(1);
  }
}

/**
 * Check if user is already authenticated with valid tokens
 * Returns validation result without starting OAuth flow
 */
async function checkExistingAuthentication(): Promise<{
  valid: boolean;
  email?: string;
  error?: string;
}> {
  try {
    // 1. Check if token file exists
    if (!await fs.pathExists(TOKENS_PATH)) {
      return { valid: false, error: 'No token file found' };
    }

    // 2. Load tokens from file
    const tokens = await fs.readJson(TOKENS_PATH);

    // 3. Validate token structure
    if (!tokens.access_token || !tokens.expiry_date) {
      return { valid: false, error: 'Invalid token structure' };
    }

    // 4. Create temporary OAuth2 client
    const tempClient = createOAuth2Client();
    tempClient.setCredentials(tokens);

    // 5. Check if token is expired and refresh if needed
    if (tokens.expiry_date < Date.now()) {
      if (tokens.refresh_token) {
        try {
          log('→ Token expired, attempting refresh...', colors.cyan);
          const { credentials } = await tempClient.refreshAccessToken();

          // Save refreshed tokens
          const updatedTokens = {
            ...tokens,
            access_token: credentials.access_token,
            expiry_date: credentials.expiry_date,
          };
          await fs.writeJson(TOKENS_PATH, updatedTokens, { spaces: 2 });

          // Set new credentials
          tempClient.setCredentials(credentials);
          log('✓ Token refreshed successfully', colors.green);
        } catch (refreshError) {
          return { valid: false, error: 'Token refresh failed' };
        }
      } else {
        return { valid: false, error: 'Token expired, no refresh token' };
      }
    }

    // 6. Validate token by fetching user info from Google
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${tempClient.credentials.access_token}` },
      }
    );

    if (!userInfoResponse.ok) {
      return { valid: false, error: 'Token validation failed' };
    }

    const userInfo = await userInfoResponse.json();
    return { valid: true, email: userInfo.email };

  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

/**
 * Create OAuth2 client
 */
function createOAuth2Client(): OAuth2Client {
  return new OAuth2Client(OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, OAUTH_REDIRECT_URI);
}

/**
 * Generate authorization URL
 */
function generateAuthUrl(oauth2Client: OAuth2Client): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force consent screen to get refresh token
  });
}

/**
 * Start temporary HTTP server to handle OAuth callback
 */
function startCallbackServer(oauth2Client: OAuth2Client): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const reqUrl = new URL(req.url!, `http://${req.headers.host}`);

        // Only handle callback path
        if (!reqUrl.pathname.includes('/callback')) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }

        const code = reqUrl.searchParams.get('code');
        const error = reqUrl.searchParams.get('error');

        if (error) {
          log(`\n❌ Authorization denied: ${error}`, colors.red);
          res.writeHead(400);
          res.end('<h1>Authorization Denied</h1><p>You can close this window.</p>');
          server.close();
          reject(new Error(`Authorization denied: ${error}`));
          return;
        }

        if (!code) {
          log('\n❌ No authorization code received', colors.red);
          res.writeHead(400);
          res.end('<h1>Error</h1><p>No authorization code received.</p>');
          server.close();
          reject(new Error('No authorization code received'));
          return;
        }

        log('\n✓ Authorization code received', colors.green);
        log('→ Exchanging code for tokens...', colors.cyan);

        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        log('✓ Tokens received', colors.green);

        // Get user info to verify account
        const userInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
        const userInfoResponse = await fetch(userInfoUrl, {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        });

        const userInfo = (await userInfoResponse.json()) as { email: string; name?: string };
        const userEmail = userInfo.email;

        log(`✓ Authenticated as: ${userEmail}`, colors.green);

        // Validate email if expected email is set
        if (EXPECTED_EMAIL && userEmail !== EXPECTED_EMAIL) {
          log(`\n⚠️  Warning: Authenticated email (${userEmail}) does not match expected email (${EXPECTED_EMAIL})`, colors.yellow);
          log('→ Proceeding anyway...', colors.yellow);
        }

        // Save tokens to file
        await fs.ensureDir(path.dirname(TOKENS_PATH));
        await fs.writeJson(TOKENS_PATH, tokens, { spaces: 2 });

        log(`✓ Tokens saved to: ${TOKENS_PATH}`, colors.green);
        log('\n✅ Setup complete! Start the server with: npm run dev\n', colors.green);

        // Send success response - simplified
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Authentication Successful</title>
              <meta charset="utf-8">
            </head>
            <body>
              <h1>✓ Authentication Successful</h1>
              <p>Authenticated as: ${userEmail}</p>
              <p><strong>You can close this window now.</strong></p>
              <script>
                // Auto-close after 2 seconds (works in some browsers)
                setTimeout(() => window.close(), 2000);
              </script>
            </body>
          </html>
        `);

        // Close server
        server.close();
        resolve();
      } catch (error: any) {
        log(`\n❌ Error during callback: ${error.message}`, colors.red);
        res.writeHead(500);
        res.end('<h1>Error</h1><p>Authentication failed. Check console for details.</p>');
        server.close();
        reject(error);
      }
    });

    // Parse OAUTH_REDIRECT_URI to get port
    const redirectUrl = new URL(OAUTH_REDIRECT_URI!);
    const port = parseInt(redirectUrl.port, 10);

    server.listen(port, () => {
      log(`→ Callback server listening on port ${port}`, colors.cyan);
    });

    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        log(`\n❌ Port ${port} is already in use`, colors.red);
        log(`→ Stop any running servers and try again\n`, colors.yellow);
      } else {
        log(`\n❌ Server error: ${error.message}`, colors.red);
      }
      reject(error);
    });
  });
}

/**
 * Main setup function
 */
async function main() {
  try {
    log('\n🔐 YouTube Playlist Manager - Authentication Setup\n', colors.cyan);

    // Validate environment variables
    validateEnvVars();

    // Check existing authentication first
    log('→ Checking existing authentication...', colors.cyan);
    const authCheck = await checkExistingAuthentication();

    if (authCheck.valid && authCheck.email) {
      log(`✓ Already authenticated as: ${authCheck.email}`, colors.green);

      // Validate against expected email if set
      if (EXPECTED_EMAIL && authCheck.email !== EXPECTED_EMAIL) {
        log(
          `⚠️  Warning: Authenticated account (${authCheck.email}) differs from expected (${EXPECTED_EMAIL})`,
          colors.yellow
        );
        log('→ Re-run this script to authenticate with correct account if needed\n', colors.yellow);
      } else {
        log('✅ Authentication is valid and ready to use\n', colors.green);
      }

      process.exit(0); // Exit successfully - no need to re-authenticate
    }

    // Authentication needed - show reason
    if (authCheck.error) {
      log(`⚠️  ${authCheck.error}`, colors.yellow);
    }

    log('→ Starting OAuth2 authentication flow...\n', colors.cyan);

    // Check if tokens already exist (will be overwritten)
    if (await fs.pathExists(TOKENS_PATH)) {
      log('→ Existing tokens will be replaced\n', colors.yellow);
    }

    // Create OAuth2 client
    const oauth2Client = createOAuth2Client();

    // Generate authorization URL
    const authUrl = generateAuthUrl(oauth2Client);

    log('→ Starting authentication setup...', colors.cyan);
    log('→ Opening browser for authorization...', colors.cyan);
    log(`\n   If browser doesn't open automatically, visit:`, colors.yellow);
    log(`   ${authUrl}\n`, colors.yellow);

    // Open browser
    try {
      await open(authUrl);
    } catch (error) {
      log('⚠️  Could not open browser automatically', colors.yellow);
    }

    // Start callback server and wait for tokens
    await startCallbackServer(oauth2Client);

    process.exit(0);
  } catch (error: any) {
    log(`\n❌ Setup failed: ${error.message}\n`, colors.red);
    process.exit(1);
  }
}

// Run setup
main();
