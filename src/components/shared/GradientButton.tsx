'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'danger' | 'success' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface GradientButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  icon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-neutral-900 via-neutral-800 to-black bg-[length:200%_200%] hover:bg-right text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)] dark:from-white dark:via-neutral-200 dark:to-white dark:text-neutral-900 dark:shadow-[0_2px_8px_rgba(255,255,255,0.1)] dark:hover:shadow-[0_6px_20px_rgba(255,255,255,0.15)]',
  danger:
    'bg-gradient-to-r from-red-700 via-red-600 to-red-700 bg-[length:200%_200%] hover:bg-right text-white shadow-[0_2px_8px_rgba(220,38,38,0.25)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.3)]',
  success:
    'bg-gradient-to-r from-neutral-900 via-neutral-800 to-black bg-[length:200%_200%] hover:bg-right text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)] dark:from-white dark:via-neutral-200 dark:to-white dark:text-neutral-900',
  ghost:
    'bg-white/40 dark:bg-white/5 backdrop-blur-sm hover:bg-white/60 dark:hover:bg-white/10 text-foreground shadow-none border border-black/[0.04] dark:border-white/[0.06]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm gap-1.5',
  md: 'px-6 py-2.5 text-sm gap-2',
  lg: 'px-8 py-3.5 text-base gap-2.5',
};

export function GradientButton({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  loading = false,
  className,
  type = 'button',
  icon,
}: GradientButtonProps) {
  const isGhost = variant === 'ghost';

  return (
    <motion.button
      whileHover={disabled || loading ? undefined : {
        y: -1,
        transition: { type: 'spring', stiffness: 400, damping: 20 },
      }}
      whileTap={disabled || loading ? undefined : {
        scale: 0.97,
        y: 0,
        transition: { type: 'spring', stiffness: 500, damping: 25 },
      }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'rounded-xl font-bold inline-flex items-center justify-center',
        'transition-all duration-300 ease-out',
        'relative overflow-hidden',
        variantClasses[variant],
        sizeClasses[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {!isGhost && !disabled && !loading && (
        <span className="absolute inset-0 overflow-hidden pointer-events-none">
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </span>
      )}

      {loading ? (
        <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      ) : icon ? (
        <span className="flex-shrink-0 relative z-10">{icon}</span>
      ) : null}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
