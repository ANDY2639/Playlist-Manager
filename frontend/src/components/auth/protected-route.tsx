'use client';

import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { authApi } from '@/services/api.service';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Simplified Protected Route
 * Only checks if backend is authenticated (not individual users)
 * Shows error if backend authentication is unavailable
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [backendError, setBackendError] = useState<string | null>(null);

  useEffect(() => {
    // Check if backend is authenticated (one-time check)
    authApi.status()
      .then((status) => {
        if (!status.authenticated) {
          setBackendError('Backend is not authenticated with YouTube.');
        }
      })
      .catch((error) => {
        setBackendError(error.message || 'Failed to connect to backend.');
      })
      .finally(() => setIsChecking(false));
  }, []);

  // Show loading while checking backend auth
  if (isChecking) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground">Checking backend...</p>
        </div>
      </div>
    );
  }

  // Show error if backend is not authenticated
  if (backendError) {
    return (
      <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-8">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Backend Authentication Error</AlertTitle>
          <AlertDescription>
            {backendError}
            <br />
            <br />
            Contact the administrator to re-run: <code className="bg-destructive/10 px-1 py-0.5 rounded">npm run auth:setup</code>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Render protected content
  return <>{children}</>;
}
