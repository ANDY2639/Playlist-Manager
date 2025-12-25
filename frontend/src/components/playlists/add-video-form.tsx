'use client';

import { useState } from 'react';
import { safeParse } from 'valibot';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAddVideo } from '@/hooks/usePlaylistMutations';
import { AddVideoSchema } from '@/schemas/playlist.schema';
import { Plus, AlertCircle } from 'lucide-react';

interface AddVideoFormProps {
  playlistId: string;
  onSuccess?: () => void;
}

export function AddVideoForm({ playlistId, onSuccess }: AddVideoFormProps) {
  const [videoInput, setVideoInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addVideo = useAddVideo();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate input
    const result = safeParse(AddVideoSchema, { videoId: videoInput.trim() });

    if (!result.success) {
      const issue = result.issues[0];
      setError(issue?.message || 'Invalid video URL or ID');
      return;
    }

    // Submit
    try {
      await addVideo.mutateAsync({
        playlistId,
        data: { videoId: result.output.videoId },
      });
      setVideoInput('');
      onSuccess?.();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to add video. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={videoInput}
            onChange={(e) => setVideoInput(e.target.value)}
            placeholder="Paste YouTube video URL or ID..."
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={addVideo.isPending}
            required
          />
        </div>
        <Button type="submit" disabled={addVideo.isPending || !videoInput.trim()}>
          {addVideo.isPending ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Adding...</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Video
            </>
          )}
        </Button>
      </form>

      {/* Error Message */}
      {(error || addVideo.isError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Failed to add video. Please try again.'}</AlertDescription>
        </Alert>
      )}

      {/* Help Text */}
      <p className="text-sm text-muted-foreground">
        You can paste a YouTube video URL (e.g., https://youtube.com/watch?v=VIDEO_ID) or just the
        video ID.
      </p>
    </div>
  );
}
