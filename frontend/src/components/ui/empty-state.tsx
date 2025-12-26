import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 p-16 text-center bg-muted/20',
        className
      )}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
          <Icon className="h-10 w-10 text-primary" />
        </div>
      </div>
      <h3 className="mt-8 text-2xl font-semibold">{title}</h3>
      <p className="mt-3 text-base text-muted-foreground max-w-md leading-relaxed">{description}</p>
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
