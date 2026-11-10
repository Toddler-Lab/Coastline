/** Dhaka is UTC+6 all year. Shared by server and client so hydration matches. */
export const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

export function toDhaka(date: Date): Date {
  return new Date(date.getTime() + DHAKA_OFFSET_MS);
}

export function dhakaDateKey(date: Date = new Date()): string {
  return toDhaka(date).toISOString().slice(0, 10);
}

export function addDays(dateKey: string, days: number): string {
  const base = new Date(`${dateKey}T00:00:00.000Z`);
  return new Date(base.getTime() + days * 86_400_000).toISOString().slice(0, 10);
}

export function formatDateKey(dateKey: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${dateKey}T00:00:00.000Z`));
}

export function formatLongDateKey(dateKey: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${dateKey}T00:00:00.000Z`));
}

export function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

export function formatIsoTime(iso: string): string {
  const date = new Date(iso);
  return hourLabel(toDhaka(date).getUTCHours());
}

export function formatIsoDate(iso: string): string {
  return formatDateKey(dhakaDateKey(new Date(iso)));
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return `${formatIsoDate(iso)} · ${formatIsoTime(iso)}`;
}

export function formatMoney(minor: number): string {
  const taka = minor / 100;
  return `৳${taka.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function formatCount(value: number, singular: string, plural = `${singular}s`): string {
  return `${value} ${value === 1 ? singular : plural}`;
}
