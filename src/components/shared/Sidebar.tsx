'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, BarChart3, Calendar, Users,
  Star, Bell, Wallet, UserCircle, Settings, LifeBuoy,
  HelpCircle, ChevronDown, X, LogOut, FolderOpen, Video,
} from 'lucide-react';
import { useNavigationStore, useAuthStore, useSidebarStore } from '@/lib/store';
import { SIDEBAR_WIDTH } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { PageName } from '@/lib/types';

interface SidebarNavItem { icon: React.ElementType; label: string; page: PageName; }
interface SidebarSection { id: string; label: string; items: SidebarNavItem[]; collapsible?: boolean; }

const NAV_SECTIONS: SidebarSection[] = [
  { id: 'main', label: 'Main', collapsible: false, items: [
    { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
    { icon: BookOpen, label: 'My Courses', page: 'courses' },
    { icon: BarChart3, label: 'Analytics', page: 'analytics' },
    { icon: Calendar, label: 'Schedule', page: 'schedule' },
  ]},
  { id: 'students', label: 'Students', collapsible: false, items: [
    { icon: Users, label: 'Student Progress', page: 'student-progress' },
  ]},
  { id: 'engagement', label: 'Engagement', collapsible: false, items: [
    { icon: Star, label: 'Reviews', page: 'reviews' },
    { icon: Bell, label: 'Notifications', page: 'notifications' },
  ]},
  { id: 'finance', label: 'Finance', collapsible: false, items: [
    { icon: Wallet, label: 'Earnings', page: 'earnings' },
  ]},
  { id: 'account', label: 'Account', collapsible: true, items: [
    { icon: UserCircle, label: 'Profile', page: 'profile' },
    { icon: Settings, label: 'Settings', page: 'settings' },
  ]},
  { id: 'help', label: 'Help', collapsible: true, items: [
    { icon: LifeBuoy, label: 'Support', page: 'support' },
    { icon: HelpCircle, label: 'Help', page: 'help' },
  ]},
];

function SidebarContent() {
  const currentPage = useNavigationStore((s) => s.currentPage);
  const params = useNavigationStore((s) => s.params);
  const navigate = useNavigationStore((s) => s.navigate);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const { setOpen: setSidebarOpen } = useSidebarStore();
  const isMobile = useIsMobile();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ account: true, help: true });

  const toggleSection = (id: string) => setExpandedSections((p) => ({ ...p, [id]: !p[id] }));
  const handleNav = (page: PageName) => { navigate(page); if (isMobile) setSidebarOpen(false); };
  const handleLogoClick = () => { navigate('dashboard'); if (isMobile) setSidebarOpen(false); };

  // Determine if we're in a course context
  const courseId = params.courseId;
  const isInCourseContext = ['course-detail', 'course-curriculum', 'course-videos', 'course-settings', 'course-live'].includes(currentPage);

  let staggerIndex = 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-black/[0.04] dark:border-white/[0.04]">
        <motion.button className="flex items-center cursor-pointer gap-2.5" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleLogoClick}>
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-black flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.2)] dark:from-white dark:via-neutral-200 dark:to-white">
              <span className="text-white dark:text-neutral-900 font-extrabold text-lg leading-none">D</span>
            </div>
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-neutral-700 to-black flex items-center justify-center shadow-sm dark:from-neutral-300 dark:to-white">
              <span className="text-white dark:text-neutral-900 text-[9px] font-bold">i</span>
            </span>
          </div>
          <span className="text-lg font-extrabold gradient-text tracking-tight">DAKKHO</span>
        </motion.button>
        {isMobile && (
          <motion.button className="w-8 h-8 rounded-lg bg-black/[0.04] dark:bg-white/5 flex items-center justify-center" onClick={() => setSidebarOpen(false)} whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} aria-label="Close sidebar">
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Mobile user info */}
      {isMobile && user && (
        <motion.div className="p-4 border-b border-black/[0.04] dark:border-white/[0.04]" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03]">
            <div className="relative w-12 h-12 rounded-full p-[1.5px] bg-gradient-to-br from-neutral-800 to-black dark:from-neutral-200 dark:to-white">
              <div className="w-full h-full rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center overflow-hidden">
                {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" /> : <span className="text-lg font-bold text-foreground">{user.name.charAt(0)}</span>}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Course Context Section */}
      {isInCourseContext && courseId && (
        <div className="px-3 pt-3 pb-2 border-b border-black/[0.04] dark:border-white/[0.04]">
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40">Course</p>
          <div className="space-y-0.5 mt-1">
            {[
              { icon: BookOpen, label: 'Overview', page: 'course-detail' as PageName },
              { icon: FolderOpen, label: 'Curriculum', page: 'course-curriculum' as PageName },
              { icon: Video, label: 'Videos', page: 'course-videos' as PageName },
              { icon: Settings, label: 'Settings', page: 'course-settings' as PageName },
              { icon: Calendar, label: 'Live', page: 'course-live' as PageName },
            ].map((item, i) => {
              const isActive = currentPage === item.page;
              return (
                <motion.button
                  key={item.page}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 group relative',
                    isActive
                      ? 'bg-black/[0.05] dark:bg-white/[0.06] text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
                      : 'text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.03] hover:text-foreground'
                  )}
                  onClick={() => navigate(item.page, { courseId })}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isActive && (
                    <motion.div
                      className="absolute left-0 w-[3px] h-5 rounded-r-full bg-black dark:bg-white shadow-[0_0_8px_rgba(0,0,0,0.2)]"
                      layoutId="sidebar-active-indicator"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <item.icon className={cn('w-4 h-4', isActive ? 'text-foreground' : 'group-hover:text-foreground')} />
                  <span className="text-[13px]">{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1" style={{ overscrollBehavior: 'contain' }}>
        {NAV_SECTIONS.map((section) => {
          const sectionStartIndex = staggerIndex;
          if (section.collapsible) {
            const isExpanded = expandedSections[section.id] ?? true;
            return (
              <div key={section.id}>
                <motion.button className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 hover:text-muted-foreground transition-colors" onClick={() => toggleSection(section.id)} whileTap={{ scale: 0.98 }}>
                  <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}><ChevronDown className="w-3 h-3" /></motion.div>
                  <span className="flex-1 text-left">{section.label}</span>
                  <span className="text-[9px] font-normal bg-black/[0.03] dark:bg-white/[0.03] rounded-full px-1.5 py-0.5">{section.items.length}</span>
                </motion.button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }} className="overflow-hidden">
                      {section.items.map((item, i) => { staggerIndex++; return renderNavItem(item, sectionStartIndex + i, currentPage, handleNav, isInCourseContext); })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }
          return (
            <div key={section.id}>
              <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40">{section.label}</p>
              {section.items.map((item, i) => { staggerIndex++; return renderNavItem(item, sectionStartIndex + i, currentPage, handleNav, isInCourseContext); })}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-black/[0.04] dark:border-white/[0.04]">
        <motion.button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-all duration-300" onClick={() => { logout(); setSidebarOpen(false); }} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
          <LogOut className="w-4.5 h-4.5" /><span>Logout</span>
        </motion.button>
      </div>
    </div>
  );
}

function renderNavItem(item: SidebarNavItem, index: number, currentPage: PageName, onNavigate: (page: PageName) => void, isInCourseContext: boolean) {
  const isActive = currentPage === item.page && !isInCourseContext;
  return (
    <motion.button
      key={item.page}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative',
        isActive
          ? 'bg-black/[0.05] dark:bg-white/[0.06] text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
          : 'text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.03] hover:text-foreground'
      )}
      onClick={() => onNavigate(item.page)}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
    >
      {isActive && (
        <motion.div
          className="absolute left-0 w-[3px] h-6 rounded-r-full bg-black dark:bg-white shadow-[0_0_8px_rgba(0,0,0,0.2)] dark:shadow-[0_0_8px_rgba(255,255,255,0.1)]"
          layoutId="sidebar-active-indicator"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}
      <motion.div animate={{ scale: isActive ? 1.1 : 1 }} transition={{ type: 'spring', stiffness: 300 }}>
        <item.icon className={cn('w-[18px] h-[18px] transition-colors', isActive ? 'text-foreground' : 'group-hover:text-foreground')} />
      </motion.div>
      <span className="flex-1 text-left text-[13px]">{item.label}</span>
    </motion.button>
  );
}

export function Sidebar() {
  const { isOpen: sidebarOpen, setOpen: setSidebarOpen } = useSidebarStore();
  const isMobile = useIsMobile();

  return (
    <>
      {!isMobile && (
        <aside
          className={cn(
            'fixed top-0 left-0 h-full z-40',
            'backdrop-blur-2xl backdrop-saturate-[150%]',
            'bg-white/60 dark:bg-neutral-900/60',
            'border-r border-black/[0.04] dark:border-white/[0.04]',
            'after:absolute after:top-0 after:bottom-0 after:right-0 after:w-px',
            'after:bg-gradient-to-b after:from-transparent after:via-black/[0.04] after:to-transparent',
            'dark:after:from-transparent dark:after:via-white/[0.03] dark:after:to-transparent',
            'after:pointer-events-none flex flex-col'
          )}
          style={{ width: SIDEBAR_WIDTH }}
        >
          <SidebarContent />
        </aside>
      )}

      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => setSidebarOpen(false)} />
            <motion.aside
              className={cn('fixed top-0 right-0 h-full w-[280px] z-50', 'backdrop-blur-2xl backdrop-saturate-[200%]', 'bg-white/85 dark:bg-neutral-900/85', 'border-l border-black/[0.04] dark:border-white/[0.04]', 'shadow-[-20px_0_60px_rgba(0,0,0,0.08)]', 'flex flex-col')}
              initial={{ x: 280 }} animate={{ x: 0 }} exit={{ x: 280 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
