'use client';

import { useMemo, useState } from 'react';
import { Calendar, Compass, Filter, Hotel as HotelIcon, MapPin, Search, Star } from 'lucide-react';
import type { HotelSummaryDto, HotelZone } from '@coastline/api-contracts';
import { addDays, dhakaDateKey, formatLongDateKey } from '@/lib/format';
import { HotelCard } from './hotel-card';

export interface HotelDiscoveryProps {
  initialHotels: HotelSummaryDto[];
  initialCheckIn: string;
  initialCheckOut: string;
}

const ZONES: { key: HotelZone | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All Cox’s Bazar' },
  { key: 'KOLATOLI', label: 'Kolatoli' },
  { key: 'SUGANDHA', label: 'Sugandha' },
  { key: 'LABONI', label: 'Laboni' },
  { key: 'HIMCHARI', label: 'Himchari' },
  { key: 'PECHARDWIP', label: 'Pechardwip' },
  { key: 'INANI', label: 'Inani Coral' },
];

export function HotelDiscovery({
  initialHotels,
  initialCheckIn,
  initialCheckOut,
}: HotelDiscoveryProps) {
  const [selectedZone, setSelectedZone] = useState<HotelZone | 'ALL'>('ALL');
  const [selectedStars, setSelectedStars] = useState<number | 'ALL'>('ALL');
  const [checkInDate, setCheckInDate] = useState<string>(initialCheckIn);
  const [checkOutDate, setCheckOutDate] = useState<string>(initialCheckOut);
  const [searchQuery, setSearchQuery] = useState('');

  const nights = useMemo(() => {
    const start = Date.parse(checkInDate);
    const end = Date.parse(checkOutDate);
    if (isNaN(start) || isNaN(end) || end <= start) return 1;
    return Math.round((end - start) / (86_400_000));
  }, [checkInDate, checkOutDate]);

  const filteredHotels = useMemo(() => {
    return initialHotels.filter((hotel) => {
      if (selectedZone !== 'ALL' && hotel.zone !== selectedZone) {
        return false;
      }
      if (selectedStars !== 'ALL' && hotel.starRating !== selectedStars) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = hotel.name.toLowerCase().includes(query);
        const matchesBangla = hotel.banglaName?.toLowerCase().includes(query);
        const matchesAddress = hotel.address.toLowerCase().includes(query);
        if (!matchesName && !matchesBangla && !matchesAddress) {
          return false;
        }
      }
      return true;
    });
  }, [initialHotels, selectedZone, selectedStars, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Search and Date Controls Bar */}
      <div className="rounded-2xl border border-line bg-panel p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <label className="text-[11px] font-medium uppercase tracking-wider text-mist">
              Search Hotel or Location
            </label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-mist" />
              <input
                type="text"
                placeholder="e.g. Sayeman, Seagull, Inani..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface pl-9 pr-3 py-2 text-[13px] text-foam placeholder:text-mist/70 focus:border-sea focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-mist">
              Check-In Date
            </label>
            <div className="relative mt-1">
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
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-[13px] text-foam focus:border-sea focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-mist">
              Check-Out Date
            </label>
            <div className="relative mt-1">
              <input
                type="date"
                min={addDays(checkInDate, 1)}
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-[13px] text-foam focus:border-sea focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-mist">
              Duration
            </label>
            <div className="mt-1 flex items-center justify-between rounded-xl border border-line bg-surface/60 px-3 py-2 text-[13px] text-foam">
              <span className="font-semibold text-sea">{nights} {nights === 1 ? 'Night' : 'Nights'}</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setCheckOutDate(addDays(checkInDate, 1))}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${nights === 1 ? 'bg-sea text-white' : 'bg-surface text-mist hover:text-foam'}`}
                >
                  1N
                </button>
                <button
                  type="button"
                  onClick={() => setCheckOutDate(addDays(checkInDate, 2))}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${nights === 2 ? 'bg-sea text-white' : 'bg-surface text-mist hover:text-foam'}`}
                >
                  2N
                </button>
                <button
                  type="button"
                  onClick={() => setCheckOutDate(addDays(checkInDate, 3))}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${nights === 3 ? 'bg-sea text-white' : 'bg-surface text-mist hover:text-foam'}`}
                >
                  3N
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Zone Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line/60">
          <span className="text-[11.5px] font-medium text-mist mr-1">Zone:</span>
          {ZONES.map((zone) => (
            <button
              key={zone.key}
              type="button"
              onClick={() => setSelectedZone(zone.key)}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
                selectedZone === zone.key
                  ? 'bg-sea text-white shadow-sm'
                  : 'bg-surface text-mist hover:text-foam hover:bg-surface/80'
              }`}
            >
              {zone.label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[11.5px] font-medium text-mist">Stars:</span>
            {[
              { val: 'ALL', label: 'All' },
              { val: 5, label: '5★' },
              { val: 4, label: '4★' },
              { val: 3, label: '3★' },
            ].map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setSelectedStars(s.val as number | 'ALL')}
                className={`rounded-lg px-2.5 py-1 text-[11.5px] font-medium transition-colors ${
                  selectedStars === s.val
                    ? 'bg-sand text-abyss font-bold'
                    : 'bg-surface text-mist hover:text-foam'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Proximity / Governance Banner */}
      <div className="rounded-xl border border-sea/25 bg-sea/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12.5px] text-mist">
        <div className="flex items-center gap-2.5">
          <Compass className="h-5 w-5 text-sea flex-none" />
          <span>
            Showing <strong className="text-foam">{filteredHotels.length} verified accommodations</strong> across Kolatoli, Sugandha, Laboni, Himchari & Inani with exact GPS proximity to beaches.
          </span>
        </div>
        <span className="text-[11px] font-mono text-sea uppercase tracking-wider whitespace-nowrap">
          100% Verified Tariffs
        </span>
      </div>

      {/* Hotel Cards Grid */}
      {filteredHotels.length === 0 ? (
        <div className="rounded-2xl border border-line bg-panel p-12 text-center space-y-3">
          <HotelIcon className="mx-auto h-10 w-10 text-mist" />
          <h3 className="text-[18px] font-semibold text-foam">No hotels match your filters</h3>
          <p className="text-[13px] text-mist max-w-md mx-auto">
            Try choosing a different zone or clearing the star rating filter to view more properties.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedZone('ALL');
              setSelectedStars('ALL');
              setSearchQuery('');
            }}
            className="rounded-xl bg-surface px-4 py-2 text-[12.5px] font-semibold text-foam hover:bg-surface/80 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredHotels.map((hotel) => (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              checkInDate={checkInDate}
              checkOutDate={checkOutDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
