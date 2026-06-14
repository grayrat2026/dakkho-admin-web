'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Search, Bell, X, ChevronRight } from 'lucide-react';
import { useNavigationStore, useAuthStore, useSidebarStore, useNotificationStore } from '@/lib/store';
import { TOPBAR_HEIGHT, SIDEBAR_WIDTH } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { PageName } from '@/lib/types';

// Breadcrumb map
const pageLabels: Record<PageName, string> = {
  dashboard: 'Dashboard',
  courses: 'My Courses',
  'course-new': 'New Course',
  'course-detail': 'Course Detail',
  'course-curriculum': 'Curriculum',
  'course-videos': 'Videos',
  'course-settings': 'Settings',
  'course-live': 'Live Classes',
  analytics: 'Analytics',
  schedule: 'Schedule',
  'student-progress': 'Student Progress',
  reviews: 'Reviews',
  notifications: 'Notifications',
  earnings: 'Earnings',
  profile: 'Profile',
  settings: 'Settings',
  support: 'Support',
  help: 'Help',
  login: 'Login',
  apply: 'Apply',
  'application-status': 'Application Status',
  'set-password': 'Set Password',
  'forgot-password': 'Forgot Password',
};

function Breadcrumbs() {
  const { currentPage, params, navigate } = useNavigationStore();
  const courseId = params.courseId;

  const crumbs: { label: string; page?: PageName; params?: Record<string, string> }[] = [
    { label: 'Home', page: 'dashboard' },
  ];

  // Add course breadcrumb chain
  if (courseId && ['course-detail', 'course-curriculum', 'course-videos', 'course-settings', 'course-live'].includes(currentPage)) {
    crumbs.push({ label: 'Courses', page: 'courses' });
    crumbs.push({ label: 'Course', page: 'course-detail', params: { courseId } });

    if (currentPage !== 'course-detail') {
      crumbs.push({ label: pageLabels[currentPage] });
    }
  } else if (currentPage === 'courses') {
    crumbs.push({ label: 'My Courses' });
  } else if (currentPage === 'course-new') {
    crumbs.push({ label: 'Courses', page: 'courses' });
    crumbs.push({ label: 'New Course' });
  } else {
    crumbs.push({ label: pageLabels[currentPage] || currentPage });
  }

  return (
    <div className="flex items-center gap-1 text-sm overflow-x-auto whitespace-nowrap">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />}
          {crumb.page ? (
            <button
              onClick={() => navigate(crumb.page!, crumb.params)}
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              {crumb.label}
            </button>
          ) : (
            <span className="text-foreground font-semibold">{crumb.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

export function TopBar() {
  const { currentPage, navigate } = useNavigationStore();
  const user = useAuthStore((s) => s.user);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const { isOpen: sidebarOpen, toggle: toggleSidebar, setOpen: setSidebarOpen } = useSidebarStore();
  const isMobile = useIsMobile();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogoClick = useCallback(() => { navigate('dashboard'); }, [navigate]);
  const handleNotificationClick = useCallback(() => { navigate('notifications'); }, [navigate]);
  const handleProfileClick = useCallback(() => { navigate('profile'); }, [navigate]);

  return (
    <motion.header
      className={cn(
        'fixed top-0 right-0 z-50',
        'backdrop-blur-2xl backdrop-saturate-[150%]',
        'bg-white/60 dark:bg-neutral-900/60',
        'border-b border-black/[0.04] dark:border-white/[0.04]',
        'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px',
        'after:bg-gradient-to-r after:from-transparent after:via-black/[0.06] after:to-transparent',
        'dark:after:from-transparent dark:after:via-white/[0.04] dark:after:to-transparent',
        'after:pointer-events-none'
      )}
      style={{ height: TOPBAR_HEIGHT, left: isMobile ? 0 : SIDEBAR_WIDTH }}
      initial={{ y: -64 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="h-full flex items-center justify-between px-4 md:px-6 gap-3">
        {/* Left: Logo + Breadcrumbs */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <motion.button
            className="flex items-center cursor-pointer gap-2.5"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogoClick}
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-black flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.2)] dark:from-white dark:via-neutral-200 dark:to-white">
                <span className="text-white dark:text-neutral-900 font-extrabold text-lg leading-none">D</span>
              </div>
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-neutral-700 to-black flex items-center justify-center shadow-sm dark:from-neutral-300 dark:to-white">
                <span className="text-white dark:text-neutral-900 text-[9px] font-bold">i</span>
              </span>
            </div>
            {!isMobile && <span className="text-lg font-extrabold gradient-text tracking-tight">DAKKHO</span>}
          </motion.button>

          {/* Breadcrumbs (desktop) */}
          {!isMobile && (
            <div className="border-l border-black/[0.06] dark:border-white/[0.04] pl-3 ml-1">
              <Breadcrumbs />
            </div>
          )}
        </div>

        {/* Search (desktop) */}
        {!isMobile && (
          <motion.div className="flex-1 max-w-lg mx-auto" animate={{ scale: searchFocused ? 1.02 : 1 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
            <div className={cn(
              'relative flex items-center rounded-xl transition-all duration-300',
              'backdrop-blur-xl',
              searchFocused
                ? 'bg-white/70 dark:bg-neutral-800/70 border-black/10 shadow-[0_0_0_3px_rgba(0,0,0,0.03),0_2px_8px_rgba(0,0,0,0.04)]'
                : 'bg-white/40 dark:bg-neutral-800/40 border-black/[0.04] dark:border-white/[0.04]',
              'border'
            )}>
              <Search className={cn('w-4 h-4 ml-3.5 flex-shrink-0 transition-colors', searchFocused ? 'text-foreground' : 'text-muted-foreground')} />
              <input
                type="text"
                placeholder="Search courses, students..."
                className="w-full bg-transparent py-2.5 px-3 text-sm outline-none placeholder:text-muted-foreground/50 text-foreground"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.button className="mr-2.5 w-6 h-6 rounded-full bg-muted/60 flex items-center justify-center flex-shrink-0" onClick={() => setSearchQuery('')} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 400 }}>
                    <X className="w-3 h-3 text-muted-foreground" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Notification bell */}
          <motion.button
            className={cn('relative w-10 h-10 rounded-xl flex items-center justify-center', 'backdrop-blur-xl', 'bg-white/40 dark:bg-white/5', 'border border-black/[0.04] dark:border-white/[0.04]', 'hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-all duration-300')}
            onClick={handleNotificationClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Notifications"
          >
            <Bell className="w-[18px] h-[18px] text-muted-foreground" />
            {unreadCount > 0 && (
              <motion.span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-black dark:bg-white flex items-center justify-center px-1 ring-2 ring-white dark:ring-neutral-900"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                <span className="text-[10px] font-bold text-white dark:text-black leading-none">{unreadCount > 99 ? '99+' : unreadCount}</span>
              </motion.span>
            )}
          </motion.button>

          {/* Avatar (desktop) */}
          {!isMobile && (
            <motion.button
              className="relative w-10 h-10 rounded-xl p-[1.5px] bg-gradient-to-br from-neutral-800 via-neutral-600 to-black dark:from-neutral-200 dark:via-neutral-300 dark:to-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
              onClick={handleProfileClick}
              whileHover={{ scale: 1.05, boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}
              whileTap={{ scale: 0.95 }}
              aria-label="Profile"
            >
              <div className="w-full h-full rounded-[9px] bg-white dark:bg-neutral-900 flex items-center justify-center overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-[9px] object-cover" />
                ) : (
                  <span className="text-sm font-bold text-foreground">{user?.name?.charAt(0) || 'U'}</span>
                )}
              </div>
            </motion.button>
          )}

          {/* Hamburger (mobile) */}
          {isMobile && (
            <motion.button
              className={cn('w-10 h-10 rounded-xl flex items-center justify-center', 'backdrop-blur-xl', 'bg-white/40 dark:bg-white/5', 'border border-black/[0.04] dark:border-white/[0.04]', 'hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-all')}
              onClick={toggleSidebar}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Toggle menu"
            >
              <Menu className="w-[18px] h-[18px] text-muted-foreground" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
