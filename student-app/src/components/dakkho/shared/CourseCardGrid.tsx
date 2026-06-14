'use client';

import { motion } from 'framer-motion';
import { Star, Users, Clock, Play, BookOpen } from 'lucide-react';
import { useInstructors, useCategories } from '@/lib/data-hooks';
import { formatDuration, getLevelColor } from '@/lib/mock-data';
import { useNavigationStore, useBookmarkStore } from '@/lib/store';
import { GlassCard } from './GlassCard';
import { ProgressBar } from './ProgressBar';
import { Heart } from 'lucide-react';
import type { Course, Instructor, Category } from '@/lib/mock-data';
import { ProgressiveImage } from '@/components/shared/ProgressiveImage';

interface CourseCardProps {
  course: Course;
  showProgress?: boolean;
  progress?: number;
  index?: number;
  instructors?: Instructor[];
  categories?: Category[];
  variant?: 'landscape' | 'poster';
}

export function CourseCard({ course, showProgress = false, progress = 0, index = 0, instructors: instructorsProp, categories: categoriesProp, variant = 'landscape' }: CourseCardProps) {
  const navigate = useNavigationStore((s) => s.navigate);
  const { isBookmarked, toggleBookmark } = useBookmarkStore();

  // Use provided props or fallback to hooks
  const { data: hookInstructors } = useInstructors();
  const { data: hookCategories } = useCategories();
  const instructors = instructorsProp ?? hookInstructors;
  const categories = categoriesProp ?? hookCategories;

  const instructor = instructors.find((i) => i.id === course.instructorId);
  const category = categories.find((c) => c.id === course.categoryId);
  const bookmarked = isBookmarked(course.id);

  const thumbnailColors = [
    'from-sky-400 to-blue-600',
    'from-emerald-400 to-teal-600',
    'from-purple-400 to-indigo-600',
    'from-amber-400 to-orange-600',
    'from-rose-400 to-pink-600',
    'from-cyan-400 to-sky-600',
  ];
  const colorClass = thumbnailColors[course.id.charCodeAt(1) % thumbnailColors.length];

  if (variant === 'poster') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.4 }}
        className="h-full"
      >
        <GlassCard
          hover
          className="overflow-hidden cursor-pointer group relative h-full"
          onClick={() => navigate('course-detail', { courseId: course.id })}
        >
          {/* Full-card poster image */}
          <div className="relative w-full h-full overflow-hidden">
            <ProgressiveImage
              src={course.thumbnailUrl}
              alt={course.title}
              className="absolute inset-0 w-full h-full"
              imgClassName="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              placeholderGradient={colorClass}
              fallback={
                <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
                  <BookOpen className="w-12 h-12 text-white/30" />
                </div>
              }
            />

            {/* Play overlay on hover — desktop only */}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none hidden sm:flex">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-xl scale-50 group-hover:scale-100 transition-transform duration-400">
                <Play className="w-5 h-5 text-sky-600 ml-0.5" fill="currentColor" />
              </div>
            </div>

            {/* Level badge — always visible */}
            <span
              className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-black/40 backdrop-blur-sm z-10"
              style={{ borderColor: getLevelColor(course.level) }}
            >
              {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
            </span>

            {/* Price badge — always visible */}
            {course.price > 0 ? (
              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-emerald-500/80 backdrop-blur-sm z-10">
                ৳{course.price}
              </span>
            ) : (
              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-sky-500/80 backdrop-blur-sm z-10">
                Free
              </span>
            )}

            {/* Bookmark — always visible */}
            <motion.button
              className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center z-30"
              onClick={(e) => { e.stopPropagation(); toggleBookmark(course.id); }}
              whileTap={{ scale: 0.8 }}
            >
              <Heart className={`w-4 h-4 ${bookmarked ? 'text-red-400 fill-red-400' : 'text-white'}`} />
            </motion.button>

            {/* Bottom gradient — always visible */}
            <div className="absolute bottom-0 left-0 right-0 h-[50%] bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

            {/* Title overlay — always visible (mobile + desktop) */}
            <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
              <h3 className="font-bold text-sm text-white line-clamp-2 leading-tight drop-shadow-lg">
                {course.title}
              </h3>
            </div>

            {/* Desktop hover metadata overlay — hidden on mobile */}
            <div className="
              absolute bottom-0 left-0 right-0 p-3 pt-10
              bg-gradient-to-t from-black/95 via-black/70 to-transparent
              opacity-0 translate-y-4
              group-hover:opacity-100 group-hover:translate-y-0
              transition-all duration-500 ease-out
              pointer-events-none
              hidden sm:block
              z-20
            ">
              <div className="space-y-1">
                {category && (
                  <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider block opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                    {category.name}
                  </span>
                )}
                <h3 className="font-bold text-sm text-white line-clamp-2 leading-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150">
                  {course.title}
                </h3>
                {instructor && (
                  <p className="text-xs text-white/80 line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200">
                    {instructor.name}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-[250ms]">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    {course.rating}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {course.totalStudents}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(course.duration)}
                  </span>
                </div>
                {showProgress && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-300">
                    <ProgressBar value={progress} size="sm" showLabel />
                  </div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    );
  }

  // Landscape variant (default)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <GlassCard
        hover
        className="overflow-hidden cursor-pointer group"
        onClick={() => navigate('course-detail', { courseId: course.id })}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          <ProgressiveImage
            src={course.thumbnailUrl}
            alt={course.title}
            className="absolute inset-0 w-full h-full"
            imgClassName="absolute inset-0 w-full h-full object-cover"
            placeholderGradient={colorClass}
            fallback={
              <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
                <BookOpen className="w-12 h-12 text-white/30" />
              </div>
            }
          />
          {/* Play overlay on hover */}
          <motion.div
            className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <motion.div
              className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center"
              initial={{ scale: 0.5 }}
              whileHover={{ scale: 1 }}
            >
              <Play className="w-6 h-6 text-sky-600 ml-1" fill="currentColor" />
            </motion.div>
          </motion.div>
          {/* Level badge */}
          <span
            className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-black/40 backdrop-blur-sm"
            style={{ borderColor: getLevelColor(course.level) }}
          >
            {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
          </span>
          {/* Price badge */}
          {course.price > 0 ? (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-emerald-500/80 backdrop-blur-sm">
              ৳{course.price}
            </span>
          ) : (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-sky-500/80 backdrop-blur-sm">
              Free
            </span>
          )}
          {/* Bookmark */}
          <motion.button
            className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
            onClick={(e) => { e.stopPropagation(); toggleBookmark(course.id); }}
            whileTap={{ scale: 0.8 }}
          >
            <Heart className={`w-4 h-4 ${bookmarked ? 'text-red-400 fill-red-400' : 'text-white'}`} />
          </motion.button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          {category && (
            <span className="text-[10px] font-semibold text-sky-500 uppercase tracking-wider">
              {category.name}
            </span>
          )}
          <h3 className="font-bold text-sm text-foreground line-clamp-2 leading-tight">
            {course.title}
          </h3>
          {instructor && (
            <p className="text-xs text-muted-foreground">{instructor.name}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              {course.rating}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {course.totalStudents}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(course.duration)}
            </span>
          </div>
          {showProgress && (
            <ProgressBar value={progress} size="sm" showLabel />
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

interface CourseCardGridProps {
  courses: Course[];
  showProgress?: boolean;
  getProgress?: (courseId: string) => number;
  instructors?: Instructor[];
  categories?: Category[];
  variant?: 'landscape' | 'poster';
}

export function CourseCardGrid({ courses, showProgress = false, getProgress, instructors, categories, variant = 'landscape' }: CourseCardGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {courses.map((course, i) => (
        <CourseCard
          key={course.id}
          course={course}
          showProgress={showProgress}
          progress={getProgress ? getProgress(course.id) : 0}
          index={i}
          instructors={instructors}
          categories={categories}
          variant={variant}
        />
      ))}
    </div>
  );
}
