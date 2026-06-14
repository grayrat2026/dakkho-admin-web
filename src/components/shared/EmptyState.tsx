'use client';

import { type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { GradientButton } from '@/components/shared/GradientButton';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="mb-8">
        <div className="relative">
          <div className="absolute inset-0 w-24 h-24 rounded-2xl bg-black/5 dark:bg-white/5 blur-xl" />
          <div className="relative w-20 h-20 rounded-2xl bg-black/[0.04] dark:bg-white/[0.04] backdrop-blur-sm flex items-center justify-center border border-black/[0.04] dark:border-white/[0.04]">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-black dark:from-white dark:via-neutral-200 dark:to-white flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.15)]">
              <Icon className="w-7 h-7 text-white dark:text-neutral-900" />
            </div>
          </div>
        </div>
      </motion.div>
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-8 text-sm leading-relaxed">{description}</p>
      {actionLabel && onAction && <GradientButton variant="primary" size="md" onClick={onAction}>{actionLabel}</GradientButton>}
    </div>
  );
}
