import type { StampFormat } from '../types/photobooth';

export function getFormattedDate(format?: StampFormat | 'MM.DD.YYYY'): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  if (format === 'MM.DD.YYYY') return `${month}.${day}.${year}`;
  if (format === 'DD.MM.YYYY') return `${day}.${month}.${year}`;
  return `${year}.${month}.${day}`;
}
