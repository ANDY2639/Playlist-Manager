import { useMutation, useQueryClient } from '@tanstack/react-query';
import { playlistApi } from '@/services/api.service';
import type {
  CreatePlaylistRequest,
  UpdatePlaylistRequest,
  AddVideoRequest,
  ReorderItemRequest,
} from '@/types/playlist.types';

/**
 * Hook for creating a new playlist
 */
export function useCreatePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePlaylistRequest) => {
      return await playlistApi.create(data);
    },
    onSuccess: () => {
      // Invalidate playlists query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });
}

/**
 * Hook for updating an existing playlist
 */
export function useUpdatePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playlistId,
      data,
    }: {
      playlistId: string;
      data: UpdatePlaylistRequest;
    }) => {
      return await playlistApi.update(playlistId, data);
    },
    onSuccess: (_, variables) => {
      // Invalidate both the playlists list and the specific playlist
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({
        queryKey: ['playlist', variables.playlistId],
      });
    },
  });
}

/**
 * Hook for deleting a playlist
 */
export function useDeletePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playlistId: string) => {
      return await playlistApi.delete(playlistId);
    },
    onSuccess: (_, playlistId) => {
      // Invalidate playlists query
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      // Remove the specific playlist from cache
      queryClient.removeQueries({ queryKey: ['playlist', playlistId] });
      queryClient.removeQueries({
        queryKey: ['playlist', playlistId, 'items'],
      });
    },
  });
}

/**
 * Hook for adding a video to a playlist
 */
export function useAddVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playlistId,
      data,
    }: {
      playlistId: string;
      data: AddVideoRequest;
    }) => {
      return await playlistApi.addVideo(playlistId, data);
    },
    onSuccess: (_, variables) => {
      // Invalidate playlist items to refetch the video list
      queryClient.invalidateQueries({
        queryKey: ['playlist', variables.playlistId, 'items'],
      });
      // Also invalidate the playlist itself (video count might change)
      queryClient.invalidateQueries({
        queryKey: ['playlist', variables.playlistId],
      });
    },
  });
}

/**
 * Hook for removing a video from a playlist
 */
export function useRemoveVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playlistId,
      itemId,
    }: {
      playlistId: string;
      itemId: string;
    }) => {
      return await playlistApi.removeVideo(playlistId, itemId);
    },
    onSuccess: (_, variables) => {
      // Invalidate playlist items to refetch the video list
      queryClient.invalidateQueries({
        queryKey: ['playlist', variables.playlistId, 'items'],
      });
      // Also invalidate the playlist itself (video count might change)
      queryClient.invalidateQueries({
        queryKey: ['playlist', variables.playlistId],
      });
    },
  });
}

/**
 * Hook for reordering a video in a playlist
 */
export function useReorderVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playlistId,
      itemId,
      data,
    }: {
      playlistId: string;
      itemId: string;
      data: ReorderItemRequest;
    }) => {
      return await playlistApi.reorderVideo(playlistId, itemId, data);
    },
    onSuccess: (_, variables) => {
      // Invalidate playlist items to refetch the video list with new order
      queryClient.invalidateQueries({
        queryKey: ['playlist', variables.playlistId, 'items'],
      });
    },
  });
}
