'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from './api-client';
import { useAuthStore } from './store';

// ==================== Generic API Data Hook ====================
function useApiData<T>(path: string, defaultValue: T, deps: any[] = []) {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const fetch = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const result = await apiGet(path);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [path, isAuthenticated, ...deps]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch, setData };
}

// ==================== Generic Mutation Hook ====================
function useApiMutation<TInput, TOutput = any>(
  method: 'POST' | 'PUT' | 'DELETE',
  pathFn: (input: TInput) => string,
  bodyFn?: (input: TInput) => any,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (input: TInput): Promise<TOutput | null> => {
    setLoading(true);
    setError(null);
    try {
      const path = pathFn(input);
      const body = bodyFn ? bodyFn(input) : input;
      let result: any;
      if (method === 'POST') {
        result = await apiPost(path, body);
      } else if (method === 'PUT') {
        result = await apiPut(path, body);
      } else {
        result = await apiDelete(path);
      }
      setLoading(false);
      return result as TOutput;
    } catch (err: any) {
      setError(err.message || 'Operation failed');
      setLoading(false);
      return null;
    }
  }, [method, pathFn, bodyFn]);

  return { mutate, loading, error, setError };
}

// ==================== Dashboard ====================
export function useDashboard() {
  return useApiData('/dashboard', { success: true, dashboard: { courseCount: 0, totalStudents: 0, totalRevenue: 0, avgRating: 0, upcomingClasses: 0, totalReviews: 0 } });
}

// ==================== Technologies & Subjects ====================
export function useTechnologies() {
  return useApiData('/technologies', { technologies: [] });
}

export function useSubjects(technologyId?: number) {
  const path = technologyId ? `/subjects?technology_id=${technologyId}` : '/subjects';
  return useApiData(path, { subjects: [] }, [technologyId]);
}

export function useCourseSubjects(courseId: string) {
  return useApiData(`/courses/${courseId}/subjects`, { subjects: [] }, [courseId]);
}

export function useAddSubjectToCourse(courseId: string) {
  return useApiMutation<{ subjectId: number; sortOrder?: number }, any>(
    'POST',
    () => `/courses/${courseId}/subjects`,
    (input) => ({ subject_id: input.subjectId, sort_order: input.sortOrder }),
  );
}

export function useRemoveSubjectFromCourse(courseId: string) {
  return useApiMutation<{ subjectId: number }, any>(
    'DELETE',
    (input) => `/courses/${courseId}/subjects/${input.subjectId}`,
  );
}

// ==================== Courses ====================
export function useCourses() {
  return useApiData('/courses', { courses: [], total: 0 });
}

export function useCourse(id: string) {
  return useApiData(`/courses/${id}`, { success: true, course: null, studentCount: 0 }, [id]);
}

export function useCreateCourse() {
  return useApiMutation<{ title: string; description?: string; technologyId?: number; level?: string; price?: number; semester?: string; whatYouLearn?: string; tags?: string; language?: string }, any>(
    'POST',
    () => '/courses',
    (input) => input,
  );
}

export function useUpdateCourse(courseId: string) {
  return useApiMutation<{ title?: string; description?: string; technologyId?: number; level?: string; price?: number; semester?: string; whatYouLearn?: string; tags?: string; language?: string; isPublished?: boolean }, any>(
    'PUT',
    () => `/courses/${courseId}`,
    (input) => input,
  );
}

export function useDeleteCourse() {
  return useApiMutation<{ courseId: string }, any>(
    'DELETE',
    (input) => `/courses/${input.courseId}`,
  );
}

export function useUploadThumbnail(courseId: string) {
  return useApiMutation<{ file: File }, any>(
    'POST',
    () => `/courses/${courseId}/thumbnail`,
    (input) => {
      const fd = new FormData();
      fd.append('thumbnail', input.file);
      return fd;
    },
  );
}

