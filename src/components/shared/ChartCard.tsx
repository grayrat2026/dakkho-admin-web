'use client';

import { type ReactNode } from 'react';
import { GlassCard } from '@/components/shared/GlassCard';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function ChartCard({ title, children, className }: ChartCardProps) {
  return (
    <GlassCard className={cn('p-6', className)} glow>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400 shadow-[0_0_8px_rgba(0,0,0,0.1)]" />
        <h3 className="text-lg font-bold gradient-text">{title}</h3>
      </div>
      <div className="w-full">{children}</div>
    </GlassCard>
  );
}
