'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, TrendingUp, Clock, DollarSign, ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip,
} from 'recharts';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatCard } from '@/components/shared/StatCard';
import { ChartCard } from '@/components/shared/ChartCard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { useDashboard } from '@/lib/api-hooks';
import { cn, formatBDT, relativeTime } from '@/lib/utils';
import { staggerChildren } from '@/lib/animations';

const statusBadge: Record<string, { label: string; color: string }> = {
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  pending: { label: 'Pending', color: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-300' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

export function Earnings() {
  const [txnPage, setTxnPage] = useState(1);
  const { data: dashboardData, loading } = useDashboard();

  const dashboard = dashboardData?.dashboard || {} as any;
  const totalRevenue = dashboard.totalRevenue || 0;
  const monthlyRevenue = dashboard.monthlyRevenue || [];
  const transactions = dashboard.transactions || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  const chartData = monthlyRevenue.map((m: any) => ({
    ...m,
    monthLabel: m.month ? m.month.split('-')[1] : '',
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
          Earnings <span className="gradient-text">Overview</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">View your financial details and transactions</p>
      </motion.div>

      {/* Summary StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div {...staggerChildren(0)}>
          <StatCard
            title="Total Revenue"
            value={totalRevenue}
            icon={Wallet}
            prefix="৳"
            trend={{ value: 15, isUp: true }}
          />
        </motion.div>
        <motion.div {...staggerChildren(1)}>
          <StatCard
            title="This Month"
            value={dashboard.thisMonth || 0}
            icon={TrendingUp}
            prefix="৳"
            trend={{ value: 8, isUp: true }}
          />
        </motion.div>
        <motion.div {...staggerChildren(2)}>
          <StatCard
            title="Pending Payout"
            value={dashboard.pendingPayout || 0}
            icon={Clock}
            prefix="৳"
          />
        </motion.div>
      </div>

      {/* Revenue Chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <ChartCard title="Monthly Revenue">
            <div className="h-64 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0a0a0a" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0a0a0a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="monthLabel"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                    }}
                    formatter={(value: number) => [formatBDT(value), 'Revenue']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#0a0a0a"
                    strokeWidth={2.5}
                    fill="url(#earningsGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </motion.div>
      )}

      {/* Transaction List */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <GlassCard glow className="p-6">
          <h3 className="text-lg font-bold gradient-text mb-4">Recent Transactions</h3>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No transactions available</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((txn: any, i: number) => {
                const badge = statusBadge[txn.status] || statusBadge.completed;
                return (
                  <motion.div
                    key={txn.id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/30 dark:bg-white/[0.03] backdrop-blur-sm border border-white/30 dark:border-white/[0.04]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-black dark:from-white dark:via-neutral-200 dark:to-white flex items-center justify-center flex-shrink-0 shadow-[0_4px_15px_rgba(0,0,0,0.1)]">
                      <DollarSign className="w-5 h-5 text-white dark:text-black" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{txn.courseName}</p>
                      <p className="text-xs text-muted-foreground truncate">{txn.studentName} • {txn.date}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-foreground">{formatBDT(txn.amount)}</p>
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', badge.color)}>
                        {badge.label}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}
