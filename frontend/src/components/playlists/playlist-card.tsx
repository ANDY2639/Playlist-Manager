'use client';

import Link from 'next/link';
import { MoreVertical, Edit, Download, Trash2, Eye, Lock, Globe, Unlock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    className: 'text-green-600 bg-green-50',
  },
  private: {
    icon: Lock,
    label: 'Private',
    className: 'text-gray-600 bg-gray-50',
  },
  unlisted: {
    icon: Unlock,
    label: 'Unlisted',
    className: 'text-blue-600 bg-blue-50',
  },
};

export function PlaylistCard({ playlist, onEdit, onDelete, onDownload }: PlaylistCardProps) {
  const privacyInfo = privacyConfig[playlist.privacyStatus];
  const PrivacyIcon = privacyInfo.icon;

  return (
    <Card className="group transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="line-clamp-2 text-lg">
              <Link
                href={`/playlists/${playlist.id}`}
                className="hover:text-primary transition-colors"
              >
                {playlist.title}
              </Link>
            </CardTitle>
          </div>

          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/playlists/${playlist.id}`} className="flex items-center cursor-pointer">
                  <Eye className="mr-2 h-4 w-4" />
                  <span>View Details</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              {onDownload && (
                <DropdownMenuItem onClick={onDownload} disabled>
                  <Download className="mr-2 h-4 w-4" />
                  <span>Download (Coming Soon)</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {playlist.description && (
          <CardDescription className="line-clamp-2 mt-2">
            {playlist.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between text-sm">
          {/* Privacy Badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${privacyInfo.className}`}>
            <PrivacyIcon className="h-3.5 w-3.5" />
            <span className="font-medium">{privacyInfo.label}</span>
          </div>

          {/* Video Count */}
          <div className="text-muted-foreground">
            {playlist.itemCount ?? 0} {playlist.itemCount === 1 ? 'video' : 'videos'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
