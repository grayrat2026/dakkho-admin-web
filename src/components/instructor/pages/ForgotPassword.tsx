'use client';

import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Check, ChevronLeft, KeyRound, ShieldCheck } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { useNavigationStore } from '@/lib/store';
import { authPost } from '@/lib/api-client';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3 | 4;

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
  }),
};

export function ForgotPassword() {
  const navigate = useNavigationStore((s) => s.navigate);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);

  // Step 1: Email
  const [email, setEmail] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Step 2: OTP
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 3: New password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');

  const goToStep = (step: Step) => {
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSendingOtp(true);
    setOtpError('');
    try {
      await authPost('/instructor/auth/forgot-password', { email: email.trim() });
      goToStep(2);
    } catch (err: any) {
      setOtpError(err.message || 'Failed to send OTP. Please check your email.');
    }
    setSendingOtp(false);
  };

  // Step 2: OTP handling
  useEffect(() => {
    if (currentStep === 2 && otpRefs.current[0]) {
      otpRefs.current[0]?.focus();
    }
  }, [currentStep]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || '';
    }
    setOtp(newOtp);
    const nextEmpty = newOtp.findIndex(v => !v);
    if (nextEmpty !== -1) {
      otpRefs.current[nextEmpty]?.focus();
    } else {
      otpRefs.current[5]?.focus();
    }
  };

  const isOtpComplete = otp.every((d) => d !== '');

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!isOtpComplete) return;
    setVerifying(true);
    setOtpError('');
    // Just go to step 3 - we'll verify OTP with the reset password call
    setVerifying(false);
    goToStep(3);
  };

  // Step 3: Reset password
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setResetting(true);
    try {
      const otpCode = otp.join('');
      await authPost('/instructor/auth/reset-password', {
        email: email.trim(),
        otp: otpCode,
        password: newPassword,
      });
      goToStep(4);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    }
    setResetting(false);
  };

  const inputClass = cn(
    'w-full pl-11 pr-12 py-3.5 rounded-xl text-sm',
    'premium-input',
    'placeholder:text-muted-foreground/60',
    'text-foreground'
  );

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
          {currentStep < 4 && (
            <button
              type="button"
              onClick={() => {
                if (currentStep > 1) goToStep((currentStep - 1) as Step);
                else navigate('login');
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              {currentStep === 1 ? 'Back to Sign In' : 'Previous Step'}
            </button>
          )}

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <motion.div
                  className={cn(
                    'w-2.5 h-2.5 rounded-full transition-all duration-300',
                    step < currentStep
                      ? 'bg-foreground/70'
                      : step === currentStep
                      ? 'bg-foreground/70 ring-4 ring-foreground/10'
                      : 'bg-white/30 dark:bg-white/[0.04]'
                  )}
                  animate={{ scale: step === currentStep ? 1.2 : 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                />
                {step < 4 && (
                  <div className={cn(
                    'w-6 h-0.5 rounded-full transition-colors duration-300',
                    step < currentStep ? 'bg-foreground/70' : 'bg-white/20 dark:bg-white/[0.03]'
                  )} />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="relative overflow-hidden min-h-[280px]">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              {/* Step 1: Email input */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <div className="text-center mb-6">
                    <motion.div
                      className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-black/[0.04] to-black/[0.06] dark:from-white/[0.04] dark:to-white/[0.06] flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <Mail className="w-7 h-7 text-foreground/70" />
                    </motion.div>
                    <h2 className="text-xl font-extrabold text-foreground">Forgot Password?</h2>
                    <p className="text-muted-foreground mt-1 text-sm">An OTP will be sent to your email</p>
                  </div>

                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setOtpError(''); }}
                        placeholder="Email address"
                        className={cn(inputClass, 'pr-4')}
                      />
                    </div>
                    {otpError && (
                      <p className="text-xs text-red-500">{otpError}</p>
                    )}
                    <GradientButton
                      type="submit"
                      variant="primary"
                      size="lg"
                      loading={sendingOtp}
                      disabled={!email.trim()}
                      className="w-full"
                    >
                      Send OTP
                    </GradientButton>
                  </form>
                </motion.div>
              )}

              {/* Step 2: OTP verification */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <div className="text-center mb-6">
                    <motion.div
                      className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-black/[0.04] to-black/[0.06] dark:from-white/[0.04] dark:to-white/[0.06] flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <KeyRound className="w-7 h-7 text-foreground/70" />
                    </motion.div>
                    <h2 className="text-xl font-extrabold text-foreground">Verify OTP</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                      A 6-digit OTP was sent to <span className="text-foreground font-medium">{email}</span>
                    </p>
                  </div>

                  <form onSubmit={handleVerifyOtp} className="space-y-5">
                    {/* 6-digit OTP boxes */}
                    <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                      {otp.map((digit, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0, rotateY: -90 }}
                          animate={{ scale: 1, rotateY: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: i * 0.05 }}
                        >
                          <input
                            ref={(el) => { otpRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(i, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                            className={cn(
                              'w-11 h-13 text-center text-lg font-bold rounded-xl',
                              'premium-input',
                              'text-foreground',
                              digit && 'border-neutral-400/50 bg-black/[0.02] dark:bg-white/[0.02]'
                            )}
                          />
                        </motion.div>
                      ))}
                    </div>

                    <GradientButton
                      type="submit"
                      variant="primary"
                      size="lg"
                      loading={verifying}
                      disabled={!isOtpComplete}
                      className="w-full"
                    >
                      Verify
                    </GradientButton>
                  </form>
                </motion.div>
              )}

              {/* Step 3: New password */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <div className="text-center mb-6">
                    <motion.div
                      className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-black/[0.04] to-black/[0.06] dark:from-white/[0.04] dark:to-white/[0.06] flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <ShieldCheck className="w-7 h-7 text-emerald-500" />
                    </motion.div>
                    <h2 className="text-xl font-extrabold text-foreground">New Password</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Create your new password</p>
                  </div>

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                        placeholder="New password"
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                        placeholder="Confirm password"
                        className={cn(inputClass, confirmPassword.length > 0 && newPassword !== confirmPassword ? 'border-red-300 dark:border-red-700 focus:border-red-400 focus:ring-red-500/20' : '')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>

                    {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-red-500"
                      >
                        Passwords do not match
                      </motion.p>
                    )}

                    {/* Error message */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, x: 0 }}
                          animate={{ opacity: 1, x: [0, -8, 8, -6, 6, -3, 3, 0] }}
                          transition={{ duration: 0.5 }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400"
                        >
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <GradientButton
                      type="submit"
                      variant="primary"
                      size="lg"
                      loading={resetting}
                      disabled={newPassword.length < 8 || newPassword !== confirmPassword}
                      className="w-full"
                    >
                      Reset Password
                    </GradientButton>
                  </form>
                </motion.div>
              )}

              {/* Step 4: Success */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="text-center"
                >
                  {/* Animated checkmark */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
                    className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-500 flex items-center justify-center shadow-[0_4px_15px_rgba(16,185,129,0.3)]"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.5 }}
                    >
                      <Check className="w-10 h-10 text-white" strokeWidth={3} />
                    </motion.div>
                  </motion.div>

                  <motion.h2
                    className="text-2xl font-extrabold text-foreground mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    Password Reset!
                  </motion.h2>
                  <motion.p
                    className="text-muted-foreground text-sm mb-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    Your password has been changed successfully. Sign in now.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <GradientButton
                      variant="primary"
                      size="lg"
                      className="w-full"
                      onClick={() => navigate('login')}
                    >
                      Sign In
                    </GradientButton>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
