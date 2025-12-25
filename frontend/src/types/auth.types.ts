/**
 * Frontend auth types matching backend DTOs
 * Backend source: backend/src/types/auth.types.ts
 */

/**
 * User information from OAuth2
 */
export interface UserInfo {
  email: string;
  name: string;
}

/**
 * Authentication status response from backend
 */
export interface AuthStatus {
  authenticated: boolean;
  user?: Partial<UserInfo>;
  expiresAt?: number;
}

/**
 * Login response from backend
 */
export interface LoginResponse {
  success: boolean;
  authUrl: string;
  message: string;
}

/**
 * Logout response from backend
 */
export interface LogoutResponse {
  success: boolean;
  message: string;
}

/**
 * OAuth callback query parameters
 */
export interface OAuthCallbackParams {
  auth?: 'success' | 'denied' | 'error';
  error?: string;
}

/**
 * Auth context/hook state
 */
export interface AuthContextState {
  isAuthenticated: boolean;
  user: Partial<UserInfo> | null;
  expiresAt: number | null;
  isLoading: boolean;
  error: Error | null;
}
