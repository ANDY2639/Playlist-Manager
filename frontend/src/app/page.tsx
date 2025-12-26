'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

/**
 * Home page - automatically redirects to /playlists
 * No login screen needed - app is fully public
 */
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Immediately redirect to playlists
    router.push('/playlists');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
