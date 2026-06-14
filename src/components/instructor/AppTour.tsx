'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTourStore } from '@/lib/store';
import { GradientButton } from '@/components/shared/GradientButton';
import type { TourStep } from '@/lib/types';

const appTourSteps: TourStep[] = [
  { target: '[data-tour="sidebar"]', title: 'Navigation', description: 'Use the sidebar to navigate between different sections of the app.', position: 'right', spotlightPadding: 12 },
  { target: '[data-tour="dashboard-stats"]', title: 'Dashboard Stats', description: 'View your key metrics at a glance — students, courses, revenue, and rating.', position: 'bottom', spotlightPadding: 12 },
  { target: '[data-tour="quick-actions"]', title: 'Quick Actions', description: 'Quickly access common tasks like adding videos or viewing analytics.', position: 'bottom', spotlightPadding: 12 },
  { target: '[data-tour="notifications"]', title: 'Notifications', description: 'Stay updated with student enrollments, reviews, and schedule reminders.', position: 'bottom', spotlightPadding: 12 },
  { target: '[data-tour="profile-menu"]', title: 'Profile & Settings', description: 'Manage your profile, change password, and customize your experience.', position: 'bottom', spotlightPadding: 12 },
];

export function AppTour() {
  const { isActive, currentStep, nextStep, prevStep, completeTour, skipTour } = useTourStore();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const steps = appTourSteps;
  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const rafRef = useRef<number>(0);

  const updateTargetRect = useCallback(() => {
    if (!isActive || !step) return;
    const el = document.querySelector(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      // Use rAF to defer setState outside the effect body
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setTargetRect(rect);
      });
    }
  }, [isActive, step]);

  useEffect(() => {
    updateTargetRect();
  }, [updateTargetRect, currentStep]);

  useEffect(() => {
    if (!isActive) return;
    window.addEventListener('resize', updateTargetRect);
    return () => window.removeEventListener('resize', updateTargetRect);
  }, [isActive, updateTargetRect]);

  if (!isActive || !step || !targetRect) return null;

  const padding = step.spotlightPadding || 12;
  const tooltipPosition = step.position || 'bottom';

  const getTooltipStyle = () => {
    const top = targetRect.top + targetRect.height / 2;
    const left = targetRect.left + targetRect.width / 2;

    switch (tooltipPosition) {
      case 'top':
        return { top: targetRect.top - padding - 16, left, transform: 'translate(-50%, -100%)' };
      case 'bottom':
        return { top: targetRect.bottom + padding + 16, left, transform: 'translate(-50%, 0)' };
      case 'left':
        return { top, left: targetRect.left - padding - 16, transform: 'translate(-100%, -50%)' };
      case 'right':
        return { top, left: targetRect.right + padding + 16, transform: 'translate(0, -50%)' };
      default:
        return { top: targetRect.bottom + padding + 16, left, transform: 'translate(-50%, 0)' };
    }
  };

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed inset-0 z-[100] pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/60" onClick={skipTour} />

          {/* Spotlight cutout */}
          <motion.div
            className="absolute rounded-xl border-2 border-foreground/50 shadow-[0_0_20px_rgba(0,0,0,0.3)]"
            initial={false}
            animate={{
              top: targetRect.top - padding,
              left: targetRect.left - padding,
              width: targetRect.width + padding * 2,
              height: targetRect.height + padding * 2,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              background: 'transparent',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
            }}
          />

          {/* Tooltip */}
          <motion.div
            className="absolute z-[101]"
            style={getTooltipStyle()}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <div className="glass-card p-5 max-w-sm w-[300px]">
              {/* Close button */}
              <button
                onClick={skipTour}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Step content */}
              <h3 className="font-bold text-base mb-2 pr-6 gradient-text">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{step.description}</p>

              {/* Progress dots */}
              <div className="flex gap-1.5 mb-4">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i === currentStep
                        ? 'bg-foreground w-4'
                        : i < currentStep
                        ? 'bg-foreground/60'
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <GradientButton
                      variant="ghost"
                      size="sm"
                      onClick={prevStep}
                      icon={<ChevronLeft className="w-4 h-4" />}
                    >
                      Back
                    </GradientButton>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={skipTour}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                  >
                    Skip
                  </button>
                  <GradientButton
                    variant="primary"
                    size="sm"
                    onClick={isLast ? completeTour : nextStep}
                    icon={
                      isLast ? undefined : <ChevronRight className="w-4 h-4" />
                    }
                  >
                    {isLast ? 'Finish' : 'Next'}
                  </GradientButton>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
