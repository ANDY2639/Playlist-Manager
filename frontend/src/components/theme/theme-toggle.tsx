'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';
import { useState, useEffect } from 'react';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const themes = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ] as const;

  const currentTheme = themes.find((t) => t.value === theme) || themes[2];
  const CurrentIcon = currentTheme.icon;

  // Handle theme change with animation
  const handleThemeChange = (newTheme: typeof theme) => {
    setIsAnimating(true);
    setTheme(newTheme);
    setIsOpen(false);

    // Reset animation state after animation completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          group relative flex h-10 w-10 items-center justify-center rounded-xl
          border border-border/50 bg-card/50 backdrop-blur-sm
          transition-all duration-300 ease-out
          hover:bg-accent hover:border-primary/20 hover:scale-105
          active:scale-95
          ${isAnimating ? 'animate-[glowPulse_0.6s_ease-out]' : ''}
        `}
        aria-label="Toggle theme"
      >
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-xl bg-primary/0 blur-lg opacity-0 group-hover:bg-primary/10 group-hover:opacity-100 transition-all duration-300" />

        {/* Icon with rotation animation */}
        <CurrentIcon
          className={`
            relative h-4.5 w-4.5 text-muted-foreground
            group-hover:text-primary
            transition-all duration-300
            ${isAnimating ? 'animate-[iconRotate_0.6s_ease-out]' : ''}
          `}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 z-50 w-48 overflow-hidden rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lifted animate-slide-in-right origin-top-right">
            <div className="p-1.5">
              {themes.map((themeOption) => {
                const Icon = themeOption.icon;
                const isActive = theme === themeOption.value;

                return (
                  <button
                    key={themeOption.value}
                    onClick={() => handleThemeChange(themeOption.value)}
                    className={`
                      group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                      transition-all duration-300 ease-out
                      hover:scale-[1.02] active:scale-[0.98]
                      ${isActive
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                      }
                    `}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                    )}

                    {/* Icon */}
                    <div className={`
                      flex h-8 w-8 items-center justify-center rounded-lg transition-smooth
                      ${isActive
                        ? 'bg-primary/10 border border-primary/20'
                        : 'bg-secondary/50 border border-border/30 group-hover:bg-primary/5 group-hover:border-primary/10'
                      }
                    `}>
                      <Icon className={`h-4 w-4 transition-smooth ${isActive ? 'text-primary' : ''}`} />
                    </div>

                    {/* Label */}
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">{themeOption.label}</div>
                      {themeOption.value === 'system' && (
                        <div className="text-xs text-muted-foreground">
                          {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
                        </div>
                      )}
                    </div>

                    {/* Check mark for active */}
                    {isActive && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer hint */}
            <div className="border-t border-border/30 px-3 py-2 bg-muted/30">
              <p className="text-xs text-muted-foreground">
                Theme syncs across tabs
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
