'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  BeachPointDetail,
  CreateSunbedsRequest,
  SunbedAvailability,
  SunbedStatus,
  UpdateSunbedRequest,
} from '@coastline/api-contracts';
import { AlertTriangle, BedDouble, Pencil, Plus, Save, X } from 'lucide-react';
import { AdminNotice, DetailList } from '@/components/admin/feedback';
import {
  bedStatusLabel,
  bedStatusTone,
  detailMessages,
  errorMessage,
  minorToTaka,
  slotRangeLabels,
  slotStartsFrom,
  takaToMinor,
} from '@/components/admin/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { useToast } from '@/components/ui/toast';
import { ApiError, clientApi } from '@/lib/api';
import { formatDateTime, formatMoney } from '@/lib/format';

const MAX_PRICE_TAKA = 100_000;
const MAX_BEDS_PER_BATCH = 50;
const STATUSES: SunbedStatus[] = ['AVAILABLE', 'OUT_OF_SERVICE', 'RETIRED'];

function priceError(value: string): string | undefined {
  const price = Number(value);
  if (value.trim() === '' || !/^\d+$/.test(value.trim()) || !Number.isFinite(price)) {
    return 'Enter whole taka (0 or more).';
  }
  if (price < 0 || price > MAX_PRICE_TAKA) {
    return `Price must be between 0 and ${MAX_PRICE_TAKA.toLocaleString('en-US')} taka.`;
  }
  return undefined;
}

function AddSunbedsForm({
  pointId,
  pointCode,
  defaultPriceMinor,
}: {
  pointId: string;
  pointCode: string;
  defaultPriceMinor: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [count, setCount] = useState('1');
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{ count?: string; price?: string; note?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);
  const [createdCodes, setCreatedCodes] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError(null);
    setDetails([]);

    const nextErrors: typeof errors = {};
    const parsedCount = Number(count);
    if (
      !/^\d+$/.test(count.trim()) ||
      !Number.isInteger(parsedCount) ||
      parsedCount < 1 ||
      parsedCount > MAX_BEDS_PER_BATCH
    ) {
      nextErrors.count = `Enter a whole number from 1 to ${MAX_BEDS_PER_BATCH}.`;
    }
    if (price.trim() !== '') {
      const priceIssue = priceError(price);
      if (priceIssue) nextErrors.price = priceIssue;
    }
    if (note.trim().length > 400) {
      nextErrors.note = 'Note must be 400 characters or fewer.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const body: CreateSunbedsRequest = {
      count: parsedCount,
      ...(price.trim() !== '' ? { hourlyPriceMinor: takaToMinor(Number(price)) } : {}),
      ...(note.trim() !== '' ? { note: note.trim() } : {}),
    };

    setPending(true);
    try {
      const sunbeds = await clientApi<Array<{ id: string; code: string }>>(
        `/admin/beach-points/${pointId}/sunbeds`,
        { method: 'POST', body: JSON.stringify(body) },
      );
      setCreatedCodes(sunbeds.map((sunbed) => sunbed.code));
      setCount('1');
      setPrice('');
      setNote('');
      setErrors({});
      toast.push(`${sunbeds.length} sunbed${sunbeds.length === 1 ? '' : 's'} added.`, 'success');
      router.refresh();
    } catch (error) {
      setApiError(errorMessage(error));
      if (error instanceof ApiError) {
        setDetails(detailMessages(error.details));
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} aria-busy={pending} className="border-b border-line bg-abyss/35 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="label">New beds</p>
          <h3 className="mt-1 text-[15px]">Add sunbeds to {pointCode}</h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-mist">
          Codes are never reused
        </span>
      </div>

      {apiError ? (
        <AdminNotice tone="danger" title="Could not add sunbeds." className="mt-3">
          {apiError}
          <DetailList items={details} />
        </AdminNotice>
      ) : null}

      {createdCodes.length > 0 ? (
        <AdminNotice
          tone="success"
          title={`Added ${createdCodes.length} bed${createdCodes.length === 1 ? '' : 's'}.`}
          className="mt-3"
        >
          <span className="font-mono text-[11px] text-foam">{createdCodes.join(', ')}</span>
          <span className="mt-1 block text-[11px] text-mist">
            New beds start as available at the point&rsquo;s hourly price unless overridden.
          </span>
        </AdminNotice>
      ) : null}

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Field label="Count" htmlFor="sunbed-count" error={errors.count} hint="1–50 per batch.">
          <Input
            id="sunbed-count"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_BEDS_PER_BATCH}
            step={1}
            value={count}
            className="font-mono tabular-nums"
            onChange={(event) => {
              setCount(event.target.value);
              setErrors((current) => ({ ...current, count: undefined }));
            }}
            required
          />
        </Field>
        <Field
          label="Hourly price (৳)"
          htmlFor="sunbed-price"
          error={errors.price}
          hint={`Optional. Defaults to ${formatMoney(defaultPriceMinor)}/hr.`}
        >
          <Input
            id="sunbed-price"
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_PRICE_TAKA}
            step={1}
            value={price}
            placeholder={String(minorToTaka(defaultPriceMinor))}
            className="font-mono tabular-nums"
            onChange={(event) => {
              setPrice(event.target.value);
              setErrors((current) => ({ ...current, price: undefined }));
            }}
          />
        </Field>
        <Field label="Note" htmlFor="sunbed-note" error={errors.note} hint="Optional, write-only.">
          <Input
            id="sunbed-note"
            value={note}
            maxLength={400}
            placeholder="e.g. front row"
            onChange={(event) => {
              setNote(event.target.value);
              setErrors((current) => ({ ...current, note: undefined }));
            }}
          />
        </Field>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="submit" loading={pending}>
          <Plus aria-hidden className="h-4 w-4" />
          Add sunbeds
        </Button>
        <p className="text-[11px] text-mist">
          Sequence numbers continue from the highest existing bed, including retired ones.
        </p>
      </div>
    </form>
  );
}

