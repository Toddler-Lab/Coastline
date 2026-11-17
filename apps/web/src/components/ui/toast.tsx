'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CircleCheck, CircleX, Info } from 'lucide-react';
import { cn } from '@/lib/cn';

type Tone = 'success' | 'info' | 'danger';

interface SnackAction {
  label: string;
  onClick: () => void;
}

interface Snack {
  id: number;
  message: string;
  tone: Tone;
  action?: SnackAction;
}

interface ToastApi {
  push: (message: string, tone?: Tone, action?: SnackAction) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider');
  return value;
}

const ICONS = { success: CircleCheck, info: Info, danger: CircleX } as const;

/** Snackbar: one line, optional action (for example Undo), above the bottom bar. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [snacks, setSnacks] = useState<Snack[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setSnacks((current) => current.filter((snack) => snack.id !== id));
  }, []);

  const push = useCallback(
    (message: string, tone: Tone = 'info', action?: SnackAction) => {
      const id = nextId.current++;
      setSnacks((current) => [...current.slice(-2), { id, message, tone, action }]);
      window.setTimeout(() => dismiss(id), action ? 6000 : 4200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--bottombar-h)+16px+env(safe-area-inset-bottom))] z-[300] flex flex-col items-center gap-2 px-4 lg:bottom-6"
      >
        {snacks.map((snack) => {
          const Icon = ICONS[snack.tone];
          return (
            <div
              key={snack.id}
              className="animate-fade-in pointer-events-auto flex min-h-12 w-full max-w-md items-center gap-3 rounded-md bg-fg px-4 py-2 text-body-sm text-bg shadow-soft"
            >
              <Icon
                aria-hidden
                className={cn('size-5 flex-none', snack.tone === 'danger' && 'text-danger')}
              />
              <span className="flex-1">{snack.message}</span>
              {snack.action ? (
                <button
                  type="button"
                  onClick={() => {
                    snack.action?.onClick();
                    dismiss(snack.id);
                  }}
                  className="-mr-2 h-10 rounded-sm px-3 text-label text-primary-soft underline-offset-2 hover:underline"
                >
                  {snack.action.label}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
