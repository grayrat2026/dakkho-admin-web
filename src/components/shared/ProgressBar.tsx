'use client';

import { cn } from '@/lib/utils';

type ProgressVariant = 'black' | 'gray' | 'red' | 'green' | 'blue';
type ProgressSize = 'sm' | 'md' | 'lg';

interface ProgressBarProps {
  value: number;
  variant?: ProgressVariant;
  size?: ProgressSize;
  animated?: boolean;
  showLabel?: boolean;
}

const variantClasses: Record<ProgressVariant, string> = {
  black: 'bg-gradient-to-r from-neutral-900 via-neutral-800 to-black',
  gray: 'bg-gradient-to-r from-neutral-500 via-neutral-400 to-neutral-600',
  red: 'bg-gradient-to-r from-red-700 via-red-600 to-red-700',
  green: 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-700',
  blue: 'bg-gradient-to-r from-neutral-700 via-neutral-600 to-neutral-800',
};

const sizeClasses: Record<ProgressSize, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const shadowClasses: Record<ProgressVariant, string> = {
  black: 'shadow-[0_0_8px_rgba(0,0,0,0.15)]',
  gray: 'shadow-[0_0_8px_rgba(0,0,0,0.08)]',
  red: 'shadow-[0_0_8px_rgba(220,38,38,0.15)]',
  green: 'shadow-[0_0_8px_rgba(16,185,129,0.15)]',
  blue: 'shadow-[0_0_8px_rgba(0,0,0,0.1)]',
};

export function ProgressBar({
  value,
  variant = 'black',
  size = 'md',
  animated = true,
  showLabel = false,
}: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Progress</span>
          <span className="text-xs font-bold text-foreground">{clampedValue}%</span>
        </div>
      )}
      <div className={cn('w-full rounded-full overflow-hidden bg-black/[0.04] dark:bg-white/[0.04]', sizeClasses[size])}>
        <div
          className={cn(
            'h-full rounded-full relative',
            variantClasses[variant],
            shadowClasses[variant],
            animated && 'progress-fill',
            'after:absolute after:inset-0 after:rounded-full',
            'after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent',
            'after:animate-[shimmer_2s_infinite]'
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
