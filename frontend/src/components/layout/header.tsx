'use client';

import Link from 'next/link';
import { Youtube, User } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <Container size="full" className="flex h-16 items-center justify-between">
        {/* Logo and Title */}
        <Link href="/playlists" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <Youtube className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold tracking-tight">
            Playlist Manager
          </span>
        </Link>

        {/* Navigation and Connected Account */}
        <nav className="flex items-center gap-6">
          <Link
            href="/playlists"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Playlists
          </Link>

          {/* Connected Account Info */}
          {user && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
          )}
        </nav>
      </Container>
    </header>
  );
}
