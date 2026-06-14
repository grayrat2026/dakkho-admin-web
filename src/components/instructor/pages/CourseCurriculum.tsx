'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, ChevronDown, ChevronRight, Trash2, Edit3, GripVertical,
  FolderOpen, FileText, Video, Link as LinkIcon, X, Upload, Save,
  BookOpen, Play, Eye, MoreVertical, Check, Search, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  useCurriculum, useCourseSubjects, useSubjects, useTechnologies,
  useCreateChapter, useUpdateChapter, useDeleteChapter,
  useCreateLesson, useUpdateLesson, useDeleteLesson,
  useAddSubjectToCourse, useRemoveSubjectFromCourse,
  useUploadResource, useResources,
  useUploadVideo, useCourse,
} from '@/lib/api-hooks';
import { useNavigationStore } from '@/lib/store';
import { cn, formatDurationShort } from '@/lib/utils';
import { staggerChildren } from '@/lib/animations';
import { apiUpload } from '@/lib/api-client';

// Video duration detector
function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      resolve(Math.round(video.duration));
      URL.revokeObjectURL(video.src);
    };
    video.onerror = () => resolve(0);
    video.src = URL.createObjectURL(file);
  });
}

export function CourseCurriculum() {
  const params = useNavigationStore((s) => s.params);
  const courseId = params.courseId || '';

  const { data: courseData, loading: courseLoading } = useCourse(courseId);
  const { data: curriculumData, loading: curriculumLoading, refetch: refetchCurriculum } = useCurriculum(courseId);
  const { data: courseSubjectsData, refetch: refetchCourseSubjects } = useCourseSubjects(courseId);
  const { data: resourcesData, refetch: refetchResources } = useResources(courseId);
  const { data: techData } = useTechnologies();

  const course = courseData?.course || courseData;
  const technologies = techData?.technologies || [];

  const curriculum = useMemo(() => curriculumData?.curriculum || curriculumData || { subjects: [], chapters: [], lessons: [], resources: [] }, [curriculumData]);
  const courseSubjects = useMemo(() => courseSubjectsData?.subjects || [], [courseSubjectsData]);
  const resources = useMemo(() => resourcesData?.resources || [], [resourcesData]);

  const { mutate: createChapter, loading: creatingChapter } = useCreateChapter(courseId);
  const { mutate: updateChapter } = useUpdateChapter(courseId);
  const { mutate: deleteChapter } = useDeleteChapter(courseId);
  const { mutate: createLesson, loading: creatingLesson } = useCreateLesson(courseId);
  const { mutate: updateLesson } = useUpdateLesson(courseId);
  const { mutate: deleteLesson } = useDeleteLesson(courseId);
  const { mutate: addSubject } = useAddSubjectToCourse(courseId);
  const { mutate: removeSubject } = useRemoveSubjectFromCourse(courseId);
  const { upload: uploadResource, uploadProgress: resourceUploadProgress, loading: uploadingResource } = useUploadResource(courseId);
  const { upload: uploadVideo, uploadProgress: videoUploadProgress, loading: uploadingVideo } = useUploadVideo(courseId);

  // State for new chapter
  const [showNewChapter, setShowNewChapter] = useState<string | null>(null); // subjectId
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterDesc, setNewChapterDesc] = useState('');

  // State for new lesson
  const [showNewLesson, setShowNewLesson] = useState<string | null>(null); // chapterId
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonType, setNewLessonType] = useState<'video' | 'link' | 'youtube' | 'document'>('video');
  const [newLessonDuration, setNewLessonDuration] = useState('');
  const [newLessonIsPreview, setNewLessonIsPreview] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoThumbnail, setVideoThumbnail] = useState<File | null>(null);
  const [ccFile, setCcFile] = useState<File | null>(null);

  // State for adding subject
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [selectedTechs, setSelectedTechs] = useState<Set<number>>(new Set());
  const [selectedSemesters, setSelectedSemesters] = useState<Set<string>>(new Set());
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('');
  const { data: availableSubjectsData } = useSubjects();
  const allAvailableSubjects = availableSubjectsData?.subjects || [];

  // State for editing
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [editChapterTitle, setEditChapterTitle] = useState('');
  const [editChapterDesc, setEditChapterDesc] = useState('');

  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState('');

  // Group chapters by subject
  const chaptersBySubject = useMemo(() => {
    const chapters = curriculum.chapters || [];
    const map = new Map<number, any[]>();
    chapters.forEach((ch: any) => {
      const sid = ch.subjectId || ch.subject_id || 0;
      if (!map.has(sid)) map.set(sid, []);
      map.get(sid)!.push(ch);
    });
    // Sort within each subject
    map.forEach((chs) => chs.sort((a: any, b: any) => (a.sortOrder || a.sort_order || 0) - (b.sortOrder || b.sort_order || 0)));
    return map;
  }, [curriculum]);

  // Get lessons for a chapter
  const getLessonsForChapter = useCallback((chapterId: string) => {
    const lessons = curriculum.lessons || [];
    return lessons
      .filter((l: any) => (l.chapterId || l.chapter_id) === chapterId)
      .sort((a: any, b: any) => (a.sortOrder || a.sort_order || 0) - (b.sortOrder || b.sort_order || 0));
  }, [curriculum]);

  // Helper: get subject name from either camelCase or snake_case source
  const getSubjectName = (subject: any) => subject.name || subject.subjectName || subject.subject_name || 'Unnamed';
  const getSubjectId = (subject: any) => subject.id || subject.subjectId || subject.subject_id;
  const getSubjectSemester = (subject: any) => subject.semester || subject.semesterName || '';
  const getSubjectTechId = (subject: any) => subject.technologyId || subject.technology_id;

  // Available semesters from subjects matching selected technologies
  const availableSemesters = useMemo(() => {
    const semSet = new Set<string>();
    allAvailableSubjects.forEach((s: any) => {
      const techId = getSubjectTechId(s);
      if (selectedTechs.size === 0 || selectedTechs.has(techId)) {
        const sem = getSubjectSemester(s);
        if (sem) semSet.add(sem);
      }
    });
    return Array.from(semSet).sort();
  }, [allAvailableSubjects, selectedTechs]);

  // Filtered subjects based on selected technologies + semesters + search
  const filteredAvailableSubjects = useMemo(() => {
    // Subjects already added to this course (by ID)
    const addedIds = new Set(subjects.map((s: any) => getSubjectId(s)));

    return allAvailableSubjects.filter((s: any) => {
      const techId = getSubjectTechId(s);
      const sem = getSubjectSemester(s);
      const id = getSubjectId(s);

      // Filter by technology
      if (selectedTechs.size > 0 && !selectedTechs.has(techId)) return false;
      // Filter by semester
      if (selectedSemesters.size > 0 && sem && !selectedSemesters.has(sem)) return false;
      // Search query
      if (subjectSearchQuery) {
        const name = getSubjectName(s).toLowerCase();
        if (!name.includes(subjectSearchQuery.toLowerCase())) return false;
      }
      // Exclude already added
      if (addedIds.has(id)) return false;

      return true;
    });
  }, [allAvailableSubjects, selectedTechs, selectedSemesters, subjectSearchQuery, subjects]);

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      // Auto-detect duration
      const duration = await getVideoDuration(file);
      if (duration > 0) {
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        setNewLessonDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }
  };

  const handleAddSubject = async (subjectId: number) => {
    const result = await addSubject({ subjectId });
    if (result) {
      toast.success('Subject added to course');
      refetchCourseSubjects();
      refetchCurriculum();
    } else {
      toast.error('Failed to add subject');
    }
  };

  const handleRemoveSubject = async (subjectId: number) => {
    const result = await removeSubject({ subjectId });
    if (result !== null) {
      toast.success('Subject removed');
      refetchCourseSubjects();
      refetchCurriculum();
    }
  };

  const handleCreateChapter = async (subjectId: number) => {
    if (!newChapterTitle.trim()) {
      toast.error('Please enter a chapter title');
      return;
    }
    const chapters = chaptersBySubject.get(subjectId) || [];
    const result = await createChapter({
      title: newChapterTitle.trim(),
      subjectId,
      description: newChapterDesc.trim() || undefined,
      sortOrder: chapters.length + 1,
    });
    if (result) {
      toast.success('Chapter created');
      setNewChapterTitle('');
      setNewChapterDesc('');
      setShowNewChapter(null);
      refetchCurriculum();
    } else {
      toast.error('Failed to create chapter');
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    const result = await deleteChapter({ chapterId });
    if (result !== null) {
      toast.success('Chapter deleted');
      refetchCurriculum();
    }
  };

  const handleUpdateChapter = async (chapterId: string) => {
    if (!editChapterTitle.trim()) return;
    const result = await updateChapter({ chapterId, title: editChapterTitle.trim(), description: editChapterDesc.trim() || undefined });
    if (result) {
      toast.success('Chapter updated');
      setEditingChapter(null);
      setEditChapterDesc('');
      refetchCurriculum();
    }
  };

  const handleCreateLesson = async (chapterId: string, subjectId: number) => {
    if (!newLessonTitle.trim()) {
      toast.error('Please enter a lesson title');
      return;
    }

    // If video file selected, upload first
    if (videoFile) {
      const fd = new FormData();
      fd.append('video', videoFile);
      fd.append('title', newLessonTitle.trim());
      fd.append('lesson_type', newLessonType);
      if (videoThumbnail) fd.append('thumbnail', videoThumbnail);
      if (ccFile) fd.append('cc_file', ccFile);

      const durationParts = newLessonDuration.split(':');
      let durationSec = 0;
      if (durationParts.length === 2) {
        durationSec = parseInt(durationParts[0]) * 60 + parseInt(durationParts[1]);
      } else {
        durationSec = parseInt(newLessonDuration) || 0;
      }
      fd.append('duration', String(durationSec));
      fd.append('is_preview', String(newLessonIsPreview));

      const result = await uploadVideo(fd);
      if (result) {
        toast.success('Video uploaded & lesson created');
        resetLessonForm();
        refetchCurriculum();
      } else {
        toast.error('Video upload failed');
      }
      return;
    }

    const durationParts = newLessonDuration.split(':');
    let durationSec = 0;
    if (durationParts.length === 2) {
      durationSec = parseInt(durationParts[0]) * 60 + parseInt(durationParts[1]);
    } else {
      durationSec = parseInt(newLessonDuration) || 0;
    }

    const result = await createLesson({
      title: newLessonTitle.trim(),
      chapterId,
      subjectId,
      lessonType: newLessonType,
      duration: durationSec || undefined,
      isPreview: newLessonIsPreview,
    });
    if (result) {
      toast.success('Lesson created');
      resetLessonForm();
      refetchCurriculum();
    } else {
      toast.error('Failed to create lesson');
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    const result = await deleteLesson({ lessonId });
    if (result !== null) {
      toast.success('Lesson deleted');
      refetchCurriculum();
    }
  };

  const handleUploadResource = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', file.name);
    const result = await uploadResource(fd);
    if (result) {
      toast.success('Resource uploaded');
      refetchResources();
    } else {
      toast.error('Upload failed');
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    const { apiDelete } = await import('@/lib/api-client');
    try {
      await apiDelete(`/courses/${courseId}/resources/${resourceId}`);
      toast.success('Resource deleted');
      refetchResources();
    } catch {
      toast.error('Failed to delete resource');
    }
  };

  const resetLessonForm = () => {
    setNewLessonTitle('');
    setNewLessonType('video');
    setNewLessonDuration('');
    setNewLessonIsPreview(false);
    setVideoFile(null);
    setVideoThumbnail(null);
    setCcFile(null);
    setShowNewLesson(null);
  };

  if (curriculumLoading || courseLoading) {
    return <LoadingSkeleton type="card" count={3} />;
  }

  const subjects = courseSubjects.length > 0 ? courseSubjects : (curriculum.subjects || []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
              Course <span className="gradient-text">Curriculum</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {course?.title || 'Manage curriculum structure'}
            </p>
          </div>
          <GradientButton size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddSubject(true)}>
            Add Subject
          </GradientButton>
        </div>
      </motion.div>

      {/* Course Subjects & Chapters */}
      {subjects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No subjects yet"
          description="Add subjects to organize your course content by topics"
          actionLabel="Add Subject"
          onAction={() => setShowAddSubject(true)}
        />
      ) : (
        <div className="space-y-4">
          {subjects.map((subject: any, si: number) => {
            const subjectChapters = chaptersBySubject.get(getSubjectId(subject)) || [];
            return (
              <motion.div key={getSubjectId(subject) || si} {...staggerChildren(si, 0.04)}>
                <GlassCard className="overflow-hidden" glow>
                  {/* Subject Header */}
                  <div className="p-4 md:p-5 border-b border-black/[0.03] dark:border-white/[0.03] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-black dark:from-white dark:via-neutral-200 dark:to-white flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
                        <BookOpen className="w-5 h-5 text-white dark:text-neutral-900" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{getSubjectName(subject)}</h3>
                        <p className="text-xs text-muted-foreground">{subjectChapters.length} chapters</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <GradientButton size="sm" variant="ghost" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => { setShowNewChapter(String(getSubjectId(subject))); setNewChapterTitle(''); setNewChapterDesc(''); }}>
                        Chapter
                      </GradientButton>
                      <button
                        onClick={() => handleRemoveSubject(getSubjectId(subject))}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* New Chapter Form */}
                  <AnimatePresence>
                    {showNewChapter === String(getSubjectId(subject)) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-b border-black/[0.03] dark:border-white/[0.03]"
                      >
                        <div className="p-4 space-y-3 bg-black/[0.01] dark:bg-white/[0.01]">
                          <input
                            type="text"
                            value={newChapterTitle}
                            onChange={(e) => setNewChapterTitle(e.target.value)}
                            placeholder="Chapter title"
                            className="w-full px-3 py-2 rounded-lg text-sm premium-input placeholder:text-muted-foreground/60"
                            autoFocus
                          />
                          <input
                            type="text"
                            value={newChapterDesc}
                            onChange={(e) => setNewChapterDesc(e.target.value)}
                            placeholder="Chapter description (optional)"
                            className="w-full px-3 py-2 rounded-lg text-sm premium-input placeholder:text-muted-foreground/60"
                          />
                          <div className="flex gap-2">
                            <GradientButton size="sm" loading={creatingChapter} onClick={() => handleCreateChapter(getSubjectId(subject))} icon={<Plus className="w-3.5 h-3.5" />}>
                              Add
                            </GradientButton>
                            <GradientButton size="sm" variant="ghost" onClick={() => setShowNewChapter(null)}>Cancel</GradientButton>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Chapters */}
                  <div className="divide-y divide-black/[0.03] dark:divide-white/[0.03]">
                    {subjectChapters.map((chapter: any, ci: number) => {
                      const chapterLessons = getLessonsForChapter(chapter.id);
                      return (
                        <ChapterSection
                          key={chapter.id}
                          chapter={chapter}
                          lessons={chapterLessons}
                          courseId={courseId}
                          onDeleteChapter={handleDeleteChapter}
                          onUpdateChapter={handleUpdateChapter}
                          onDeleteLesson={handleDeleteLesson}
                          onCreateLesson={handleCreateLesson}
                          editingChapter={editingChapter}
                          setEditingChapter={setEditingChapter}
                          editChapterTitle={editChapterTitle}
                          setEditChapterTitle={setEditChapterTitle}
                          showNewLesson={showNewLesson}
                          setShowNewLesson={setShowNewLesson}
                          newLessonTitle={newLessonTitle}
                          setNewLessonTitle={setNewLessonTitle}
                          newLessonType={newLessonType}
                          setNewLessonType={setNewLessonType}
                          newLessonDuration={newLessonDuration}
                          setNewLessonDuration={setNewLessonDuration}
                          newLessonIsPreview={newLessonIsPreview}
                          setNewLessonIsPreview={setNewLessonIsPreview}
                          videoFile={videoFile}
                          handleVideoFileChange={handleVideoFileChange}
                          videoThumbnail={videoThumbnail}
                          setVideoThumbnail={setVideoThumbnail}
                          ccFile={ccFile}
                          setCcFile={setCcFile}
                          creatingLesson={creatingLesson}
                          uploadingVideo={uploadingVideo}
                          videoUploadProgress={videoUploadProgress}
                          resetLessonForm={resetLessonForm}
                          subjectId={getSubjectId(subject)}
                          editChapterDesc={editChapterDesc}
                          setEditChapterDesc={setEditChapterDesc}
                        />
                      );
                    })}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Resources Section */}
      <motion.div {...staggerChildren(subjects.length, 0.04)}>
        <GlassCard className="p-5" glow>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400" />
              <h2 className="text-lg font-bold gradient-text">Resources</h2>
            </div>
            <label className="cursor-pointer">
              <GradientButton size="sm" icon={<Upload className="w-3.5 h-3.5" />} loading={uploadingResource}>
                Upload
              </GradientButton>
              <input type="file" className="hidden" accept=".pdf,.zip,.doc,.docx,.ppt,.pptx" onChange={handleUploadResource} />
            </label>
          </div>

          {/* Upload Progress */}
          {uploadingResource && (
            <div className="mb-4">
              <div className="h-2 rounded-full bg-black/[0.04] dark:bg-white/[0.04] overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-white dark:to-neutral-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${resourceUploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Uploading... {resourceUploadProgress}%</p>
            </div>
          )}

          {resources.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No resources uploaded yet</p>
          ) : (
            <div className="space-y-2">
              {resources.map((resource: any, i: number) => (
                <motion.div
                  key={resource.id || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.03] dark:border-white/[0.03]"
                >
                  <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{resource.title || resource.name}</p>
                    <p className="text-xs text-muted-foreground">{resource.type || 'File'} {resource.size ? `• ${(resource.size / 1024).toFixed(1)}KB` : ''}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteResource(resource.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Add Subject Dialog */}
      <AnimatePresence>
        {showAddSubject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => { setShowAddSubject(false); setSelectedTechs(new Set()); setSelectedSemesters(new Set()); setSubjectSearchQuery(''); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[85vh] flex flex-col"
            >
              <GlassCard className="p-6 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold gradient-text">Add Subject</h3>
                  <button onClick={() => { setShowAddSubject(false); setSelectedTechs(new Set()); setSelectedSemesters(new Set()); setSubjectSearchQuery(''); }} className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center"><X className="w-4 h-4" /></button>
                </div>

                <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-1 custom-scrollbar">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={subjectSearchQuery}
                      onChange={(e) => setSubjectSearchQuery(e.target.value)}
                      placeholder="Search subjects..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm premium-input placeholder:text-muted-foreground/60"
                    />
                  </div>

                  {/* Technology Checkboxes */}
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2">Technologies</label>
                    <div className="flex flex-wrap gap-2">
                      {technologies.map((tech: any) => {
                        const isSelected = selectedTechs.has(tech.id);
                        return (
                          <button
                            key={tech.id}
                            onClick={() => {
                              const next = new Set(selectedTechs);
                              if (isSelected) next.delete(tech.id); else next.add(tech.id);
                              setSelectedTechs(next);
                              // Clear semesters that no longer apply
                              const validSems = new Set<string>();
                              allAvailableSubjects.forEach((s: any) => {
                                const tid = getSubjectTechId(s);
                                if (next.has(tid) || next.size === 0) {
                                  const sem = getSubjectSemester(s);
                                  if (sem) validSems.add(sem);
                                }
                              });
                              const kept = new Set([...selectedSemesters].filter(s => validSems.has(s)));
                              setSelectedSemesters(kept);
                            }}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                              isSelected
                                ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white'
                                : 'bg-transparent text-muted-foreground border-black/[0.08] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20'
                            )}
                          >
                            {tech.name || tech.shortCode}
                          </button>
                        );
                      })}
                      {technologies.length === 0 && (
                        <p className="text-xs text-muted-foreground">No technologies available</p>
                      )}
                    </div>
                  </div>

                  {/* Semester Checkboxes */}
                  {availableSemesters.length > 0 && (
                    <div>
                      <label className="text-sm font-semibold text-foreground block mb-2">Semesters</label>
                      <div className="flex flex-wrap gap-2">
                        {availableSemesters.map((sem) => {
                          const isSelected = selectedSemesters.has(sem);
                          return (
                            <button
                              key={sem}
                              onClick={() => {
                                const next = new Set(selectedSemesters);
                                if (isSelected) next.delete(sem); else next.add(sem);
                                setSelectedSemesters(next);
                              }}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                                isSelected
                                  ? 'bg-neutral-800 text-white border-neutral-800 dark:bg-neutral-200 dark:text-neutral-900 dark:border-neutral-200'
                                  : 'bg-transparent text-muted-foreground border-black/[0.08] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20'
                              )}
                            >
                              Sem {sem}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Subject List */}
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2">
                      Available Subjects
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {filteredAvailableSubjects.length} found
                      </span>
                    </label>
                    <div className="max-h-52 overflow-y-auto space-y-1 custom-scrollbar">
                      {filteredAvailableSubjects.map((subject: any) => {
                        const techId = getSubjectTechId(subject);
                        const tech = technologies.find((t: any) => t.id === techId);
                        const sem = getSubjectSemester(subject);
                        return (
                          <button
                            key={getSubjectId(subject)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left text-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors group"
                            onClick={() => handleAddSubject(getSubjectId(subject))}
                          >
                            <Plus className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            <span className="flex-1 truncate">{getSubjectName(subject)}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {tech && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground font-semibold">
                                  {tech.shortCode || tech.name}
                                </span>
                              )}
                              {sem && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground font-semibold">
                                  Sem {sem}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                      {filteredAvailableSubjects.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {selectedTechs.size === 0 && selectedSemesters.size === 0 && !subjectSearchQuery
                            ? 'Select technologies or search to see subjects'
                            : 'No matching subjects found'}
                        </p>
                      )}
                    </div>
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

// Chapter Section Component
function ChapterSection({
  chapter,
  lessons,
  courseId,
  onDeleteChapter,
  onUpdateChapter,
  onDeleteLesson,
  onCreateLesson,
  editingChapter,
  setEditingChapter,
  editChapterTitle,
  setEditChapterTitle,
  editChapterDesc,
  setEditChapterDesc,
  showNewLesson,
  setShowNewLesson,
  newLessonTitle,
  setNewLessonTitle,
  newLessonType,
  setNewLessonType,
  newLessonDuration,
  setNewLessonDuration,
  newLessonIsPreview,
  setNewLessonIsPreview,
  videoFile,
  handleVideoFileChange,
  videoThumbnail,
  setVideoThumbnail,
  ccFile,
  setCcFile,
  creatingLesson,
  uploadingVideo,
  videoUploadProgress,
  resetLessonForm,
  subjectId,
}: any) {
  const [expanded, setExpanded] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const chapterDesc = chapter.description || chapter.desc || '';

  return (
    <div>
      {/* Chapter Header */}
      <div
        className="flex items-center gap-3 px-4 md:px-5 py-3 cursor-pointer hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <motion.div animate={{ rotate: expanded ? 0 : -90 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
        <GripVertical className="w-4 h-4 text-muted-foreground/30" />
        <div className="flex-1 min-w-0">
          {editingChapter === chapter.id ? (
            <div className="space-y-2" onClick={(e: any) => e.stopPropagation()}>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editChapterTitle}
                  onChange={(e) => setEditChapterTitle(e.target.value)}
                  className="flex-1 px-2 py-1 rounded-lg text-sm premium-input"
                  placeholder="Chapter title"
                  autoFocus
                />
                <button onClick={() => onUpdateChapter(chapter.id)} className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center"><Check className="w-3.5 h-3.5" /></button>
                <button onClick={() => setEditingChapter(null)} className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
              </div>
              <input
                type="text"
                value={editChapterDesc}
                onChange={(e) => setEditChapterDesc(e.target.value)}
                className="w-full px-2 py-1 rounded-lg text-sm premium-input"
                placeholder="Chapter description (optional)"
              />
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-foreground truncate">{chapter.title}</p>
              <p className="text-xs text-muted-foreground">
                {lessons.length} lessons
                {chapterDesc ? ` · ${chapterDesc}` : ''}
              </p>
            </>
          )}
        </div>
        {!editingChapter && (
          <div className="flex items-center gap-1" onClick={(e: any) => e.stopPropagation()}>
            <button
              onClick={() => { setEditingChapter(chapter.id); setEditChapterTitle(chapter.title); setEditChapterDesc(chapterDesc); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { onDeleteChapter(chapter.id); setConfirmDelete(false); }}
                  className="h-7 px-2 rounded-lg bg-red-100 text-red-700 text-[10px] font-bold flex items-center gap-1 dark:bg-red-900/30 dark:text-red-400"
                >
                  <AlertTriangle className="w-3 h-3" />Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="h-7 px-2 rounded-lg bg-muted/50 text-muted-foreground text-[10px] font-bold"
                >
                  Keep
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Chapter Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-8 md:pl-12 pr-4 md:pr-5 pb-3 space-y-1">
              {/* Lessons */}
              {lessons.map((lesson: any, li: number) => (
                <div
                  key={lesson.id || li}
                  className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group"
                >
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground/20" />
                  {lesson.lessonType === 'video' || lesson.lessonType === 'video' ? (
                    <Video className="w-4 h-4 text-muted-foreground/60" />
                  ) : lesson.lessonType === 'link' ? (
                    <LinkIcon className="w-4 h-4 text-muted-foreground/60" />
                  ) : (
                    <FileText className="w-4 h-4 text-muted-foreground/60" />
                  )}
                  <span className="flex-1 text-sm text-foreground truncate">{lesson.title}</span>
                  {lesson.duration > 0 && (
                    <span className="text-[10px] text-muted-foreground">{formatDurationShort(lesson.duration)}</span>
                  )}
                  {lesson.isPreview && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center gap-0.5">
                      <Eye className="w-3 h-3" />Preview
                    </span>
                  )}
                  <button
                    onClick={() => onDeleteLesson(lesson.id)}
                    className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Add Lesson Button */}
              <div className="pt-1">
                {showNewLesson === chapter.id ? (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.03] dark:border-white/[0.03] space-y-3"
                  >
                    <input
                      type="text"
                      value={newLessonTitle}
                      onChange={(e) => setNewLessonTitle(e.target.value)}
                      placeholder="Lesson title"
                      className="w-full px-3 py-2 rounded-lg text-sm premium-input placeholder:text-muted-foreground/60"
                      autoFocus
                    />

                    {/* Lesson Type + Duration */}
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newLessonType}
                        onChange={(e) => setNewLessonType(e.target.value)}
                        className="px-3 py-2 rounded-lg text-sm premium-input"
                      >
                        <option value="video">Video</option>
                        <option value="link">Link</option>
                        <option value="youtube">YouTube</option>
                        <option value="document">Document</option>
                      </select>
                      <input
                        type="text"
                        value={newLessonDuration}
                        onChange={(e) => setNewLessonDuration(e.target.value)}
                        placeholder="Duration (mm:ss)"
                        className="px-3 py-2 rounded-lg text-sm premium-input placeholder:text-muted-foreground/60"
                      />
                    </div>

                    {/* Video Upload */}
                    {(newLessonType === 'video') && (
                      <div className="space-y-2">
                        <label className="block">
                          <div className="border-2 border-dashed border-black/[0.06] dark:border-white/[0.04] rounded-xl p-4 text-center cursor-pointer hover:border-black/10 dark:hover:border-white/10 transition-colors">
                            <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                            <p className="text-xs text-muted-foreground">{videoFile ? videoFile.name : 'Click to upload video'}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-0.5">Auto-detects duration</p>
                          </div>
                          <input type="file" accept="video/*" className="hidden" onChange={handleVideoFileChange} />
                        </label>

                        {/* Thumbnail + CC */}
                        <div className="grid grid-cols-2 gap-2">
                          <label className="block">
                            <div className="border border-dashed border-black/[0.04] dark:border-white/[0.04] rounded-lg p-2 text-center cursor-pointer hover:border-black/10 transition-colors">
                              <p className="text-[10px] text-muted-foreground">{videoThumbnail ? videoThumbnail.name : 'Thumbnail'}</p>
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => setVideoThumbnail(e.target.files?.[0] || null)} />
                          </label>
                          <label className="block">
                            <div className="border border-dashed border-black/[0.04] dark:border-white/[0.04] rounded-lg p-2 text-center cursor-pointer hover:border-black/10 transition-colors">
                              <p className="text-[10px] text-muted-foreground">{ccFile ? ccFile.name : 'Subtitle (.vtt/.srt)'}</p>
                            </div>
                            <input type="file" accept=".vtt,.srt" className="hidden" onChange={(e) => setCcFile(e.target.files?.[0] || null)} />
                          </label>
                        </div>

                        {/* Upload Progress */}
                        {uploadingVideo && (
                          <div>
                            <div className="h-2 rounded-full bg-black/[0.04] dark:bg-white/[0.04] overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-white dark:to-neutral-400 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${videoUploadProgress}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Uploading... {videoUploadProgress}%</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Preview toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Free Preview</span>
                      <button
                        onClick={() => setNewLessonIsPreview(!newLessonIsPreview)}
                        className={cn(
                          'w-10 h-5 rounded-full transition-colors relative',
                          newLessonIsPreview
                            ? 'bg-gradient-to-r from-neutral-900 via-neutral-800 to-black dark:from-white dark:via-neutral-200 dark:to-white'
                            : 'bg-muted/60'
                        )}
                      >
                        <motion.div
                          className="w-4 h-4 bg-white dark:bg-black rounded-full shadow-sm absolute top-0.5"
                          animate={{ left: newLessonIsPreview ? '20px' : '2px' }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <GradientButton size="sm" loading={creatingLesson || uploadingVideo} onClick={() => onCreateLesson(chapter.id, subjectId)} icon={<Plus className="w-3.5 h-3.5" />}>
                        Add Lesson
                      </GradientButton>
                      <GradientButton size="sm" variant="ghost" onClick={resetLessonForm}>Cancel</GradientButton>
                    </div>
                  </motion.div>
                ) : (
                  <button
                    onClick={() => { setShowNewLesson(chapter.id); setNewLessonTitle(''); setNewLessonType('video'); setNewLessonDuration(''); setNewLessonIsPreview(false); setVideoFile(null); setVideoThumbnail(null); setCcFile(null); }}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-medium py-1 px-2 rounded-lg hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Lesson
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
