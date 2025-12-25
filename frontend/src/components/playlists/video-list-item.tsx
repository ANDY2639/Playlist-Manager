'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';
import type { PlaylistItemDTO } from '@/types/playlist.types';

interface VideoListItemProps {
  video: PlaylistItemDTO;
  isRemoving?: boolean;
  onRemove: () => void;
  openModal: (id: string) => void;
}

export function VideoListItem({ video, onRemove, isRemoving = false, openModal }: VideoListItemProps) {
  return (
    <div className="group flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      {/* Thumbnail */}
      <div className="shrink-0">
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.title || 'Video thumbnail'}
            className="w-40 h-24 object-cover rounded-md"
            width={160}
            height={96}
          />
        ) : (
          <div className="w-40 h-24 bg-muted rounded-md flex items-center justify-center">
            <span className="text-sm text-muted-foreground">No thumbnail</span>
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium line-clamp-2 mb-1" onClick={() => openModal(video.videoId)}>
          {video.title || 'Untitled Video'}
        </h3>
        {video.channelTitle && (
          <p className="text-sm text-muted-foreground mb-1">{video.channelTitle}</p>
        )}
        {video.videoPublishedAt && (
          <p className="text-xs text-muted-foreground">
            Added on {new Date(video.videoPublishedAt).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={isRemoving}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Remove video</span>
        </Button>
      </div>
    </div>
  );
}
