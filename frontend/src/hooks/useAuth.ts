import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/services/api.service';
import type { AuthStatus, LoginResponse, LogoutResponse } from '@/types/auth.types';
import type { AxiosError } from 'axios';

/**
 * Query key constants for TanStack Query
 */
export const AUTH_QUERY_KEYS = {
  status: ['auth', 'status'] as const,
};

/**
 * Custom hook for authentication using TanStack Query
 * Provides auth state, login, logout, and refetch capabilities
 */
export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  /**
   * Query: Check authentication status
   * Runs automatically and caches result
   */
  const {
    data: authStatus,
    isLoading,
    error,
    refetch,
  } = useQuery<AuthStatus, AxiosError>({
    queryKey: AUTH_QUERY_KEYS.status,
    queryFn: authApi.status,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: true, // Check auth when window regains focus
    refetchOnMount: true,
  });

  /**
   * Mutation: Initiate login (get auth URL)
   */
  const loginMutation = useMutation<LoginResponse, AxiosError, void>({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // Redirect user to Google OAuth consent screen
      window.location.href = data.authUrl;
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });

  /**
   * Mutation: Logout
   */
  const logoutMutation = useMutation<LogoutResponse, AxiosError, void>({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear auth query cache
      queryClient.setQueryData(AUTH_QUERY_KEYS.status, {
        authenticated: false,
      });
      // Invalidate to force refetch
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.status });
      // Redirect to home
      router.push('/');
    },
    onError: (error) => {
      console.error('Logout failed:', error);
    },
  });

  /**
   * Helper: Check if tokens are expired
   */
  const isTokenExpired = (): boolean => {
    if (!authStatus?.expiresAt) return false;
    return Date.now() >= authStatus.expiresAt;
  };

  /**
   * Helper: Check if currently authenticated
   */
  const isAuthenticated = authStatus?.authenticated ?? false;

  /**
   * Helper: Get current user info
   */
  const user = authStatus?.user ?? null;

  /**
   * Helper: Get token expiry time
   */
  const expiresAt = authStatus?.expiresAt ?? null;

  return {
    // Auth state
    isAuthenticated,
    user,
    expiresAt,
    isLoading,
    error,
    isTokenExpired: isTokenExpired(),

    // Actions
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    refetch,

    // Mutation states
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
    logoutError: logoutMutation.error,
  };
}
