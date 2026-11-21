'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function FlyTransitionListener() {
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('[data-fly]') as HTMLElement | null;
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      // Respect reduced motion
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return; // default link handling
      }

      // Only fly for actual route changes to destinations
      if (href.startsWith('/d/')) {
        const img = target.querySelector('img');
        const customFlyImg = target.dataset.flyimg;
        const src = customFlyImg || (img ? img.currentSrc || img.src : null);

        if (!src) return;

        // Prevent stacking animations
        if (document.querySelector('.dl-fly-active')) return;

        e.preventDefault();
        const rect = (img || target).getBoundingClientRect();

        const flyEl = document.createElement('div');
        flyEl.className = 'dl-fly-active';
        flyEl.style.position = 'fixed';
        flyEl.style.zIndex = '9999';
        flyEl.style.overflow = 'hidden';
        flyEl.style.pointerEvents = 'none';
        flyEl.style.borderRadius = '24px';
        flyEl.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        flyEl.style.left = `${rect.left}px`;
        flyEl.style.top = `${rect.top}px`;
        flyEl.style.width = `${rect.width}px`;
        flyEl.style.height = `${rect.height}px`;

        const flyImg = document.createElement('img');
        flyImg.src = src;
        flyImg.style.width = '100%';
        flyImg.style.height = '100%';
        flyImg.style.objectFit = 'cover';
        flyImg.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';

        flyEl.appendChild(flyImg);
        document.body.appendChild(flyEl);

        // Trigger expand to full viewport
        requestAnimationFrame(() => {
          flyEl.style.left = '0px';
          flyEl.style.top = '0px';
          flyEl.style.width = '100vw';
          flyEl.style.height = '100vh';
          flyEl.style.borderRadius = '0px';
          flyImg.style.transform = 'scale(1.04)';
        });

        setTimeout(() => {
          router.push(href);
          setTimeout(() => {
            flyEl.style.transition = 'opacity 0.4s ease';
            flyEl.style.opacity = '0';
            setTimeout(() => {
              flyEl.remove();
            }, 420);
          }, 150);
        }, 450);
      }
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [router]);

  return null;
}
