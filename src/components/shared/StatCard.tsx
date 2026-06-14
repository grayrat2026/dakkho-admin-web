'use client';

import { type LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/shared/GlassCard';
import { AnimatedCounter } from '@/components/shared/AnimatedCounter';
import { cn } from '@/lib/utils';

interface Trend {
  value: number;
  isUp: boolean;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: Trend;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  accentColor?: 'black' | 'gray' | 'red' | 'blue' | 'green';
}

const accentConfig = {
  black: {
    iconBg: 'from-neutral-900 via-neutral-800 to-black',
    iconShadow: 'shadow-[0_4px_15px_rgba(0,0,0,0.2)]',
    glowBg: 'bg-black/5',
  },
  gray: {
    iconBg: 'from-neutral-600 via-neutral-500 to-neutral-700',
    iconShadow: 'shadow-[0_4px_15px_rgba(0,0,0,0.15)]',
    glowBg: 'bg-neutral-500/5',
  },
  red: {
    iconBg: 'from-red-700 via-red-600 to-red-700',
    iconShadow: 'shadow-[0_4px_15px_rgba(220,38,38,0.2)]',
    glowBg: 'bg-red-500/5',
  },
  blue: {
    iconBg: 'from-neutral-800 via-neutral-700 to-neutral-900',
    iconShadow: 'shadow-[0_4px_15px_rgba(0,0,0,0.15)]',
    glowBg: 'bg-neutral-400/5',
  },
  green: {
    iconBg: 'from-neutral-900 via-neutral-800 to-black',
    iconShadow: 'shadow-[0_4px_15px_rgba(0,0,0,0.2)]',
    glowBg: 'bg-black/5',
  },
};

export function StatCard({ title, value, icon: Icon, trend, prefix = '', suffix = '', decimals = 0, accentColor = 'black' }: StatCardProps) {
  const accent = accentConfig[accentColor];

  return (
    <GlassCard hover className="p-5" glow>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">{title}</p>
          <p className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
          </p>
          {trend && (
            <div className="flex items-center gap-1.5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, delay: 0.3 }}
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold',
                  trend.isUp
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                    : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                )}
              >
                {trend.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trend.isUp ? '+' : '-'}{trend.value}%
              </motion.div>
              <span className="text-[10px] text-muted-foreground">vs last month</span>
            </div>
          )}
        </div>

        <div className="relative flex-shrink-0">
          <div className={cn('absolute inset-0 w-11 h-11 rounded-xl blur-lg opacity-40', accent.glowBg)} />
          <motion.div
            className={cn(
              'relative w-11 h-11 rounded-xl flex items-center justify-center',
              'bg-gradient-to-br',
              accent.iconBg,
              accent.iconShadow
            )}
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <Icon className="w-5 h-5 text-white dark:text-neutral-100" />
          </motion.div>
        </div>
      </div>
    </GlassCard>
  );
}
