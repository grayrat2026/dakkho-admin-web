'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Clock, Video, ExternalLink, Radio, Calendar as CalendarIcon, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { useSchedule, useCreateLiveClass, useCourse } from '@/lib/api-hooks';
import { useNavigationStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { staggerChildren } from '@/lib/animations';

const platformConfig: Record<string, { label: string; icon: typeof Video; color: string }> = {
  jitsi: { label: 'Jitsi', icon: Video, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  zoom: { label: 'Zoom', icon: Video, color: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-300' },
  meet: { label: 'Meet', icon: Video, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
  livekit: { label: 'Dakkho Live', icon: Radio, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
};

function formatCountdown(scheduledAt: string): string {
  const now = new Date();
  const scheduled = new Date(scheduledAt);
  const diff = scheduled.getTime() - now.getTime();
  if (diff <= 0) return 'Starting now';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function isWithinTenMinutes(scheduledAt: string): boolean {
  const now = new Date();
  const scheduled = new Date(scheduledAt);
  const diff = scheduled.getTime() - now.getTime();
  return diff >= -10 * 60 * 1000 && diff <= 10 * 60 * 1000;
}

export function CourseLive() {
  const params = useNavigationStore((s) => s.params);
  const courseId = params.courseId || '';

  const { data: courseData, loading: courseLoading } = useCourse(courseId);
  const { data: scheduleData, loading: scheduleLoading, refetch } = useSchedule();
  const { mutate: createLiveClass, loading: creating } = useCreateLiveClass();

  const course = courseData?.course || courseData;

  // Filter schedule for this course
  const courseSchedule = useMemo(() => {
    const schedule = scheduleData?.schedule || [];
    return schedule.filter((cls: any) => cls.courseId === courseId || cls.course_id === courseId);
  }, [scheduleData, courseId]);

  const upcoming = courseSchedule.filter((cls: any) => new Date(cls.scheduledAt || cls.scheduled_at) > new Date());
  const past = courseSchedule.filter((cls: any) => new Date(cls.scheduledAt || cls.scheduled_at) <= new Date());

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newClass, setNewClass] = useState({
    title: '',
    date: '',
    time: '',
    duration: '60',
    platform: 'jitsi' as 'jitsi' | 'zoom' | 'meet',
    url: '',
    description: '',
  });

  // Countdown timer for next class
  const [countdown, setCountdown] = useState('');
  useEffect(() => {
    if (upcoming.length === 0) return;
    const update = () => {
      setCountdown(formatCountdown(upcoming[0].scheduledAt || upcoming[0].scheduled_at));
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [upcoming]);

  const handleCreateClass = async () => {
    if (!newClass.title.trim()) {
      toast.error('Please enter a class title');
      return;
    }
    if (!newClass.date || !newClass.time) {
      toast.error('Please select date and time');
      return;
    }

    const scheduledAt = new Date(`${newClass.date}T${newClass.time}:00`).toISOString();
    const classData: any = {
      title: newClass.title.trim(),
      courseId,
      scheduledAt,
      durationMinutes: parseInt(newClass.duration) || 60,
      platform: newClass.platform,
      meetingUrl: newClass.url.trim() || undefined,
      description: newClass.description.trim() || undefined,
    };

    const result = await createLiveClass(classData);
    if (result) {
      toast.success('Live class created');
      setShowCreateDialog(false);
      setNewClass({ title: '', date: '', time: '', duration: '60', platform: 'jitsi', url: '', description: '' });
      refetch();
    } else {
      toast.error('Failed to create live class');
    }
  };

  if (scheduleLoading || courseLoading) {
    return <LoadingSkeleton type="card" count={2} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
              Live <span className="gradient-text">Classes</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">{course?.title || ''}</p>
          </div>
          <GradientButton size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateDialog(true)}>
            Schedule Class
          </GradientButton>
        </div>
      </motion.div>

      {/* Next Class Countdown */}
      {upcoming.length > 0 && (
        <motion.div {...staggerChildren(0, 0.04)}>
          <GlassCard className="p-6" glow>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-black dark:from-white dark:via-neutral-200 dark:to-white flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.15)]">
                <Radio className="w-6 h-6 text-white dark:text-neutral-900" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-foreground truncate">{upcoming[0].title || upcoming[0].courseName}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(upcoming[0].scheduledAt || upcoming[0].scheduled_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-sm font-bold text-foreground">⏱ {countdown}</span>
                </div>
              </div>
              {upcoming[0].meetingUrl && (
                <GradientButton
                  size="sm"
                  onClick={() => window.open(upcoming[0].meetingUrl, '_blank')}
                  icon={<ExternalLink className="w-3.5 h-3.5" />}
                >
                  {isWithinTenMinutes(upcoming[0].scheduledAt || upcoming[0].scheduled_at) ? 'Start' : 'Join'}
                </GradientButton>
              )}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Upcoming Classes */}
      <motion.div {...staggerChildren(1, 0.04)}>
        <GlassCard className="p-6" glow>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400" />
            <h2 className="text-lg font-bold gradient-text">Upcoming</h2>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No upcoming live classes</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((cls: any, i: number) => {
                const platform = platformConfig[cls.platform] || platformConfig.jitsi;
                return (
                  <motion.div
                    key={cls.id || i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.03] dark:border-white/[0.03]"
                  >
                    <div className="flex-shrink-0 text-center w-14">
                      <p className="text-lg font-extrabold text-foreground">
                        {new Date(cls.scheduledAt || cls.scheduled_at).getDate()}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        {new Date(cls.scheduledAt || cls.scheduled_at).toLocaleDateString('en-US', { month: 'short' })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{cls.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {new Date(cls.scheduledAt || cls.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-xs text-muted-foreground">{cls.durationMinutes || cls.duration_minutes} min</span>
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', platform.color)}>{platform.label}</span>
                      </div>
                    </div>
                    {cls.meetingUrl && (
                      <GradientButton size="sm" onClick={() => window.open(cls.meetingUrl, '_blank')} icon={<ExternalLink className="w-3.5 h-3.5" />}>
                        {isWithinTenMinutes(cls.scheduledAt || cls.scheduled_at) ? 'Start' : 'Link'}
                      </GradientButton>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Past Classes */}
      {past.length > 0 && (
        <motion.div {...staggerChildren(2, 0.04)}>
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-neutral-600 to-neutral-400 dark:from-neutral-400 dark:to-neutral-300" />
              <h2 className="text-lg font-bold gradient-text">Past Classes</h2>
            </div>
            <div className="space-y-2">
              {past.slice(0, 10).map((cls: any, i: number) => (
                <div key={cls.id || i} className="flex items-center gap-3 py-2 px-3 rounded-lg opacity-60">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{cls.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(cls.scheduledAt || cls.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Create Class Dialog */}
      <AnimatePresence>
        {showCreateDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCreateDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg"
            >
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold gradient-text">Schedule Live Class</h3>
                  <button onClick={() => setShowCreateDialog(false)} className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center"><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">Class Title</label>
                    <input type="text" value={newClass.title} onChange={(e) => setNewClass({ ...newClass, title: e.target.value })} placeholder="Enter class title" className="w-full px-4 py-2.5 rounded-xl text-sm premium-input placeholder:text-muted-foreground/60" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block">Date</label>
                      <input type="date" value={newClass.date} onChange={(e) => setNewClass({ ...newClass, date: e.target.value })} className="w-full px-4 py-2.5 rounded-xl text-sm premium-input" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block">Time</label>
                      <input type="time" value={newClass.time} onChange={(e) => setNewClass({ ...newClass, time: e.target.value })} className="w-full px-4 py-2.5 rounded-xl text-sm premium-input" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block">Duration (min)</label>
                      <input type="number" value={newClass.duration} onChange={(e) => setNewClass({ ...newClass, duration: e.target.value })} className="w-full px-4 py-2.5 rounded-xl text-sm premium-input" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block">Platform</label>
                      <select value={newClass.platform} onChange={(e) => setNewClass({ ...newClass, platform: e.target.value as any })} className="w-full px-4 py-2.5 rounded-xl text-sm premium-input">
                        <option value="livekit">Dakkho Live (Built-in)</option>
                        <option value="jitsi">Jitsi</option>
                        <option value="zoom">Zoom</option>
                        <option value="meet">Google Meet</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">Meeting Link</label>
                    <input type="url" value={newClass.url} onChange={(e) => setNewClass({ ...newClass, url: e.target.value })} placeholder="https://meet.jit.si/..." className="w-full px-4 py-2.5 rounded-xl text-sm premium-input placeholder:text-muted-foreground/60" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1.5 block">Description</label>
                    <textarea value={newClass.description} onChange={(e) => setNewClass({ ...newClass, description: e.target.value })} placeholder="Optional description" rows={2} className="w-full px-4 py-2.5 rounded-xl text-sm premium-input placeholder:text-muted-foreground/60 resize-none" />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <GradientButton variant="ghost" onClick={() => setShowCreateDialog(false)}>Cancel</GradientButton>
                    <GradientButton onClick={handleCreateClass} loading={creating} disabled={!newClass.title.trim() || !newClass.date || !newClass.time} icon={<Plus className="w-4 h-4" />}>
                      Create
                    </GradientButton>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
