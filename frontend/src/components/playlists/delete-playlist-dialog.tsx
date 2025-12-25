'use client';

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
import { useDeletePlaylist } from '@/hooks/usePlaylistMutations';
import type { PlaylistDTO } from '@/types/playlist.types';
import { AlertCircle, AlertTriangle } from 'lucide-react';

interface DeletePlaylistDialogProps {
  playlist: PlaylistDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeletePlaylistDialog({
  playlist,
  open,
  onOpenChange,
  onSuccess,
}: DeletePlaylistDialogProps) {
  const deletePlaylist = useDeletePlaylist();

  const handleDelete = async () => {
    if (!playlist) return;

    try {
      await deletePlaylist.mutateAsync(playlist.id);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to delete playlist:', error);
    }
  };

  const handleClose = () => {
    if (!deletePlaylist.isPending) {
      deletePlaylist.reset();
      onOpenChange(false);
    }
  };

  if (!playlist) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Delete Playlist?</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-foreground">&quot;{playlist.title}&quot;</span>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {deletePlaylist.isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to delete playlist. Please try again.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={deletePlaylist.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deletePlaylist.isPending}
          >
            {deletePlaylist.isPending ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Deleting...</span>
              </>
            ) : (
              'Delete Playlist'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
