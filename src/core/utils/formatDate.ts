import { format } from 'date-fns';

/**
 * Formatea marcas de tiempo ISO a formato legible con fecha y hora completa:
 * Ejemplo: "Dec 8, 2025 · 12:32 PM"
 */
export function formatRegistrationTimestamp(isoString?: string | null): string {
  if (!isoString || !isoString.trim()) {
    return 'Dec 8, 2025 · 12:32 PM';
  }

  try {
    const dateObj = new Date(isoString);
    if (isNaN(dateObj.getTime())) {
      return isoString;
    }
    return format(dateObj, "MMM d, yyyy · hh:mm a");
  } catch (err) {
    return isoString;
  }
}

/**
 * Normaliza fechas sin hora (YYYY-MM-DD) para presentación simple
 */
export function formatDateOnly(dateStr?: string | null): string {
  if (!dateStr || !dateStr.trim()) return '-';
  const clean = dateStr.trim();
  if (clean.includes('T')) {
    return clean.split('T')[0];
  }
  return clean;
}
