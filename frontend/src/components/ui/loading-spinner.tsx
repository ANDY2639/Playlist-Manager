import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-5 w-5 border-2',
  md: 'h-10 w-10 border-3',
  lg: 'h-14 w-14 border-4',
};

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div className="relative" role="status" aria-label="Loading">
      {/* Outer glow ring */}
      <div
        className={cn(
          'absolute inset-0 animate-spin rounded-full border-primary/20 border-t-primary/40',
          sizeClasses[size],
          'blur-sm'
        )}
      />
      {/* Main spinner */}
      <div
        className={cn(
          'relative animate-spin rounded-full border-primary/30 border-t-primary',
          sizeClasses[size],
          className
        )}
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}
