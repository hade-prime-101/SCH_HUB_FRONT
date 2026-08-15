'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/app/ui/theme-provider';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getThemeIcon = () => {
    if (theme === 'light') {
      return <Sun className="h-4 w-4" />;
    } else if (theme === 'dark') {
      return <Moon className="h-4 w-4" />;
    } else {
      return <Monitor className="h-4 w-4" />;
    }
  };

  const getThemeLabel = () => {
    if (theme === 'light') {
      return 'Light';
    } else if (theme === 'dark') {
      return 'Dark';
    } else {
      return 'System';
    }
  };

  const getNextThemeLabel = () => {
    if (theme === 'light') {
      return 'Switch to dark theme';
    } else if (theme === 'dark') {
      return 'Switch to system theme';
    } else {
      return 'Switch to light theme';
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn("relative h-8 w-8", className)}
      aria-label={getNextThemeLabel()}
      title={getNextThemeLabel()}
    >
      <div className="relative h-4 w-4">
        <Sun className="absolute h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <Monitor className="absolute h-4 w-4 rotate-90 scale-0 transition-all system:rotate-0 system:scale-100" />
      </div>
      <span className="sr-only">{getThemeLabel()}</span>
    </Button>
  );
}

export function ThemeSelect() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={theme === 'light' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setTheme('light')}
        className="gap-2"
      >
        <Sun className="h-4 w-4" />
        Light
      </Button>
      <Button
        variant={theme === 'dark' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setTheme('dark')}
        className="gap-2"
      >
        <Moon className="h-4 w-4" />
        Dark
      </Button>
      <Button
        variant={theme === 'system' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setTheme('system')}
        className="gap-2"
      >
        <Monitor className="h-4 w-4" />
        System
      </Button>
    </div>
  );
}