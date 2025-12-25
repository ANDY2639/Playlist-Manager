import axios, { AxiosError, AxiosResponse } from 'axios';
import type {
  LoginResponse,
  AuthStatus,
  LogoutResponse
} from '@/types/auth.types';
import type {
  PlaylistDTO,
  PlaylistItemDTO,
  CreatePlaylistRequest,
  UpdatePlaylistRequest,
  AddVideoRequest,
  ReorderItemRequest
} from '@/types/playlist.types';
import type {
  StartDownloadRequest,
  StartDownloadResponse,
  DownloadStatusResponse
} from '@/types/download.types';
import type { ApiError } from '@/types/api.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance with credentials support for cookies
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookie-based sessions
});

// Request interceptor - add any auth headers if needed
apiClient.interceptors.request.use(
  (config) => {
    // Future: Add bearer token if switching from cookies to JWT
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle common errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError<ApiError>) => {
    // Handle common errors
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 401:
          // Unauthorized - auth token expired or invalid
          console.error('Unauthorized - authentication required');
          // Don't redirect here, let the useAuth hook handle it
          break;
        case 403:
          console.error('Forbidden - insufficient permissions');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Internal server error:', data?.message);
          break;
        default:
          console.error(`API Error ${status}:`, data?.message || error.message);
      }
    } else if (error.request) {
      console.error('No response received from server');
    } else {
      console.error('Error setting up request:', error.message);
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// AUTH API
// ============================================================================

export const authApi = {
  /**
   * Get authorization URL to start OAuth flow
   * Backend: GET /api/auth/login
   */
  login: async (): Promise<LoginResponse> => {
    const response = await apiClient.get<LoginResponse>('/api/auth/login');
    return response.data;
  },

  /**
   * Check authentication status
   * Backend: GET /api/auth/status
   */
  status: async (): Promise<AuthStatus> => {
    const response = await apiClient.get<AuthStatus>('/api/auth/status');
    return response.data;
  },

  /**
   * Logout and clear tokens
   * Backend: POST /api/auth/logout
   */
  logout: async (): Promise<LogoutResponse> => {
    const response = await apiClient.post<LogoutResponse>('/api/auth/logout');
    return response.data;
  },
};

// ============================================================================
// PLAYLIST API
// ============================================================================

export const playlistApi = {
  /**
   * Get all playlists for authenticated user
   * Backend: GET /api/playlists
   */
  list: async (): Promise<PlaylistDTO[]> => {
    const response = await apiClient.get<{ success: boolean; data: PlaylistDTO[] }>('/api/playlists');
    return response.data.data;
  },

  /**
   * Get single playlist details
   * Backend: GET /api/playlists/:id
   */
  get: async (id: string): Promise<PlaylistDTO> => {
    const response = await apiClient.get<{ success: boolean; data: PlaylistDTO }>(`/api/playlists/${id}`);
    return response.data.data;
  },

  /**
   * Get playlist items (videos)
   * Backend: GET /api/playlists/:id/items
   */
  getItems: async (id: string): Promise<PlaylistItemDTO[]> => {
    const response = await apiClient.get<{ success: boolean; data: PlaylistItemDTO[] }>(`/api/playlists/${id}/items`);
    return response.data.data;
  },

  /**
   * Create new playlist
   * Backend: POST /api/playlists
   */
  create: async (data: CreatePlaylistRequest): Promise<PlaylistDTO> => {
    const response = await apiClient.post<{ success: boolean; data: PlaylistDTO }>('/api/playlists', data);
    return response.data.data;
  },

  /**
   * Update playlist metadata
   * Backend: PATCH /api/playlists/:id
   */
  update: async (id: string, data: UpdatePlaylistRequest): Promise<PlaylistDTO> => {
    const response = await apiClient.patch<{ success: boolean; data: PlaylistDTO }>(`/api/playlists/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete playlist
   * Backend: DELETE /api/playlists/:id
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/playlists/${id}`);
  },

  /**
   * Add video to playlist
   * Backend: POST /api/playlists/:id/items
   */
  addVideo: async (playlistId: string, data: AddVideoRequest): Promise<PlaylistItemDTO> => {
    const response = await apiClient.post<{ success: boolean; data: PlaylistItemDTO }>(
      `/api/playlists/${playlistId}/items`,
      data
    );
    return response.data.data;
  },

  /**
   * Remove video from playlist
   * Backend: DELETE /api/playlists/:playlistId/items/:itemId
   */
  removeVideo: async (playlistId: string, itemId: string): Promise<void> => {
    await apiClient.delete(`/api/playlists/${playlistId}/items/${itemId}`);
  },

  /**
   * Reorder video in playlist
   * Backend: PATCH /api/playlists/:playlistId/items/:itemId
   */
  reorderVideo: async (
    playlistId: string,
    itemId: string,
    data: ReorderItemRequest
  ): Promise<PlaylistItemDTO> => {
    const response = await apiClient.patch<{ success: boolean; data: PlaylistItemDTO }>(
      `/api/playlists/${playlistId}/items/${itemId}`,
      data
    );
    return response.data.data;
  },
};

// ============================================================================
// DOWNLOAD API
// ============================================================================

export const downloadApi = {
  /**
   * Start playlist download
   * Backend: POST /api/downloads/start
   */
  start: async (data: StartDownloadRequest): Promise<StartDownloadResponse> => {
    const response = await apiClient.post<{ success: boolean; data: StartDownloadResponse }>(
      '/api/downloads/start',
      data
    );
    return response.data.data;
  },

  /**
   * Get download status
   * Backend: GET /api/downloads/:downloadId/status
   */
  status: async (downloadId: string): Promise<DownloadStatusResponse> => {
    const response = await apiClient.get<DownloadStatusResponse>(
      `/api/downloads/${downloadId}/status`
    );
    return response.data;
  },

  /**
   * Get ZIP download URL
   * Returns URL string for anchor tag href
   */
  getZipUrl: (downloadId: string): string => {
    return `${API_BASE_URL}/api/downloads/${downloadId}/zip`;
  },
};

// Export all APIs as default object
export const api = {
  auth: authApi,
  playlists: playlistApi,
  downloads: downloadApi,
};

export default api;
