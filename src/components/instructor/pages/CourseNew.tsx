'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Upload, BookOpen, ChevronDown, X, Plus, Image as ImageIcon, ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { useTechnologies, useSubjects, useCreateCourse } from '@/lib/api-hooks';
import { useNavigationStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { staggerChildren } from '@/lib/animations';
import { apiUpload } from '@/lib/api-client';

export function CourseNew() {
  const navigate = useNavigationStore((s) => s.navigate);
  const { data: techData, loading: techLoading } = useTechnologies();
  const { mutate: createCourse, loading: creating } = useCreateCourse();

  const technologies = useMemo(() => techData?.technologies || [], [techData]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    technologyId: 0,
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    price: 0,
    semester: '',
    whatYouLearn: '',
    tags: '',
    language: 'Bangla',
  });
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  // Get subjects based on selected technology
  const { data: subjectData } = useSubjects(form.technologyId || undefined);
  const subjects = useMemo(() => subjectData?.subjects || [], [subjectData]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file);
      const reader = new FileReader();
      reader.onload = (ev) => setThumbnailPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const toggleSubject = (id: number) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('Please enter a course title');
      return;
    }

    const courseData: any = {
      title: form.title.trim(),
      level: form.level,
      language: form.language,
    };
    if (form.description.trim()) courseData.description = form.description.trim();
    if (form.technologyId) courseData.technology_id = form.technologyId;
    if (form.price > 0) courseData.price = form.price;
    if (form.semester.trim()) courseData.semester = form.semester.trim();
    if (form.whatYouLearn.trim()) courseData.what_you_learn = form.whatYouLearn.trim();
    if (form.tags.trim()) courseData.tags = form.tags.trim();

    const result = await createCourse(courseData);
    if (result) {
      const courseId = result.course?.id || result.id || result.data?.id;

      // Upload thumbnail if selected
      if (thumbnail && courseId) {
        setUploadingThumbnail(true);
        try {
          const fd = new FormData();
          fd.append('thumbnail', thumbnail);
          await apiUpload(`/instructor/courses/${courseId}/thumbnail`, fd);
        } catch {
          toast.warning('Course created but thumbnail upload failed');
        }
        setUploadingThumbnail(false);
      }

      toast.success('Course created successfully!');
      navigate('course-curriculum', { courseId });
    } else {
      toast.error('Failed to create course');
    }
  };

  if (techLoading) {
    return <LoadingSkeleton type="card" count={3} />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
          Create New <span className="gradient-text">Course</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Set up your course details. You can add curriculum content after creation.
        </p>
      </motion.div>

      {/* Thumbnail Upload */}
      <motion.div {...staggerChildren(0, 0.05)}>
        <GlassCard className="p-6" glow>
          <h2 className="text-lg font-bold gradient-text mb-4">Course Thumbnail</h2>
          <div
            className={cn(
              'relative border-2 border-dashed rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer',
              thumbnailPreview
                ? 'border-black/10 dark:border-white/10'
                : 'border-black/[0.08] dark:border-white/[0.06] hover:border-black/20 dark:hover:border-white/15'
            )}
            onClick={() => document.getElementById('thumbnail-input')?.click()}
          >
            {thumbnailPreview ? (
              <div className="relative aspect-video">
                <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all flex items-center justify-center group">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-semibold bg-black/40 px-4 py-2 rounded-xl">
                    Change Thumbnail
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setThumbnail(null); setThumbnailPreview(null); }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="aspect-video flex flex-col items-center justify-center gap-3 p-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-black/[0.04] to-black/[0.06] dark:from-white/[0.04] dark:to-white/[0.06] flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground/60" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">Click to upload thumbnail</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP (recommended 1280x720)</p>
                </div>
              </div>
            )}
            <input
              id="thumbnail-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleThumbnailChange}
            />
          </div>
        </GlassCard>
      </motion.div>

      {/* Course Details */}
      <motion.div {...staggerChildren(1, 0.05)}>
        <GlassCard className="p-6" glow>
          <h2 className="text-lg font-bold gradient-text mb-4">Course Details</h2>
          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">
                Course Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Data Structures and Algorithms"
                className="w-full px-4 py-3 rounded-xl text-sm premium-input placeholder:text-muted-foreground/60"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe what students will learn in this course..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm premium-input placeholder:text-muted-foreground/60 resize-none"
              />
            </div>

            {/* Technology + Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Technology</label>
                <select
                  value={form.technologyId}
                  onChange={(e) => { setForm({ ...form, technologyId: Number(e.target.value) }); setSelectedSubjectIds([]); }}
                  className="w-full px-4 py-3 rounded-xl text-sm premium-input"
                >
                  <option value={0}>Select technology</option>
                  {technologies.map((tech: any) => (
                    <option key={tech.id} value={tech.id}>{tech.name} ({tech.shortCode})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Level</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value as any })}
                  className="w-full px-4 py-3 rounded-xl text-sm premium-input"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* Price + Semester */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Price (BDT ৳)</label>
                <input
                  type="number"
                  value={form.price || ''}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) || 0 })}
                  placeholder="0 for free"
                  min={0}
                  className="w-full px-4 py-3 rounded-xl text-sm premium-input placeholder:text-muted-foreground/60"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Semester</label>
                <input
                  type="text"
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                  placeholder="e.g., 3rd Semester"
                  className="w-full px-4 py-3 rounded-xl text-sm premium-input placeholder:text-muted-foreground/60"
                />
              </div>
            </div>

            {/* What You'll Learn */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">What You&apos;ll Learn</label>
              <textarea
                value={form.whatYouLearn}
                onChange={(e) => setForm({ ...form, whatYouLearn: e.target.value })}
                placeholder="Comma-separated learning outcomes, e.g., Understand data structures, Implement sorting algorithms, Analyze time complexity"
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm premium-input placeholder:text-muted-foreground/60 resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">Separate each item with a comma</p>
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Tags</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="Comma-separated tags, e.g., programming, algorithms, data-structures"
                className="w-full px-4 py-3 rounded-xl text-sm premium-input placeholder:text-muted-foreground/60"
              />
              {form.tags && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.tags.split(',').filter(t => t.trim()).map((tag, i) => (
                    <span key={i} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.04] text-foreground">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Language */}
            <div className="max-w-xs">
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Language</label>
              <select
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-sm premium-input"
              >
                <option value="Bangla">Bangla</option>
                <option value="English">English</option>
                <option value="Bangla & English">Bangla & English</option>
              </select>
            </div>

            {/* Subject Selection */}
            {form.technologyId > 0 && subjects.length > 0 && (
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Subjects (Select multiple)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {subjects.map((subject: any) => (
                    <motion.button
                      key={subject.id}
                      type="button"
                      className={cn(
                        'px-3 py-2 rounded-xl text-sm font-semibold text-left transition-all duration-200 border',
                        selectedSubjectIds.includes(subject.id)
                          ? 'bg-black/[0.06] dark:bg-white/[0.06] border-black/10 dark:border-white/10 text-foreground'
                          : 'bg-transparent border-black/[0.04] dark:border-white/[0.04] text-muted-foreground hover:text-foreground hover:border-black/10 dark:hover:border-white/10'
                      )}
                      onClick={() => toggleSubject(subject.id)}
                      whileTap={{ scale: 0.97 }}
                    >
                      {selectedSubjectIds.includes(subject.id) && '✓ '}
                      {subject.name}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>

      {/* Submit */}
      <motion.div
        {...staggerChildren(2, 0.05)}
        className="flex items-center justify-between gap-4 pt-2"
      >
        <GradientButton variant="ghost" onClick={() => navigate('courses')}>
          Cancel
        </GradientButton>
        <GradientButton
          onClick={handleSubmit}
          loading={creating || uploadingThumbnail}
          disabled={!form.title.trim() || creating}
          icon={<ArrowRight className="w-4 h-4" />}
          size="lg"
        >
          {uploadingThumbnail ? 'Uploading Thumbnail...' : creating ? 'Creating...' : 'Create Course & Add Curriculum'}
        </GradientButton>
      </motion.div>
    </div>
  );
}
