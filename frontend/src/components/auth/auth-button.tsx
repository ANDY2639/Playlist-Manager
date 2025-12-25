'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { LogOut, User } from 'lucide-react';

export function AuthButton() {
  const { isAuthenticated, user, isLoading, login, logout, isLoggingIn, isLoggingOut } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <Button variant="ghost" disabled>
        <LoadingSpinner size="sm" />
      </Button>
    );
  }

  // Not authenticated - show login button
  if (!isAuthenticated) {
    return (
      <Button
        onClick={() => login()}
        disabled={isLoggingIn}
        variant="default"
        className="gap-2"
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
    );
  }

  // Authenticated - show user menu
  const userInitial = user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';
  const displayName = user?.name || user?.email || 'User';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userInitial}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            {user?.email && (
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="cursor-default">
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logout()}
          disabled={isLoggingOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          {isLoggingOut ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              <span>Signing out...</span>
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
