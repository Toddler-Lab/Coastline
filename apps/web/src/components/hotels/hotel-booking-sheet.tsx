'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, BedDouble, Calendar, CheckCircle2, Loader2, ShieldCheck, UserCheck, X } from 'lucide-react';
import type { HotelDetailDto, OrderDto, RoomTypeDto } from '@coastline/api-contracts';
import { ApiError, clientApi } from '@/lib/api';
import { formatLongDateKey, formatMoney } from '@/lib/format';
import { useToast } from '@/components/ui/toast';

export interface HotelBookingSheetProps {
  hotel: HotelDetailDto;
  roomType: RoomTypeDto;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  isOpen: boolean;
  onClose: () => void;
}

export function HotelBookingSheet({
  hotel,
  roomType,
  checkInDate,
  checkOutDate,
  nights,
  isOpen,
  onClose,
}: HotelBookingSheetProps) {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalMinor = roomType.basePriceMinor * nights;

  async function handleConfirmBooking() {
    setSubmitting(true);
    setErrorText(null);

    try {
      const order = await clientApi<OrderDto>('/hotels/bookings', {
        method: 'POST',
        body: JSON.stringify({
          hotelId: hotel.id,
          roomTypeId: roomType.id,
          checkInDate,
          checkOutDate,
          guestsCount: roomType.maxGuests,
        }),
      });

      toast.push(`Hotel reservation ${order.publicRef} confirmed!`, 'success');
      router.push(`/bookings/${encodeURIComponent(order.publicRef)}?new=1`);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorText(err.message);
        toast.push(err.message, 'danger');
      } else {
        setErrorText('Failed to complete booking. Please verify the API is running.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-abyss/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-line bg-panel p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between border-b border-line pb-4">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-sea">
              Instant Hotel Reservation
            </span>
            <h2 className="mt-1 text-[20px] font-bold text-foam">{hotel.name}</h2>
            <p className="text-[12px] text-mist">{hotel.address}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-mist hover:text-foam hover:bg-surface transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorText ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-danger/40 bg-danger/10 p-3 text-danger text-[12.5px]">
            <AlertCircle className="h-4 w-4 flex-none mt-0.5" />
            <span>{errorText}</span>
          </div>
        ) : null}

        <div className="rounded-xl border border-line/80 bg-surface/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-foam">{roomType.name}</span>
            {roomType.sampleRoomNumber ? (
              <span className="rounded-md border border-sea/30 bg-sea/10 px-2 py-0.5 font-mono text-[11.5px] font-bold text-sea">
                Room {roomType.sampleRoomNumber}
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3 text-[12px]">
            <div>
              <p className="text-mist">Check-In</p>
              <p className="font-medium text-foam">{formatLongDateKey(checkInDate)}</p>
            </div>
            <div>
              <p className="text-mist">Check-Out</p>
              <p className="font-medium text-foam">{formatLongDateKey(checkOutDate)}</p>
            </div>
            <div>
              <p className="text-mist">Duration</p>
              <p className="font-medium text-foam">{nights} {nights === 1 ? 'Night' : 'Nights'}</p>
            </div>
            <div>
              <p className="text-mist">Bed Configuration</p>
              <p className="font-medium text-foam">{roomType.bedConfig}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 border-t border-line/60 pt-3 text-[12.5px]">
          <div className="flex justify-between text-mist">
            <span>{formatMoney(roomType.basePriceMinor)} × {nights} {nights === 1 ? 'night' : 'nights'}</span>
            <span>{formatMoney(totalMinor)}</span>
          </div>
          <div className="flex justify-between text-mist">
            <span>Coastal Tourism VAT & Service (Demo)</span>
            <span className="text-success font-medium">Included</span>
          </div>
          <div className="flex items-baseline justify-between border-t border-line pt-2 text-[15px] font-bold text-foam">
            <span>Total Payable (Simulated)</span>
            <span className="font-mono text-[22px] text-sea">{formatMoney(totalMinor)}</span>
          </div>
        </div>

        <div className="rounded-xl border border-sand/30 bg-sand/5 p-3 flex items-start gap-2 text-[11px] text-mist">
          <ShieldCheck className="h-4 w-4 flex-none text-sand mt-0.5" />
          <span>
            Demo Mode: No payment credentials required. Your room number is instantly reserved with verified tourist police governance.
          </span>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded-xl border border-line bg-surface py-2.5 text-[13px] font-medium text-foam hover:bg-surface/80 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmBooking}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-sea hover:bg-sea-bright py-2.5 text-[13px] font-bold text-white shadow-md transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Reserving Room...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Confirm & Pay (Demo)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
