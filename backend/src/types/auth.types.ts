import { OAuth2Client } from 'googleapis-common';

/**
 * OAuth2 tokens stored in the file system
 */
export interface StoredTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

/**
 * User information from OAuth2
 */
export interface UserInfo {
  email: string;
  name: string;
}

/**
 * Authentication status response
 */
export interface AuthStatus {
  authenticated: boolean;
  user?: Partial<UserInfo>;
  expiresAt?: number;
}

/**
 * Extended Fastify request with authenticated OAuth2 client
 */
export interface AuthenticatedRequest {
  oauth2Client?: OAuth2Client;
  tokens?: StoredTokens;
}

/**
 * Guaranteed authenticated request (after auth middleware validation)
 */
export interface GuaranteedAuthRequest {
  oauth2Client: OAuth2Client;
  tokens: StoredTokens;
}

/**
 * OAuth2 configuration
 */
export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}
