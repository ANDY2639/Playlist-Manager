/**
 * Common API response types
 */

/**
 * Generic API error response
 */
export interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode?: number;
}

/**
 * Generic API success response
 */
export interface ApiSuccess<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

/**
 * Union type for API responses
 */
export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

/**
 * Axios error with typed response
 */
export interface TypedAxiosError {
  response?: {
    data: ApiError;
    status: number;
    statusText: string;
  };
  request?: unknown;
  message: string;
}

/**
 * Query options for TanStack Query
 */
export interface QueryConfig {
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
  gcTime?: number;
  retry?: number | boolean;
}
