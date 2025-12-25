'use client';

import { useState } from 'react';
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
import { useCreatePlaylist } from '@/hooks/usePlaylistMutations';
import { CreatePlaylistSchema, type CreatePlaylistInput } from '@/schemas/playlist.schema';
import { AlertCircle } from 'lucide-react';

interface CreatePlaylistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreatePlaylistModal({ open, onOpenChange, onSuccess }: CreatePlaylistModalProps) {
  const [formData, setFormData] = useState<CreatePlaylistInput>({
    title: '',
    description: '',
    privacyStatus: 'private',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createPlaylist = useCreatePlaylist();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate with Valibot
    const result = safeParse(CreatePlaylistSchema, formData);

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
      await createPlaylist.mutateAsync(result.output as any);
      // Reset form
      setFormData({ title: '', description: '', privacyStatus: 'private' });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create playlist:', error);
    }
  };

  const handleClose = () => {
    if (!createPlaylist.isPending) {
      setFormData({ title: '', description: '', privacyStatus: 'private' });
      setErrors({});
      createPlaylist.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
            <DialogDescription>
              Create a new YouTube playlist. You can add videos to it later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title Field */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="My Awesome Playlist"
                disabled={createPlaylist.isPending}
                required
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="A collection of my favorite videos"
                disabled={createPlaylist.isPending}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>

            {/* Privacy Field */}
            <div className="space-y-2">
              <label htmlFor="privacyStatus" className="text-sm font-medium">
                Privacy
              </label>
              <select
                id="privacyStatus"
                value={formData.privacyStatus}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    privacyStatus: e.target.value as 'public' | 'private' | 'unlisted',
                  })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={createPlaylist.isPending}
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
            {createPlaylist.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to create playlist. Please try again.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createPlaylist.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createPlaylist.isPending}>
              {createPlaylist.isPending ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Creating...</span>
                </>
              ) : (
                'Create Playlist'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
