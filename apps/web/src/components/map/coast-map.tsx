'use client';

import { useEffect, useRef, useState } from 'react';
import {
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  setWorkerUrl,
} from 'maplibre-gl';
import type { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';

export interface MapPointData {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  freeBeds: number;
  totalBeds: number;
}

export interface MapBedData {
  id: string;
  code: string;
  latitude: number;
  longitude: number;
  state: 'free' | 'booked' | 'mine' | 'selected' | 'off';
}

export interface CoastMapProps {
  points: MapPointData[];
  beds: MapBedData[];
  selectedPointCode: string | null;
  onSelectPoint: (code: string) => void;
  onToggleBed: (id: string) => void;
  onReady?: () => void;
}

const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      minzoom: 1,
      maxzoom: 19,
      attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
    },
  },
  layers: [
    {
      id: 'satellite',
      type: 'raster',
      source: 'satellite',
      paint: {
        'raster-saturation': -0.06,
        'raster-contrast': 0.04,
        'raster-brightness-max': 0.93,
      },
    },
  ],
};

const BED_LABELS: Record<MapBedData['state'], string> = {
  free: 'free',
  booked: 'booked',
  mine: 'your booking',
  selected: 'selected',
  off: 'out of service',
};

/**
 * Sugandha, Kolatoli and Laboni are within ~1.5 km of each other. At the
 * coast-wide opening view their pins would stack, so those three are pushed
 * apart in screen space while the cards are suppressed. Zooming in removes the
 * offsets and restores the true positions and name cards.
 */
const CLUSTER_CODES = new Set(['SUG', 'KOL', 'LAB']);
const CLUSTER_OFFSETS: Record<string, [number, number]> = {
  SUG: [-34, -6],
  KOL: [0, 8],
  LAB: [34, -6],
};
const CLUSTER_ZOOM = 12.8;

function markerOffset(code: string, zoom: number): [number, number] {
  return zoom < CLUSTER_ZOOM ? (CLUSTER_OFFSETS[code] ?? [0, 0]) : [0, 0];
}

