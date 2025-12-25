import { useQuery } from '@tanstack/react-query';
import { playlistApi } from '@/services/api.service';
import type { PlaylistDTO } from '@/types/playlist.types';

export function usePlaylistsQuery() {
  const query = useQuery<PlaylistDTO[], Error>({
    queryKey: ['playlists'],
    queryFn: async () => {
      return await playlistApi.list();
    },
    staleTime: 30 * 1000, // 30 seconds - playlists don't change frequently
    refetchOnWindowFocus: true,
  });

  return {
    playlists: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
}
