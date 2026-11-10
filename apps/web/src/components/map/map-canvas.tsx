'use client';

import dynamic from 'next/dynamic';

/** MapLibre touches `window`, so the map is client-only. */
const CoastMap = dynamic(() => import('./coast-map'), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center bg-deep">
      <div className="flex flex-col items-center gap-3">
        <span
          aria-hidden
          className="h-7 w-7 animate-spin rounded-full border-2 border-sea border-t-transparent"
        />
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-mist">
          Loading satellite view
        </p>
      </div>
    </div>
  ),
});

export default CoastMap;
