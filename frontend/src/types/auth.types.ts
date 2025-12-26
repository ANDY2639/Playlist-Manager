/**
 * Frontend auth types for backend-centralized authentication
 * Backend source: backend/src/types/auth.types.ts
 */

/**
 * User information from OAuth2
 */
export interface UserInfo {
  email?: string;
  name?: string;
}

/**
 * Backend authentication status response
 * Returns the status of the backend's pre-authenticated YouTube connection
 */
export interface AuthStatus {
  authenticated: boolean;
  user?: UserInfo;
  expiresAt?: number;
  error?: string;
  message?: string;
}
