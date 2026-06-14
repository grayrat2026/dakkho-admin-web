'use client';

import { motion } from 'framer-motion';
import { Search, ChevronLeft, Info, Mail, ShieldCheck } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { useNavigationStore } from '@/lib/store';

export function ApplicationStatus() {
  const navigate = useNavigationStore((s) => s.navigate);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-slate-950 dark:via-slate-900 dark:to-neutral-950">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-neutral-200/30 dark:bg-neutral-800/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-neutral-300/30 dark:bg-neutral-700/10 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <GlassCard className="p-6 md:p-8">
          {/* Back to login */}
          <button
            type="button"
            onClick={() => navigate('login')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Sign In
          </button>

          {/* Title */}
          <div className="text-center mb-6">
            <motion.div
              className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-black/[0.04] to-black/[0.06] dark:from-white/[0.04] dark:to-white/[0.06] flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Info className="w-7 h-7 text-foreground/70" />
            </motion.div>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-neutral-900 to-black dark:from-neutral-100 dark:to-white bg-clip-text text-transparent">
              Application Status
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Instructor account information</p>
          </div>

          {/* Info content */}
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Admin Invitation Required</p>
                  <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-1 leading-relaxed">
                    Instructor accounts on Dakkho are created by the admin team. You cannot apply directly — you must be invited by an administrator.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/30 dark:bg-white/[0.03] backdrop-blur-sm border border-white/30 dark:border-white/[0.04] rounded-xl p-4 space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-foreground/50 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Already invited?</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    If you have received login credentials from the admin team, sign in directly using those credentials.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Search className="w-5 h-5 text-foreground/50 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Want to become an instructor?</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Contact the Dakkho admin team via email or support to request instructor access. They will review your request and create an account for you.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-foreground/50 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Account setup</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Once your account is created by admin, sign in and change your password in Settings for security.
                  </p>
                </div>
              </div>
            </div>

            <GradientButton
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => navigate('login')}
            >
              Go to Sign In
            </GradientButton>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
