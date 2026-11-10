'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  BeachPointSummary,
  CreateBeachPointRequest,
  UpdateBeachPointRequest,
} from '@coastline/api-contracts';
import { AlertTriangle, Save } from 'lucide-react';
import { AdminNotice, DetailList } from '@/components/admin/feedback';
import {
  detailMessages,
  errorMessage,
  minorToTaka,
  slotStartsFrom,
  takaToMinor,
} from '@/components/admin/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { ApiError, clientApi } from '@/lib/api';
import { formatDateTime, hourLabel } from '@/lib/format';

const OPEN_HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const CLOSE_HOURS = Array.from({ length: 24 }, (_, index) => index + 1);
const MAX_PRICE_TAKA = 100_000;
const MAX_SORT_ORDER = 1000;

interface Draft {
  code: string;
  name: string;
  description: string;
  latitude: string;
  longitude: string;
  openHour: string;
  closeHour: string;
  priceTaka: string;
  sortOrder: string;
  isActive: boolean;
}

type FieldErrors = Partial<Record<keyof Draft, string>>;

function draftFrom(point?: BeachPointSummary): Draft {
  if (!point) {
    return {
      code: '',
      name: '',
      description: '',
      latitude: '',
      longitude: '',
      openHour: '7',
      closeHour: '19',
      priceTaka: '',
      sortOrder: '0',
      isActive: true,
    };
  }

  return {
    code: point.code,
    name: point.name,
    description: point.description ?? '',
    latitude: String(point.latitude),
    longitude: String(point.longitude),
    openHour: String(point.openHour),
    closeHour: String(point.closeHour),
    priceTaka: String(minorToTaka(point.defaultHourlyPriceMinor)),
    sortOrder: String(point.sortOrder),
    isActive: point.isActive,
  };
}

function isWholeNumber(value: string): boolean {
  return /^-?\d+$/.test(value.trim());
}

function validate(draft: Draft, isEdit: boolean): FieldErrors {
  const errors: FieldErrors = {};

  if (!isEdit && !/^[A-Z]{2,4}$/.test(draft.code.trim())) {
    errors.code = 'Code must be 2–4 uppercase letters (A–Z).';
  }
  if (draft.name.trim().length < 2 || draft.name.trim().length > 80) {
    errors.name = 'Name must be between 2 and 80 characters.';
  }
  if (draft.description.trim().length > 400) {
    errors.description = 'Description must be 400 characters or fewer.';
  }

  const latitude = Number(draft.latitude);
  if (draft.latitude.trim() === '' || !Number.isFinite(latitude)) {
    errors.latitude = 'Enter a latitude between -90 and 90.';
  } else if (latitude < -90 || latitude > 90) {
    errors.latitude = 'Latitude must be between -90 and 90.';
  }

  const longitude = Number(draft.longitude);
  if (draft.longitude.trim() === '' || !Number.isFinite(longitude)) {
    errors.longitude = 'Enter a longitude between -180 and 180.';
  } else if (longitude < -180 || longitude > 180) {
    errors.longitude = 'Longitude must be between -180 and 180.';
  }

  const openHour = Number(draft.openHour);
  const closeHour = Number(draft.closeHour);
  if (openHour >= closeHour) {
    errors.closeHour = 'Closing hour must be later than the opening hour.';
  }

  const price = Number(draft.priceTaka);
  if (
    draft.priceTaka.trim() === '' ||
    !isWholeNumber(draft.priceTaka) ||
    !Number.isFinite(price) ||
    price < 0 ||
    price > MAX_PRICE_TAKA
  ) {
    errors.priceTaka = `Enter whole taka between 0 and ${MAX_PRICE_TAKA.toLocaleString('en-US')}.`;
  }

  const sortOrder = Number(draft.sortOrder);
  if (
    draft.sortOrder.trim() === '' ||
    !isWholeNumber(draft.sortOrder) ||
    !Number.isFinite(sortOrder) ||
    sortOrder < 0 ||
    sortOrder > MAX_SORT_ORDER
  ) {
    errors.sortOrder = `Sort order must be a whole number between 0 and ${MAX_SORT_ORDER}.`;
  }

  return errors;
}

