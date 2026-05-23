import persianDate from 'persian-date';

export function formatPrice(value: unknown): string {
  if (value == null || value === '') return '';
  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) return String(value);
  return num.toLocaleString('en-US');
}

export function parsePrice(value: string): number {
  return Number(value.replace(/,/g, ''));
}

export function formatPersianDate(iso: unknown): string {
  if (!iso) return '—';
  try {
    return new persianDate(new Date(String(iso))).format('YYYY-MM-DD');
  } catch { return String(iso); }
}
