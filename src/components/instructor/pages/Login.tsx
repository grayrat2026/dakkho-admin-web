'use client';

import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { useNavigationStore, useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export function Login() {
  const navigate = useNavigationStore((s) => s.navigate);
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) { setError('Please enter email and password'); return; }
    setLoading(true);
    const result = await login(email.trim(), password);
    if (!result) {
      setError('Invalid email or password');
    }
    setLoading(false);
    if (result) navigate('dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-[#0a0a0a] dark:via-[#111] dark:to-[#0a0a0a]" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-neutral-300/20 dark:bg-neutral-600/5 blur-[100px]" animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-neutral-400/15 dark:bg-neutral-500/5 blur-[100px]" animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-neutral-200/15 dark:bg-neutral-700/4 blur-[80px]" animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
      </div>
      <div className="noise-overlay" />

      <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }} className="w-full max-w-md relative z-10">
        <GlassCard className="p-8 md:p-10" premium>
          <div className="relative z-10 space-y-7">
            {/* Logo */}
            <motion.div className="flex justify-center" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}>
              <div className="relative">
                <div className="absolute inset-0 w-16 h-16 rounded-2xl bg-black/10 dark:bg-white/10 blur-xl" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-black dark:from-white dark:via-neutral-200 dark:to-white flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                  <span className="text-white dark:text-neutral-900 text-2xl font-extrabold">D</span>
                </div>
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-br from-neutral-700 to-black dark:from-neutral-300 dark:to-white flex items-center justify-center shadow-sm">
                  <span className="text-white dark:text-neutral-900 text-[11px] font-bold">i</span>
                </div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.div className="text-center" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Instructor Portal</span>
              </div>
              <h1 className="text-3xl font-extrabold">
                <span className="gradient-text">Welcome!</span>
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">Sign in to your Dakkho Instructor account</p>
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} placeholder="Email address" className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm premium-input placeholder:text-muted-foreground/40" />
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} placeholder="Password" className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm premium-input placeholder:text-muted-foreground/40" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>
              <motion.div className="flex justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                <button type="button" onClick={() => navigate('forgot-password')} className="text-sm text-foreground/60 hover:text-foreground font-semibold transition-colors">Forgot password?</button>
              </motion.div>
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, x: [0, -8, 8, -6, 6, -3, 3, 0] }} transition={{ duration: 0.5 }} exit={{ opacity: 0 }} className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200/60 dark:border-red-800/30 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</motion.div>
                )}
              </AnimatePresence>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                <GradientButton type="submit" variant="primary" size="lg" loading={loading} className="w-full">Sign In</GradientButton>
              </motion.div>
            </form>
            <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
              <p className="text-sm text-muted-foreground">Don&apos;t have an account?{' '}
                <button type="button" onClick={() => navigate('apply')} className="text-foreground/70 hover:text-foreground font-semibold transition-colors">Apply as Instructor</button>
              </p>
            </motion.div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