export function BeachPointForm({
  point,
  onSaved,
  onCancel,
}: {
  point?: BeachPointSummary;
  onSaved: (point: BeachPointSummary) => void;
  onCancel?: () => void;
}) {
  const isEdit = Boolean(point);
  const router = useRouter();
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(() => draftFrom(point));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);
  const [conflict, setConflict] = useState<{ bedCodes: string[]; slotStarts: string[] } | null>(
    null,
  );
  const [pending, setPending] = useState(false);

  const update = <Key extends keyof Draft>(key: Key, value: Draft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setApiError(null);
    setConflict(null);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError(null);
    setDetails([]);
    setConflict(null);

    const checked = validate(draft, isEdit);
    if (Object.keys(checked).length > 0) {
      setErrors(checked);
      return;
    }

    const latitude = Number(draft.latitude);
    const longitude = Number(draft.longitude);
    const openHour = Number(draft.openHour);
    const closeHour = Number(draft.closeHour);
    const priceMinor = takaToMinor(Number(draft.priceTaka));
    const sortOrder = Number(draft.sortOrder);
    const description = draft.description.trim() === '' ? null : draft.description.trim();

    setPending(true);
    try {
      if (point) {
        const body: UpdateBeachPointRequest = {
          name: draft.name.trim(),
          description,
          latitude,
          longitude,
          openHour,
          closeHour,
          defaultHourlyPriceMinor: priceMinor,
          sortOrder,
          isActive: draft.isActive,
        };
        const saved = await clientApi<BeachPointSummary>(`/admin/beach-points/${point.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        toast.push(`${saved.code} updated.`, 'success');
        onSaved(saved);
        router.refresh();
      } else {
        const body: CreateBeachPointRequest = {
          code: draft.code.trim(),
          name: draft.name.trim(),
          description: description ?? undefined,
          latitude,
          longitude,
          openHour,
          closeHour,
          defaultHourlyPriceMinor: priceMinor,
          sortOrder,
        };
        const saved = await clientApi<BeachPointSummary>('/admin/beach-points', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        toast.push(`${saved.code} created. Add sunbeds next.`, 'success');
        onSaved(saved);
        router.refresh();
      }
    } catch (error) {
      const message = errorMessage(error);
      setApiError(message);

      if (error instanceof ApiError) {
        setDetails(detailMessages(error.details));
        const raw = error.details as Record<string, unknown> | null;
        if (error.status === 409 && raw && typeof raw === 'object') {
          const slotStarts = slotStartsFrom(raw);
          if (slotStarts.length > 0) {
            const bedCodes = Array.isArray(raw.bedCodes)
              ? raw.bedCodes.filter((entry): entry is string => typeof entry === 'string')
              : [];
            setConflict({ bedCodes, slotStarts });
          } else if (typeof raw.code === 'string' && !point) {
            setErrors((current) => ({ ...current, code: message }));
          }
        }
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} aria-busy={pending} className="space-y-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="label">{isEdit ? 'Edit point' : 'New point'}</p>
          <h2 className="mt-1 text-[17px]">
            {isEdit ? `${point?.code} · ${point?.name}` : 'Add beach point'}
          </h2>
        </div>
        {isEdit ? (
          <Badge tone={point?.isActive ? 'success' : 'warn'}>
            {point?.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ) : null}
      </div>

      {apiError ? (
        <AdminNotice tone="danger" title="The API refused this change.">
          {apiError}
          <DetailList items={details} />
          {conflict ? (
            <div className="mt-2 rounded-lg border border-warn/35 bg-warn/5 p-2.5">
              <p className="label flex items-center gap-1.5 text-warn">
                <AlertTriangle aria-hidden className="h-3 w-3" />
                Future bookings block deactivation
              </p>
              {conflict.bedCodes.length > 0 ? (
                <p className="mt-1.5 font-mono text-[11px] text-foam">
                  Beds: {conflict.bedCodes.join(', ')}
                </p>
              ) : null}
              <ul className="mt-1.5 space-y-0.5 font-mono text-[11px] tabular-nums text-mist">
                {conflict.slotStarts.slice(0, 8).map((slot) => (
                  <li key={slot}>{formatDateTime(slot)}</li>
                ))}
              </ul>
              {conflict.slotStarts.length > 8 ? (
                <p className="mt-1 text-[11px] text-mist">
                  +{conflict.slotStarts.length - 8} more booked slots
                </p>
              ) : null}
            </div>
          ) : null}
        </AdminNotice>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        {!isEdit ? (
          <Field label="Code" htmlFor="point-code" error={errors.code} hint="2–4 A–Z, immutable.">
            <Input
              id="point-code"
              value={draft.code}
              autoComplete="off"
              maxLength={4}
              placeholder="LAB"
              className="font-mono uppercase tracking-[0.12em]"
              onChange={(event) => update('code', event.target.value.toUpperCase())}
              required
            />
          </Field>
        ) : (
          <Field label="Code" htmlFor="point-code-readonly" hint="Code and currency are immutable.">
            <Input
              id="point-code-readonly"
              value={point?.code ?? ''}
              readOnly
              className="font-mono uppercase tracking-[0.12em]"
            />
          </Field>
        )}
        <Field label="Name" htmlFor="point-name" error={errors.name}>
          <Input
            id="point-name"
            value={draft.name}
            maxLength={80}
            placeholder="Laboni Point"
            onChange={(event) => update('name', event.target.value)}
            required
          />
        </Field>
      </div>

      <Field
        label="Description"
        htmlFor="point-description"
        error={errors.description}
        hint="Optional, 400 characters. Shown to tourists on the map."
      >
        <Textarea
          id="point-description"
          value={draft.description}
          maxLength={400}
          rows={2}
          onChange={(event) => update('description', event.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Latitude" htmlFor="point-latitude" error={errors.latitude}>
          <Input
            id="point-latitude"
            type="number"
            inputMode="decimal"
            step="any"
            value={draft.latitude}
            placeholder="21.4272"
            className="font-mono tabular-nums"
            onChange={(event) => update('latitude', event.target.value)}
            required
          />
        </Field>
        <Field label="Longitude" htmlFor="point-longitude" error={errors.longitude}>
          <Input
            id="point-longitude"
            type="number"
            inputMode="decimal"
            step="any"
            value={draft.longitude}
            placeholder="92.0058"
            className="font-mono tabular-nums"
            onChange={(event) => update('longitude', event.target.value)}
            required
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Opens (Dhaka)" htmlFor="point-open" error={errors.openHour}>
          <Select
            id="point-open"
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
        <Field label="Closes (Dhaka)" htmlFor="point-close" error={errors.closeHour}>
          <Select
            id="point-close"
            value={draft.closeHour}
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

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Default hourly price (৳)"
          htmlFor="point-price"
          error={errors.priceTaka}
          hint="Whole taka; sent as minor units (×100)."
        >
          <Input
            id="point-price"
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_PRICE_TAKA}
            step={1}
            value={draft.priceTaka}
            placeholder="500"
            className="font-mono tabular-nums"
            onChange={(event) => update('priceTaka', event.target.value)}
            required
          />
        </Field>
        <Field
          label="Sort order"
          htmlFor="point-sort"
          error={errors.sortOrder}
          hint="Lower shows first."
        >
          <Input
            id="point-sort"
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_SORT_ORDER}
            step={1}
            value={draft.sortOrder}
            className="font-mono tabular-nums"
            onChange={(event) => update('sortOrder', event.target.value)}
            required
          />
        </Field>
      </div>

      {isEdit ? (
        <div className="rounded-xl border border-line bg-abyss/40 p-3">
          <Checkbox
            label="Point is active"
            checked={draft.isActive}
            onChange={(event) => update('isActive', event.target.checked)}
          />
          <p className="mt-1 text-[11px] leading-relaxed text-mist">
            Deactivating hides the point from tourists and blocks new bookings. The API refuses this
            while future bookings exist; cancel or move them first.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button type="submit" loading={pending}>
          <Save aria-hidden className="h-4 w-4" />
          {isEdit ? 'Save changes' : 'Create beach point'}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        ) : null}
        {isEdit ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-mist">
            Changes are audit-logged
          </span>
        ) : null}
      </div>
    </form>
  );
}
