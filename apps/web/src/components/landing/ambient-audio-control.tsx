'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

/**
 * Accessible ambient audio toggle. Starts muted/off per browser autoplay and
 * WCAG 1.4.2 rules; plays on user click and pauses automatically in Lite mode.
 */
export function AmbientAudioControl({
  lang = 'en',
  liteMode = false,
  src = '/media/audio/ambient_bd.mp3',
}: {
  lang?: 'en' | 'bn';
  liteMode?: boolean;
  src?: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (liteMode && !audio.paused) {
      audio.pause();
      setPlaying(false);
    }
  }, [liteMode]);

  if (liteMode) return null;

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.volume = 0.3;
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    }
  };

  return (
    <>
      <audio ref={audioRef} loop preload="none" src={src} />
      <button
        type="button"
        className="dl-hero-pause"
        aria-pressed={playing}
        aria-label={playing ? 'Mute ambient background music' : 'Play ambient background music'}
        onClick={toggle}
      >
        {playing ? (
          <Volume2 aria-hidden className="size-4 text-sun" />
        ) : (
          <VolumeX aria-hidden className="size-4 text-white/80" />
        )}
        <span>
          {playing
            ? lang === 'bn'
              ? 'মিউজিক চালু'
              : 'Sound On'
            : lang === 'bn'
              ? 'মিউজিক'
              : 'Sound'}
        </span>
      </button>
    </>
  );
}
