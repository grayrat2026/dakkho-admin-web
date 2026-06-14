'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  premium?: boolean;
  glow?: boolean;
}

export function GlassCard({ children, className, hover = false, onClick, premium = false, glow = false }: GlassCardProps) {
  const baseClasses = cn(
    'relative rounded-2xl overflow-hidden',
    'backdrop-blur-2xl backdrop-saturate-[150%]',
    'bg-white/55 dark:bg-neutral-900/55',
    'border border-black/[0.04] dark:border-white/[0.04]',
    'shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]',
    'dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.2)]',
    'before:absolute before:inset-x-0 before:top-0 before:h-px',
    'before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent',
    'dark:before:from-transparent dark:before:via-white/[0.03] dark:before:to-transparent',
    'before:pointer-events-none before:z-10',
    glow && 'shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06),0_8px_30px_rgba(0,0,0,0.04)]',
    glow && 'dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.2),0_8px_30px_rgba(0,0,0,0.15)]',
    premium && 'p-[1px] bg-gradient-to-br from-black/15 via-black/[0.02] to-black/10 bg-[length:300%_300%] animate-[premiumBorderShift_6s_ease_infinite]',
    onClick && 'cursor-pointer',
    className
  );

  const innerClasses = cn(
    'relative z-10 h-full',
    premium ? 'bg-white/60 dark:bg-neutral-900/60 backdrop-blur-2xl rounded-[calc(1rem-1px)]' : '',
  );

  if (hover) {
    return (
      <motion.div
        whileHover={{
          y: -3,
          boxShadow: '0 8px 30px -4px rgba(0,0,0,0.1)',
        }}
        whileTap={{ scale: 0.985, y: -1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={cn(baseClasses, 'card-hover-premium')}
        onClick={onClick}
      >
        <div className={innerClasses}>{children}</div>
      </motion.div>
    );
  }

  return (
    <div className={baseClasses} onClick={onClick}>
      <div className={innerClasses}>{children}</div>
    </div>
  );
}
