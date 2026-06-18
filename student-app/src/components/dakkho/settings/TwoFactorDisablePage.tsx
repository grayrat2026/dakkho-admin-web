'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ChevronLeft, Lock, Eye, EyeOff, AlertTriangle,
  CheckCircle, AlertCircle, Loader2,
} from 'lucide-react';
import { useNavigationStore } from '@/lib/store';
import { twoFAApi } from '@/lib/api-client';
import { GlassCard } from '../shared/GlassCard';
import { GradientButton } from '../shared/GradientButton';

export function TwoFactorDisablePage() {
  const { goBack } = useNavigationStore();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [disabled, setDisabled] = useState(false);

  const handleDisable = async () => {
    if (!password.trim()) return;
    setIsProcessing(true);
    setError('');
    try {
      await twoFAApi.disable(password);
      setDisabled(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to disable 2FA');
    } finally {
      setIsProcessing(false);
    }
  };

  if (disabled) {
    return (
      <div className="pb-20 lg:pb-0">
        <GlassCard className="p-8 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          </motion.div>
          <h3 className="text-xl font-extrabold text-foreground mb-2">2FA Disabled</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Two-factor authentication has been turned off. Your account now uses only password protection.
          </p>
          <GradientButton onClick={goBack}>
            Back to Settings
          </GradientButton>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0">
      {/* Header */}
      <motion.div className="flex items-center gap-3 mb-6" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <motion.button
          className="w-9 h-9 rounded-xl bg-muted/30 flex items-center justify-center text-foreground"
          onClick={goBack}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
        <div>
          <h1 className="text-xl font-extrabold text-foreground">Disable 2FA</h1>
          <p className="text-xs text-muted-foreground">Turn off two-factor authentication</p>
        </div>
      </motion.div>

      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Security Warning</h3>
            <p className="text-xs text-muted-foreground">Disabling 2FA reduces account security</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-4">
          <p className="text-xs text-red-600/80 dark:text-red-400/80 leading-relaxed">
            Without two-factor authentication, your account will only be protected by your password. If someone obtains your password, they will have full access to your account.
          </p>
        </div>

        <div className="relative mb-4">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            placeholder="Enter your current password"
            className="w-full pl-10 pr-12 py-3 rounded-xl bg-muted/30 border border-white/30 dark:border-white/10 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/50"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </p>
          </div>
        )}

        <GradientButton variant="danger" onClick={handleDisable} loading={isProcessing} disabled={!password.trim()} className="w-full">
          <Shield className="w-4 h-4" /> Disable Two-Factor Authentication
        </GradientButton>
      </GlassCard>
    </div>
  );
}
