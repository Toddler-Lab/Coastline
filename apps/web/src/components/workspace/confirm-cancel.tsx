'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, TextArea } from '@/components/ui/field';
import { Sheet } from '@/components/ui/sheet';

/** Staff cancellation: a sheet that states the result and takes a reason. */
export function ConfirmCancel({
  label,
  title,
  result,
  disabled,
  onConfirm,
}: {
  label: string;
  title: string;
  result: string;
  disabled?: boolean;
  onConfirm: (reason: string | undefined) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [pending, setPending] = useState(false);
  return (
    <>
      <Button
        variant="secondary"
        className="text-danger"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        description={result}
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="lg" onClick={() => setOpen(false)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              size="lg"
              loading={pending}
              onClick={async () => {
                setPending(true);
                await onConfirm(reason.trim() || undefined);
                setPending(false);
                setOpen(false);
                setReason('');
              }}
            >
              {label}
            </Button>
          </div>
        }
      >
        <Field
          label="Reason"
          htmlFor="staff-cancel-reason"
          optional
          hint="The guest sees this in Trips."
        >
          <TextArea
            id="staff-cancel-reason"
            rows={2}
            maxLength={300}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
      </Sheet>
    </>
  );
}
