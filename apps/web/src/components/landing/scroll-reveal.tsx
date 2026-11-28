'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * Fluid GPU-composited scroll reveal for High-Res showcase sections.
 * Renders immediately without animation in Lite mode or reduced-motion.
 */
export function ScrollReveal({
  children,
  className,
  lite = false,
  delayMs = 0,
}: {
  children: React.ReactNode;
  className?: string;
  lite?: boolean;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(lite);

  useEffect(() => {
    if (lite) {
      setVisible(true);
      return;
    }
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [lite]);

  return (
    <div
      ref={ref}
      className={cn(
        !lite && 'dl-reveal',
        (!lite && visible) || lite ? 'dl-reveal-in' : '',
        className,
      )}
      style={!lite && delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