// ==================== Curriculum ====================
export function useCurriculum(courseId: string) {
  return useApiData(`/courses/${courseId}/curriculum`, { success: true, curriculum: { subjects: [], chapters: [], lessons: [], resources: [] } }, [courseId]);
}

// ==================== Chapters ====================
export function useChapters(courseId: string) {
  return useApiData(`/courses/${courseId}/chapters`, { chapters: [], total: 0 }, [courseId]);
}

export function useCreateChapter(courseId: string) {
  return useApiMutation<{ title: string; subjectId?: number; description?: string; sortOrder?: number }, any>(
    'POST',
    () => `/courses/${courseId}/chapters`,
    (input) => ({ title: input.title, subject_id: input.subjectId, description: input.description, sort_order: input.sortOrder }),
  );
}

export function useUpdateChapter(courseId: string) {
  return useApiMutation<{ chapterId: string; title?: string; description?: string; sortOrder?: number; subjectId?: number }, any>(
    'PUT',
    (input) => `/courses/${courseId}/chapters/${input.chapterId}`,
    (input) => ({ title: input.title, description: input.description, sort_order: input.sortOrder, subject_id: input.subjectId }),
  );
}

export function useDeleteChapter(courseId: string) {
  return useApiMutation<{ chapterId: string }, any>(
    'DELETE',
    (input) => `/courses/${courseId}/chapters/${input.chapterId}`,
  );
}

// ==================== Lessons ====================
export function useLessons(courseId: string) {
  return useApiData(`/courses/${courseId}/lessons`, { lessons: [], total: 0 }, [courseId]);
}

export function useCreateLesson(courseId: string) {
  return useApiMutation<{ title: string; chapterId?: string; subjectId?: number; lessonType?: string; sortOrder?: number; duration?: number; videoUrl?: string; thumbnailUrl?: string; isPreview?: boolean; description?: string }, any>(
    'POST',
    () => `/courses/${courseId}/lessons`,
    (input) => ({
      title: input.title,
      chapter_id: input.chapterId,
      subject_id: input.subjectId,
      lesson_type: input.lessonType,
      sort_order: input.sortOrder,
      duration: input.duration,
      video_url: input.videoUrl,
      thumbnail_url: input.thumbnailUrl,
      is_preview: input.isPreview,
      description: input.description,
    }),
  );
}

export function useUpdateLesson(courseId: string) {
  return useApiMutation<{ lessonId: string; title?: string; description?: string; sortOrder?: number; videoUrl?: string; duration?: number; lessonType?: string; isPreview?: boolean }, any>(
    'PUT',
    (input) => `/courses/${courseId}/lessons/${input.lessonId}`,
    (input) => ({
      title: input.title,
      description: input.description,
      sort_order: input.sortOrder,
      video_url: input.videoUrl,
      duration: input.duration,
      lesson_type: input.lessonType,
      is_preview: input.isPreview,
    }),
  );
}

export function useDeleteLesson(courseId: string) {
  return useApiMutation<{ lessonId: string }, any>(
    'DELETE',
    (input) => `/courses/${courseId}/lessons/${input.lessonId}`,
  );
}

// ==================== Videos ====================
export function useCourseVideos(courseId: string) {
  return useApiData(`/courses/${courseId}/videos`, { videos: [], total: 0 }, [courseId]);
}

export function useCreateVideo(courseId: string) {
  return useApiMutation<{ title: string; lessonType?: string; videoUrl?: string; duration?: number; isPreview?: boolean; sortOrder?: number; description?: string }, any>(
    'POST',
    () => `/courses/${courseId}/videos`,
    (input) => input,
  );
}

export function useUploadVideo(courseId: string) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (formData: FormData) => {
    setLoading(true);
    setError(null);
    setUploadProgress(0);
    try {
      const result = await apiUpload(`/courses/${courseId}/videos/upload`, formData, (percent) => {
        setUploadProgress(percent);
      });
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setLoading(false);
      return null;
    }
  }, [courseId]);

  return { upload, uploadProgress, loading, error };
}

