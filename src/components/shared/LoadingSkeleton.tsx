'use client';

import { cn } from '@/lib/utils';

type SkeletonType = 'card' | 'line' | 'circle' | 'video';

interface LoadingSkeletonProps {
  type?: SkeletonType;
  count?: number;
}

const baseSkeletonClass = 'animate-pulse rounded-xl overflow-hidden relative';

// Premium skeleton with shimmer
function PremiumSkeleton({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(baseSkeletonClass, className)}>
      {children}
      {/* Shimmer overlay */}
      <div className="absolute inset-0 skeleton-premium pointer-events-none" />
    </div>
  );
}

function SkeletonCard() {
  return (
    <PremiumSkeleton className="p-6 space-y-4">
      <div className="h-40 rounded-xl bg-muted/40" />
      <div className="space-y-2">
        <div className="h-4 w-3/4 rounded-lg bg-muted/40" />
        <div className="h-3 w-1/2 rounded-lg bg-muted/40" />
      </div>
      <div className="flex gap-2">
        <div className="h-6 w-16 rounded-full bg-muted/40" />
        <div className="h-6 w-20 rounded-full bg-muted/40" />
      </div>
    </PremiumSkeleton>
  );
}

function SkeletonLine() {
  return <PremiumSkeleton className="h-4 w-full bg-muted/40 rounded-lg" />;
}

function SkeletonCircle() {
  return <PremiumSkeleton className="h-12 w-12 rounded-full bg-muted/40" />;
}

function SkeletonVideo() {
  return (
    <PremiumSkeleton className="p-4 space-y-3">
      <div className="h-44 rounded-xl bg-muted/40" />
      <div className="space-y-2">
        <div className="h-4 w-2/3 rounded-lg bg-muted/40" />
        <div className="h-3 w-1/3 rounded-lg bg-muted/40" />
      </div>
    </PremiumSkeleton>
  );
}

const skeletonMap: Record<SkeletonType, () => JSX.Element> = {
  card: SkeletonCard,
  line: SkeletonLine,
  circle: SkeletonCircle,
  video: SkeletonVideo,
};

export function LoadingSkeleton({ type = 'card', count = 1 }: LoadingSkeletonProps) {
  const SkeletonComponent = skeletonMap[type];

  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </>
  );
}

// Named exports for specific skeleton types
export function CourseCardSkeleton() {
  return (
    <PremiumSkeleton className="p-0">
      <div className="h-40 bg-muted/40" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 rounded-lg bg-muted/40" />
        <div className="h-3 w-full rounded-lg bg-muted/40" />
        <div className="h-3 w-2/3 rounded-lg bg-muted/40" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 w-16 rounded-full bg-muted/40" />
          <div className="h-4 w-12 rounded-lg bg-muted/40" />
        </div>
      </div>
    </PremiumSkeleton>
  );
}

export function VideoCardSkeleton() {
  return (
    <PremiumSkeleton className="p-0">
      <div className="relative h-44 bg-muted/40">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-muted/60" />
        </div>
      </div>
      <div className="p-4 space-y-2">
        <div className="h-4 w-2/3 rounded-lg bg-muted/40" />
        <div className="h-3 w-1/2 rounded-lg bg-muted/40" />
        <div className="flex items-center gap-2 pt-1">
          <div className="h-3 w-16 rounded-lg bg-muted/40" />
          <div className="h-3 w-12 rounded-lg bg-muted/40" />
        </div>
      </div>
    </PremiumSkeleton>
  );
}
