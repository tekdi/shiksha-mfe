/** First readable message of an API error. */
export const apiErrorMessage = (err: any): string =>
  err?.response?.data?.params?.errmsg || err?.message || '';

/**
 * Runs `task` for every item with at most `limit` running at once. `task` should handle its own
 * failures: a rejection stops the worker that hit it.
 */
export const runWithConcurrency = async <T>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<void>
): Promise<void> => {
  const queue = [...items];
  const next = (): Promise<void> => {
    const item = queue.shift();
    return item === undefined ? Promise.resolve() : task(item).then(next);
  };
  await Promise.all(Array.from({ length: limit }, next));
};
