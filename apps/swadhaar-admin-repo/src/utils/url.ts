/** Removes trailing `/` characters (a linear scan; `replace(/\/+$/, '')` backtracks on long runs of slashes). */
export const trimTrailingSlashes = (value: string): string => {
  let end = value.length;
  while (end > 0 && value[end - 1] === '/') end -= 1;
  return value.slice(0, end);
};
