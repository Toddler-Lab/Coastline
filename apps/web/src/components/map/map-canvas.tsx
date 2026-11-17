'use client';

import dynamic from 'next/dynamic';

/** MapLibre touches `window`, so the map is client-only. */
const CoastMap = dynamic(() => import('./coast-map'), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center bg-surface-alt">
      <div className="flex flex-col items-center gap-3">
        <span
          aria-hidden
          className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent"
        />
        <p className="text-body-sm text-muted">Loading satellite view</p>
      </div>
    </div>
  ),
});

export default CoastMap;
