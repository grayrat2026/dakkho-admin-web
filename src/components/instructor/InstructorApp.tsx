'use client';

import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigationStore, useAuthStore, useTourStore, useNotificationStore } from '@/lib/store';
import { InstructorShell } from './InstructorShell';
import { AppTour } from './AppTour';
import { AnimatedPage } from '@/components/shared/AnimatedPage';

// Page imports
import { Dashboard } from './pages/Dashboard';
import { Courses } from './pages/Courses';
import { CourseDetail } from './pages/CourseDetail';
import { CourseNew } from './pages/CourseNew';
import { CourseCurriculum } from './pages/CourseCurriculum';
import { CourseSettings } from './pages/CourseSettings';
import { CourseLive } from './pages/CourseLive';
import { Analytics } from './pages/Analytics';
import { Schedule } from './pages/Schedule';
import { StudentProgress } from './pages/StudentProgress';
import { Reviews } from './pages/Reviews';
import { Notifications } from './pages/Notifications';
import { Earnings } from './pages/Earnings';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { Support } from './pages/Support';
import { Help } from './pages/Help';
import { VideoManager } from './pages/VideoManager';
import { Login } from './pages/Login';
import { ApplyInstructor } from './pages/ApplyInstructor';
import { ApplicationStatus } from './pages/ApplicationStatus';
import { SetPassword } from './pages/SetPassword';
import { ForgotPassword } from './pages/ForgotPassword';

import { useNotifications } from '@/lib/api-hooks';
import type { PageName } from '@/lib/types';

const AUTH_PAGES: PageName[] = ['login', 'apply', 'application-status', 'set-password', 'forgot-password'];

const pageComponents: Record<PageName, React.ComponentType> = {
  dashboard: Dashboard,
  courses: Courses,
  'course-new': CourseNew,
  'course-detail': CourseDetail,
  'course-curriculum': CourseCurriculum,
  'course-videos': VideoManager,
  'course-settings': CourseSettings,
  'course-live': CourseLive,
  analytics: Analytics,
  schedule: Schedule,
  'student-progress': StudentProgress,
  reviews: Reviews,
  notifications: Notifications,
  earnings: Earnings,
  profile: Profile,
  settings: Settings,
  support: Support,
  help: Help,
  login: Login,
  apply: ApplyInstructor,
  'application-status': ApplicationStatus,
  'set-password': SetPassword,
  'forgot-password': ForgotPassword,
};

export function InstructorApp() {
  const { currentPage, syncFromUrl } = useNavigationStore();
  const { isAuthenticated, checkAuth, isLoading } = useAuthStore();
  const { setNotifications } = useNotificationStore();
  const tourStore = useTourStore();
  const { data: notifData } = useNotifications();

  // Sync from URL on mount
  useEffect(() => {
    syncFromUrl(window.location.pathname);
    const handlePopState = () => {
      syncFromUrl(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [syncFromUrl]);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Fetch notifications from API when authenticated
  useEffect(() => {
    if (isAuthenticated && notifData?.notifications) {
      setNotifications(notifData.notifications);
    }
  }, [isAuthenticated, notifData, setNotifications]);

  // Start tour on first login
  useEffect(() => {
    if (isAuthenticated && !tourStore.hasCompletedTour && !tourStore.isActive) {
      const timer = setTimeout(() => {
        tourStore.startTour();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, tourStore.hasCompletedTour, tourStore.isActive, tourStore.startTour]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-[#0a0a0a] dark:via-[#111] dark:to-[#0a0a0a] flex items-center justify-center">
        <div className="noise-overlay" />
        <div className="flex flex-col items-center gap-5 relative z-10">
          <div className="relative">
            <div className="absolute inset-0 w-16 h-16 rounded-2xl bg-black/10 dark:bg-white/10 blur-xl" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-black dark:from-white dark:via-neutral-200 dark:to-white flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
              <span className="text-white dark:text-neutral-900 font-extrabold text-2xl">D</span>
            </div>
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-neutral-700 to-black dark:from-neutral-300 dark:to-white flex items-center justify-center shadow-sm">
              <span className="text-white dark:text-neutral-900 text-[9px] font-bold">i</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 dark:bg-white animate-[pulse-dot_1.5s_ease-in-out_infinite]" />
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 dark:bg-white animate-[pulse-dot_1.5s_ease-in-out_0.2s_infinite]" />
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 dark:bg-white animate-[pulse-dot_1.5s_ease-in-out_0.4s_infinite]" />
          </div>
        </div>
      </div>
    );
  }

  const isAuthPage = AUTH_PAGES.includes(currentPage);

  // Not authenticated and not on auth page → redirect to login
  if (!isAuthenticated && !isAuthPage) {
    const LoginComponent = pageComponents['login'];
    return <LoginComponent />;
  }

  // Authenticated and on auth page (except apply/status) → redirect to dashboard
  if (isAuthenticated && isAuthPage && currentPage !== 'apply' && currentPage !== 'application-status') {
    const DashboardComponent = pageComponents['dashboard'];
    return (
      <InstructorShell>
        <DashboardComponent />
      </InstructorShell>
    );
  }

  const PageComponent = pageComponents[currentPage] || pageComponents['dashboard'];

  if (isAuthPage) {
    return (
      <AnimatePresence mode="wait">
        <AnimatedPage key={currentPage}>
          <PageComponent />
        </AnimatedPage>
      </AnimatePresence>
    );
  }

  return (
    <>
      <InstructorShell>
        <AnimatePresence mode="wait">
          <AnimatedPage key={currentPage}>
            <PageComponent />
          </AnimatedPage>
        </AnimatePresence>
      </InstructorShell>
      <AppTour />
    </>
  );
}
