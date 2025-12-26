'use client';

import Link from 'next/link';
import { MoreVertical, Edit, Download, Trash2, Eye, Lock, Globe, Unlock, Play } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PlaylistDTO } from '@/types/playlist.types';

interface PlaylistCardProps {
  playlist: PlaylistDTO;
  onEdit: () => void;
  onDelete: () => void;
  onDownload?: () => void;
}

const privacyConfig = {
  public: {
    icon: Globe,
    label: 'Public',
    className: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  private: {
    icon: Lock,
    label: 'Private',
    className: 'text-slate-600 bg-slate-50 border-slate-200',
  },
  unlisted: {
    icon: Unlock,
    label: 'Unlisted',
    className: 'text-amber-600 bg-amber-50 border-amber-200',
  },
};

export function PlaylistCard({ playlist, onEdit, onDelete, onDownload }: PlaylistCardProps) {
  const privacyInfo = privacyConfig[playlist.privacyStatus];
  const PrivacyIcon = privacyInfo.icon;

  return (
    <Card>
      {/* Subtle red accent line on hover */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-primary via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />

      {/* Main content */}
      <div className="p-6">
        {/* Header with title and actions */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <Link
            href={`/playlists/${playlist.id}`}
            className="flex-1 min-w-0 group/title"
          >
            <h3 className="text-lg font-semibold line-clamp-2 mb-1 text-foreground group-hover/title:text-primary transition-smooth">
              {playlist.title}
            </h3>
            {playlist.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {playlist.description}
              </p>
            )}
          </Link>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-smooth hover:bg-accent hover:text-primary"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={`/playlists/${playlist.id}`} className="flex items-center cursor-pointer">
                  <Eye className="mr-3 h-4 w-4" />
                  <span>View Details</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-3 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              {onDownload && (
                <DropdownMenuItem onClick={onDownload} disabled>
                  <Download className="mr-3 h-4 w-4" />
                  <span>Download</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-3 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Footer metadata */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/40">
          {/* Privacy badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${privacyInfo.className}`}>
            <PrivacyIcon className="h-3 w-3" />
            <span>{privacyInfo.label}</span>
          </div>

          {/* Video count with icon */}
          <div className="flex items-center gap-2 text-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/5 border border-primary/10">
              <Play className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="font-medium text-foreground">
              {playlist.itemCount ?? 0}
            </span>
            <span className="text-muted-foreground">
              {playlist.itemCount === 1 ? 'video' : 'videos'}
            </span>
          </div>
        </div>
      </div>

      {/* Hover effect background */}
      <div className="absolute inset-0 bg-linear-to-br from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-smooth pointer-events-none" />
    </Card>
  );
}
