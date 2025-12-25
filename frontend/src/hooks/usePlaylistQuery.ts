import { useQuery } from '@tanstack/react-query';
import { playlistApi } from '@/services/api.service';
import type { PlaylistDTO, PlaylistItemDTO } from '@/types/playlist.types';

interface PlaylistDetailResult {
  playlist: PlaylistDTO | undefined;
  items: PlaylistItemDTO[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function usePlaylistQuery(playlistId: string): PlaylistDetailResult {
  // Fetch playlist metadata
  const playlistQuery = useQuery<PlaylistDTO, Error>({
    queryKey: ['playlist', playlistId],
    queryFn: async () => {
      return await playlistApi.get(playlistId);
    },
    staleTime: 30 * 1000,
    enabled: !!playlistId,
  });

  // Fetch playlist items (videos)
  const itemsQuery = useQuery<PlaylistItemDTO[], Error>({
    queryKey: ['playlist', playlistId, 'items'],
    queryFn: async () => {
      return await playlistApi.getItems(playlistId);
    },
    staleTime: 30 * 1000,
    enabled: !!playlistId,
  });

  return {
    playlist: playlistQuery.data,
    items: itemsQuery.data ?? [],
    isLoading: playlistQuery.isLoading || itemsQuery.isLoading,
    error: playlistQuery.error || itemsQuery.error,
    refetch: () => {
      playlistQuery.refetch();
      itemsQuery.refetch();
    },
  };
}
