'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { VideoListItem } from '@/components/playlists/video-list-item';
import { AddVideoForm } from '@/components/playlists/add-video-form';
import { EditPlaylistModal } from '@/components/playlists/edit-playlist-modal';
import { DeletePlaylistDialog } from '@/components/playlists/delete-playlist-dialog';
import { usePlaylistQuery } from '@/hooks/usePlaylistQuery';
import { useRemoveVideo } from '@/hooks/usePlaylistMutations';
import {
  ArrowLeft,
  Download,
  Edit,
  Trash2,
  AlertCircle,
  Globe,
  Lock,
  Unlock,
  ListVideo,
} from 'lucide-react';
import VideoModal from '@/components/playlists/video-modal';

interface PlaylistDetailPageProps {
  params: Promise<{ id: string }>;
}

const privacyConfig = {
  public: {
    icon: Globe,
    label: 'Public',
    className: 'text-green-600',
  },
  private: {
    icon: Lock,
    label: 'Private',
    className: 'text-gray-600',
  },
  unlisted: {
    icon: Unlock,
    label: 'Unlisted',
    className: 'text-blue-600',
  },
};

function PlaylistDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const { playlist, items, isLoading, error } = usePlaylistQuery(id);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [removingVideoId, setRemovingVideoId] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const removeVideo = useRemoveVideo();

  const openModal = (id: string) => {
    setSelectedVideoId(id);
  };

  const closeModal = () => {
    setSelectedVideoId(null);
  };

  const handleRemoveVideo = async (itemId: string) => {
    setRemovingVideoId(itemId);
    try {
      await removeVideo.mutateAsync({ playlistId: id, itemId });
    } catch (error) {
      console.error('Failed to remove video:', error);
    } finally {
      setRemovingVideoId(null);
    }
  };

  const handleDeleteSuccess = () => {
    router.push('/playlists');
  };

  // Loading State
  if (isLoading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] py-8">
        <Container size="lg">
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        </Container>
      </main>
    );
  }

  // Error State
  if (error || !playlist) {
    return (
      <main className="min-h-[calc(100vh-4rem)] py-8">
        <Container size="lg">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Playlist</AlertTitle>
            <AlertDescription>
              {error?.message || 'Failed to load playlist. It may not exist or you may not have access to it.'}
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link href="/playlists">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Playlists
              </Link>
            </Button>
          </div>
        </Container>
      </main>
    );
  }

  const privacyInfo = privacyConfig[playlist.privacyStatus];
  const PrivacyIcon = privacyInfo.icon;

  return (
    <main className="min-h-[calc(100vh-4rem)] py-8">
      <Container size="lg">
        {/* Back Button */}
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/playlists">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Playlists
            </Link>
          </Button>
        </div>

        {/* Playlist Header */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold tracking-tight mb-2">{playlist.title}</h1>
              {playlist.description && (
                <p className="text-muted-foreground">{playlist.description}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" size="sm" disabled>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className={`flex items-center gap-1.5 ${privacyInfo.className}`}>
              <PrivacyIcon className="h-4 w-4" />
              <span className="font-medium">{privacyInfo.label}</span>
            </div>
            <div>
              {items.length} {items.length === 1 ? 'video' : 'videos'}
            </div>
          </div>
        </div>

        {/* Add Video Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Add Videos</h2>
          <AddVideoForm
            playlistId={id}
            onSuccess={() => {
              console.log('Video added successfully!');
            }}
          />
        </div>

        {/* Videos List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Videos</h2>

          {items.length === 0 ? (
            <EmptyState
              icon={ListVideo}
              title="No videos yet"
              description="Add your first video to this playlist using the form above."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <VideoListItem
                  key={item.id}
                  video={item}
                  openModal={openModal}
                  onRemove={() => handleRemoveVideo(item.id)}
                  isRemoving={removingVideoId === item.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        <VideoModal
          open={!!selectedVideoId}
          videoId={selectedVideoId}
          onClose={closeModal}
        />

        {/* Edit Modal */}
        <EditPlaylistModal
          playlist={playlist}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onSuccess={() => {
            console.log('Playlist updated successfully!');
          }}
        />

        {/* Delete Dialog */}
        <DeletePlaylistDialog
          playlist={playlist}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onSuccess={handleDeleteSuccess}
        />
      </Container>
    </main>
  );
}

export default function PlaylistDetailPage({ params }: PlaylistDetailPageProps) {
  const { id } = use(params);

  return (
    <ProtectedRoute>
      <PlaylistDetailContent id={id} />
    </ProtectedRoute>
  );
}
