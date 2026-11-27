'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';
import { Check, CircleX, Printer } from 'lucide-react';
import { ApiError, clientApi } from '@/lib/api';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Field, TextArea } from '@/components/ui/field';
import { Notice } from '@/components/ui/feedback-states';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';

/** Large QR on a white card so it scans in sun glare and in dark mode. */
export function TicketQr({ payload, code }: { payload: string; code: string }) {
  return (
    <div className="mx-auto w-full max-w-[280px] rounded-md bg-white p-4 [print-color-adjust:exact]">
      <QRCode
        value={payload}
        size={248}
        level="M"
        bgColor="#ffffff"
        fgColor="#121a1c"
        title={`Ticket ${code}`}
        className="h-auto w-full"
      />
      <p className="mt-3 text-center font-mono text-[18px] font-semibold tracking-wide text-[#121a1c]">
        {code}
      </p>
    </div>
  );
}

export function PrintButton() {
  return (
    <Button variant="secondary" onClick={() => window.print()}>
      <Printer aria-hidden className="size-5" /> Print or save
    </Button>
  );
}

/** Destructive action: a confirmation sheet that states the result. */
export function CancelBooking({
  path,
  label,
  result,
  deadline,
}: {
  path: string;
  label: string;
  result: string;
  deadline?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      await clientApi(path, {
        method: 'POST',
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      setOpen(false);
      toast.push('Booking cancelled.', 'success');
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Could not reach Coastline. Try again.',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button variant="secondary" block onClick={() => setOpen(true)} className="text-danger">
        <CircleX aria-hidden className="size-5" /> {label}
      </Button>
      {deadline ? <p className="mt-1 text-center text-caption text-muted">{deadline}</p> : null}
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={`${label}?`}
        description={result}
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="lg" onClick={() => setOpen(false)}>
              Keep booking
            </Button>
            <Button variant="danger" size="lg" loading={pending} onClick={() => void confirm()}>
              {label}
            </Button>
          </div>
        }
      >
        <Field label="Reason" htmlFor="cancel-reason" optional>
          <TextArea
            id="cancel-reason"
            rows={2}
            maxLength={300}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
        {error ? (
          <Notice tone="danger" icon={CircleX} className="mt-3">
            {error}
          </Notice>
        ) : null}
      </Sheet>
    </>
  );
}

/** Re-renders the server page on an interval while something is in progress. */
export function AutoRefresh({ everyMs = 20_000 }: { everyMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, everyMs);
    return () => window.clearInterval(timer);
  }, [router, everyMs]);
  return null;
}

export interface ProgressStep {
  label: string;
  at: string | null;
  state: 'done' | 'current' | 'pending' | 'cancelled';
}

export function ProgressSteps({ steps }: { steps: ProgressStep[] }) {
  return (
    <ol className="space-y-0">
      {steps.map((step, index) => (
        <li key={step.label} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                'grid size-7 flex-none place-items-center rounded-full border-2',
                step.state === 'done' && 'border-success bg-success text-surface',
                step.state === 'current' && 'border-primary bg-primary-soft text-primary',
                step.state === 'pending' && 'border-line bg-surface text-muted',
                step.state === 'cancelled' && 'border-danger bg-danger text-surface',
              )}
            >
              {step.state === 'done' ? (
                <Check aria-hidden className="size-4" />
              ) : step.state === 'cancelled' ? (
                <CircleX aria-hidden className="size-4" />
              ) : null}
            </span>
            {index < steps.length - 1 ? (
              <span aria-hidden className="w-0.5 flex-1 bg-line" />
            ) : null}
          </div>
          <div className="pb-5">
            <p className={cn('text-label', step.state === 'pending' && 'text-muted')}>
              {step.label}
              <span className="sr-only">
                {step.state === 'done'
                  ? ' (done)'
                  : step.state === 'current'
                    ? ' (now)'
                    : step.state === 'cancelled'
                      ? ' (cancelled)'
                      : ' (next)'}
              </span>
            </p>
            {step.at ? <p className="text-body-sm text-muted">{step.at}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
