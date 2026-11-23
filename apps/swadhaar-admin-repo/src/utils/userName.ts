/**
 * A user entered with one word gets that word as both first and last name (the user service needs a last
 * name), so a last name equal to the first name, with no middle name, is not shown twice.
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
