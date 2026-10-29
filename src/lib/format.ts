/**
 * Money is handled in integer cents everywhere to avoid floating point drift;
 * format only at the edge of the UI.
 */
import type { DateCopy } from '@/i18n';

export function formatPrice(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(Math.round(cents));
  const whole = Math.floor(abs / 100).toString();
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const fraction = (abs % 100).toString().padStart(2, '0');
  return `${sign}$${grouped}.${fraction}`;
}

export function discountPercent(priceCents: number, compareAtCents?: number): number | null {
  if (!compareAtCents || compareAtCents <= priceCents) return null;
  return Math.round(((compareAtCents - priceCents) / compareAtCents) * 100);
}

/**
 * `dates` is the active dictionary's date slice, so month names and the order of
 * day/month/year come from the language rather than a hard-coded English table.
 */
export function formatDate(iso: string, dates: DateCopy): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
  return dates.formatDate(
    date.getUTCDate(),
    dates.months[date.getUTCMonth()] ?? '',
    date.getUTCFullYear()
  );
}

/** Day/month/year triple for a date `daysFromToday` from now, in UTC. */
export function offsetDate(daysFromToday: number): { day: number; monthIndex: number; year: number } {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromToday);
  return { day: date.getUTCDate(), monthIndex: date.getUTCMonth(), year: date.getUTCFullYear() };
}

/**
 * `HH:MM` on the device clock. Deliberately not locale- or language-specific:
 * the 24-hour form needs no AM/PM word, so chat timestamps stay correct in both
 * dictionaries without a translation key.
 */
export function formatClock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/** Local calendar day as `YYYY-MM-DD`, used to group chat messages by date. */
export function dayKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
