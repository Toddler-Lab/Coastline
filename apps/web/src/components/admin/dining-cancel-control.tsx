'use client';

import { useId, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';

const REASON_MAX = 250;

/**
 * Two-step cancel: reveal an optional reason, then confirm. Keeps destructive
 * actions off a single click on the busy desk screens.
 */
export function DiningCancelControl({
  label,
  confirmLabel,
  pending,
  disabled,
  onConfirm,
}: {
  label: string;
  confirmLabel: string;
  pending: boolean;
  disabled?: boolean;
  onConfirm: (reason: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const id = useId();

  if (!open) {
    return (
      <Button
        variant="danger"
        size="sm"
        disabled={disabled || pending}
        onClick={() => setOpen(true)}
      >
        <X aria-hidden className="h-3.5 w-3.5" />
        {label}
      </Button>
    );
  }

  return (
    <div className="flex w-full flex-wrap items-end gap-2 rounded-xl border border-danger/30 bg-danger/5 p-2">
      <div className="min-w-[12rem] flex-1 space-y-1">
        <label htmlFor={`${id}-reason`} className="label block text-foam/80">
          Reason (optional)
        </label>
        <Input
          id={`${id}-reason`}
          value={reason}
          maxLength={REASON_MAX}
          className="h-9"
          onChange={(event) => setReason(event.target.value)}
        />
      </div>
      <Button
        variant="danger"
        size="sm"
        loading={pending}
        onClick={() => onConfirm(reason.trim() === '' ? undefined : reason.trim())}
      >
        {confirmLabel}
      </Button>
      <Button variant="ghost" size="sm" disabled={pending} onClick={() => setOpen(false)}>
        Keep
      </Button>
    </div>
  );
}
