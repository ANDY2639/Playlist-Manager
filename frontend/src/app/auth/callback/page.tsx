'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const authStatus = searchParams.get('auth');
    const error = searchParams.get('error');

    // Small delay to show loading state
    const timer = setTimeout(() => {
      if (authStatus === 'success') {
        // Successful auth - redirect to playlists
        router.push('/playlists');
      } else if (authStatus === 'denied' || authStatus === 'error') {
        // Failed auth - redirect to home with error
        router.push(`/?auth=${authStatus}${error ? `&error=${error}` : ''}`);
      } else {
        // No status - something went wrong
        router.push('/?auth=error&error=invalid_callback');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchParams, router]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="flex flex-col items-center gap-6 text-center">
        <LoadingSpinner size="lg" />
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Completing sign in...</h2>
          <p className="text-sm text-muted-foreground">
            Please wait while we verify your authentication.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
