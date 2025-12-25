'use client';

import { useState, useEffect } from 'react';
import { safeParse } from 'valibot';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useUpdatePlaylist } from '@/hooks/usePlaylistMutations';
import { UpdatePlaylistSchema, type UpdatePlaylistInput } from '@/schemas/playlist.schema';
import type { PlaylistDTO, UpdatePlaylistRequest } from '@/types/playlist.types';
import { AlertCircle } from 'lucide-react';

interface EditPlaylistModalProps {
  playlist: PlaylistDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditPlaylistModal({
  playlist,
  open,
  onOpenChange,
  onSuccess,
}: EditPlaylistModalProps) {
  const [formData, setFormData] = useState<UpdatePlaylistInput>({
    title: '',
    description: '',
    privacyStatus: 'private',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updatePlaylist = useUpdatePlaylist();

  // Pre-populate form with playlist data
  useEffect(() => {
    if (playlist && open) {
      setFormData({
        title: playlist.title,
        description: playlist.description || '',
        privacyStatus: playlist.privacyStatus,
      });
    }
  }, [playlist, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!playlist) return;

    // Validate with Valibot
    const result = safeParse(UpdatePlaylistSchema, formData);

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      for (const issue of result.issues) {
        if (issue.path && issue.path.length > 0) {
          const key = issue.path[0].key as string;
          newErrors[key] = issue.message;
        }
      }
      setErrors(newErrors);
      return;
    }

    // Submit the form
    try {
      await updatePlaylist.mutateAsync({
        playlistId: playlist.id,
        data: result.output as UpdatePlaylistRequest,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to update playlist:', error);
    }
  };

  const handleClose = () => {
    if (!updatePlaylist.isPending) {
      setErrors({});
      updatePlaylist.reset();
      onOpenChange(false);
    }
  };

  if (!playlist) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Playlist</DialogTitle>
            <DialogDescription>
              Update your playlist information below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title Field */}
            <div className="space-y-2">
              <label htmlFor="edit-title" className="text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </label>
              <input
                id="edit-title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="My Awesome Playlist"
                disabled={updatePlaylist.isPending}
                required
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <label htmlFor="edit-description" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="A collection of my favorite videos"
                disabled={updatePlaylist.isPending}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>

            {/* Privacy Field */}
            <div className="space-y-2">
              <label htmlFor="edit-privacyStatus" className="text-sm font-medium">
                Privacy
              </label>
              <select
                id="edit-privacyStatus"
                value={formData.privacyStatus}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    privacyStatus: e.target.value as 'public' | 'private' | 'unlisted',
                  })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={updatePlaylist.isPending}
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
              </select>
              {errors.privacyStatus && (
                <p className="text-sm text-destructive">{errors.privacyStatus}</p>
              )}
            </div>

            {/* Error Alert */}
            {updatePlaylist.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to update playlist. Please try again.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updatePlaylist.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updatePlaylist.isPending}>
              {updatePlaylist.isPending ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Updating...</span>
                </>
              ) : (
                'Update Playlist'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
