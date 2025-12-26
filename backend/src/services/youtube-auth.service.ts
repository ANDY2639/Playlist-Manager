import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { StoredTokens, OAuth2Config } from '../types/auth.types.js';
import { config } from 'dotenv';
import { pathExists } from '../utils/file-system.utils.js';

config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use path relative to this service file (backend/src/services/../../tokens = backend/tokens)
const TOKENS_DIR = path.join(__dirname, '..', '..', 'tokens');
const TOKENS_FILE = path.join(TOKENS_DIR, 'youtube-tokens.json');
const GOOGLEAPIS_URL = process.env.GOOGLEAPIS_URL!

// YouTube API scopes required for playlist management
const SCOPES = [
  `${GOOGLEAPIS_URL}/auth/youtube.readonly`,
  `${GOOGLEAPIS_URL}/auth/youtube`,
];

/**
 * YouTube Authentication Service
 * Manages OAuth2 flow and token storage for YouTube Data API v3
 */
export class YouTubeAuthService {
  private oauth2Client: OAuth2Client;
  private config: OAuth2Config;

  constructor(config: OAuth2Config) {
    this.config = config;
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );

    // Ensure tokens directory exists
    this.ensureTokensDirectory();
  }

  /**
   * Ensure tokens directory exists
   */
  private async ensureTokensDirectory(): Promise<void> {
    try {
      await fs.mkdir(TOKENS_DIR, { recursive: true });
    } catch (error) {
      console.error('Error creating tokens directory:', error);
      throw new Error('Failed to create tokens directory');
    }
  }

  /**
   * Generate OAuth2 authorization URL
   */
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent', // Force consent screen to always get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code: string): Promise<StoredTokens> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);

      if (!tokens.access_token) {
        throw new Error('No access token received');
      }

      const storedTokens: StoredTokens = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || undefined,
        scope: tokens.scope || SCOPES.join(' '),
        token_type: tokens.token_type || 'Bearer',
        expiry_date: tokens.expiry_date || Date.now() + 3600 * 1000,
      };

      // Save tokens to file system
      await this.saveTokens(storedTokens);

      // Set credentials on the client
      this.oauth2Client.setCredentials(tokens);

      return storedTokens;
    } catch (error: any) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error(`Failed to exchange authorization code: ${error.message}`);
    }
  }

  /**
   * Save tokens to file system
   */
  async saveTokens(tokens: StoredTokens): Promise<void> {
    try {
      await fs.writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2), 'utf-8');
      console.log('Tokens saved successfully');
    } catch (error) {
      console.error('Error saving tokens:', error);
      throw new Error('Failed to save tokens');
    }
  }

  /**
   * Load tokens from file system
   */
  async loadTokens(): Promise<StoredTokens | null> {
    try {
      if (await pathExists(TOKENS_FILE)) {
        const fileContent = await fs.readFile(TOKENS_FILE, 'utf-8');
        const tokens = JSON.parse(fileContent);
        this.oauth2Client.setCredentials(tokens);
        return tokens as StoredTokens;
      }
      return null;
    } catch (error) {
      console.error('Error loading tokens:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const tokens = await this.loadTokens();
    if (!tokens) {
      return false;
    }

    // Check if token is expired
    if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
      // Try to refresh the token
      if (tokens.refresh_token) {
        try {
          await this.refreshAccessToken();
          return true;
        } catch (error) {
          console.error('Failed to refresh token:', error);
          return false;
        }
      }
      return false;
    }

    return true;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<StoredTokens> {
    try {
      const tokens = await this.loadTokens();

      if (!tokens || !tokens.refresh_token) {
        throw new Error('No refresh token available');
      }

      this.oauth2Client.setCredentials({
        refresh_token: tokens.refresh_token,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      const updatedTokens: StoredTokens = {
        ...tokens,
        access_token: credentials.access_token!,
        expiry_date: credentials.expiry_date || Date.now() + 3600 * 1000,
      };

      await this.saveTokens(updatedTokens);
      this.oauth2Client.setCredentials(credentials);

      console.log('Access token refreshed successfully');
      return updatedTokens;
    } catch (error: any) {
      console.error('Error refreshing access token:', error);
      throw new Error(`Failed to refresh access token: ${error.message}`);
    }
  }

  /**
   * Get authenticated OAuth2 client
   * Automatically refreshes token if expired
   */
  async getAuthenticatedClient(): Promise<OAuth2Client> {
    const tokens = await this.loadTokens();

    if (!tokens) {
      throw new Error('User not authenticated');
    }

    // Check if token is expired and refresh if needed
    if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
      if (tokens.refresh_token) {
        await this.refreshAccessToken();
      } else {
        throw new Error('Token expired and no refresh token available');
      }
    } else {
      this.oauth2Client.setCredentials(tokens);
    }

    return this.oauth2Client;
  }

  /**
   * Get user info from Google
   */
  async getUserInfo(): Promise<{ email?: string; name?: string }> {
    try {
      const client = await this.getAuthenticatedClient();
      const oauth2 = google.oauth2({ version: 'v2', auth: client });
      const { data } = await oauth2.userinfo.get();

      return {
        email: data.email || undefined,
        name: data.name || undefined,
      };
    } catch (error: any) {
      console.error('Error getting user info:', error);
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }

  /**
   * Logout user (delete tokens)
   */
  async logout(): Promise<void> {
    try {
      if (await pathExists(TOKENS_FILE)) {
        await fs.rm(TOKENS_FILE, { force: true });
        console.log('Tokens deleted successfully');
      }

      // Reset the OAuth2 client
      this.oauth2Client = new google.auth.OAuth2(
        this.config.clientId,
        this.config.clientSecret,
        this.config.redirectUri
      );
    } catch (error) {
      console.error('Error during logout:', error);
      throw new Error('Failed to logout');
    }
  }

  /**
   * Get current stored tokens
   */
  async getStoredTokens(): Promise<StoredTokens | null> {
    return this.loadTokens();
  }

  /**
   * Ensure backend is authenticated with YouTube
   * Called once at server startup
   * Verifies tokens exist and are valid
   */
  async ensureAuthenticated(): Promise<void> {
    const tokens = await this.loadTokens();

    if (!tokens) {
      throw new Error(
        '\n❌ No YouTube tokens found.\n' +
        '→ Run: npm run auth:setup\n' +
        '→ This will authenticate the admin account.\n'
      );
    }

    // Verify tokens are valid
    try {
      await this.getAuthenticatedClient();
      const userInfo = await this.getUserInfo();

      console.log(`✓ Authenticated as: ${userInfo.email}`);

      // Validate account if expected email is set
      const expectedEmail = process.env.YOUTUBE_ACCOUNT_EMAIL;
      if (expectedEmail && userInfo.email !== expectedEmail) {
        console.warn(
          `⚠️  Warning: Authenticated account (${userInfo.email}) does not match expected account (${expectedEmail})`
        );
      }
    } catch (error: any) {
      throw new Error(
        '\n❌ Invalid or expired tokens.\n' +
        '→ Run: npm run auth:setup\n' +
        '→ To re-authenticate the admin account.\n' +
        `Details: ${error.message}\n`
      );
    }
  }

  /**
   * Start background token refresh
   * Refreshes tokens every 50 minutes (before the 60-minute expiration)
   */
  startAutoRefresh(): NodeJS.Timeout {
    const REFRESH_INTERVAL = 50 * 60 * 1000; // 50 minutes

    const intervalId = setInterval(async () => {
      try {
        await this.refreshAccessToken();
        console.log('✓ Tokens auto-refreshed');
      } catch (error: any) {
        console.error('❌ Failed to auto-refresh tokens:', error.message);
      }
    }, REFRESH_INTERVAL);

    console.log(`→ Auto-refresh enabled (every 50 minutes)`);

    return intervalId;
  }
}

// Singleton instance
let authServiceInstance: YouTubeAuthService | null = null;

/**
 * Get or create YouTubeAuthService instance
 */
export function getYouTubeAuthService(): YouTubeAuthService {
  if (!authServiceInstance) {
    const config: OAuth2Config = {
      clientId: process.env.YOUTUBE_CLIENT_ID!,
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET!,
      redirectUri: process.env.OAUTH_REDIRECT_URI!,
    };

    // Validate configuration
    if (!config.clientId || !config.clientSecret || !config.redirectUri) {
      throw new Error(
        'Missing OAuth2 configuration. Please set YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, and OAUTH_REDIRECT_URI in .env file'
      );
    }

    authServiceInstance = new YouTubeAuthService(config);
  }

  return authServiceInstance;
}
