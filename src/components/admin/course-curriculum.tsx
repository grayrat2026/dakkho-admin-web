'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  BookOpen,
  GraduationCap,
  Video,
  FileText,
  ListChecks,
  AlertTriangle,
  GripVertical,
  Eye,
  Clock,
  Upload,
  CheckCircle2,
  Link,
  Image,
  Paperclip,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete, apiUpload, ApiError } from '@/lib/api-client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Chapter {
  id: string;
  title: string;
  courseId: string;
  subjectId?: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

interface Lesson {
  id: string;
  title: string;
  chapterId: string;
  courseId: string;
  subjectId?: string;
  description?: string;
  lessonType: string;
  sortOrder: number;
  isPreview: boolean;
  duration: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  documentUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface LearningPoint {
  id: string;
  courseId: string;
  content: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

interface Subject {
  id: string;
  name: string;
}

interface VideoItem {
  id: string;
  title: string;
  courseId: string;
  subjectId?: string;
  chapterId?: string;
  lessonId?: string;
  lessonType?: string;
  videoUrl?: string;
  duration: number;
  order: number;
  isPreview: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Component Props
// ---------------------------------------------------------------------------

interface CourseCurriculumProps {
  courseId: string;
}

// ---------------------------------------------------------------------------
// Lesson type options
// ---------------------------------------------------------------------------

const LESSON_TYPES = [
  { value: 'lecture', label: 'Lecture' },
  { value: 'unit', label: 'Unit' },
  { value: 'part', label: 'Part' },
  { value: 'extra_class', label: 'Extra Class' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'note', label: 'Note' },
  { value: 'other', label: 'Other' },
];

const lessonTypeBadgeStyles: Record<string, string> = {
  lecture: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  unit: 'bg-dakkho-blue/15 text-dakkho-blue border border-dakkho-blue/20',
  part: 'bg-dakkho-purple/15 text-dakkho-purple border border-dakkho-purple/20',
  extra_class: 'bg-dakkho-orange/15 text-dakkho-orange border border-dakkho-orange/20',
  assignment: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  quiz: 'bg-rose-500/15 text-rose-400 border border-rose-500/20',
  note: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20',
  other: 'bg-white/10 text-muted-foreground border border-white/10',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CourseCurriculum({ courseId }: CourseCurriculumProps) {
  const { toast } = useToast();

  // Data state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [learningPoints, setLearningPoints] = useState<LearningPoint[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Chapter dialog
  const [chapterFormOpen, setChapterFormOpen] = useState(false);
  const [editChapter, setEditChapter] = useState<Chapter | null>(null);
  const [chapterForm, setChapterForm] = useState({ title: '', subjectId: '', sortOrder: 0 });
  const [chapterSaving, setChapterSaving] = useState(false);

  // Lesson dialog — now with Video + Thumbnail + Document + Details
  const [lessonFormOpen, setLessonFormOpen] = useState(false);
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    chapterId: '',
    lessonType: 'lecture',
    sortOrder: 0,
    isPreview: false,
    duration: 0,
    description: '',
    videoUrl: '',
    videoType: 'upload' as 'upload' | 'link' | 'youtube',
    thumbnailUrl: '',
    documentUrl: '',
  });
  const [lessonSaving, setLessonSaving] = useState(false);
  const [lessonVideoUploading, setLessonVideoUploading] = useState(false);
  const [lessonVideoDragOver, setLessonVideoDragOver] = useState(false);
  const [lessonThumbnailUploading, setLessonThumbnailUploading] = useState(false);
  const [lessonDocumentUploading, setLessonDocumentUploading] = useState(false);
  const [lessonExtractedDuration, setLessonExtractedDuration] = useState<number | null>(null);
  const lessonVideoFileRef = useRef<HTMLInputElement>(null);
  const lessonThumbnailFileRef = useRef<HTMLInputElement>(null);
  const lessonDocumentFileRef = useRef<HTMLInputElement>(null);

  // Learning point dialog
  const [lpFormOpen, setLpFormOpen] = useState(false);
  const [editLp, setEditLp] = useState<LearningPoint | null>(null);
  const [lpForm, setLpForm] = useState({ content: '', sortOrder: 0 });
  const [lpSaving, setLpSaving] = useState(false);

  // Video dialog (for standalone videos)
  const [videoFormOpen, setVideoFormOpen] = useState(false);
  const [editVideo, setEditVideo] = useState<VideoItem | null>(null);
  const [videoForm, setVideoForm] = useState({
    title: '',
    subjectId: '',
    chapterId: '',
    lessonId: '',
    lessonType: '',
    videoUrl: '',
    duration: 0,
    order: 0,
    isPreview: false,
    videoType: 'upload' as 'upload' | 'link' | 'youtube',
  });
  const [videoSaving, setVideoSaving] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoDragOver, setVideoDragOver] = useState(false);
  const [extractedDuration, setExtractedDuration] = useState<number | null>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null);

  const openDeleteDialog = (type: string, id: string, name: string) => {
    setDeleteTarget({ type, id, name });
    setDeleteOpen(true);
  };

