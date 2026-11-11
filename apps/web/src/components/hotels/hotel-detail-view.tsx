'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BedDouble,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Waves,
  Zap,
} from 'lucide-react';
import type { HotelDetailDto, RoomTypeDto } from '@coastline/api-contracts';
import { addDays, dhakaDateKey, formatLongDateKey, formatMoney } from '@/lib/format';
import { HotelBookingSheet } from './hotel-booking-sheet';
import { Badge } from '@/components/ui/badge';
import { Panel } from '@/components/ui/panel';

export interface HotelDetailViewProps {
  hotel: HotelDetailDto;
  initialCheckIn: string;
  initialCheckOut: string;
}

export function HotelDetailView({
  hotel,
  initialCheckIn,
  initialCheckOut,
}: HotelDetailViewProps) {
  const [checkInDate, setCheckInDate] = useState<string>(initialCheckIn);
  const [checkOutDate, setCheckOutDate] = useState<string>(initialCheckOut);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomTypeDto | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const nights = useMemo(() => {
    const start = Date.parse(checkInDate);
    const end = Date.parse(checkOutDate);
    if (isNaN(start) || isNaN(end) || end <= start) return 1;
    return Math.round((end - start) / (86_400_000));
  }, [checkInDate, checkOutDate]);

  function handleOpenBooking(rt: RoomTypeDto) {
    setSelectedRoomType(rt);
    setSheetOpen(true);
  }

  return (
    <div className="space-y-8">
      <Link
        href="/hotels"
        className="inline-flex min-h-11 items-center gap-1.5 text-[12.5px] text-mist transition-colors hover:text-foam"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to all hotels
      </Link>

      {/* Property Hero Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-abyss border border-sand/40 px-2.5 py-1 text-[11.5px] font-semibold text-sand">
            <Star className="h-3.5 w-3.5 fill-sand text-sand" />
            {hotel.starRating}-Star Luxury
          </span>
          <Badge tone="sea">{hotel.zone} Zone</Badge>
          <span className="inline-flex items-center gap-1 text-[12px] text-mist">
            <MapPin className="h-3.5 w-3.5 text-sea" />
            {hotel.distanceMeters}m to {hotel.nearestBeachCode} Beach Point
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <div>
            <h1 className="text-[28px] sm:text-[36px] font-bold text-foam">{hotel.name}</h1>
            {hotel.banglaName ? (
              <p className="text-[16px] text-mist mt-0.5">{hotel.banglaName}</p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-mist">Starting From</p>
            <p className="text-[26px] font-extrabold text-sea">
              {formatMoney(hotel.minPriceMinor)}
              <span className="text-[12px] font-normal text-mist"> / night</span>
            </p>
          </div>
        </div>

        <p className="text-[13px] text-foam/80 flex items-center gap-1.5">
          <Compass className="h-4 w-4 text-mist flex-none" />
          {hotel.address}
        </p>
      </div>

      {/* Gallery Grid */}
      <div className="grid gap-3 sm:grid-cols-3 rounded-2xl overflow-hidden border border-line">
        <div className="sm:col-span-2 relative aspect-[16/10] bg-surface">
          <img
            src={hotel.featuredImage}
            alt={hotel.name}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="grid grid-rows-2 gap-3">
          {hotel.galleryImages.slice(0, 2).map((img, idx) => (
            <div key={idx} className="relative aspect-[16/9] sm:aspect-auto bg-surface overflow-hidden">
              <img src={img} alt={`${hotel.name} gallery ${idx + 1}`} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      {/* Overview & Key Amenities */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Panel className="p-5 space-y-4">
            <h2 className="text-[18px] font-semibold text-foam">About this Property</h2>
            <p className="text-[13.5px] leading-relaxed text-mist">{hotel.description}</p>

            <div className="pt-3 border-t border-line">
              <h3 className="text-[13px] font-semibold text-foam uppercase tracking-wider">
                Audited & Verified Amenities
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {hotel.amenities.map((amenity, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-[12px] text-foam"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          </Panel>

          {/* Stay Dates Selector */}
          <div className="rounded-2xl border border-sea/30 bg-sea/5 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-sea">Choose Stay Dates</p>
                <h3 className="text-[17px] font-bold text-foam">Select Check-In & Check-Out</h3>
              </div>
              <span className="rounded-md bg-sea/20 px-2.5 py-1 text-[12px] font-bold text-sea">
                {nights} {nights === 1 ? 'Night' : 'Nights'}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-mist">Check-In</label>
                <input
                  type="date"
                  min={dhakaDateKey()}
                  value={checkInDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCheckInDate(val);
                    if (val >= checkOutDate) {
                      setCheckOutDate(addDays(val, 1));
                    }
                  }}
                  className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-[13px] text-foam focus:border-sea focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-mist">Check-Out</label>
                <input
                  type="date"
                  min={addDays(checkInDate, 1)}
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-[13px] text-foam focus:border-sea focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Room Types Listing */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[20px] font-bold text-foam">Available Room Categories</h2>
              <span className="text-[12px] text-mist">{hotel.roomTypes.length} Room Types</span>
            </div>

            <div className="space-y-4">
              {hotel.roomTypes.map((rt) => {
                const totalStayPrice = rt.basePriceMinor * nights;
                const isAvailable = rt.availableRooms > 0;

                return (
                  <Panel key={rt.id} className="p-5 flex flex-col sm:flex-row gap-5 items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[18px] font-bold text-foam">{rt.name}</h3>
                        {rt.sampleRoomNumber && isAvailable ? (
                          <span className="rounded-md border border-sea/40 bg-sea/10 px-2 py-0.5 font-mono text-[11px] font-bold text-sea">
                            Room {rt.sampleRoomNumber}
                          </span>
                        ) : null}
                        {isAvailable ? (
                          <span className="rounded-md bg-success/10 px-2 py-0.5 text-[10.5px] font-medium text-success">
                            {rt.availableRooms} rooms left
                          </span>
                        ) : (
                          <span className="rounded-md bg-danger/10 px-2 py-0.5 text-[10.5px] font-medium text-danger">
                            Fully Booked
                          </span>
                        )}
                      </div>

                      {rt.description ? (
                        <p className="text-[12.5px] text-mist">{rt.description}</p>
                      ) : null}

                      <div className="flex flex-wrap gap-3 text-[12px] text-foam/80">
                        <span className="inline-flex items-center gap-1">
                          <BedDouble className="h-3.5 w-3.5 text-sea" />
                          {rt.bedConfig}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-mist" />
                          Up to {rt.maxGuests} Guests
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {rt.amenities.map((a, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-surface px-2 py-0.5 text-[10.5px] text-mist"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="w-full sm:w-auto sm:text-right flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-line">
                      <div>
                        <p className="text-[11px] text-mist uppercase tracking-wider">Per Night</p>
                        <p className="text-[20px] font-bold text-foam">{formatMoney(rt.basePriceMinor)}</p>
                        <p className="text-[11px] text-sea font-medium">
                          {formatMoney(totalStayPrice)} for {nights} {nights === 1 ? 'night' : 'nights'}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => handleOpenBooking(rt)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-sea hover:bg-sea-bright disabled:opacity-40 disabled:hover:bg-sea px-5 py-2.5 text-[13px] font-bold text-white shadow-md transition-colors"
                      >
                        <BedDouble className="h-4 w-4" />
                        {isAvailable ? 'Instant Book' : 'Sold Out'}
                      </button>
                    </div>
                  </Panel>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Info & Contact */}
        <aside className="space-y-4">
          <Panel className="p-5 space-y-4">
            <h3 className="text-[16px] font-bold text-foam">Verified Front Desk</h3>
            <div className="space-y-2 text-[12.5px]">
              <div className="flex items-center gap-2 text-foam">
                <Phone className="h-4 w-4 text-sea flex-none" />
                <a href={`tel:${hotel.phone}`} className="hover:underline">{hotel.phone}</a>
              </div>
              {hotel.email ? (
                <div className="flex items-center gap-2 text-foam">
                  <Mail className="h-4 w-4 text-sea flex-none" />
                  <a href={`mailto:${hotel.email}`} className="hover:underline truncate">{hotel.email}</a>
                </div>
              ) : null}
            </div>

            <div className="border-t border-line pt-3 space-y-2 text-[12px]">
              <div className="flex justify-between">
                <span className="text-mist">Check-In Time</span>
                <span className="font-mono text-foam">{hotel.checkInTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mist">Check-Out Time</span>
                <span className="font-mono text-foam">{hotel.checkOutTime}</span>
              </div>
            </div>
          </Panel>

          <Panel className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-success">
              <ShieldCheck className="h-5 w-5" />
              <h3 className="text-[14px] font-semibold text-foam">Governance & Safety</h3>
            </div>
            <p className="text-[11.5px] leading-relaxed text-mist">
              This property has verified standby generators, compliant fire exit mapping, and tourist police registry verification under the Cox’s Bazar Coastal Tourism standard.
            </p>
          </Panel>
        </aside>
      </div>

      {selectedRoomType ? (
        <HotelBookingSheet
          hotel={hotel}
          roomType={selectedRoomType}
          checkInDate={checkInDate}
          checkOutDate={checkOutDate}
          nights={nights}
          isOpen={sheetOpen}
          onClose={() => setSheetOpen(false)}
        />
      ) : null}
    </div>
  );
}
