'use client';

import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from './button';

/**
 * Bottom sheet on compact screens, centred dialog (max 560) on expanded ones.
 * Built on the native modal <dialog>: it traps focus, closes on Escape and
 * returns focus to the opener, and renders in the top layer.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  footer,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleClose = () => onCloseRef.current();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={cn('sheet', className)}
      onClick={(event) => {
        // A click on the backdrop lands on the dialog element itself.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {open ? (
        <div className="flex max-h-[calc(100dvh-48px)] flex-col">
          <div aria-hidden className="mx-auto mt-2 h-1 w-10 rounded-full bg-line lg:hidden" />
          <header className="flex items-start gap-3 px-5 pb-2 pt-3 lg:pt-5">
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-title">
                {title}
              </h2>
              {description ? (
                <p id={descriptionId} className="mt-1 text-body-sm text-muted">
                  {description}
                </p>
              ) : null}
            </div>
            <IconButton label="Close" onClick={onClose} className="-mr-2 -mt-1">
              <X aria-hidden className="size-6" />
            </IconButton>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
          {footer ? (
            <footer className="border-t border-line px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-4">
              {footer}
            </footer>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}