export function useUpdateVideo(courseId: string) {
  return useApiMutation<{ videoId: string; title?: string; duration?: number; isPreview?: boolean; sortOrder?: number; description?: string }, any>(
    'PUT',
    (input) => `/courses/${courseId}/videos/${input.videoId}`,
    (input) => input,
  );
}

export function useDeleteVideo() {
  return useApiMutation<{ videoId: string }, any>(
    'DELETE',
    (input) => `/videos/${input.videoId}`,
  );
}

// ==================== Resources ====================
export function useResources(courseId: string) {
  return useApiData(`/courses/${courseId}/resources`, { resources: [], total: 0 }, [courseId]);
}

export function useUploadResource(courseId: string) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (formData: FormData) => {
    setLoading(true);
    setError(null);
    setUploadProgress(0);
    try {
      const result = await apiUpload(`/courses/${courseId}/resources`, formData, (percent) => {
        setUploadProgress(percent);
      });
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setLoading(false);
      return null;
    }
  }, [courseId]);

  return { upload, uploadProgress, loading, error };
}

export function useDeleteResource(courseId: string) {
  return useApiMutation<{ resourceId: string }, any>(
    'DELETE',
    (input) => `/courses/${courseId}/resources/${input.resourceId}`,
  );
}

// ==================== Schedule ====================
export function useSchedule() {
  return useApiData('/schedule', { success: true, schedule: [] });
}

export function useCreateLiveClass() {
  return useApiMutation<{ title: string; courseId?: string; scheduledAt: string; durationMinutes?: number; platform?: string; meetingUrl?: string; description?: string }, any>(
    'POST',
    () => '/schedule',
    (input) => ({
      title: input.title,
      course_id: input.courseId,
      scheduled_at: input.scheduledAt,
      duration_minutes: input.durationMinutes,
      platform: input.platform,
      meeting_url: input.meetingUrl,
      description: input.description,
    }),
  );
}

// ==================== Reviews ====================
export function useReviews(page = 1) {
  return useApiData(`/reviews?page=${page}`, { success: true, reviews: [], stats: {}, page, limit: 10 }, [page]);
}

export function useReplyReview() {
  return useApiMutation<{ reviewId: number | string; replyText: string }, any>(
    'PUT',
    (input) => `/reviews/${input.reviewId}/reply`,
    (input) => ({ reply_text: input.replyText }),
  );
}

// ==================== Notifications ====================
export function useNotifications() {
  return useApiData('/notifications', { success: true, notifications: [], total: 0 });
}

// ==================== Profile ====================
export function useProfile() {
  return useApiData('/profile', { success: true, profile: null });
}

// ==================== Support ====================
export function useSupportTickets() {
  return useApiData('/support/tickets', { success: true, tickets: [] });
}

export function useCreateSupportTicket() {
  return useApiMutation<{ category?: string; subject: string; description: string; priority?: string }, any>(
    'POST',
    () => '/support/tickets',
    (input) => input,
  );
}

export function useSendSupportMessage() {
  return useApiMutation<{ ticketId: number | string; message: string }, any>(
    'POST',
    (input) => `/support/tickets/${input.ticketId}/messages`,
    (input) => ({ message: input.message }),
  );
}

// ==================== Course Students ====================
export function useCourseStudents(courseId: string) {
  return useApiData(`/courses/${courseId}/students`, { students: [], total: 0 }, [courseId]);
}

// ==================== Course Progress ====================
export function useCourseProgress(courseId: string) {
  return useApiData(`/courses/${courseId}/progress`, { success: true, progress: [] }, [courseId]);
}

// ==================== Course Analytics ====================
export function useCourseAnalytics(courseId: string) {
  return useApiData(`/courses/${courseId}/analytics`, { success: true, analytics: {} }, [courseId]);
}
