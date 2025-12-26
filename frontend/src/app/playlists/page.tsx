'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Container } from '@/components/layout/container';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent } from '@/components/ui/card';
import { PlaylistCard } from '@/components/playlists/playlist-card';
import { CreatePlaylistModal } from '@/components/playlists/create-playlist-modal';
import { EditPlaylistModal } from '@/components/playlists/edit-playlist-modal';
import { DeletePlaylistDialog } from '@/components/playlists/delete-playlist-dialog';
import { usePlaylistsQuery } from '@/hooks/usePlaylistsQuery';
import { ListVideo, Plus, AlertCircle } from 'lucide-react';
import type { PlaylistDTO } from '@/types/playlist.types';

function PlaylistsContent() {
  const { playlists, isLoading, error, refetch } = usePlaylistsQuery();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<PlaylistDTO | null>(null);
  const [deletingPlaylist, setDeletingPlaylist] = useState<PlaylistDTO | null>(null);

  // Loading State
  if (isLoading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] py-8">
        <Container size="xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        </Container>
      </main>
    );
  }

  // Error State
  if (error) {
    return (
      <main className="min-h-[calc(100vh-4rem)] py-8">
        <Container size="xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Playlists</AlertTitle>
            <AlertDescription>
              {error.message || 'Failed to load playlists. Please try again.'}
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] py-12">
      <Container size="xl">
        {/* Header with entrance animation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12 animate-fade-in-up">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight">Your Playlists</h1>
            <p className="text-muted-foreground text-base">
              Manage and download your YouTube playlists with ease
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)} size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Playlist
          </Button>
        </div>

        {/* Empty State */}
        {playlists.length === 0 ? (
          <div className="animate-fade-in-up stagger-1">
            <EmptyState
              icon={ListVideo}
              title="No playlists yet"
              description="Create your first playlist to get started with managing your YouTube content."
              action={
                <Button onClick={() => setCreateModalOpen(true)} size="lg" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Playlist
                </Button>
              }
            />
          </div>
        ) : (
          /* Playlists Grid with staggered animations */
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {playlists.map((playlist, index) => (
              <div
                key={playlist.id}
                className={`animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}
              >
                <PlaylistCard
                  playlist={playlist}
                  onEdit={() => setEditingPlaylist(playlist)}
                  onDelete={() => setDeletingPlaylist(playlist)}
                  onDownload={() => console.log('Download:', playlist.id)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Create Playlist Modal */}
        <CreatePlaylistModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onSuccess={() => {
            console.log('Playlist created successfully!');
          }}
        />

        {/* Edit Playlist Modal */}
        <EditPlaylistModal
          playlist={editingPlaylist}
          open={!!editingPlaylist}
          onOpenChange={(open) => !open && setEditingPlaylist(null)}
          onSuccess={() => {
            console.log('Playlist updated successfully!');
            setEditingPlaylist(null);
          }}
        />

        {/* Delete Playlist Dialog */}
        <DeletePlaylistDialog
          playlist={deletingPlaylist}
          open={!!deletingPlaylist}
          onOpenChange={(open) => !open && setDeletingPlaylist(null)}
          onSuccess={() => {
            console.log('Playlist deleted successfully!');
            setDeletingPlaylist(null);
          }}
        />
      </Container>
    </main>
  );
}

export default function PlaylistsPage() {
  return (
    <ProtectedRoute>
      <PlaylistsContent />
    </ProtectedRoute>
  );
}
