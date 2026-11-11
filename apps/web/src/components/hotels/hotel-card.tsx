import Link from 'next/link';
import { BedDouble, Check, MapPin, ShieldCheck, Sparkles, Star, Waves, Zap } from 'lucide-react';
import type { HotelSummaryDto } from '@coastline/api-contracts';
import { formatMoney } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Panel } from '@/components/ui/panel';

export interface HotelCardProps {
  hotel: HotelSummaryDto;
  checkInDate: string;
  checkOutDate: string;
}

const ZONE_LABELS: Record<string, string> = {
  KOLATOLI: 'Kolatoli Beach',
  SUGANDHA: 'Sugandha Point',
  LABONI: 'Laboni Point',
  HIMCHARI: 'Himchari Cliff',
  PECHARDWIP: 'Pechardwip Eco',
  INANI: 'Inani Coral Beach',
};

export function HotelCard({ hotel, checkInDate, checkOutDate }: HotelCardProps) {
  const queryParams = new URLSearchParams({
    checkIn: checkInDate,
    checkOut: checkOutDate,
  });

  return (
    <Panel className="group overflow-hidden flex flex-col transition-all duration-200 hover:border-sea/50 hover:shadow-lg">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface">
        <img
          src={hotel.featuredImage}
          alt={hotel.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-abyss/80 via-transparent to-black/20" />

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-abyss/85 px-2 py-1 text-[11px] font-semibold text-sand backdrop-blur-md">
            <Star className="h-3 w-3 fill-sand text-sand" />
            {hotel.starRating}-Star
          </span>
          {hotel.isFeatured ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-sea/90 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
              <Sparkles className="h-3 w-3" />
              Verified Premium
            </span>
          ) : null}
        </div>

        <div className="absolute top-3 right-3">
          <span className="rounded-md bg-abyss/85 px-2 py-1 text-[11px] font-medium text-foam backdrop-blur-md">
            {ZONE_LABELS[hotel.zone] ?? hotel.zone}
          </span>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-1 text-[12px] font-medium text-foam">
            <MapPin className="h-3.5 w-3.5 text-sea" />
            <span>{hotel.distanceMeters}m to {hotel.nearestBeachCode} Beach</span>
          </div>
          <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-mist">
            Instant Booking
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-[17px] font-semibold text-foam group-hover:text-sea transition-colors">
                {hotel.name}
              </h3>
              {hotel.banglaName ? (
                <p className="text-[12px] text-mist">{hotel.banglaName}</p>
              ) : null}
            </div>
          </div>

          <p className="mt-2 text-[12px] leading-relaxed text-mist line-clamp-2">
            {hotel.description}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded bg-surface px-2 py-0.5 text-[10.5px] text-mist">
              <Zap className="h-3 w-3 text-sand" /> 100% Generator
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-surface px-2 py-0.5 text-[10.5px] text-mist">
              <Waves className="h-3 w-3 text-sea" /> Ocean Access
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-surface px-2 py-0.5 text-[10.5px] text-mist">
              <ShieldCheck className="h-3 w-3 text-success" /> Police Verified
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-line flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-mist">From</p>
            <p className="text-[20px] font-bold text-foam">
              {formatMoney(hotel.minPriceMinor)}
              <span className="text-[11px] font-normal text-mist"> / night</span>
            </p>
            <p className="text-[10.5px] text-sea">
              {hotel.availableRoomsCount} rooms available
            </p>
          </div>

          <Link
            href={`/hotels/${hotel.slug}?${queryParams.toString()}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sea hover:bg-sea-bright px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-colors"
          >
            <BedDouble className="h-3.5 w-3.5" />
            View Rooms
          </Link>
        </div>
      </div>
    </Panel>
  );
}
