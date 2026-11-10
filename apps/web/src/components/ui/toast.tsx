'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'success' | 'info' | 'danger';
interface Toast {
  id: number;
  message: string;
  tone: Tone;
}

interface ToastApi {
  push: (message: string, tone?: Tone) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return value;
}

const TONES: Record<Tone, string> = {
  success: 'border-success/40 bg-[#0c2a22] text-foam',
  info: 'border-sea/40 bg-[#08262b] text-foam',
  danger: 'border-danger/45 bg-[#2a1210] text-foam',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const push = useCallback((message: string, tone: Tone = 'info') => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[200] flex flex-col items-center gap-2 px-4 sm:bottom-6"
        aria-live="polite"
        role="status"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'animate-sheet-up pointer-events-auto max-w-sm rounded-xl border px-4 py-2.5 text-[13px] shadow-2xl backdrop-blur',
              TONES[toast.tone],
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
