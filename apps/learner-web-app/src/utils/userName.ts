/**
 * A user entered with one name gets that name as both first and last name (the user service needs a last name),
 * so a last name equal to the first name, with no middle name, is not shown twice. Same rule as the admin app.
 */
export const displayLastName = (firstName: unknown, middleName: unknown, lastName: unknown): string => {
  const fn = String(firstName ?? '').trim();
  const mn = String(middleName ?? '').trim();
  const ln = String(lastName ?? '').trim();
  return !mn && ln && ln.toLowerCase() === fn.toLowerCase() ? '' : ln;
};

/** First, middle and last name joined, without the repeated last name described above */
export const joinUserName = (firstName: unknown, middleName: unknown, lastName: unknown): string =>
  [String(firstName ?? '').trim(), String(middleName ?? '').trim(), displayLastName(firstName, middleName, lastName)]
    .filter(Boolean)
    .join(' ');

/**
 * Splits a typed full name for saving: the first word is the first name, the rest the last name. A single word is
 * saved as both (the user service needs a last name), and joinUserName shows it once.
 */
export const splitFullName = (fullName: string): { firstName: string; lastName: string } => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || '';
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : firstName;
  return { firstName, lastName };
};
