'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DINING_ADMIN_LIMITS,
  type DiningAdminVenueDto,
  type UpdateDiningVenueRequest,
} from '@coastline/api-contracts';
import { Save } from 'lucide-react';
import { AdminNotice, DetailList } from '@/components/admin/feedback';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { useToast } from '@/components/ui/toast';
import { clientApi } from '@/lib/api';
import {
  diningErrorDetails,
  diningErrorMessage,
  diningFieldErrors,
  minorToTakaInput,
  parseTaka,
} from '@/lib/dining/admin';
import { hourLabel } from '@/lib/format';

const OPEN_HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const CLOSE_HOURS = Array.from({ length: 24 }, (_, index) => index + 1);

interface Draft {
  description: string;
  openHour: string;
  closeHour: string;
  reservationsEnabled: boolean;
  deliveryEnabled: boolean;
  depositTaka: string;
  isActive: boolean;
}

type FieldErrors = Partial<Record<keyof Draft, string>>;

function draftFrom(venue: DiningAdminVenueDto): Draft {
  return {
    description: venue.description ?? '',
    openHour: String(venue.openHour),
    closeHour: String(venue.closeHour),
    reservationsEnabled: venue.reservationsEnabled,
    deliveryEnabled: venue.deliveryEnabled,
    depositTaka: minorToTakaInput(venue.reservationDepositMinor),
    isActive: venue.isActive,
  };
}

function validate(draft: Draft): FieldErrors {
  const errors: FieldErrors = {};
  if (Number(draft.closeHour) <= Number(draft.openHour)) {
    errors.closeHour = 'Closing hour must be later than the opening hour.';
  }
  const deposit = parseTaka(draft.depositTaka);
  if (deposit === null || deposit > DINING_ADMIN_LIMITS.maxDepositMinor) {
    errors.depositTaka = `Enter taka from 0 to ${(DINING_ADMIN_LIMITS.maxDepositMinor / 100).toLocaleString('en-US')}.`;
  }
  if (draft.description.trim().length > DINING_ADMIN_LIMITS.descriptionMaxLength) {
    errors.description = `Keep the description to ${DINING_ADMIN_LIMITS.descriptionMaxLength} characters.`;
  }
  return errors;
}

/** Maps API field names to draft keys for inline 422 messages. */
const API_FIELDS: Record<string, keyof Draft> = {
  description: 'description',
  openHour: 'openHour',
  closeHour: 'closeHour',
  reservationDepositMinor: 'depositTaka',
};

export function DiningVenueForm({ venue }: { venue: DiningAdminVenueDto }) {
  const router = useRouter();
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(() => draftFrom(venue));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  const update = <Key extends keyof Draft>(key: Key, value: Draft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setApiError(null);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError(null);
    setDetails([]);
    const checked = validate(draft);
    if (Object.keys(checked).length > 0) {
      setErrors(checked);
      return;
    }

    const description = draft.description.trim();
    const body: UpdateDiningVenueRequest = {
      description: description === '' ? null : description,
      openHour: Number(draft.openHour),
      closeHour: Number(draft.closeHour),
      reservationsEnabled: draft.reservationsEnabled,
      deliveryEnabled: draft.deliveryEnabled,
      reservationDepositMinor: parseTaka(draft.depositTaka) ?? 0,
      isActive: draft.isActive,
    };

    setPending(true);
    try {
      const saved = await clientApi<DiningAdminVenueDto>(
        `/admin/dining/venues/${encodeURIComponent(venue.code)}`,
        { method: 'PATCH', body: JSON.stringify(body) },
      );
      setDraft(draftFrom(saved));
      toast.push(`${saved.code} settings saved.`, 'success');
      router.refresh();
    } catch (error) {
      setApiError(diningErrorMessage(error));
      setDetails(diningErrorDetails(error));
      const fieldErrors: FieldErrors = {};
      for (const [field, message] of Object.entries(diningFieldErrors(error))) {
        const key = API_FIELDS[field];
        if (key) fieldErrors[key] = message;
      }
      setErrors(fieldErrors);
    } finally {
      setPending(false);
    }
  };

  return (
    <Panel className="h-fit p-4">
      <form onSubmit={submit} aria-busy={pending} className="space-y-3.5" noValidate>
        <PanelHeader eyebrow="Settings" title="Venue settings" />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Opens (Dhaka)" htmlFor="venue-open" error={errors.openHour}>
            <Select
              id="venue-open"
              value={draft.openHour}
              onChange={(event) => update('openHour', event.target.value)}
            >
              {OPEN_HOURS.map((hour) => (
                <option key={hour} value={hour}>
                  {hourLabel(hour)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Closes (Dhaka)" htmlFor="venue-close" error={errors.closeHour}>
            <Select
              id="venue-close"
              value={draft.closeHour}
              aria-invalid={errors.closeHour ? true : undefined}
              onChange={(event) => update('closeHour', event.target.value)}
            >
              {CLOSE_HOURS.map((hour) => (
                <option key={hour} value={hour}>
                  {hourLabel(hour)}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label="Reservation deposit (৳, simulated)"
          htmlFor="venue-deposit"
          error={errors.depositTaka}
          hint="0 means no deposit. Taken as a mock payment; existing reservations keep their deposit."
        >
          <Input
            id="venue-deposit"
            inputMode="decimal"
            value={draft.depositTaka}
            aria-invalid={errors.depositTaka ? true : undefined}
            onChange={(event) => update('depositTaka', event.target.value)}
          />
        </Field>

        <Field
          label="Description"
          htmlFor="venue-description"
          error={errors.description}
          hint={`${draft.description.trim().length}/${DINING_ADMIN_LIMITS.descriptionMaxLength} characters`}
        >
          <Textarea
            id="venue-description"
            value={draft.description}
            maxLength={DINING_ADMIN_LIMITS.descriptionMaxLength + 50}
            aria-invalid={errors.description ? true : undefined}
            onChange={(event) => update('description', event.target.value)}
          />
        </Field>

        <fieldset className="space-y-0.5 rounded-xl border border-line p-3">
          <legend className="label px-1">Services</legend>
          <Checkbox
            label="Accept table reservations"
            checked={draft.reservationsEnabled}
            onChange={(event) => update('reservationsEnabled', event.target.checked)}
          />
          <Checkbox
            label="Deliver to sunbeds"
            checked={draft.deliveryEnabled}
            onChange={(event) => update('deliveryEnabled', event.target.checked)}
          />
          <Checkbox
            label="Active (visible to tourists)"
            checked={draft.isActive}
            onChange={(event) => update('isActive', event.target.checked)}
          />
        </fieldset>

        {apiError ? (
          <AdminNotice tone="danger" title="Not saved.">
            {apiError}
            <DetailList items={details} />
          </AdminNotice>
        ) : null}

        <Button type="submit" loading={pending} className="w-full">
          <Save aria-hidden className="h-4 w-4" />
          Save settings
        </Button>
      </form>
    </Panel>
  );
}