export default function CoastMap({
  points,
  beds,
  selectedPointCode,
  onSelectPoint,
  onToggleBed,
  onReady,
}: CoastMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const pointMarkers = useRef<Array<{ marker: Marker; code: string }>>([]);
  const bedMarkers = useRef<Marker[]>([]);
  const [ready, setReady] = useState(false);

  // The handlers change identity every render; keep the newest ones available
  // to markers without rebuilding the map.
  const pointHandler = useRef(onSelectPoint);
  const bedHandler = useRef(onToggleBed);
  pointHandler.current = onSelectPoint;
  bedHandler.current = onToggleBed;
  const readyHandler = useRef(onReady);
  readyHandler.current = onReady;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    setWorkerUrl('/maplibre-gl-worker.mjs');

    const map = new MapLibreMap({
      container: containerRef.current,
      style: SATELLITE_STYLE,
      center: [92.02, 21.33],
      zoom: 9.4,
      minZoom: 8.0,
      maxZoom: 18.5,
      maxBounds: [
        [91.8, 20.65],
        [92.45, 21.75],
      ],
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      maxPitch: 0,
      renderWorldCopies: false,
      fadeDuration: 0,
      attributionControl: { compact: true },
    });

    map.addControl(new NavigationControl({ showCompass: false }), 'bottom-right');
    map.on('load', () => {
      setReady(true);
      readyHandler.current?.();
    });

    // Keep the three town pins spread only while the coast-wide view is shown.
    const syncZoomBand = () => {
      const zoom = map.getZoom();
      map.getContainer().classList.toggle('map-wide', zoom < CLUSTER_ZOOM);
      pointMarkers.current.forEach(({ marker, code }) => {
        marker.setOffset(markerOffset(code, zoom));
      });
    };
    map.on('zoom', syncZoomBand);

    const observer = new ResizeObserver(() => map.resize());
    observer.observe(containerRef.current);
    mapRef.current = map;
    syncZoomBand();

    return () => {
      observer.disconnect();
      map.off('zoom', syncZoomBand);
      pointMarkers.current.forEach(({ marker }) => marker.remove());
      bedMarkers.current.forEach((marker) => marker.remove());
      pointMarkers.current = [];
      bedMarkers.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fit all beach points once the first catalogue arrives.
  const fitted = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || fitted.current || points.length === 0) {
      return;
    }
    fitted.current = true;

    if (points.length === 1) {
      map.jumpTo({ center: [points[0].longitude, points[0].latitude], zoom: 13 });
      return;
    }

    const bounds = new LngLatBounds();
    points.forEach((point) => bounds.extend([point.longitude, point.latitude]));
    // On desktop the left rail and booking panel cover the map edges. Keep the
    // pins in the open strip between them so no marker lands under a panel.
    const wide = window.innerWidth >= 1024;
    map.fitBounds(bounds, {
      padding: wide
        ? { top: 90, right: 440, bottom: 110, left: 344 }
        : { top: 70, right: 54, bottom: 96, left: 54 },
      maxZoom: 12,
      duration: 0,
    });
  }, [points, ready]);

  // Point pins.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) {
      return;
    }

    pointMarkers.current.forEach(({ marker }) => marker.remove());
    pointMarkers.current = [];

    points.forEach((point, index) => {
      // Once a point is open its bed pills take over the map. Keeping the pin
      // would overlap the centred bed grid and the point's own name card.
      if (selectedPointCode === point.code) {
        return;
      }

      const clustered = CLUSTER_CODES.has(point.code);
      const element = document.createElement('button');
      element.type = 'button';
      element.className = clustered ? 'point-marker point-marker--cluster' : 'point-marker';
      element.setAttribute('aria-pressed', String(selectedPointCode === point.code));
      element.setAttribute(
        'aria-label',
        `${point.name}, ${point.freeBeds} of ${point.totalBeds} beds free`,
      );

      const pin = document.createElement('span');
      pin.className = 'point-marker__pin';
      pin.textContent = String(index + 1).padStart(2, '0');

      const card = document.createElement('span');
      card.className = 'point-marker__card';

      const name = document.createElement('span');
      name.textContent = point.name.replace(' Beach', '');
      const free = document.createElement('span');
      free.className = 'point-marker__free';
      free.textContent = `${point.freeBeds} free`;
      card.append(name, free);

      element.append(pin, card);
      element.addEventListener('click', () => pointHandler.current(point.code));

      const marker = new Marker({
        element,
        anchor: 'bottom',
        offset: markerOffset(point.code, map.getZoom()),
      })
        .setLngLat([point.longitude, point.latitude])
        .addTo(map);
      pointMarkers.current.push({ marker, code: point.code });
    });
  }, [points, ready, selectedPointCode]);

  // Bed pills for the selected point.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) {
      return;
    }

    bedMarkers.current.forEach((marker) => marker.remove());
    bedMarkers.current = [];

    beds.forEach((bed) => {
      const element = document.createElement('button');
      element.type = 'button';
      element.className = `bed-marker bed-marker--${bed.state}`;
      element.textContent = bed.code;
      element.title = `${bed.code} — ${BED_LABELS[bed.state]}`;
      element.setAttribute('aria-label', `${bed.code}, ${BED_LABELS[bed.state]}`);
      const locked = bed.state === 'booked' || bed.state === 'mine' || bed.state === 'off';
      element.disabled = locked;
      element.setAttribute('aria-pressed', String(bed.state === 'selected'));

      if (!locked) {
        element.addEventListener('click', () => bedHandler.current(bed.id));
      }

      const marker = new Marker({ element, anchor: 'center' })
        .setLngLat([bed.longitude, bed.latitude])
        .addTo(map);
      bedMarkers.current.push(marker);
    });
  }, [beds, ready]);

  // Focus the selected point, unless the visitor prefers reduced motion.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !selectedPointCode) {
      return;
    }
    const point = points.find((item) => item.code === selectedPointCode);
    if (!point) {
      return;
    }

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const target = { center: [point.longitude, point.latitude] as [number, number], zoom: 16.9 };
    if (reduced) {
      map.jumpTo(target);
    } else {
      map.flyTo({ ...target, duration: 900, curve: 1.35, essential: true });
    }
  }, [selectedPointCode, points, ready]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-deep">
      <div
        ref={containerRef}
        className="h-full w-full"
        aria-label="Satellite map of Cox's Bazar beach points"
      />
      {!ready ? (
        <div className="absolute inset-0 z-10 grid place-items-center bg-deep">
          <div className="flex flex-col items-center gap-3">
            <span
              aria-hidden
              className="h-7 w-7 animate-spin rounded-full border-2 border-sea border-t-transparent"
            />
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-mist">
              Loading satellite view
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
