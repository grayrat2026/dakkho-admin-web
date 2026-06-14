'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCourses } from '@/lib/data-hooks';
import type { Course } from '@/lib/mock-data';
import { CourseCard } from '../shared/CourseCardGrid';
import { CourseCardSkeleton } from '../shared/LoadingSkeleton';

export function TrendingCourses() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: allCourses, loading } = useCourses({ limit: 20 });

  // Featured courses or most popular as trending
  const featured = allCourses.filter((c) => c.isFeatured).slice(0, 10);
  const courses: Course[] = featured.length > 0 ? featured : allCourses.slice(0, 10);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -260 : 260, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-sky-500" />
          <h2 className="text-lg font-extrabold text-foreground">Trending Courses</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-48 sm:w-52 h-[340px] sm:h-[360px]">
              <CourseCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (courses.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-sky-500" />
          <h2 className="text-lg font-extrabold text-foreground">Trending Courses</h2>
        </div>
        <div className="flex gap-2">
          <motion.button
            className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center"
            onClick={() => scroll('left')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
          <motion.button
            className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center"
            onClick={() => scroll('right')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
        style={{ scrollbarWidth: 'none' }}
      >
        {courses.map((course, i) => (
          <div key={course.id} className="flex-shrink-0 w-48 sm:w-52 h-[340px] sm:h-[360px]">
            <CourseCard
              course={course}
              index={i}
              variant="poster"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
