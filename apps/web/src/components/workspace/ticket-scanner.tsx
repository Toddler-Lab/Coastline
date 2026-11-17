'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, LogIn, Search } from 'lucide-react';
import type {
  AdminOrderDto,
  AdminOrderListDto,
  AdminReservationDto,
} from '@coastline/api-contracts';
import { ApiError, clientApi } from '@/lib/api';
import { RESERVATION_STATUS_LABELS, reservationStatusTone } from '@/lib/dining/admin';
import { formatDateKey, formatDateTime, formatTimeRange } from '@/lib/format';
import { orderToTrip } from '@/lib/trips';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, DetailRows } from '@/components/ui/display';
import { Field, Input } from '@/components/ui/field';
import { Notice } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';

type Found =
  | { kind: 'order'; order: AdminOrderDto }
  | { kind: 'reservation'; reservation: AdminReservationDto };

const REF = /^(BK|HTL|RS|FO)-(\d{8})-[A-Z0-9]{4}$/;

function refFromPayload(payload: string): string | null {
  const match = /^COASTLINE:([^:]+):/.exec(payload.trim());
  return match ? match[1] : null;
}

function message(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Could not reach Coastline. Check the connection and try again.';
}

interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>>;
}

export function TicketScanner() {
  const toast = useToast();
  const [reference, setReference] = useState('');
  const [found, setFound] = useState<Found | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setCameraSupported(
      'BarcodeDetector' in window && Boolean(navigator.mediaDevices?.getUserMedia),
    );
  }, []);

  async function lookupReservation(ref: string): Promise<AdminReservationDto | null> {
    const digits = REF.exec(ref)?.[2];
    if (!digits) return null;
    const date = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
    const list = await clientApi<AdminReservationDto[]>(`/admin/dining/reservations?date=${date}`);
    return list.find((item) => item.publicRef === ref) ?? null;
  }

  async function find(input: string) {
    const trimmed = input.trim();
    if (!trimmed) return;
    setPending(true);
    setError(null);
    setFound(null);
    try {
      const payloadRef = refFromPayload(trimmed);
      const ref = (payloadRef ?? trimmed).toUpperCase();
      if (ref.startsWith('BK-') || ref.startsWith('HTL-')) {
        if (payloadRef) {
          // The API verifies the ticket signature; an edited QR is refused.
          const order = await clientApi<AdminOrderDto>('/admin/tickets/validate', {
            method: 'POST',
            body: JSON.stringify({ payload: trimmed }),
          });
          setFound({ kind: 'order', order });
        } else {
          const list = await clientApi<AdminOrderListDto>(
            `/admin/orders?ref=${encodeURIComponent(ref)}`,
          );
          const order = list.orders.find((item) => item.publicRef === ref);
          if (!order) throw new Error(`No booking ${ref}.`);
          setFound({ kind: 'order', order });
        }
      } else if (ref.startsWith('RS-')) {
        const reservation = await lookupReservation(ref);
        if (!reservation) throw new Error(`No table reservation ${ref}.`);
        setFound({ kind: 'reservation', reservation });
      } else if (ref.startsWith('FO-')) {
        throw new Error('Food orders are handled in the provider kitchen, not at the desk.');
      } else {
        throw new Error('References look like BK-20261117-AB12 or RS-20261117-AB12.');
      }
    } catch (caught) {
      setError(
        caught instanceof Error && !(caught instanceof ApiError) ? caught.message : message(caught),
      );
    } finally {
      setPending(false);
    }
  }

  async function checkIn() {
    if (!found) return;
    setChecking(true);
    setError(null);
    try {
      if (found.kind === 'order') {
        const order = await clientApi<AdminOrderDto>(
          `/admin/orders/${encodeURIComponent(found.order.publicRef)}/check-in`,
          { method: 'POST', body: '{}' },
        );
        setFound({ kind: 'order', order });
        toast.push(`${order.publicRef} checked in.`, 'success');
      } else {
        const reservation = await clientApi<AdminReservationDto>(
          `/admin/dining/reservations/${encodeURIComponent(found.reservation.publicRef)}/check-in`,
          { method: 'POST', body: '{}' },
        );
        setFound({ kind: 'reservation', reservation });
        toast.push(`${reservation.publicRef} checked in.`, 'success');
      }
    } catch (caught) {
      setError(message(caught));
    } finally {
      setChecking(false);
    }
  }

  // Camera scanning where the browser has a barcode detector.
  useEffect(() => {
    if (!cameraOn) return;
    let stream: MediaStream | null = null;
    let stopped = false;
    let timer = 0;
    const Detector = (
      window as unknown as {
        BarcodeDetector: new (options: { formats: string[] }) => BarcodeDetectorLike;
      }
    ).BarcodeDetector;
    const detector = new Detector({ formats: ['qr_code'] });
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(async (media) => {
        stream = media;
        if (!videoRef.current || stopped) return;
        videoRef.current.srcObject = media;
        await videoRef.current.play();
        const tick = async () => {
          if (stopped || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes[0]?.rawValue) {
              setCameraOn(false);
              void find(codes[0].rawValue);
              return;
            }
          } catch {
            // Keep scanning; a frame can fail while the camera warms up.
          }
          timer = window.setTimeout(tick, 300);
        };
        void tick();
      })
      .catch(() => {
        setError('The camera could not start. Allow camera access or type the reference instead.');
        setCameraOn(false);
      });
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOn]);

  const result = found
    ? found.kind === 'order'
      ? (() => {
          const trip = orderToTrip(found.order);
          const reserved =
            found.order.items.filter((item) => item.status === 'RESERVED').length +
            (found.order.hotelBookings ?? []).filter((item) => item.status === 'RESERVED').length;
          return {
            title: trip.title,
            ref: found.order.publicRef,
            status:
              found.order.status === 'CANCELLED'
                ? { tone: 'danger' as const, label: 'Cancelled' }
                : reserved === 0
                  ? { tone: 'success' as const, label: 'Checked in' }
                  : { tone: 'info' as const, label: 'Ready to check in' },
            canCheckIn: found.order.status === 'CONFIRMED' && reserved > 0,
            rows: [
              { label: 'Guest', value: found.order.tourist.name },
              { label: 'What', value: trip.subtitle },
              { label: 'When', value: `${formatDateKey(trip.dateKey)} · ${trip.timeLabel}` },
            ],
          };
        })()
      : {
          title: found.reservation.venue.name,
          ref: found.reservation.publicRef,
          status: {
            tone: reservationStatusTone(found.reservation.status),
            label: RESERVATION_STATUS_LABELS[found.reservation.status],
          },
          canCheckIn: found.reservation.status === 'CONFIRMED',
          rows: [
            { label: 'Guest', value: found.reservation.tourist.name },
            {
              label: 'Table',
              value: `${found.reservation.table.code} · ${found.reservation.partySize} guests`,
            },
            {
              label: 'When',
              value: `${formatDateTime(found.reservation.startAt)} · ${formatTimeRange(found.reservation.startAt, found.reservation.endAt)}`,
            },
          ],
        }
    : null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <Card className="overflow-hidden">
          {cameraOn ? (
            <video
              ref={videoRef}
              muted
              playsInline
              className="aspect-square w-full bg-fg object-cover"
              aria-label="Camera view"
            />
          ) : (
            <div className="grid aspect-[4/3] place-items-center bg-surface-alt p-6 text-center">
              <div>
                <Camera aria-hidden className="mx-auto size-12 text-muted" />
                <p className="mt-2 text-body-sm text-muted">
                  {cameraSupported
                    ? 'Point the camera at the guest’s ticket QR.'
                    : 'Camera scanning is not supported in this browser. Type the reference below.'}
                </p>
              </div>
            </div>
          )}
          {cameraSupported ? (
            <div className="p-3">
              <Button
                block
                size="lg"
                variant={cameraOn ? 'secondary' : 'primary'}
                onClick={() => setCameraOn((on) => !on)}
              >
                {cameraOn ? (
                  <CameraOff aria-hidden className="size-5" />
                ) : (
                  <Camera aria-hidden className="size-5" />
                )}
                {cameraOn ? 'Stop camera' : 'Scan ticket'}
              </Button>
            </div>
          ) : null}
        </Card>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void find(reference);
          }}
          className="flex items-end gap-2"
        >
          <Field label="Reference or ticket text" htmlFor="desk-ref" className="flex-1">
            <Input
              id="desk-ref"
              value={reference}
              autoCapitalize="characters"
              autoComplete="off"
              placeholder="BK-20261117-AB12"
              className="font-mono"
              onChange={(event) => setReference(event.target.value)}
            />
          </Field>
          <Button type="submit" size="md" loading={pending} aria-label="Find booking">
            <Search aria-hidden className="size-5" /> Find
          </Button>
        </form>
      </div>

      <div aria-live="polite">
        {error ? (
          <Notice tone="danger" title="Not found">
            {error}
          </Notice>
        ) : null}
        {result ? (
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-title">{result.title}</p>
                <p className="font-mono text-body-sm text-muted">{result.ref}</p>
              </div>
              <StatusBadge tone={result.status.tone} label={result.status.label} />
            </div>
            <DetailRows className="mt-3" rows={result.rows} />
            {result.canCheckIn ? (
              <Button
                size="lg"
                block
                className="mt-4"
                loading={checking}
                onClick={() => void checkIn()}
              >
                <LogIn aria-hidden className="size-5" /> Check in
              </Button>
            ) : null}
          </Card>
        ) : !error ? (
          <Card className="p-5 text-body-sm text-muted">
            Scan a ticket or type a reference to see the booking here.
          </Card>
        ) : null}
      </div>
    </div>
  );
}
