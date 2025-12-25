'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Youtube, Download, FolderArchive, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import Link from 'next/link';

function HomeContent() {
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, login, isLoggingIn } = useAuth();

  // Handle OAuth callback status
  const authStatus = searchParams.get('auth');
  const authError = searchParams.get('error');
  const redirect = searchParams.get('redirect');

  useEffect(() => {
    // If authenticated and no special params, redirect to playlists
    if (isAuthenticated && !authStatus && !redirect) {
      window.location.href = '/playlists';
    }
  }, [isAuthenticated, authStatus, redirect]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-12">
      <Container size="md" className="space-y-8">
        {/* OAuth Status Alerts */}
        {authStatus === 'success' && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">
              Authentication Successful
            </AlertTitle>
            <AlertDescription className="text-green-700">
              You have been successfully signed in. Redirecting to playlists...
            </AlertDescription>
          </Alert>
        )}

        {authStatus === 'denied' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Cancelled</AlertTitle>
            <AlertDescription>
              You cancelled the authentication process. Sign in to access your playlists.
            </AlertDescription>
          </Alert>
        )}

        {authStatus === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>
              {authError ? `Error: ${authError}` : 'An error occurred during authentication.'}
            </AlertDescription>
          </Alert>
        )}

        {redirect === 'auth-required' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              Please sign in to access that page.
            </AlertDescription>
          </Alert>
        )}

        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Youtube className="h-20 w-20 text-primary" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight">
            Playlist Manager
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Manage your YouTube playlists and download videos with ease.
            Organize, curate, and archive your favorite content.
          </p>
        </div>

        {/* CTA Section */}
        {!isAuthenticated && (
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={() => login()}
              disabled={isLoggingIn}
              className="gap-2 text-lg px-8 py-6"
            >
              {isLoggingIn ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in with Google</span>
              )}
            </Button>
          </div>
        )}

        {isAuthenticated && (
          <div className="flex justify-center">
            <Button size="lg" asChild className="text-lg px-8 py-6">
              <Link href="/playlists">Go to Playlists</Link>
            </Button>
          </div>
        )}

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-3 pt-12">
          <Card>
            <CardHeader>
              <Youtube className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Manage Playlists</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create, organize, and manage your YouTube playlists directly from this interface.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Download className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Download Videos</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Download videos from your playlists at 720p resolution for offline viewing.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FolderArchive className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Export as ZIP</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Export entire playlists as ZIP archives for easy storage and sharing.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </Container>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
