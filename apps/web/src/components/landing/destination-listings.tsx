'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Hotel, Utensils } from 'lucide-react';
import type { DestinationDetailDto } from '@coastline/api-contracts';
import type { InventoryResult } from '@/lib/places-server';
import type { DroneDestination } from '@/lib/drone-landing-data';
import { CardRow, CardRowItem } from '@/components/patterns/spot-hub-sections';
import { HotelCard, VenueCard } from '@/components/patterns/listing-cards';

export interface DestinationListingsProps {
  destination: DestinationDetailDto;
  droneDest: DroneDestination;
  inventory: InventoryResult;
  selectedFilterSpot: string;
  onSelectFilterSpot: (spotSlug: string) => void;
  lang: 'en' | 'bn';
}

export function DestinationListings({
  destination,
  droneDest,
  inventory,
  selectedFilterSpot,
  onSelectFilterSpot,
  lang,
}: DestinationListingsProps) {
  const spotName = (spotSlug: string | null) =>
    destination.spots.find((spot) => spot.slug === spotSlug)?.name;

  const filteredHotels =
    selectedFilterSpot === 'all'
      ? inventory.hotels
      : inventory.hotels.filter(
          (h) =>
            h.spotSlug &&
            (h.spotSlug === selectedFilterSpot ||
              h.spotSlug.includes(selectedFilterSpot) ||
              selectedFilterSpot.includes(h.spotSlug)),
        );

  const filteredVenues =
    selectedFilterSpot === 'all'
      ? inventory.venues
      : inventory.venues.filter((v) => {
          if (!v.beachPointCode) return false;
          const code = v.beachPointCode.toLowerCase();
          return selectedFilterSpot.toLowerCase().includes(code);
        });

  const spotsWithInventory = (
    destination.spots.length > 0 ? destination.spots : droneDest.spots
  ).map((s) => ('slug' in s ? s.slug : s.id));

  return (
    <section className="dl-sec" id="list" style={{ paddingTop: '10px' }}>
      <div className="dl-wrap">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <div className="dl-eyebrow" style={{ color: 'var(--accent)' }}>
              {lang === 'bn'
                ? `${destination.nameBn || destination.name}-এ জনপ্রিয় লিস্টিং`
                : `Book in ${destination.name}`}
            </div>
            <h2 className="dl-h2" style={{ marginBottom: 0 }}>
              {lang === 'bn' ? 'হোটেল ও' : 'Stays &'}{' '}
              <span className="serif" style={{ color: 'var(--accent)' }}>
                {lang === 'bn' ? 'খাবার স্থান।' : 'dining.'}
              </span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted mr-1">
              {lang === 'bn' ? 'স্পট অনুযায়ী ফিল্টার:' : 'Filter by spot:'}
            </span>
            <button
              type="button"
              onClick={() => onSelectFilterSpot('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedFilterSpot === 'all'
                  ? 'bg-action-bg text-action-fg shadow-sm'
                  : 'bg-surface border border-line text-muted hover:border-primary/50'
              }`}
            >
              {lang === 'bn' ? 'সকল স্পট' : 'All Spots'}
            </button>
            {spotsWithInventory.map((sSlug) => {
              const sName =
                destination.spots.find((s) => s.slug === sSlug)?.name ||
                droneDest.spots.find((s) => s.id === sSlug)?.name ||
                sSlug;
              return (
                <button
                  key={sSlug}
                  type="button"
                  onClick={() => onSelectFilterSpot(sSlug)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedFilterSpot === sSlug
                      ? 'bg-action-bg text-action-fg shadow-sm'
                      : 'bg-surface border border-line text-muted hover:border-primary/50'
                  }`}
                >
                  {sName}
                </button>
              );
            })}
          </div>
        </div>

        <div id="stays" style={{ marginTop: '28px' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-title font-bold text-fg flex items-center gap-2">
              <Hotel className="size-5 text-primary" />
              <span>{lang === 'bn' ? 'হোটেল ও বিচভিউ রিসোর্ট' : 'Popular stays & resorts'}</span>
              <span className="text-xs font-normal text-muted">
                ({filteredHotels.length} {lang === 'bn' ? 'উপলব্ধ' : 'available'})
              </span>
            </h3>
            <Link
              href={`/d/${destination.slug}/stay`}
              className="text-label text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>{lang === 'bn' ? 'সবগুলো হোটেল দেখুন' : 'See all stays'}</span>
              <ChevronRight className="size-4" />
            </Link>
          </div>
          {filteredHotels.length > 0 ? (
            <CardRow label="Popular stays">
              {filteredHotels.slice(0, 6).map((hotel) => (
                <CardRowItem key={hotel.id}>
                  <HotelCard hotel={hotel} spotName={spotName(hotel.spotSlug)} />
                </CardRowItem>
              ))}
            </CardRow>
          ) : (
            <p className="text-sm text-muted py-6">
              {lang === 'bn'
                ? 'নির্বাচিত স্পটে এই মুহূর্তে কোনো হোটেল পাওয়া যায়নি।'
                : 'No hotels found for the selected spot filter.'}
            </p>
          )}
        </div>

        <div id="dining" style={{ marginTop: '40px' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-title font-bold text-fg flex items-center gap-2">
              <Utensils className="size-5 text-amber-600" />
              <span>{lang === 'bn' ? 'সিফুড ও খাবার রেস্তোরাঁ' : 'Places to eat & seafood'}</span>
              <span className="text-xs font-normal text-muted">
                ({filteredVenues.length} {lang === 'bn' ? 'উপলব্ধ' : 'places'})
              </span>
            </h3>
            <Link
              href={`/d/${destination.slug}/food`}
              className="text-label text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>{lang === 'bn' ? 'সবগুলো খাবার স্থান দেখুন' : 'See all dining'}</span>
              <ChevronRight className="size-4" />
            </Link>
          </div>
          {filteredVenues.length > 0 ? (
            <CardRow label="Places to eat">
              {filteredVenues.slice(0, 6).map((venue) => (
                <CardRowItem key={venue.id}>
                  <VenueCard venue={venue} />
                </CardRowItem>
              ))}
            </CardRow>
          ) : (
            <p className="text-sm text-muted py-6">
              {lang === 'bn'
                ? 'নির্বাচিত স্পটে এই মুহূর্তে কোনো খাবার স্থান পাওয়া যায়নি।'
                : 'No dining venues found for the selected spot filter.'}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
