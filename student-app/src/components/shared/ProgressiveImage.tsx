'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface ProgressiveImageProps {
  /** Image source URL */
  src?: string | null;
  /** Alt text for the image */
  alt: string;
  /** Additional CSS classes for the wrapper */
  className?: string;
  /** CSS classes for the img element itself */
  imgClassName?: string;
  /** Fallback content when src is empty/null or image fails to load */
  fallback?: React.ReactNode;
  /** Gradient class for the placeholder shimmer (e.g. 'from-sky-400 to-blue-600') */
  placeholderGradient?: string;
  /** Whether to use lazy loading (default: true) */
  lazy?: boolean;
  /** Minimum blur time in ms before showing the image (creates a smoother feel) */
  minBlurMs?: number;
}

/**
 * ProgressiveImage — Lazy + Progressive loading for all images.
 *
 * Features:
 * - **Lazy loading**: Uses IntersectionObserver to only load images when they enter the viewport.
 * - **Progressive blur-up**: Shows a shimmer placeholder while loading, then smoothly
 *   crossfades to the actual image with a CSS transition.
 * - **Error fallback**: If the image fails to load, shows the fallback content.
 * - **No-layout-shift**: The placeholder has the same dimensions as the final image.
 */
export function ProgressiveImage({
  src,
  alt,
  className = '',
  imgClassName = '',
  fallback,
  placeholderGradient = 'from-gray-400 to-gray-600',
  lazy = true,
  minBlurMs = 200,
}: ProgressiveImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(!lazy); // if not lazy, consider it in view immediately
  const containerRef = useRef<HTMLDivElement>(null);
  const loadStartRef = useRef<number>(0);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect(); // once in view, no need to observe anymore
        }
      },
      { rootMargin: '200px' } // start loading 200px before entering viewport
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [lazy]);

  const handleLoad = useCallback(() => {
    const elapsed = Date.now() - loadStartRef.current;
    const remaining = Math.max(0, minBlurMs - elapsed);
    // Ensure at least minBlurMs of shimmer time so the transition feels smooth
    setTimeout(() => setLoaded(true), remaining);
  }, [minBlurMs]);

  const handleError = useCallback(() => {
    setError(true);
  }, []);

  // No src provided — show fallback immediately
  if (!src) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className={`bg-gradient-to-br ${placeholderGradient} animate-pulse ${className}`}>
        <div className="w-full h-full bg-shimmer" />
      </div>
    );
  }

  // Image errored — show fallback
  if (error) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className={`bg-gradient-to-br ${placeholderGradient} ${className}`} />
    );
  }

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* Shimmer placeholder — always rendered, fades out when image loads */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${placeholderGradient} transition-opacity duration-500 ${
          loaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Animated shimmer effect */}
        <div className="absolute inset-0 bg-shimmer" />
      </div>

      {/* Actual image — only rendered when in viewport (lazy) */}
      {inView && (
        <img
          src={src}
          alt={alt}
          className={`transition-opacity duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          } ${imgClassName}`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
          ref={(el) => {
            // Track when the image starts loading for the minBlurMs calculation
            if (el && !loadStartRef.current) {
              loadStartRef.current = Date.now();
              // If image is already cached and complete, trigger load immediately
              if (el.complete) {
                handleLoad();
              }
            }
          }}
        />
      )}
    </div>
  );
}
