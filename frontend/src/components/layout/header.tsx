'use client';

import Link from 'next/link';
import { Play } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { ThemeToggle } from '@/components/theme/theme-toggle';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border/50">
      <Container size="full" className="flex h-20 items-center justify-between">
        {/* Logo - Refined minimalist wordmark */}
        <Link
          href="/playlists"
          className="group flex items-center gap-3 transition-smooth hover:opacity-90"
        >
          {/* Red accent mark */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-lg opacity-0 group-hover:opacity-100 transition-smooth" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 border border-primary/10 group-hover:bg-primary/10 transition-smooth">
              <Play className="h-5 w-5 text-primary fill-primary" />
            </div>
          </div>

          <div className="flex flex-col -space-y-1">
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Playlist
            </span>
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Manager
            </span>
          </div>
        </Link>

        {/* Right section - Navigation and Theme Toggle */}
        <nav className="flex items-center gap-6">
          <Link
            href="/playlists"
            className="relative text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground group"
          >
            <span>Playlists</span>
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-smooth group-hover:w-full" />
          </Link>

          {/* Theme Toggle */}
          <ThemeToggle />
        </nav>
      </Container>
    </header>
  );
}