  // Expanded chapters (for accordion)
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, chRes, lsRes, lpRes, vidRes] = await Promise.all([
        apiGet(`/subjects?limit=200`) as Promise<Record<string, unknown>>,
        apiGet(`/chapters?courseId=${courseId}`) as Promise<Record<string, unknown>>,
        apiGet(`/lessons?courseId=${courseId}`) as Promise<Record<string, unknown>>,
        apiGet(`/learning-points?courseId=${courseId}`) as Promise<Record<string, unknown>>,
        apiGet(`/videos?courseId=${courseId}`) as Promise<Record<string, unknown>>,
      ]);

      const mapArr = (data: Record<string, unknown>, key: string): Record<string, unknown>[] =>
        (data[key] as Record<string, unknown>[]) || (data.documents as Record<string, unknown>[]) || [];

      const subDocs = mapArr(subRes, 'subjects');
      const chDocs = mapArr(chRes, 'chapters');
      const lsDocs = mapArr(lsRes, 'lessons');
      const lpDocs = mapArr(lpRes, 'learningPoints');
      const vidDocs = mapArr(vidRes, 'videos');

      setSubjects(subDocs.map((d) => ({ id: String(d.id), name: String(d.name ?? '') })));
      setChapters(
        chDocs.map((d) => ({
          id: String(d.id),
          title: String(d.title ?? ''),
          courseId: String(d.courseId ?? courseId),
          subjectId: d.subjectId ? String(d.subjectId) : undefined,
          sortOrder: Number(d.sortOrder ?? 0),
        })),
      );
      setLessons(
        lsDocs.map((d) => ({
          id: String(d.id),
          title: String(d.title ?? ''),
          chapterId: String(d.chapterId ?? ''),
          courseId: String(d.courseId ?? courseId),
          subjectId: d.subjectId ? String(d.subjectId) : undefined,
          description: d.description ? String(d.description) : undefined,
          lessonType: String(d.lessonType ?? 'lecture'),
          sortOrder: Number(d.sortOrder ?? 0),
          isPreview: Boolean(d.isPreview),
          duration: Number(d.duration ?? 0),
          videoUrl: d.videoUrl ? String(d.videoUrl) : undefined,
          thumbnailUrl: d.thumbnailUrl ? String(d.thumbnailUrl) : undefined,
          documentUrl: d.documentUrl ? String(d.documentUrl) : undefined,
        })),
      );
      setLearningPoints(
        lpDocs.map((d) => ({
          id: String(d.id),
          courseId: String(d.courseId ?? courseId),
          content: String(d.content ?? ''),
          sortOrder: Number(d.sortOrder ?? 0),
        })),
      );
      setVideos(
        vidDocs.map((d) => ({
          id: String(d.id),
          title: String(d.title ?? ''),
          courseId: String(d.courseId ?? courseId),
          subjectId: d.subjectId ? String(d.subjectId) : undefined,
          chapterId: d.chapterId ? String(d.chapterId) : undefined,
          lessonId: d.lessonId ? String(d.lessonId) : undefined,
          lessonType: d.lessonType ? String(d.lessonType) : undefined,
          videoUrl: d.videoUrl ? String(d.videoUrl) : undefined,
          duration: Number(d.duration ?? 0),
          order: Number(d.order ?? 0),
          isPreview: Boolean(d.isPreview),
        })),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch curriculum data';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [courseId, toast]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // -------------------------------------------------------------------------
  // Toggle chapter expansion
  // -------------------------------------------------------------------------

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  // -------------------------------------------------------------------------
  // Chapter CRUD
  // -------------------------------------------------------------------------

  const openCreateChapter = () => {
    setEditChapter(null);
    setChapterForm({ title: '', subjectId: '', sortOrder: chapters.length });
    setChapterFormOpen(true);
  };

  const openEditChapter = (chapter: Chapter) => {
    setEditChapter(chapter);
    setChapterForm({
      title: chapter.title,
      subjectId: chapter.subjectId || '',
      sortOrder: chapter.sortOrder,
    });
    setChapterFormOpen(true);
  };

  const handleSaveChapter = async () => {
    if (!chapterForm.title.trim()) return;
    setChapterSaving(true);
    try {
      const payload: Record<string, unknown> = {
        course_id: courseId,
        title: chapterForm.title,
        subject_id: chapterForm.subjectId || undefined,
        sort_order: chapterForm.sortOrder,
      };
      if (editChapter) {
        await apiPut('/chapters', { chapterId: editChapter.id, ...payload });
        toast({ title: 'Success', description: 'Chapter updated' });
      } else {
        await apiPost('/chapters', payload);
        toast({ title: 'Success', description: 'Chapter created' });
      }
      setChapterFormOpen(false);
      fetchAllData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save chapter';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setChapterSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // Lesson CRUD — Enhanced with Video + Thumbnail + Document
  // -------------------------------------------------------------------------

  // Helper: Extract duration from video file using HTML5 video element
  const extractVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const videoEl = document.createElement('video');
      videoEl.preload = 'metadata';
      videoEl.onloadedmetadata = () => {
        const durationSeconds = videoEl.duration;
        URL.revokeObjectURL(videoEl.src);
        const durationMinutes = Math.round(durationSeconds / 60 * 10) / 10;
        resolve(durationMinutes);
      };
      videoEl.onerror = () => {
        URL.revokeObjectURL(videoEl.src);
        resolve(0);
      };
      videoEl.src = URL.createObjectURL(file);
    });
  };

  // Helper: Check if URL is a YouTube link and extract embed URL
  const getYouTubeEmbedUrl = (url: string): string | null => {
    const ytRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(ytRegex);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return null;
  };

  const openCreateLesson = (chapterId?: string) => {
    setEditLesson(null);
    const chapterLessons = lessons.filter((l) => l.chapterId === (chapterId || ''));
    setLessonForm({
      title: '',
      chapterId: chapterId || '',
      lessonType: 'lecture',
      sortOrder: chapterLessons.length,
      isPreview: false,
      duration: 0,
      description: '',
      videoUrl: '',
      videoType: 'upload',
      thumbnailUrl: '',
      documentUrl: '',
    });
    setLessonExtractedDuration(null);
    setLessonFormOpen(true);
  };

  const openEditLesson = (lesson: Lesson) => {
    setEditLesson(lesson);
    // Detect video type from URL
    let vType: 'upload' | 'link' | 'youtube' = 'link';
    if (lesson.videoUrl) {
      if (getYouTubeEmbedUrl(lesson.videoUrl)) {
        vType = 'youtube';
      } else if (lesson.videoUrl.includes('r2.dev') || lesson.videoUrl.includes('pub-')) {
        vType = 'upload';
      }
    }
    setLessonForm({
      title: lesson.title,
      chapterId: lesson.chapterId,
      lessonType: lesson.lessonType,
      sortOrder: lesson.sortOrder,
      isPreview: lesson.isPreview,
      duration: lesson.duration,
      description: lesson.description || '',
      videoUrl: lesson.videoUrl || '',
      videoType: vType,
      thumbnailUrl: lesson.thumbnailUrl || '',
      documentUrl: lesson.documentUrl || '',
    });
    setLessonExtractedDuration(null);
    setLessonFormOpen(true);
  };

  // Handle video file upload for lesson
  const handleLessonVideoUpload = async (file: File) => {
    setLessonVideoUploading(true);
    setLessonExtractedDuration(null);
    try {
      const duration = await extractVideoDuration(file);
      if (duration > 0) {
        setLessonExtractedDuration(duration);
        setLessonForm((prev) => ({ ...prev, duration }));
      }
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'videos');
      const result = await apiUpload('/upload', formData) as Record<string, unknown>;
      const url = result.url as string;
      setLessonForm((prev) => ({ ...prev, videoUrl: url, videoType: 'upload' }));
      toast({ title: 'Video uploaded', description: duration > 0 ? `Duration: ${duration} min (auto-detected)` : 'File uploaded successfully' });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Upload failed';
      toast({ title: 'Upload Error', description: message, variant: 'destructive' });
    } finally {
      setLessonVideoUploading(false);
    }
  };

  // Handle thumbnail file upload for lesson
  const handleLessonThumbnailUpload = async (file: File) => {
    setLessonThumbnailUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'thumbnails');
      const result = await apiUpload('/upload', formData) as Record<string, unknown>;
      const url = result.url as string;
      setLessonForm((prev) => ({ ...prev, thumbnailUrl: url }));
      toast({ title: 'Thumbnail uploaded', description: 'Thumbnail set successfully' });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Upload failed';
      toast({ title: 'Upload Error', description: message, variant: 'destructive' });
    } finally {
      setLessonThumbnailUploading(false);
    }
  };

  // Handle document file upload for lesson
  const handleLessonDocumentUpload = async (file: File) => {
    setLessonDocumentUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'documents');
      const result = await apiUpload('/upload', formData) as Record<string, unknown>;
      const url = result.url as string;
      setLessonForm((prev) => ({ ...prev, documentUrl: url }));
      toast({ title: 'Document uploaded', description: 'Document attached successfully' });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Upload failed';
      toast({ title: 'Upload Error', description: message, variant: 'destructive' });
    } finally {
      setLessonDocumentUploading(false);
    }
  };

  const handleSaveLesson = async () => {
    if (!lessonForm.title.trim()) return;
    if (!lessonForm.chapterId) {
      toast({ title: 'Error', description: 'Please select a chapter', variant: 'destructive' });
      return;
    }
    setLessonSaving(true);
    try {
      // Convert YouTube URL to embed URL if applicable
      let finalVideoUrl = lessonForm.videoUrl;
      if (lessonForm.videoType === 'youtube' && finalVideoUrl) {
        const embedUrl = getYouTubeEmbedUrl(finalVideoUrl);
        if (embedUrl) finalVideoUrl = embedUrl;
      }

      const payload: Record<string, unknown> = {
        course_id: courseId,
        chapter_id: lessonForm.chapterId,
        title: lessonForm.title,
        lesson_type: lessonForm.lessonType,
        sort_order: lessonForm.sortOrder,
        is_preview: lessonForm.isPreview,
        duration: lessonForm.duration,
        description: lessonForm.description || undefined,
        video_url: finalVideoUrl || undefined,
        thumbnail_url: lessonForm.thumbnailUrl || undefined,
        document_url: lessonForm.documentUrl || undefined,
      };
      if (editLesson) {
        await apiPut('/lessons', { lessonId: editLesson.id, ...payload });
        toast({ title: 'Success', description: 'Lesson updated' });
      } else {
        await apiPost('/lessons', payload);
        toast({ title: 'Success', description: 'Lesson created' });
      }
      setLessonFormOpen(false);
      fetchAllData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save lesson';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLessonSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // Learning Point CRUD
  // -------------------------------------------------------------------------

  const openCreateLp = () => {
    setEditLp(null);
    setLpForm({ content: '', sortOrder: learningPoints.length });
    setLpFormOpen(true);
  };

  const openEditLp = (lp: LearningPoint) => {
    setEditLp(lp);
    setLpForm({ content: lp.content, sortOrder: lp.sortOrder });
    setLpFormOpen(true);
  };

  const handleSaveLp = async () => {
    if (!lpForm.content.trim()) return;
    setLpSaving(true);
    try {
      const payload: Record<string, unknown> = {
        course_id: courseId,
        content: lpForm.content,
        sort_order: lpForm.sortOrder,
      };
      if (editLp) {
        await apiPut('/learning-points', { learningPointId: editLp.id, ...payload });
        toast({ title: 'Success', description: 'Learning point updated' });
      } else {
        await apiPost('/learning-points', payload);
        toast({ title: 'Success', description: 'Learning point created' });
      }
      setLpFormOpen(false);
      fetchAllData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save learning point';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLpSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // Standalone Video CRUD (for videos not attached to lessons)
  // -------------------------------------------------------------------------

  const handleVideoFileUpload = async (file: File) => {
    setVideoUploading(true);
    setExtractedDuration(null);
    try {
      const duration = await extractVideoDuration(file);
      if (duration > 0) {
        setExtractedDuration(duration);
        setVideoForm((prev) => ({ ...prev, duration }));
      }
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'videos');
      const result = await apiUpload('/upload', formData) as Record<string, unknown>;
      const url = result.url as string;
      setVideoForm((prev) => ({ ...prev, videoUrl: url, videoType: 'upload' }));
      toast({ title: 'Video uploaded', description: duration > 0 ? `Duration: ${duration} min (auto-detected)` : 'File uploaded successfully' });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Upload failed';
      toast({ title: 'Upload Error', description: message, variant: 'destructive' });
    } finally {
      setVideoUploading(false);
    }
  };

  const handleVideoFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setVideoDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      handleVideoFileUpload(file);
    }
  };

  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleVideoFileUpload(file);
  };

  const openCreateVideo = (lessonId?: string, chapterId?: string) => {
    setEditVideo(null);
    const lesson = lessons.find((l) => l.id === lessonId);
    setVideoForm({
      title: '',
      subjectId: '',
      chapterId: chapterId || '',
      lessonId: lessonId || '',
      lessonType: lesson?.lessonType || '',
      videoUrl: '',
      duration: 0,
      order: 0,
      isPreview: false,
      videoType: 'upload',
    });
    setExtractedDuration(null);
    setVideoFormOpen(true);
  };

  const openEditVideo = (video: VideoItem) => {
    setEditVideo(video);
    let vType: 'upload' | 'link' | 'youtube' = 'link';
    if (video.videoUrl) {
      if (getYouTubeEmbedUrl(video.videoUrl)) {
        vType = 'youtube';
      } else if (video.videoUrl.includes('r2.dev') || video.videoUrl.includes('pub-')) {
        vType = 'upload';
      }
    }
    setVideoForm({
      title: video.title,
      subjectId: video.subjectId || '',
      chapterId: video.chapterId || '',
      lessonId: video.lessonId || '',
      lessonType: video.lessonType || '',
      videoUrl: video.videoUrl || '',
      duration: video.duration,
      order: video.order,
      isPreview: video.isPreview,
      videoType: vType,
    });
    setExtractedDuration(null);
    setVideoFormOpen(true);
  };

  const handleSaveVideo = async () => {
    if (!videoForm.title.trim()) return;
    setVideoSaving(true);
    try {
      let finalVideoUrl = videoForm.videoUrl;
      if (videoForm.videoType === 'youtube' && finalVideoUrl) {
        const embedUrl = getYouTubeEmbedUrl(finalVideoUrl);
        if (embedUrl) finalVideoUrl = embedUrl;
      }

      const payload: Record<string, unknown> = {
        course_id: courseId,
        title: videoForm.title,
        subject_id: videoForm.subjectId || undefined,
        chapter_id: videoForm.chapterId || undefined,
        lesson_id: videoForm.lessonId || undefined,
        lesson_type: videoForm.lessonType || undefined,
        video_url: finalVideoUrl || undefined,
        duration: videoForm.duration,
        sort_order: videoForm.order,
        is_preview: videoForm.isPreview,
      };
      if (editVideo) {
        await apiPut('/videos', { videoId: editVideo.id, ...payload });
        toast({ title: 'Success', description: 'Video updated' });
      } else {
        await apiPost('/videos', payload);
        toast({ title: 'Success', description: 'Video created' });
      }
      setVideoFormOpen(false);
      fetchAllData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save video';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setVideoSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // Delete handler
  // -------------------------------------------------------------------------

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const endpoints: Record<string, string> = {
        chapter: '/chapters',
        lesson: '/lessons',
        learningPoint: '/learning-points',
        video: '/videos',
      };
      // Use both param formats for compatibility
      const idParams: Record<string, string> = {
        chapter: `id=${deleteTarget.id}`,
        lesson: `id=${deleteTarget.id}`,
        learningPoint: `id=${deleteTarget.id}`,
        video: `id=${deleteTarget.id}`,
      };
      const endpoint = endpoints[deleteTarget.type];
      const idParam = idParams[deleteTarget.type];
      if (endpoint && idParam) {
        await apiDelete(`${endpoint}?${idParam}`);
        toast({ title: 'Deleted', description: `${deleteTarget.name} has been deleted` });
      }
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchAllData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  // -------------------------------------------------------------------------
  // Helper: get lessons for a chapter
  // -------------------------------------------------------------------------

  const getLessonsForChapter = (chapterId: string) =>
    lessons
      .filter((l) => l.chapterId === chapterId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

  const getVideosForLesson = (lessonId: string) =>
    videos.filter((v) => v.lessonId === lessonId);

  const getSubjectName = (subjectId?: string) => {
    if (!subjectId) return null;
    const sub = subjects.find((s) => s.id === subjectId);
    return sub?.name || subjectId;
  };

  // Group chapters by subject
  const chaptersBySubject = () => {
    const groups: Record<string, Chapter[]> = {};
    chapters
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .forEach((ch) => {
        const key = ch.subjectId || '__no_subject__';
        if (!groups[key]) groups[key] = [];
        groups[key].push(ch);
      });
    return groups;
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card rounded-xl p-4 space-y-3 animate-pulse">
            <div className="h-5 w-48 bg-white/[0.06] rounded" />
            <div className="h-4 w-32 bg-white/[0.04] rounded ml-4" />
            <div className="h-4 w-40 bg-white/[0.04] rounded ml-8" />
          </div>
        ))}
      </div>
    );
  }

  const grouped = chaptersBySubject();

  return (
    <div className="space-y-6">
      {/* ---- What You'll Learn Section ---- */}
      <div className="glass-card rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-dakkho-purple" />
            <h2 className="font-semibold text-foreground text-lg">What You'll Learn</h2>
            <Badge variant="secondary" className="bg-dakkho-purple/15 text-dakkho-purple text-xs">
              {learningPoints.length}
            </Badge>
          </div>
          <Button size="sm" onClick={openCreateLp} className="gradient-purple text-white gap-1.5 h-8">
            <Plus className="h-3.5 w-3.5" /> Add Point
          </Button>
        </div>
        {learningPoints.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            No learning points yet. Add what students will learn in this course.
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {learningPoints
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((lp, idx) => (
                <div
                  key={lp.id}
                  className="flex items-start gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-colors group"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground/30 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground flex-1 min-w-0">
                    <span className="text-muted-foreground/50 mr-1.5">{idx + 1}.</span>
                    {lp.content}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-white/[0.06]"
                      onClick={() => openEditLp(lp)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() =>
                        openDeleteDialog('learningPoint', lp.id, lp.content.slice(0, 30))
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* ---- Chapters & Lessons Section ---- */}
      <div className="glass-card rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-dakkho-blue" />
            <h2 className="font-semibold text-foreground text-lg">Chapters & Lessons</h2>
            <Badge variant="secondary" className="bg-dakkho-blue/15 text-dakkho-blue text-xs">
              {chapters.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAllData}
              className="border-white/[0.08] bg-white/[0.04] h-8 w-8 p-0"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" onClick={openCreateChapter} className="gradient-purple text-white gap-1.5 h-8">
              <Plus className="h-3.5 w-3.5" /> Add Chapter
            </Button>
          </div>
        </div>

        {chapters.length === 0 ? (
          <div className="text-center py-8">
            <GraduationCap className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No chapters yet. Create your first chapter.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(grouped).map(([subjectKey, subjectChapters]) => (
              <div key={subjectKey} className="space-y-1">
                {subjectKey !== '__no_subject__' && (
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <GraduationCap className="h-4 w-4 text-dakkho-purple" />
                    <span className="text-sm font-medium text-dakkho-purple">
                      {getSubjectName(subjectKey)}
                    </span>
                  </div>
                )}
                {subjectChapters.map((chapter) => {
                  const isExpanded = expandedChapters.has(chapter.id);
                  const chapterLessons = getLessonsForChapter(chapter.id);
                  const chapterVideos = videos.filter((v) => v.chapterId === chapter.id && !v.lessonId);

                  return (
                    <div
                      key={chapter.id}
                      className="border border-white/[0.06] rounded-lg overflow-hidden"
                    >
                      {/* Chapter Header */}
                      <div
                        className="flex items-center gap-2 px-3 py-2.5 bg-white/[0.03] hover:bg-white/[0.05] cursor-pointer transition-colors group"
                        onClick={() => toggleChapter(chapter.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') toggleChapter(chapter.id);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <GripVertical className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">
                          {chapter.title}
                        </span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {chapter.subjectId && (
                            <Badge
                              variant="secondary"
                              className="bg-dakkho-purple/10 text-dakkho-purple text-[10px] px-1.5 py-0"
                            >
                              {getSubjectName(chapter.subjectId)}
                            </Badge>
                          )}
                          <Badge
                            variant="secondary"
                            className="bg-white/5 text-muted-foreground text-[10px] px-1.5 py-0"
                          >
                            {chapterLessons.length} lessons
                          </Badge>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-white/[0.06]"
                              title="Add Lesson"
                              onClick={(e) => {
                                e.stopPropagation();
                                openCreateLesson(chapter.id);
                              }}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-white/[0.06]"
                              title="Add Video"
                              onClick={(e) => {
                                e.stopPropagation();
                                openCreateVideo(undefined, chapter.id);
                              }}
                            >
                              <Video className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-white/[0.06]"
                              title="Edit Chapter"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditChapter(chapter);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                              title="Delete Chapter"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteDialog('chapter', chapter.id, chapter.title);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Chapter Content (Lessons & Videos) */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                          >
                            <div className="pl-4 pr-2 py-1 space-y-0.5 bg-white/[0.01]">
                              {chapterLessons.map((lesson) => {
                                const lessonVideos = getVideosForLesson(lesson.id);
                                return (
                                  <div key={lesson.id} className="space-y-0.5">
                                    {/* Lesson Row */}
                                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/[0.04] transition-colors group">
                                      <FileText className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                                      <span className="text-sm text-foreground/90 flex-1 min-w-0 truncate">
                                        {lesson.title}
                                      </span>
                                      {/* Thumbnail indicator */}
                                      {lesson.thumbnailUrl && (
                                        <div className="w-6 h-4 rounded-sm overflow-hidden flex-shrink-0 border border-white/[0.08]">
                                          <img src={lesson.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                        </div>
                                      )}
                                      {/* Video indicator */}
                                      {lesson.videoUrl && (
                                        <Video className="h-3 w-3 text-dakkho-blue/70 flex-shrink-0" />
                                      )}
                                      {/* Document indicator */}
                                      {lesson.documentUrl && (
                                        <Paperclip className="h-3 w-3 text-dakkho-orange/70 flex-shrink-0" />
                                      )}
                                      <Badge
                                        variant="secondary"
                                        className={`text-[10px] px-1.5 py-0 ${lessonTypeBadgeStyles[lesson.lessonType] || lessonTypeBadgeStyles.other}`}
                                      >
                                        {lesson.lessonType.replace('_', ' ')}
                                      </Badge>
                                      {lesson.isPreview && (
                                        <Badge
                                          variant="secondary"
                                          className="bg-dakkho-success/15 text-dakkho-success text-[10px] px-1.5 py-0"
                                        >
                                          <Eye className="h-2.5 w-2.5 mr-0.5" /> Preview
                                        </Badge>
                                      )}
                                      {lesson.duration > 0 && (
                                        <span className="text-[10px] text-muted-foreground/50 flex items-center gap-0.5">
                                          <Clock className="h-2.5 w-2.5" />
                                          {lesson.duration}m
                                        </span>
                                      )}
                                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 hover:bg-white/[0.06]"
                                          onClick={() => openEditLesson(lesson)}
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                                          onClick={() =>
                                            openDeleteDialog('lesson', lesson.id, lesson.title)
                                          }
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                    {/* Videos under lesson (from videos table) */}
                                    {lessonVideos.map((vid) => (
                                      <div
                                        key={vid.id}
                                        className="flex items-center gap-2 px-2 py-1 ml-6 rounded-md hover:bg-white/[0.04] transition-colors group"
                                      >
                                        <Video className="h-3 w-3 text-dakkho-blue/60 flex-shrink-0" />
                                        <span className="text-xs text-foreground/70 flex-1 min-w-0 truncate">
                                          {vid.title}
                                        </span>
                                        {vid.duration > 0 && (
                                          <span className="text-[10px] text-muted-foreground/40">
                                            {vid.duration}m
                                          </span>
                                        )}
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5 hover:bg-white/[0.06]"
                                            onClick={() => openEditVideo(vid)}
                                          >
                                            <Pencil className="h-2.5 w-2.5" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5 hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() =>
                                              openDeleteDialog('video', vid.id, vid.title)
                                            }
                                          >
                                            <Trash2 className="h-2.5 w-2.5" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })}

                              {/* Videos directly under chapter (no lesson) */}
                              {chapterVideos.map((vid) => (
                                <div
                                  key={vid.id}
                                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/[0.04] transition-colors group"
                                >
                                  <Video className="h-3.5 w-3.5 text-dakkho-blue/60 flex-shrink-0" />
                                  <span className="text-sm text-foreground/80 flex-1 min-w-0 truncate">
                                    {vid.title}
                                  </span>
                                  {vid.duration > 0 && (
                                    <span className="text-[10px] text-muted-foreground/50 flex items-center gap-0.5">
                                      <Clock className="h-2.5 w-2.5" />
                                      {vid.duration}m
                                    </span>
                                  )}
                                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 hover:bg-white/[0.06]"
                                      onClick={() => openEditVideo(vid)}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                                      onClick={() =>
                                        openDeleteDialog('video', vid.id, vid.title)
                                      }
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}

                              {chapterLessons.length === 0 && chapterVideos.length === 0 && (
                                <div className="flex items-center justify-center gap-2 px-2 py-3">
                                  <p className="text-xs text-muted-foreground/40">
                                    No lessons yet.
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs text-dakkho-blue hover:text-dakkho-blue/80 gap-1 px-2"
                                    onClick={() => openCreateLesson(chapter.id)}
                                  >
                                    <Plus className="h-3 w-3" /> Add Lesson
                                  </Button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---- Videos Section (Flat list) ---- */}
      {videos.length > 0 && (
        <div className="glass-card rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-dakkho-orange" />
              <h2 className="font-semibold text-foreground text-lg">All Videos</h2>
              <Badge variant="secondary" className="bg-dakkho-orange/15 text-dakkho-orange text-xs">
                {videos.length}
              </Badge>
            </div>
            <Button
              size="sm"
              onClick={() => openCreateVideo()}
              className="gradient-purple text-white gap-1.5 h-8"
            >
              <Plus className="h-3.5 w-3.5" /> Add Video
            </Button>
          </div>
          <div className="max-h-96 overflow-y-auto space-y-1">
            {videos.map((vid) => (
              <div
                key={vid.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.1] transition-colors group"
              >
                <Video className="h-4 w-4 text-dakkho-orange/60 flex-shrink-0" />
                <span className="text-sm text-foreground flex-1 min-w-0 truncate">{vid.title}</span>
                {vid.lessonType && (
                  <Badge
                    variant="secondary"
                    className={`text-[10px] px-1.5 py-0 ${lessonTypeBadgeStyles[vid.lessonType] || lessonTypeBadgeStyles.other}`}
                  >
                    {vid.lessonType.replace('_', ' ')}
                  </Badge>
                )}
                {vid.isPreview && (
                  <Badge
                    variant="secondary"
                    className="bg-dakkho-success/15 text-dakkho-success text-[10px] px-1.5 py-0"
                  >
                    <Eye className="h-2.5 w-2.5 mr-0.5" /> Preview
                  </Badge>
                )}
                {vid.duration > 0 && (
                  <span className="text-[10px] text-muted-foreground/50 flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" /> {vid.duration}m
                  </span>
                )}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-white/[0.06]"
                    onClick={() => openEditVideo(vid)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() =>
                      openDeleteDialog('video', vid.id, vid.title)
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- Chapter Dialog ---- */}
      <Dialog open={chapterFormOpen} onOpenChange={setChapterFormOpen}>
        <DialogContent className="bg-[#1A1A2E] border-white/[0.08] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editChapter ? 'Edit Chapter' : 'Add Chapter'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editChapter ? 'Update chapter details' : 'Create a new chapter in this course'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Title</Label>
              <Input
                value={chapterForm.title}
                onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                className="bg-white/[0.04] border-white/[0.08]"
                placeholder="Enter chapter title"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Subject (optional)</Label>
              <Select
                value={chapterForm.subjectId || '_none'}
                onValueChange={(v) =>
                  setChapterForm({ ...chapterForm, subjectId: v === '_none' ? '' : v })
                }
              >
                <SelectTrigger className="bg-white/[0.04] border-white/[0.08]">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {subjects.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Sort Order</Label>
              <Input
                type="number"
                min={0}
                value={chapterForm.sortOrder}
                onChange={(e) => setChapterForm({ ...chapterForm, sortOrder: Number(e.target.value) })}
                className="bg-white/[0.04] border-white/[0.08]"
              />
            </div>
          </div>
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setChapterFormOpen(false)}
              className="border-white/[0.08] bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveChapter}
              disabled={chapterSaving || !chapterForm.title.trim()}
              className="gradient-purple text-white gap-2"
            >
              {chapterSaving && <RefreshCw className="h-4 w-4 animate-spin" />}
              {editChapter ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Lesson Dialog — Enhanced with Video + Thumbnail + Document ---- */}
      <Dialog open={lessonFormOpen} onOpenChange={setLessonFormOpen}>
        <DialogContent className="bg-[#1A1A2E] border-white/[0.08] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              {editLesson ? 'Edit Lesson' : 'Add Lesson'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editLesson ? 'Update lesson details, video, thumbnail and documents' : 'Create a new lesson with video, thumbnail and documents'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            {/* ---- Section 1: Basic Info ---- */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-dakkho-blue flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Basic Info
              </h3>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Title *</Label>
                <Input
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="bg-white/[0.04] border-white/[0.08]"
                  placeholder="Enter lesson title"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">Chapter *</Label>
                  <Select
                    value={lessonForm.chapterId || '_none'}
                    onValueChange={(v) =>
                      setLessonForm({ ...lessonForm, chapterId: v === '_none' ? '' : v })
                    }
                  >
                    <SelectTrigger className="bg-white/[0.04] border-white/[0.08]">
                      <SelectValue placeholder="Select chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">No chapter</SelectItem>
                      {chapters.map((ch) => (
                        <SelectItem key={ch.id} value={ch.id}>
                          {ch.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">Lesson Type</Label>
                  <Select
                    value={lessonForm.lessonType}
                    onValueChange={(v) => setLessonForm({ ...lessonForm, lessonType: v })}
                  >
                    <SelectTrigger className="bg-white/[0.04] border-white/[0.08]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LESSON_TYPES.map((lt) => (
                        <SelectItem key={lt.value} value={lt.value}>
                          {lt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Description</Label>
                <Textarea
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  className="bg-white/[0.04] border-white/[0.08] min-h-[60px]"
                  placeholder="Lesson description (optional)"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">
                    Duration (min)
                    {lessonExtractedDuration !== null && lessonExtractedDuration > 0 && (
                      <span className="text-emerald-400 ml-1 text-[9px]">auto</span>
                    )}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={lessonForm.duration}
                    onChange={(e) => {
                      setLessonForm({ ...lessonForm, duration: Number(e.target.value) });
                      setLessonExtractedDuration(null);
                    }}
                    className="bg-white/[0.04] border-white/[0.08]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">Sort Order</Label>
                  <Input
                    type="number"
                    min={0}
                    value={lessonForm.sortOrder}
                    onChange={(e) => setLessonForm({ ...lessonForm, sortOrder: Number(e.target.value) })}
                    className="bg-white/[0.04] border-white/[0.08]"
                  />
                </div>
                <div className="space-y-2 flex items-end pb-1">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={lessonForm.isPreview}
                      onCheckedChange={(v) => setLessonForm({ ...lessonForm, isPreview: v })}
                    />
                    <Label className="text-muted-foreground text-xs">Free Preview</Label>
                  </div>
                </div>
              </div>
            </div>

            {/* ---- Section 2: Video ---- */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-dakkho-purple flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5" /> Video
              </h3>
              <Tabs
                value={lessonForm.videoType}
                onValueChange={(v) => setLessonForm({ ...lessonForm, videoType: v as 'upload' | 'link' | 'youtube', videoUrl: '', duration: 0 })}
                className="w-full"
              >
                <TabsList className="bg-white/[0.04] border border-white/[0.08] w-full">
                  <TabsTrigger value="upload" className="flex-1 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                    <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload
                  </TabsTrigger>
                  <TabsTrigger value="link" className="flex-1 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                    <Link className="h-3.5 w-3.5 mr-1.5" /> Link
                  </TabsTrigger>
                  <TabsTrigger value="youtube" className="flex-1 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                    <Video className="h-3.5 w-3.5 mr-1.5" /> YouTube
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="mt-3">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setLessonVideoDragOver(true); }}
                    onDragLeave={() => setLessonVideoDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setLessonVideoDragOver(false);
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith('video/')) handleLessonVideoUpload(file);
                    }}
                    onClick={() => lessonVideoFileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                      lessonVideoDragOver
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                    } ${lessonVideoUploading ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    <input
                      ref={lessonVideoFileRef}
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLessonVideoUpload(file);
                      }}
                      className="hidden"
                    />
                    {lessonVideoUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs text-muted-foreground">Uploading & extracting duration...</p>
                      </div>
                    ) : lessonForm.videoUrl && lessonForm.videoType === 'upload' ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                        <p className="text-xs text-muted-foreground truncate max-w-full">Video uploaded</p>
                        {lessonExtractedDuration !== null && lessonExtractedDuration > 0 && (
                          <p className="text-xs text-emerald-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {lessonExtractedDuration} min (auto-detected)
                          </p>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs text-emerald-400 h-6"
                          onClick={(e) => { e.stopPropagation(); lessonVideoFileRef.current?.click(); }}
                        >
                          Replace file
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-7 w-7 text-muted-foreground/40" />
                        <p className="text-xs text-muted-foreground">Drag & drop or click to upload</p>
                        <p className="text-[10px] text-muted-foreground/50">MP4, WebM, MOV — Duration auto-detected</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="link" className="mt-3">
                  <Input
                    value={lessonForm.videoType === 'link' ? lessonForm.videoUrl : ''}
                    onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value, videoType: 'link' })}
                    className="bg-white/[0.04] border-white/[0.08]"
                    placeholder="https://example.com/video.mp4"
                  />
                  <p className="text-[10px] text-muted-foreground/50 mt-1.5">Direct video file URL (MP4, WebM, etc.)</p>
                </TabsContent>
                <TabsContent value="youtube" className="mt-3">
                  <Input
                    value={lessonForm.videoType === 'youtube' ? lessonForm.videoUrl : ''}
                    onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value, videoType: 'youtube' })}
                    className="bg-white/[0.04] border-white/[0.08]"
                    placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
                  />
                  <p className="text-[10px] text-muted-foreground/50 mt-1.5">YouTube link will be auto-converted to embed</p>
                  {lessonForm.videoType === 'youtube' && lessonForm.videoUrl && getYouTubeEmbedUrl(lessonForm.videoUrl) && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-white/[0.08] aspect-video">
                      <iframe
                        src={getYouTubeEmbedUrl(lessonForm.videoUrl)!}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="YouTube preview"
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* ---- Section 3: Thumbnail ---- */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-dakkho-orange flex items-center gap-1.5">
                <Image className="h-3.5 w-3.5" /> Thumbnail
              </h3>
              <div className="flex items-start gap-3">
                {/* Thumbnail Preview */}
                {lessonForm.thumbnailUrl ? (
                  <div className="relative group/thumb w-24 h-16 rounded-lg overflow-hidden border border-white/[0.08] flex-shrink-0">
                    <img
                      src={lessonForm.thumbnailUrl}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setLessonForm({ ...lessonForm, thumbnailUrl: '' })}
                      className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-destructive/80 text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ) : null}
                <div className="flex-1">
                  <div
                    onClick={() => lessonThumbnailFileRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-all border-white/10 hover:border-white/20 hover:bg-white/[0.02] ${lessonThumbnailUploading ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    <input
                      ref={lessonThumbnailFileRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLessonThumbnailUpload(file);
                      }}
                      className="hidden"
                    />
                    {lessonThumbnailUploading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-dakkho-orange border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-muted-foreground">Uploading...</span>
                      </div>
                    ) : lessonForm.thumbnailUrl ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs text-muted-foreground">Change thumbnail</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Image className="h-5 w-5 text-muted-foreground/40" />
                        <p className="text-[10px] text-muted-foreground/50">Click to upload thumbnail (16:9 recommended)</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ---- Section 4: Document ---- */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-cyan-400 flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5" /> Document / Attachment
              </h3>
              <div
                onClick={() => lessonDocumentFileRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-all border-white/10 hover:border-white/20 hover:bg-white/[0.02] ${lessonDocumentUploading ? 'opacity-60 pointer-events-none' : ''}`}
              >
                <input
                  ref={lessonDocumentFileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLessonDocumentUpload(file);
                  }}
                  className="hidden"
                />
                {lessonDocumentUploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-muted-foreground">Uploading...</span>
                  </div>
                ) : lessonForm.documentUrl ? (
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {lessonForm.documentUrl.split('/').pop()?.split('?')[0] || 'Document attached'}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive h-6 hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLessonForm({ ...lessonForm, documentUrl: '' });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Paperclip className="h-5 w-5 text-muted-foreground/40" />
                    <p className="text-[10px] text-muted-foreground/50">Click to upload PDF, DOC, PPT, XLS, ZIP, etc.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setLessonFormOpen(false)}
              className="border-white/[0.08] bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveLesson}
              disabled={lessonSaving || !lessonForm.title.trim() || !lessonForm.chapterId}
              className="gradient-purple text-white gap-2"
            >
              {lessonSaving && <RefreshCw className="h-4 w-4 animate-spin" />}
              {editLesson ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Learning Point Dialog ---- */}
      <Dialog open={lpFormOpen} onOpenChange={setLpFormOpen}>
        <DialogContent className="bg-[#1A1A2E] border-white/[0.08] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editLp ? 'Edit Learning Point' : 'Add Learning Point'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editLp ? 'Update the learning point' : 'Add what students will learn'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Content</Label>
              <Textarea
                value={lpForm.content}
                onChange={(e) => setLpForm({ ...lpForm, content: e.target.value })}
                className="bg-white/[0.04] border-white/[0.08] min-h-[80px]"
                placeholder="What will students learn?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Sort Order</Label>
              <Input
                type="number"
                min={0}
                value={lpForm.sortOrder}
                onChange={(e) => setLpForm({ ...lpForm, sortOrder: Number(e.target.value) })}
                className="bg-white/[0.04] border-white/[0.08]"
              />
            </div>
          </div>
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setLpFormOpen(false)}
              className="border-white/[0.08] bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveLp}
              disabled={lpSaving || !lpForm.content.trim()}
              className="gradient-purple text-white gap-2"
            >
              {lpSaving && <RefreshCw className="h-4 w-4 animate-spin" />}
              {editLp ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Video Dialog (standalone) ---- */}
      <Dialog open={videoFormOpen} onOpenChange={setVideoFormOpen}>
        <DialogContent className="bg-[#1A1A2E] border-white/[0.08] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editVideo ? 'Edit Video' : 'Add Video'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editVideo ? 'Update video details' : 'Add a new video to the course'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Video Title</Label>
              <Input
                value={videoForm.title}
                onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                className="bg-white/[0.04] border-white/[0.08]"
                placeholder="Enter video title"
              />
            </div>

            {/* Video Source: Upload / Link / YouTube Embed */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Video Source</Label>
              <Tabs
                value={videoForm.videoType}
                onValueChange={(v) => setVideoForm({ ...videoForm, videoType: v as 'upload' | 'link' | 'youtube', videoUrl: '', duration: 0 })}
                className="w-full"
              >
                <TabsList className="bg-white/[0.04] border border-white/[0.08] w-full">
                  <TabsTrigger value="upload" className="flex-1 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                    <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload
                  </TabsTrigger>
                  <TabsTrigger value="link" className="flex-1 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                    <Link className="h-3.5 w-3.5 mr-1.5" /> Link
                  </TabsTrigger>
                  <TabsTrigger value="youtube" className="flex-1 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                    <Video className="h-3.5 w-3.5 mr-1.5" /> YouTube
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="mt-3">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setVideoDragOver(true); }}
                    onDragLeave={() => setVideoDragOver(false)}
                    onDrop={handleVideoFileDrop}
                    onClick={() => videoFileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                      videoDragOver
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                    } ${videoUploading ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    <input
                      ref={videoFileRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileSelect}
                      className="hidden"
                    />
                    {videoUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs text-muted-foreground">Uploading & extracting duration...</p>
                      </div>
                    ) : videoForm.videoUrl && videoForm.videoType === 'upload' ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                        <p className="text-xs text-muted-foreground truncate max-w-full">Video uploaded successfully</p>
                        {extractedDuration !== null && extractedDuration > 0 && (
                          <p className="text-xs text-emerald-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Duration: {extractedDuration} min (auto-detected)
                          </p>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs text-emerald-400 h-6"
                          onClick={(e) => { e.stopPropagation(); videoFileRef.current?.click(); }}
                        >
                          Replace file
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-7 w-7 text-muted-foreground/40" />
                        <p className="text-xs text-muted-foreground">Drag & drop or click to upload</p>
                        <p className="text-[10px] text-muted-foreground/50">MP4, WebM, MOV — Duration auto-detected</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="link" className="mt-3">
                  <Input
                    value={videoForm.videoType === 'link' ? videoForm.videoUrl : ''}
                    onChange={(e) => setVideoForm({ ...videoForm, videoUrl: e.target.value, videoType: 'link' })}
                    className="bg-white/[0.04] border-white/[0.08]"
                    placeholder="https://example.com/video.mp4"
                  />
                  <p className="text-[10px] text-muted-foreground/50 mt-1.5">Direct video file URL (MP4, WebM, etc.)</p>
                </TabsContent>
                <TabsContent value="youtube" className="mt-3">
                  <Input
                    value={videoForm.videoType === 'youtube' ? videoForm.videoUrl : ''}
                    onChange={(e) => setVideoForm({ ...videoForm, videoUrl: e.target.value, videoType: 'youtube' })}
                    className="bg-white/[0.04] border-white/[0.08]"
                    placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
                  />
                  <p className="text-[10px] text-muted-foreground/50 mt-1.5">YouTube link will be auto-converted to embed</p>
                  {videoForm.videoType === 'youtube' && videoForm.videoUrl && getYouTubeEmbedUrl(videoForm.videoUrl) && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-white/[0.08] aspect-video">
                      <iframe
                        src={getYouTubeEmbedUrl(videoForm.videoUrl)!}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="YouTube preview"
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Subject</Label>
                <Select
                  value={videoForm.subjectId || '_none'}
                  onValueChange={(v) =>
                    setVideoForm({ ...videoForm, subjectId: v === '_none' ? '' : v })
                  }
                >
                  <SelectTrigger className="bg-white/[0.04] border-white/[0.08]">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {subjects.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Chapter</Label>
                <Select
                  value={videoForm.chapterId || '_none'}
                  onValueChange={(v) =>
                    setVideoForm({ ...videoForm, chapterId: v === '_none' ? '' : v, lessonId: '' })
                  }
                >
                  <SelectTrigger className="bg-white/[0.04] border-white/[0.08]">
                    <SelectValue placeholder="Select chapter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {chapters.map((ch) => (
                      <SelectItem key={ch.id} value={ch.id}>
                        {ch.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Lesson</Label>
                <Select
                  value={videoForm.lessonId || '_none'}
                  onValueChange={(v) => {
                    const lid = v === '_none' ? '' : v;
                    const lesson = lessons.find((l) => l.id === lid);
                    setVideoForm({
                      ...videoForm,
                      lessonId: lid,
                      lessonType: lesson?.lessonType || '',
                    });
                  }}
                >
                  <SelectTrigger className="bg-white/[0.04] border-white/[0.08]">
                    <SelectValue placeholder="Select lesson" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {(videoForm.chapterId
                      ? lessons.filter((l) => l.chapterId === videoForm.chapterId)
                      : lessons
                    ).map((ls) => (
                      <SelectItem key={ls.id} value={ls.id}>
                        {ls.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Lesson Type</Label>
                <Select
                  value={videoForm.lessonType || '_none'}
                  onValueChange={(v) =>
                    setVideoForm({ ...videoForm, lessonType: v === '_none' ? '' : v })
                  }
                >
                  <SelectTrigger className="bg-white/[0.04] border-white/[0.08]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {LESSON_TYPES.map((lt) => (
                      <SelectItem key={lt.value} value={lt.value}>
                        {lt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  Duration (minutes)
                  {extractedDuration !== null && extractedDuration > 0 && (
                    <span className="text-emerald-400 ml-1.5 text-[10px]">auto-detected</span>
                  )}
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={videoForm.duration}
                  onChange={(e) => {
                    setVideoForm({ ...videoForm, duration: Number(e.target.value) });
                    setExtractedDuration(null);
                  }}
                  className="bg-white/[0.04] border-white/[0.08]"
                />
                {videoForm.duration > 0 && (
                  <p className="text-[10px] text-muted-foreground/60">
                    {videoForm.duration < 60
                      ? `${videoForm.duration} min`
                      : `${Math.floor(videoForm.duration / 60)}h ${Math.round(videoForm.duration % 60)}m`}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Order</Label>
                <Input
                  type="number"
                  min={0}
                  value={videoForm.order}
                  onChange={(e) => setVideoForm({ ...videoForm, order: Number(e.target.value) })}
                  className="bg-white/[0.04] border-white/[0.08]"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-muted-foreground">Preview</Label>
                <p className="text-xs text-muted-foreground/50">Allow free preview of this video</p>
              </div>
              <Switch
                checked={videoForm.isPreview}
                onCheckedChange={(v) => setVideoForm({ ...videoForm, isPreview: v })}
              />
            </div>
          </div>
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setVideoFormOpen(false)}
              className="border-white/[0.08] bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveVideo}
              disabled={videoSaving || videoUploading || !videoForm.title.trim()}
              className="gradient-purple text-white gap-2"
            >
              {videoSaving && <RefreshCw className="h-4 w-4 animate-spin" />}
              {editVideo ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Delete Confirmation Dialog ---- */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-[#1A1A2E] border-white/[0.08]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-dakkho-warning" />
              Delete {deleteTarget?.type === 'chapter' ? 'Chapter' : deleteTarget?.type === 'lesson' ? 'Lesson' : deleteTarget?.type === 'learningPoint' ? 'Learning Point' : 'Video'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">{deleteTarget?.name}</span>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/[0.08] bg-transparent">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