function SunbedEditor({ bed, onClose }: { bed: SunbedAvailability; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [price, setPrice] = useState(String(minorToTaka(bed.hourlyPriceMinor)));
  const [status, setStatus] = useState<SunbedStatus>(bed.status);
  const [note, setNote] = useState('');
  const [noteTouched, setNoteTouched] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState<{ price?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);
  const [conflictSlots, setConflictSlots] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  const priceIssue = priceError(price);
  const priceMinor = priceIssue ? null : takaToMinor(Number(price));
  const statusChanged = status !== bed.status;
  const destructive = statusChanged && (status === 'OUT_OF_SERVICE' || status === 'RETIRED');
  const hasChanges = priceMinor !== bed.hourlyPriceMinor || statusChanged || noteTouched;
  const canSave = hasChanges && !priceIssue && !pending && (!destructive || confirmed);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError(null);
    setDetails([]);
    setConflictSlots([]);

    if (priceIssue) {
      setErrors({ price: priceIssue });
      return;
    }
    if (!canSave) return;

    const body: UpdateSunbedRequest = {
      hourlyPriceMinor: priceMinor ?? bed.hourlyPriceMinor,
      status,
      ...(noteTouched ? { note: note.trim() === '' ? null : note.trim() } : {}),
    };

    setPending(true);
    try {
      await clientApi<unknown>(`/admin/sunbeds/${bed.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      toast.push(`${bed.code} updated.`, 'success');
      onClose();
      router.refresh();
    } catch (error) {
      setApiError(errorMessage(error));
      if (error instanceof ApiError) {
        setDetails(detailMessages(error.details));
        setConflictSlots(slotStartsFrom(error.details));
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} aria-busy={pending} className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="label">Edit bed</p>
          <h2 className="mt-1 flex items-center gap-2 text-[17px]">
            <span className="font-mono text-[15px] tracking-[0.06em] text-sea">{bed.code}</span>
            <Badge tone={bedStatusTone(bed.status)}>{bedStatusLabel(bed.status)}</Badge>
          </h2>
        </div>
        <Button variant="ghost" size="sm" className="min-h-11" onClick={onClose} disabled={pending}>
          <X aria-hidden className="h-3.5 w-3.5" />
          Close
        </Button>
      </div>

      {apiError ? (
        <AdminNotice tone="danger" title="The API refused this change.">
          {apiError}
          <DetailList items={details} />
          {conflictSlots.length > 0 ? (
            <div className="mt-2 rounded-lg border border-warn/35 bg-warn/5 p-2.5">
              <p className="label flex items-center gap-1.5 text-warn">
                <AlertTriangle aria-hidden className="h-3 w-3" />
                Future bookings hold this bed
              </p>
              <ul className="mt-1.5 space-y-0.5 font-mono text-[11px] tabular-nums text-mist">
                {conflictSlots.slice(0, 10).map((slot) => (
                  <li key={slot}>{formatDateTime(slot)}</li>
                ))}
              </ul>
              {conflictSlots.length > 10 ? (
                <p className="mt-1 text-[11px] text-mist">
                  +{conflictSlots.length - 10} more booked slots. Cancel or move those bookings
                  first.
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-mist">
                  Cancel or move those bookings first, then change the status.
                </p>
              )}
            </div>
          ) : null}
        </AdminNotice>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Hourly price (৳)" htmlFor="bed-price" error={errors.price}>
          <Input
            id="bed-price"
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_PRICE_TAKA}
            step={1}
            value={price}
            className="font-mono tabular-nums"
            onChange={(event) => {
              setPrice(event.target.value);
              setErrors({});
            }}
            required
          />
        </Field>
        <Field
          label="Status"
          htmlFor="bed-status"
          hint={
            bed.status === 'RETIRED'
              ? 'Retired is final; only price and note can change.'
              : 'Out of service and retired are refused while future bookings exist.'
          }
        >
          <Select
            id="bed-status"
            value={status}
            disabled={bed.status === 'RETIRED'}
            onChange={(event) => {
              setStatus(event.target.value as SunbedStatus);
              setConfirmed(false);
            }}
          >
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {bedStatusLabel(value)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="Internal note"
        htmlFor="bed-note"
        hint="Write-only: existing notes are not returned by the availability API. Leave untouched to keep it."
      >
        <Textarea
          id="bed-note"
          value={note}
          maxLength={400}
          rows={2}
          placeholder="Add or replace a note"
          onChange={(event) => {
            setNote(event.target.value);
            setNoteTouched(true);
          }}
        />
      </Field>

      {destructive ? (
        <div className="rounded-xl border border-warn/35 bg-warn/5 p-3">
          <p className="flex items-start gap-2 text-[12px] leading-relaxed text-foam">
            <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 flex-none text-warn" />
            <span>
              {status === 'RETIRED'
                ? `Retiring ${bed.code} is permanent. It cannot be returned to service or reused.`
                : `Taking ${bed.code} out of service stops new bookings. It can be returned to service later.`}
            </span>
          </p>
          <Checkbox
            className="mt-2"
            label={
              status === 'RETIRED'
                ? `I understand retiring ${bed.code} is final`
                : `I confirm ${bed.code} should leave service`
            }
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" loading={pending} disabled={!canSave}>
          <Save aria-hidden className="h-4 w-4" />
          Save bed
        </Button>
        <Button variant="ghost" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        {!hasChanges ? (
          <span className="text-[11px] text-mist">Change a price, status or note to save.</span>
        ) : null}
      </div>
    </form>
  );
}

export function SunbedsManager({ point }: { point: BeachPointDetail }) {
  const [addOpen, setAddOpen] = useState(point.sunbeds.length === 0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingBed = editingId
    ? (point.sunbeds.find((sunbed) => sunbed.id === editingId) ?? null)
    : null;

  return (
    <div className="space-y-4">
      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-line p-4">
          <PanelHeader
            eyebrow="Inventory"
            title={`Sunbeds · ${point.code}`}
            right={
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-mist">
                {point.sunbeds.length} beds · {point.referenceSlotLabel} ref.
              </span>
            }
          />
          <Button
            variant={addOpen ? 'ghost' : 'secondary'}
            aria-expanded={addOpen}
            onClick={() => setAddOpen((open) => !open)}
          >
            {addOpen ? (
              <>
                <X aria-hidden className="h-4 w-4" />
                Hide add form
              </>
            ) : (
              <>
                <Plus aria-hidden className="h-4 w-4" />
                Add sunbeds
              </>
            )}
          </Button>
        </div>

        {addOpen ? (
          <AddSunbedsForm
            pointId={point.id}
            pointCode={point.code}
            defaultPriceMinor={point.defaultHourlyPriceMinor}
          />
        ) : null}

        {point.sunbeds.length === 0 ? (
          <div className="p-6 text-center">
            <BedDouble aria-hidden className="mx-auto h-6 w-6 text-mist" />
            <p className="mt-2 font-display text-[15px] text-foam">No sunbeds yet</p>
            <p className="mt-1 text-[12.5px] text-mist">
              Add a batch above. Codes continue from the point code and are never reused.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-line text-mist">
                  <th
                    scope="col"
                    className="px-4 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em]"
                  >
                    Bed
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em]"
                  >
                    Seq
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em]"
                  >
                    Price
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em]"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em]"
                  >
                    Note
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em]"
                  >
                    Booked today
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-2.5 text-right font-mono text-[9.5px] uppercase tracking-[0.14em]"
                  >
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {point.sunbeds.map((bed) => {
                  const ranges = slotRangeLabels(bed.bookedSlots);
                  const selected = editingId === bed.id;
                  return (
                    <tr
                      key={bed.id}
                      className={
                        selected
                          ? 'border-b border-line/70 bg-sea/5 last:border-0'
                          : 'border-b border-line/70 last:border-0 hover:bg-raised/30'
                      }
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11.5px] tracking-[0.04em] text-foam">
                          {bed.code}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-mono text-[11px] tabular-nums text-mist">
                        {String(bed.seq).padStart(3, '0')}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono tabular-nums text-foam">
                        {formatMoney(bed.hourlyPriceMinor)}
                        <span className="ml-1 text-[10px] text-mist">/hr</span>
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={bedStatusTone(bed.status)}>{bedStatusLabel(bed.status)}</Badge>
                      </td>
                      <td
                        className="px-3 py-3 font-mono text-[11px] text-mist"
                        title="Bed notes are not returned by the availability API."
                      >
                        —
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-[11px] tabular-nums text-mist">
                        {ranges.length > 0
                          ? ranges.join(' · ')
                          : bed.status === 'AVAILABLE'
                            ? 'Free today'
                            : 'Not bookable'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant={selected ? 'secondary' : 'ghost'}
                          size="sm"
                          className="min-h-11"
                          aria-label={`Edit sunbed ${bed.code}`}
                          onClick={() => setEditingId(selected ? null : bed.id)}
                        >
                          <Pencil aria-hidden className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-line px-4 py-2.5 text-[11px] leading-relaxed text-mist">
          &ldquo;Booked today&rdquo; lists this Dhaka day&rsquo;s held slots. Bed notes are
          write-only in the API, so existing notes are shown as an em dash.
        </p>
      </Panel>

      {editingBed ? (
        <Panel className="p-4">
          <SunbedEditor key={editingBed.id} bed={editingBed} onClose={() => setEditingId(null)} />
        </Panel>
      ) : null}
    </div>
  );
}
