'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Home, BookOpen, BarChart3, Bell, UserCircle } from 'lucide-react';
import { useNavigationStore, useNotificationStore } from '@/lib/store';
import { BOTTOM_NAV_HEIGHT } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { PageName } from '@/lib/types';

interface NavTab { icon: React.ElementType; label: string; page: PageName; showBadge?: boolean; }

const tabs: NavTab[] = [
  { icon: Home, label: 'Home', page: 'dashboard' },
  { icon: BookOpen, label: 'Courses', page: 'courses' },
  { icon: BarChart3, label: 'Analytics', page: 'analytics' },
  { icon: Bell, label: 'Alerts', page: 'notifications', showBadge: true },
  { icon: UserCircle, label: 'Profile', page: 'profile' },
];

// Pages that are "under" courses - highlight the Courses tab
const coursePages: PageName[] = ['course-detail', 'course-curriculum', 'course-videos', 'course-settings', 'course-live', 'course-new'];

export function BottomNav() {
  const { currentPage, navigate } = useNavigationStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const getIsActive = (tabPage: PageName) => {
    if (currentPage === tabPage) return true;
    if (tabPage === 'courses' && coursePages.includes(currentPage)) return true;
    return false;
  };

  return (
    <motion.nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 md:hidden',
        'backdrop-blur-2xl backdrop-saturate-[200%]',
        'bg-white/70 dark:bg-neutral-900/70',
        'border-t border-black/[0.04] dark:border-white/[0.04]',
        'before:absolute before:top-0 before:left-0 before:right-0 before:h-px',
        'before:bg-gradient-to-r before:from-transparent before:via-black/[0.06] before:to-transparent',
        'dark:before:from-transparent dark:before:via-white/[0.04] dark:before:to-transparent',
        'before:pointer-events-none'
      )}
      style={{ height: BOTTOM_NAV_HEIGHT, paddingBottom: 'env(safe-area-inset-bottom)' }}
      initial={{ y: 64 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = getIsActive(tab.page);
          return (
            <motion.button
              key={tab.page}
              className="flex flex-col items-center justify-center gap-0.5 w-16 h-full relative"
              onClick={() => navigate(tab.page)}
              whileTap={{ scale: 0.9 }}
              whileHover={{ y: -3 }}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    className="absolute inset-x-2 top-1 bottom-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.04]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </AnimatePresence>

              <motion.div className="relative" animate={{ y: isActive ? -3 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                <tab.icon
                  className={cn('w-[20px] h-[20px] transition-all duration-300', isActive ? 'text-foreground' : 'text-muted-foreground/50')}
                  fill={isActive ? 'currentColor' : 'none'}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {tab.showBadge && unreadCount > 0 && (
                  <motion.span
                    className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] rounded-full bg-black dark:bg-white flex items-center justify-center px-1"
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}
                  >
                    <span className="text-[9px] font-bold text-white dark:text-black leading-none">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  </motion.span>
                )}
              </motion.div>

              <AnimatePresence>
                {isActive && (
                  <motion.span className="text-[10px] font-bold text-foreground relative z-10" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} transition={{ duration: 0.2 }}>
                    {tab.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {isActive && (
                <motion.div
                  className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-black dark:bg-white shadow-[0_0_8px_rgba(0,0,0,0.15)] dark:shadow-[0_0_8px_rgba(255,255,255,0.1)]"
                  layoutId="bottomnav-indicator"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}
