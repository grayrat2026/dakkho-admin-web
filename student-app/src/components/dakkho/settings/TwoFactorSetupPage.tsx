'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Smartphone, ChevronLeft, Key, Lock, Eye, EyeOff,
  QrCode, Copy, CheckCircle, AlertTriangle, Loader2, ArrowLeft,
  Download, AlertCircle,
} from 'lucide-react';
import { useNavigationStore } from '@/lib/store';
import { twoFAApi } from '@/lib/api-client';
import { GlassCard } from '../shared/GlassCard';
import { GradientButton } from '../shared/GradientButton';

type Step = 'confirm' | 'scan' | 'verify' | 'backup' | 'done';

export function TwoFactorSetupPage() {
  const { goBack } = useNavigationStore();

  const [step, setStep] = useState<Step>('confirm');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Setup data from API
  const [otpAuthUrl, setOtpAuthUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Verification
  const [totpCode, setTotpCode] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  const handleConfirmPassword = async () => {
    if (!password.trim()) return;
    setIsProcessing(true);
    setError('');
    try {
      const result = await twoFAApi.setup(password);
      setOtpAuthUrl(result.otpAuthUrl);
      setSecret(result.secret);
      setBackupCodes(result.backupCodes);
      setStep('scan');
    } catch (err: any) {
      setError(err?.message || 'Failed to initiate 2FA setup');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyCode = async () => {
    if (totpCode.length !== 6) return;
    setIsProcessing(true);
    setError('');
    try {
      await twoFAApi.verifySetup(totpCode);
      setStep('backup');
    } catch (err: any) {
      setError(err?.message || 'Invalid code. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const downloadBackupCodes = () => {
    const text = `DAKKHO 2FA Backup Codes\nGenerated: ${new Date().toLocaleDateString()}\n\n${backupCodes.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nKeep these codes safe. Each code can only be used once.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dakkho-2fa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

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
          <h1 className="text-xl font-extrabold text-foreground">Two-Factor Authentication</h1>
          <p className="text-xs text-muted-foreground">Secure your account with an authenticator app</p>
        </div>
      </motion.div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6 px-2">
        {['Confirm', 'Scan', 'Verify', 'Backup'].map((label, i) => {
          const stepOrder = ['confirm', 'scan', 'verify', 'backup', 'done'];
          const currentIndex = stepOrder.indexOf(step);
          const isActive = i <= currentIndex - 1;
          const isCurrentStep = stepOrder[i + 1] === step || (i === 0 && step === 'confirm');
          return (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                isActive || isCurrentStep
                  ? 'bg-sky-500 text-white'
                  : 'bg-muted/30 text-muted-foreground'
              }`}>
                {isActive && !isCurrentStep ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-[10px] font-semibold ${isActive || isCurrentStep ? 'text-sky-500' : 'text-muted-foreground'}`}>
                {label}
              </span>
              {i < 3 && <div className={`flex-1 h-0.5 rounded ${isActive ? 'bg-sky-500' : 'bg-muted/20'}`} />}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Confirm Password */}
        {step === 'confirm' && (
          <motion.div key="confirm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                  <Key className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Confirm Your Identity</h3>
                  <p className="text-xs text-muted-foreground">Enter your password to start 2FA setup</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 mb-4">
                <p className="text-xs text-sky-700 dark:text-sky-300 leading-relaxed">
                  Two-factor authentication adds an extra layer of security. Once enabled, you will need both your password and a code from your authenticator app to log in.
                </p>
              </div>

              <div className="relative mb-4">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter your current password"
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-muted/30 border border-white/30 dark:border-white/10 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/50"
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

              <GradientButton onClick={handleConfirmPassword} loading={isProcessing} disabled={!password.trim()} className="w-full">
                <Shield className="w-4 h-4" /> Continue to Setup
              </GradientButton>
            </GlassCard>
          </motion.div>
        )}

        {/* Step 2: Scan QR Code */}
        {step === 'scan' && (
          <motion.div key="scan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-sky-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Scan QR Code</h3>
                  <p className="text-xs text-muted-foreground">Use Google Authenticator, Authy, or any TOTP app</p>
                </div>
              </div>

              <div className="flex flex-col items-center mb-4">
                {/* QR Code placeholder - generates a QR code URL */}
                <div className="w-48 h-48 bg-white rounded-2xl flex items-center justify-center mb-4 overflow-hidden border-2 border-sky-200 dark:border-sky-800">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=192x192&data=${encodeURIComponent(otpAuthUrl)}&bgcolor=ffffff&color=0f172a`}
                    alt="2FA QR Code"
                    className="w-full h-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="flex flex-col items-center justify-center p-4 text-center"><svg class="w-8 h-8 text-muted-foreground mb-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><rect x="18" y="14" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/></svg><p class="text-xs text-muted-foreground">QR Code</p></div>';
                    }}
                  />
                </div>

                <p className="text-xs text-muted-foreground text-center mb-3">
                  Scan this QR code with your authenticator app
                </p>

                {/* Manual entry key */}
                <div className="w-full p-3 rounded-xl bg-muted/30 border border-white/10 dark:border-white/5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Manual Entry Key</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-foreground break-all flex-1">{secret}</code>
                    <motion.button
                      className="text-sky-500 hover:text-sky-600 p-1"
                      onClick={() => copyToClipboard(secret)}
                      whileTap={{ scale: 0.9 }}
                    >
                      {codeCopied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  className="px-4 py-2.5 rounded-xl bg-muted/30 text-sm font-semibold text-foreground flex items-center gap-2"
                  onClick={() => setStep('confirm')}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </motion.button>
                <GradientButton onClick={() => setStep('verify')} className="flex-1">
                  <Smartphone className="w-4 h-4" /> I've Scanned the Code
                </GradientButton>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Step 3: Verify Code */}
        {step === 'verify' && (
          <motion.div key="verify" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <Key className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Verify Setup</h3>
                  <p className="text-xs text-muted-foreground">Enter the 6-digit code from your authenticator app</p>
                </div>
              </div>

              <div className="flex justify-center mb-4">
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`w-11 h-13 rounded-xl border-2 flex items-center justify-center text-lg font-bold transition-all ${
                        totpCode.length === i
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-600'
                          : totpCode.length > i
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-foreground'
                            : 'border-muted/30 bg-muted/20 text-muted-foreground'
                      }`}
                    >
                      {totpCode[i] || ''}
                    </div>
                  ))}
                </div>
              </div>

              <input
                type="text"
                value={totpCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setTotpCode(val);
                  setError('');
                }}
                className="sr-only"
                autoFocus
              />
              {/* Visible input for mobile */}
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={totpCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setTotpCode(val);
                  setError('');
                }}
                placeholder="Enter 6-digit code"
                className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-white/30 dark:border-white/10 text-sm font-bold text-center tracking-[0.5em] text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/50 mb-4"
              />

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <motion.button
                  className="px-4 py-2.5 rounded-xl bg-muted/30 text-sm font-semibold text-foreground flex items-center gap-2"
                  onClick={() => setStep('scan')}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </motion.button>
                <GradientButton onClick={handleVerifyCode} loading={isProcessing} disabled={totpCode.length !== 6} className="flex-1">
                  <CheckCircle className="w-4 h-4" /> Verify & Enable
                </GradientButton>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Step 4: Backup Codes */}
        {step === 'backup' && (
          <motion.div key="backup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Save Backup Codes</h3>
                  <p className="text-xs text-muted-foreground">Store these codes in a safe place</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-4">
                <p className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  Each backup code can only be used once. If you lose your authenticator, you can use these codes to sign in.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {backupCodes.map((code, i) => (
                  <div key={i} className="px-3 py-2 rounded-lg bg-muted/30 font-mono text-xs text-foreground text-center">
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mb-4">
                <motion.button
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 text-sm font-semibold"
                  onClick={() => copyToClipboard(backupCodes.join('\n'))}
                  whileTap={{ scale: 0.95 }}
                >
                  {codeCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {codeCopied ? 'Copied!' : 'Copy All'}
                </motion.button>
                <motion.button
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm font-semibold"
                  onClick={downloadBackupCodes}
                  whileTap={{ scale: 0.95 }}
                >
                  <Download className="w-4 h-4" /> Download
                </motion.button>
              </div>

              <GradientButton onClick={() => setStep('done')} className="w-full">
                <CheckCircle className="w-4 h-4" /> I've Saved My Backup Codes
              </GradientButton>
            </GlassCard>
          </motion.div>
        )}

        {/* Step 5: Done */}
        {step === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <GlassCard className="p-8 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-xl font-extrabold text-foreground mb-2">2FA Enabled!</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Your account is now protected with two-factor authentication. You will need your authenticator app every time you log in.
              </p>
              <GradientButton onClick={goBack}>
                Back to Settings
              </GradientButton>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
