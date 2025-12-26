import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/services/api.service';
import type { AuthStatus } from '@/types/auth.types';
import type { AxiosError } from 'axios';

/**
 * Query key constants for TanStack Query
 */
export const AUTH_QUERY_KEYS = {
  status: ['auth', 'status'] as const,
};

/**
 * Simplified auth hook - checks backend authentication status only
 * No user login/logout - backend is pre-authenticated with admin account
 */
export function useAuth() {
  const {
    data: authStatus,
    isLoading,
    error,
    refetch,
  } = useQuery<AuthStatus, AxiosError>({
    queryKey: AUTH_QUERY_KEYS.status,
    queryFn: authApi.status,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: Infinity, // Keep cached forever
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Only check once on initial mount
  });

  return {
    // Backend auth state
    isBackendAuthenticated: authStatus?.authenticated ?? false,
    user: authStatus?.user ?? null,
    expiresAt: authStatus?.expiresAt,

    // Loading/error states
    isLoading,
    error,
    refetch,
  };
}
