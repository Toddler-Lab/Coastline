'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import type {
  AdminMenuItemDto,
  DiningAdminVenueDto,
  UpdateDiningVenueRequest,
  UpdateMenuItemRequest,
} from '@coastline/api-contracts';
import { DINING_ADMIN_LIMITS } from '@coastline/api-contracts';
import { clientApi } from '@/lib/api';
import {
  diningErrorMessage,
  diningFieldErrors,
  minorToTakaInput,
  parseTaka,
} from '@/lib/dining/admin';
import { formatMoney, hourLabel } from '@/lib/format';
import { Button, IconButton } from '@/components/ui/button';
import { Card } from '@/components/ui/display';
import { Checkbox, Field, Input, Select, TextArea } from '@/components/ui/field';
import { Notice } from '@/components/ui/feedback-states';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';

const HOURS = Array.from({ length: 25 }, (_, hour) => hour);

export function VenueSettingsForm({ venue }: { venue: DiningAdminVenueDto }) {
  const router = useRouter();
  const toast = useToast();
  const [description, setDescription] = useState(venue.description ?? '');
  const [openHour, setOpenHour] = useState(venue.openHour);
  const [closeHour, setCloseHour] = useState(venue.closeHour);
  const [reservations, setReservations] = useState(venue.reservationsEnabled);
  const [delivery, setDelivery] = useState(venue.deliveryEnabled);
  const [deposit, setDeposit] = useState(minorToTakaInput(venue.reservationDepositMinor));
  const [active, setActive] = useState(venue.isActive);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const depositMinor = parseTaka(deposit);
    const local: Record<string, string> = {};
    if (depositMinor === null)
      local.reservationDepositMinor = 'Enter an amount in taka, for example 200.';
    else if (depositMinor > DINING_ADMIN_LIMITS.maxDepositMinor)
      local.reservationDepositMinor = 'That deposit is too large.';
    if (closeHour <= openHour) local.closeHour = 'Closing must be after opening.';
    setFieldErrors(local);
    if (Object.keys(local).length > 0 || depositMinor === null) return;

    setPending(true);
    setError(null);
    try {
      const body: UpdateDiningVenueRequest = {
        description: description.trim() || null,
        openHour,
        closeHour,
        reservationsEnabled: reservations,
        deliveryEnabled: delivery,
        reservationDepositMinor: depositMinor,
        isActive: active,
      };
      await clientApi(`/admin/dining/venues/${encodeURIComponent(venue.code)}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      toast.push('Listing saved.', 'success');
      router.refresh();
    } catch (caught) {
      setError(diningErrorMessage(caught));
      setFieldErrors(diningFieldErrors(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={save} noValidate>
      <Card className="space-y-5 p-5">
        <h2 className="text-title">Details</h2>
        <Field
          label="Description"
          htmlFor="venue-description"
          error={fieldErrors.description}
          hint="Shown on the listing page."
        >
          <TextArea
            id="venue-description"
            rows={4}
            maxLength={DINING_ADMIN_LIMITS.descriptionMaxLength}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Opens" htmlFor="venue-open" error={fieldErrors.openHour}>
            <Select
              id="venue-open"
              value={openHour}
              onChange={(event) => setOpenHour(Number(event.target.value))}
            >
              {HOURS.slice(0, 24).map((hour) => (
                <option key={hour} value={hour}>
                  {hourLabel(hour)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Closes" htmlFor="venue-close" error={fieldErrors.closeHour}>
            <Select
              id="venue-close"
              value={closeHour}
              aria-invalid={Boolean(fieldErrors.closeHour)}
              onChange={(event) => setCloseHour(Number(event.target.value))}
            >
              {HOURS.slice(1).map((hour) => (
                <option key={hour} value={hour}>
                  {hour === 24 ? 'Midnight' : hourLabel(hour)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="divide-y divide-line rounded-sm border border-line px-3">
          <Checkbox
            label="Take table reservations"
            checked={reservations}
            onChange={(event) => setReservations(event.target.checked)}
          />
          <Checkbox
            label="Deliver to sunbeds"
            description={venue.beachPointName ? `At ${venue.beachPointName}` : 'Needs a beach spot'}
            checked={delivery}
            onChange={(event) => setDelivery(event.target.checked)}
          />
          <Checkbox
            label="Show to visitors"
            description="Hidden listings keep their bookings but disappear from Explore."
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
          />
        </div>
        <Field
          label="Table deposit (Tk)"
          htmlFor="venue-deposit"
          error={fieldErrors.reservationDepositMinor}
          hint="0 for no deposit."
        >
          <Input
            id="venue-deposit"
            inputMode="decimal"
            value={deposit}
            aria-invalid={Boolean(fieldErrors.reservationDepositMinor)}
            onChange={(event) => setDeposit(event.target.value)}
          />
        </Field>
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Button type="submit" size="lg" block loading={pending}>
          Save details
        </Button>
      </Card>
    </form>
  );
}

export function MenuEditor({ venue }: { venue: DiningAdminVenueDto }) {
  const toast = useToast();
  const [menu, setMenu] = useState(venue.menu);
  const [editing, setEditing] = useState<AdminMenuItemDto | null>(null);

  function replace(item: AdminMenuItemDto) {
    setMenu((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((entry) => (entry.id === item.id ? item : entry)),
      })),
    );
  }

  async function patch(
    item: AdminMenuItemDto,
    body: UpdateMenuItemRequest,
  ): Promise<AdminMenuItemDto> {
    return clientApi<AdminMenuItemDto>(`/admin/dining/menu-items/${encodeURIComponent(item.id)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  /** Optimistic toggle with an undo snackbar instead of a confirmation. */
  async function toggle(item: AdminMenuItemDto) {
    const next = !item.isAvailable;
    replace({ ...item, isAvailable: next });
    try {
      replace(await patch(item, { isAvailable: next }));
      toast.push(`${item.name} ${next ? 'is back on' : 'is off'} the menu.`, 'success', {
        label: 'Undo',
        onClick: () => {
          void patch(item, { isAvailable: item.isAvailable })
            .then(replace)
            .catch(() => toast.push('Undo failed. Try again.', 'danger'));
        },
      });
    } catch (error) {
      replace(item);
      toast.push(diningErrorMessage(error), 'danger');
    }
  }

  return (
    <section aria-labelledby="menu-title">
      <h2 id="menu-title" className="mb-3 text-title">
        Menu
      </h2>
      {menu.length === 0 ? (
        <p className="text-body-sm text-muted">This venue has no menu yet.</p>
      ) : (
        <div className="space-y-5">
          {menu.map((category) => (
            <div key={category.id}>
              <h3 className="mb-2 text-title-sm">{category.name}</h3>
              <Card as="div" className="divide-y divide-line">
                {category.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-2">
                    <div className="min-w-0 flex-1">
                      <p
                        className={
                          item.isAvailable ? 'text-body' : 'text-body text-muted line-through'
                        }
                      >
                        {item.name}
                      </p>
                      <p className="tabular text-body-sm text-muted">
                        {formatMoney(item.priceMinor, item.currency)}
                      </p>
                    </div>
                    <label className="flex min-h-11 cursor-pointer items-center gap-2 text-body-sm">
                      <input
                        type="checkbox"
                        role="switch"
                        checked={item.isAvailable}
                        onChange={() => void toggle(item)}
                        className="size-5 accent-[var(--primary)]"
                      />
                      <span className="hidden md:inline">
                        {item.isAvailable ? 'Available' : 'Off'}
                      </span>
                      <span className="sr-only">{item.name} available</span>
                    </label>
                    <IconButton label={`Edit ${item.name}`} onClick={() => setEditing(item)}>
                      <Pencil aria-hidden className="size-5" />
                    </IconButton>
                  </div>
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}
      {editing ? (
        <MenuItemSheet
          key={editing.id}
          item={editing}
          onClose={() => setEditing(null)}
          onSave={async (body) => {
            const saved = await patch(editing, body);
            replace(saved);
            toast.push(`${saved.name} saved.`, 'success');
            setEditing(null);
          }}
        />
      ) : null}
    </section>
  );
}

function MenuItemSheet({
  item,
  onClose,
  onSave,
}: {
  item: AdminMenuItemDto;
  onClose: () => void;
  onSave: (body: UpdateMenuItemRequest) => Promise<void>;
}) {
  const [name, setName] = useState(item.name);
  const [nameBn, setNameBn] = useState(item.nameBn ?? '');
  const [description, setDescription] = useState(item.description ?? '');
  const [price, setPrice] = useState(minorToTakaInput(item.priceMinor));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function submit() {
    const priceMinor = parseTaka(price);
    const local: Record<string, string> = {};
    if (!name.trim()) local.name = 'Enter a name.';
    if (priceMinor === null || priceMinor <= 0)
      local.priceMinor = 'Enter a price in taka, for example 250.';
    setFieldErrors(local);
    if (Object.keys(local).length > 0 || priceMinor === null) return;
    setPending(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        nameBn: nameBn.trim() || null,
        description: description.trim() || null,
        priceMinor,
      });
    } catch (caught) {
      setError(diningErrorMessage(caught));
      setFieldErrors(diningFieldErrors(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={`Edit ${item.name}`}
      footer={
        <Button size="lg" block loading={pending} onClick={() => void submit()}>
          Save item
        </Button>
      }
    >
      <div className="space-y-4">
        <Field label="Name" htmlFor="item-name" error={fieldErrors.name}>
          <Input
            id="item-name"
            value={name}
            maxLength={DINING_ADMIN_LIMITS.menuItemNameMaxLength}
            aria-invalid={Boolean(fieldErrors.name)}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="Name in Bangla" htmlFor="item-name-bn" optional error={fieldErrors.nameBn}>
          <Input
            id="item-name-bn"
            lang="bn"
            value={nameBn}
            maxLength={DINING_ADMIN_LIMITS.menuItemNameMaxLength}
            onChange={(event) => setNameBn(event.target.value)}
          />
        </Field>
        <Field
          label="Description"
          htmlFor="item-description"
          optional
          error={fieldErrors.description}
        >
          <TextArea
            id="item-description"
            rows={2}
            maxLength={DINING_ADMIN_LIMITS.menuItemDescriptionMaxLength}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        <Field label="Price (Tk)" htmlFor="item-price" error={fieldErrors.priceMinor}>
          <Input
            id="item-price"
            inputMode="decimal"
            value={price}
            aria-invalid={Boolean(fieldErrors.priceMinor)}
            onChange={(event) => setPrice(event.target.value)}
          />
        </Field>
        {error ? <Notice tone="danger">{error}</Notice> : null}
      </div>
    </Sheet>
  );
}
