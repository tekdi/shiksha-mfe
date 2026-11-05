/** Longest minutes value accepted by the duration, reading time and time limit fields (3 digits) */
export const MINUTES_MAX_DIGITS = 3;

export const MINUTES_ERROR = 'Enter whole minutes from 1 to 999 (up to 3 digits).';

/** For fields that take a plain number of minutes: keeps digits only, at most 3 */
export const sanitizeMinutes = (value: string): string => value.replace(/\D/g, '').slice(0, MINUTES_MAX_DIGITS);

/** A plain minutes value is empty or 1–999 */
export const isValidMinutes = (value: string): boolean => {
  const v = value.trim();
  return v === '' || (/^\d{1,3}$/.test(v) && Number(v) >= 1);
};

/**
 * Validation for fields that also accept "45 min" (and "1:43" when `allowClock`), as saved lessons are shown.
 * Returns an error message, or '' when the value is fine.
 */
export const minutesFieldError = (value: string, allowClock = false): string => {
  const v = value.trim();
  if (v === '') return '';
  const clock = allowClock && /^\d{1,3}:[0-5]\d$/.test(v);
  const minutes = /^(\d{1,3})(\s*min)?$/i.exec(v);
  if (clock) return '';
  if (minutes && Number(minutes[1]) >= 1) return '';
  return allowClock ? 'Enter minutes (1–999, up to 3 digits) or a time like 1:43.' : MINUTES_ERROR;
};
