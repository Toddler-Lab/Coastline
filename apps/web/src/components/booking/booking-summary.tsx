'use client';

import { Info, ShieldCheck } from 'lucide-react';
import type { SunbedAvailability } from '@coastline/api-contracts';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/format';
import { durationLabel } from '@/lib/booking';

export function BookingSummary({
  selectedBeds,
  hours,
  subtotalMinor,
  canPay,
  submitting,
  disabledReason,
  isAdmin,
  onPay,
}: {
  selectedBeds: SunbedAvailability[];
  hours: number;
  subtotalMinor: number;
  canPay: boolean;
  submitting: boolean;
  disabledReason: string | null;
  isAdmin: boolean;
  onPay: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label">Indicative total</p>
          <p className="mt-1 text-[11px] text-mist">
            {selectedBeds.length === 0
              ? 'No beds selected'
              : `${selectedBeds.length} ${selectedBeds.length === 1 ? 'bed' : 'beds'} × ${durationLabel(hours)}`}
          </p>
        </div>
        <p className="font-display text-[28px] leading-none text-foam">
          {formatMoney(subtotalMinor)}
        </p>
      </div>

      {isAdmin ? (
        <div className="flex gap-3 rounded-xl border border-sand/35 bg-sand/8 p-3">
          <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 flex-none text-sand" />
          <div>
            <p className="text-[12px] font-semibold text-foam">
              You are viewing as admin — switch to a tourist persona to book.
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-mist">
              Use the persona switch in the header. Bookings, payments and QR tickets belong to the
              tourist persona, not the admin console.
            </p>
          </div>
        </div>
      ) : (
        <>
          <Button
            size="lg"
            className="w-full"
            loading={submitting}
            disabled={!canPay}
            onClick={onPay}
          >
            {submitting ? 'Placing booking' : `Pay ${formatMoney(subtotalMinor)} · demo`}
          </Button>
          <p className="flex items-start gap-1.5 text-[10.5px] leading-relaxed text-mist/80">
            <Info aria-hidden className="mt-0.5 h-3 w-3 flex-none text-mist" />
            <span>
              Demo payment — no real money moves. The API recalculates the total when the order is
              placed.
            </span>
          </p>
          {!canPay && disabledReason ? (
            <p className="text-[10.5px] text-warn" role="status">
              {disabledReason}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
