import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { MasterPage } from '@/services/MastersService';
import { apiErrorMessage } from '@/utils/concurrency';
import { ListQuery } from '@/utils/masters';

export const DEFAULT_ROWS_PER_PAGE = 10;
const SEARCH_DELAY_MS = 300;

type Filters = Omit<ListQuery, 'page' | 'rowsPerPage'>;

/**
 * Server-paged list for the masters pages. Reloads when the filters or page change, and
 * ignores a response that arrives after a newer request was sent.
 */
export const useMasterList = <T, F extends Filters>(
  load: (query: ListQuery) => Promise<MasterPage<T>>,
  filters: F
) => {
  const { t } = useTranslation();
  const [rows, setRows] = useState<T[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const latest = useRef(0);

  const reload = useCallback(async () => {
    const request = ++latest.current;
    setLoading(true);
    setError(null);
    try {
      const result = await load({ ...filters, page, rowsPerPage });
      if (request !== latest.current) return;
      setRows(result?.items ?? []);
      setTotalCount(result?.totalCount ?? 0);
    } catch (err) {
      if (request !== latest.current) return;
      setRows([]);
      setTotalCount(0);
      setError(apiErrorMessage(err) || t('ADMINISTRATION.ERRORS.LOAD_FAILED'));
    } finally {
      if (request === latest.current) setLoading(false);
    }
  }, [load, filters, page, rowsPerPage, t]);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    rows,
    totalCount,
    loading,
    error,
    reload,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage: (size: number) => {
      setRowsPerPage(size);
      setPage(0);
    },
  };
};

/** Search text that waits until the admin stops typing before it changes. */
export const useDebounced = (value: string, delay = SEARCH_DELAY_MS): string => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};
