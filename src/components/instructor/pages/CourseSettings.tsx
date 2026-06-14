'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, Trash2, Upload, Image as ImageIcon, X, AlertTriangle,
  BookOpen, DollarSign, BarChart3, Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { useCourse, useUpdateCourse, useDeleteCourse, useTechnologies } from '@/lib/api-hooks';
import { useNavigationStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { staggerChildren } from '@/lib/animations';
import { apiUpload } from '@/lib/api-client';

export function CourseSettings() {
  const params = useNavigationStore((s) => s.params);
  const navigate = useNavigationStore((s) => s.navigate);
  const courseId = params.courseId || '';

  const { data: courseData, loading, refetch } = useCourse(courseId);
  const { mutate: updateCourse, loading: updating } = useUpdateCourse(courseId);
  const { mutate: deleteCourse, loading: deleting } = useDeleteCourse();
  const { data: techData } = useTechnologies();

  const course = courseData?.course || courseData;
  const technologies = techData?.technologies || [];

  const [form, setForm] = useState<{
    title: string;
    description: string;
    technologyId: number;
    level: string;
    price: number;
    semester: string;
    language: string;
    whatYouLearn: string;
    tags: string;
  } | null>(null);

  // Initialize form from course data
  useMemo(() => {
    if (course && !form) {
      setForm({
        title: course.title || '',
        description: course.description || '',
        technologyId: course.technologyId || 0,
        level: course.level || 'beginner',
        price: course.price || 0,
        semester: course.semester || '',
        language: course.language || 'Bangla',
        whatYouLearn: Array.isArray(course.whatYouLearn) ? course.whatYouLearn.join(', ') : (course.whatYouLearn || ''),
        tags: Array.isArray(course.tags) ? course.tags.join(', ') : (course.tags || ''),
      });
    }
  }, [course]);

  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file);
      const reader = new FileReader();
      reader.onload = (ev) => setThumbnailPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!form) return;
    if (!form.title.trim()) {
      toast.error('Course title is required');
      return;
    }

    const updateData: any = {
      title: form.title.trim(),
      level: form.level,
      language: form.language,
    };
    if (form.description.trim()) updateData.description = form.description.trim();
    if (form.technologyId) updateData.technology_id = form.technologyId;
    if (form.price >= 0) updateData.price = form.price;
    if (form.semester.trim()) updateData.semester = form.semester.trim();
    if (form.whatYouLearn.trim()) updateData.what_you_learn = form.whatYouLearn.trim();
    if (form.tags.trim()) updateData.tags = form.tags.trim();

    const result = await updateCourse(updateData);
    if (result) {
      toast.success('Course updated');

      // Upload thumbnail if changed
      if (thumbnail) {
        setUploadingThumbnail(true);
        try {
          const fd = new FormData();
          fd.append('thumbnail', thumbnail);
          await apiUpload(`/instructor/courses/${courseId}/thumbnail`, fd);
          toast.success('Thumbnail updated');
          refetch();
        } catch {
          toast.warning('Thumbnail upload failed');
        }
        setUploadingThumbnail(false);
      }
    } else {
      toast.error('Failed to update course');
    }
  };

  const handleTogglePublish = async () => {
    if (!course) return;
    const result = await updateCourse({ isPublished: !course.isPublished });
    if (result) {
      toast.success(course.isPublished ? 'Course unpublished' : 'Course published');
      refetch();
    }
  };

  const handleDelete = async () => {
    if (course?.isPublished) {
      toast.error('Cannot delete a published course. Unpublish first.');
      return;
    }
    const result = await deleteCourse({ courseId });
    if (result !== null) {
      toast.success('Course deleted');
      navigate('courses');
    } else {
      toast.error('Failed to delete course');
    }
  };

  if (loading || !form) {
    return <LoadingSkeleton type="card" count={3} />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
          Course <span className="gradient-text">Settings</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">{course?.title || ''}</p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div {...staggerChildren(0, 0.04)}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: BookOpen, label: 'Students', value: course?.totalStudents || 0 },
            { icon: DollarSign, label: 'Price', value: `৳${course?.price || 0}` },
            { icon: BarChart3, label: 'Rating', value: course?.rating || 0 },
            { icon: Globe, label: 'Status', value: course?.isPublished ? 'Published' : 'Draft' },
          ].map((stat, i) => (
            <GlassCard key={stat.label} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-black dark:from-white dark:via-neutral-200 dark:to-white flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
                  <stat.icon className="w-4 h-4 text-white dark:text-neutral-900" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">{stat.label}</p>
                  <p className="text-sm font-extrabold text-foreground">{stat.value}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </motion.div>

      {/* Thumbnail */}
      <motion.div {...staggerChildren(1, 0.04)}>
        <GlassCard className="p-6" glow>
          <h2 className="text-lg font-bold gradient-text mb-4">Course Thumbnail</h2>
          <div
            className="relative border-2 border-dashed rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer border-black/[0.08] dark:border-white/[0.06] hover:border-black/20"
            onClick={() => document.getElementById('settings-thumbnail-input')?.click()}
          >
            {thumbnailPreview || course?.thumbnailUrl ? (
              <div className="relative aspect-video">
                <img src={thumbnailPreview || course?.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all flex items-center justify-center group">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-semibold bg-black/40 px-4 py-2 rounded-xl">
                    Change Thumbnail
                  </span>
                </div>
              </div>
            ) : (
              <div className="aspect-video flex flex-col items-center justify-center gap-3 p-8">
                <ImageIcon className="w-8 h-8 text-muted-foreground/60" />
                <p className="text-sm text-muted-foreground">Click to upload thumbnail</p>
              </div>
            )}
            <input id="settings-thumbnail-input" type="file" accept="image/*" className="hidden" onChange={handleThumbnailChange} />
          </div>
        </GlassCard>
      </motion.div>

      {/* Course Details */}
      <motion.div {...staggerChildren(2, 0.04)}>
        <GlassCard className="p-6" glow>
          <h2 className="text-lg font-bold gradient-text mb-4">Course Details</h2>
          <div className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Title *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm premium-input" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full px-4 py-3 rounded-xl text-sm premium-input resize-none" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Technology</label>
                <select value={form.technologyId} onChange={(e) => setForm({ ...form, technologyId: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl text-sm premium-input">
                  <option value={0}>Select technology</option>
                  {technologies.map((tech: any) => (
                    <option key={tech.id} value={tech.id}>{tech.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Level</label>
                <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm premium-input">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Price (BDT ৳)</label>
                <input type="number" value={form.price || ''} onChange={(e) => setForm({ ...form, price: Number(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-xl text-sm premium-input" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Semester</label>
                <input type="text" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm premium-input" />
              </div>
            </div>
            <div className="max-w-xs">
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Language</label>
              <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm premium-input">
                <option value="Bangla">Bangla</option>
                <option value="English">English</option>
                <option value="Bangla & English">Bangla & English</option>
              </select>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Publish / Unpublish */}
      <motion.div {...staggerChildren(3, 0.04)}>
        <GlassCard className="p-6" glow>
          <h2 className="text-lg font-bold gradient-text mb-4">Publishing</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {course?.isPublished ? 'Published' : 'Draft'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {course?.isPublished
                  ? 'This course is visible to students'
                  : 'This course is only visible to you'}
              </p>
            </div>
            <GradientButton
              variant={course?.isPublished ? 'ghost' : 'primary'}
              size="sm"
              onClick={handleTogglePublish}
              loading={updating}
            >
              {course?.isPublished ? 'Unpublish' : 'Publish'}
            </GradientButton>
          </div>
        </GlassCard>
      </motion.div>

      {/* Danger Zone */}
      <motion.div {...staggerChildren(4, 0.04)}>
        <GlassCard className="p-6 border-red-200/30 dark:border-red-800/20">
          <h2 className="text-lg font-bold text-red-500 mb-2">Danger Zone</h2>
          <p className="text-xs text-muted-foreground mb-4">
            {course?.isPublished
              ? 'You must unpublish the course before deleting it.'
              : 'Once deleted, this course and all its content will be permanently removed.'}
          </p>
          <AnimatePresence>
            {showDeleteConfirm ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50/50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-800/30">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">Are you sure? This action cannot be undone.</p>
                </div>
                <div className="flex gap-2">
                  <GradientButton variant="danger" size="sm" loading={deleting} onClick={handleDelete} icon={<Trash2 className="w-3.5 h-3.5" />}>
                    Delete Permanently
                  </GradientButton>
                  <GradientButton variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</GradientButton>
                </div>
              </motion.div>
            ) : (
              <GradientButton
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={course?.isPublished}
                icon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete Course
              </GradientButton>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>

      {/* Save Button */}
      <motion.div className="flex justify-end gap-3 pt-2" {...staggerChildren(5, 0.04)}>
        <GradientButton variant="ghost" onClick={() => navigate('course-detail', { courseId })}>Cancel</GradientButton>
        <GradientButton onClick={handleSave} loading={updating || uploadingThumbnail} icon={<Save className="w-4 h-4" />} size="lg">
          {uploadingThumbnail ? 'Uploading...' : 'Save Changes'}
        </GradientButton>
      </motion.div>
    </div>
  );
}
