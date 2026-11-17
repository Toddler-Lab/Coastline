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

export function daysBetween(fromKey: string, toKey: string): number {
  return Math.round(
    (Date.parse(`${toKey}T00:00:00.000Z`) - Date.parse(`${fromKey}T00:00:00.000Z`)) / 86_400_000,
  );
}

export function isDateKey(value: string | undefined | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** "Sat 23 Nov" */
export function formatDateKey(dateKey: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${dateKey}T00:00:00.000Z`));
}

/** "Saturday 23 November" */
export function formatLongDateKey(dateKey: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${dateKey}T00:00:00.000Z`));
}

/** "Today", "Tomorrow" or "Sat 23 Nov", relative to a Dhaka date key. */
export function relativeDateLabel(dateKey: string, today: string = dhakaDateKey()): string {
  if (dateKey === today) return 'Today';
  if (dateKey === addDays(today, 1)) return 'Tomorrow';
  if (dateKey === addDays(today, -1)) return 'Yesterday';
  return formatDateKey(dateKey);
}

/** 12-hour clock label for a Dhaka wall-clock hour: 0 -> "12 am", 14 -> "2 pm", 24 -> "12 am". */
export function hourLabel(hour: number, minute = 0): string {
  const h = ((hour % 24) + 24) % 24;
  const suffix = h < 12 ? 'am' : 'pm';
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return minute ? `${twelve}:${String(minute).padStart(2, '0')} ${suffix}` : `${twelve} ${suffix}`;
}

/** API slot labels are 24-hour "HH:mm"; show them on the 12-hour clock. */
export function slotLabel(label: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(label);
  return match ? hourLabel(Number(match[1]), Number(match[2])) : label;
}

export function hoursRange(openHour: number, closeHour: number): string {
  if (openHour === 0 && closeHour === 24) return 'Open 24 hours';
  return `${hourLabel(openHour)}–${hourLabel(closeHour)}`;
}

/** Dhaka wall-clock time of an instant, 12-hour. */
export function formatIsoTime(iso: string): string {
  const d = toDhaka(new Date(iso));
  return hourLabel(d.getUTCHours(), d.getUTCMinutes());
}

export function formatIsoDate(iso: string): string {
  return formatDateKey(dhakaDateKey(new Date(iso)));
}

export function formatDateTime(iso: string): string {
  return `${formatIsoDate(iso)}, ${formatIsoTime(iso)}`;
}

export function formatTimeRange(startIso: string, endIso: string): string {
  return `${formatIsoTime(startIso)}–${formatIsoTime(endIso)}`;
}

/** "Tk 1,250" from integer minor units (paisa). */
export function formatMoney(minor: number, currency = 'BDT'): string {
  const major = minor / 100;
  const digits = Number.isInteger(major) ? 0 : 2;
  const amount = major.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return currency === 'BDT' ? `Tk ${amount}` : `${currency} ${amount}`;
}

export function formatCount(value: number, singular: string, plural = `${singular}s`): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
