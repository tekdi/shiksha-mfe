import React, { useEffect, useMemo, useState } from 'react';
import { Box, Chip, InputAdornment, TextField, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SwadhaarDataTable, { ColumnDef } from '@/components/common/SwadhaarDataTable';
import { BankQuestion, fetchQuestionBank } from '@/services/ContentLibraryService';
import { NEUTRAL } from '@/styles/customTheme';

const TYPE_LABELS: Record<string, string> = {
  mcq: 'MCQ single',
  multiple_answer: 'MCQ multi',
  true_false: 'True / False',
  ftb: 'Short answer',
  fill_blank: 'Short answer',
};

const stripHtml = (text: string): string => text.replace(/<[^>]+>/g, '').trim();

/** Every published question across all assessments, with search and paging. */
export default function QuestionBankTable() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rows, setRows] = useState<BankQuestion[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { questions, count } = await fetchQuestionBank({
        search: debouncedSearch,
        limit: rowsPerPage,
        offset: page * rowsPerPage,
      });
      setRows(questions);
      setTotal(count);
    } catch (err) {
      console.error('Failed to load question bank:', err);
      setError('Failed to load the question bank.');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, rowsPerPage]);

  useEffect(() => {
    load();
  }, [load]);

  const columns: ColumnDef<BankQuestion>[] = useMemo(
    () => [
      {
        id: 'text',
        label: 'Question',
        minWidth: 360,
        render: (row) => (
          <Typography sx={{ fontWeight: 600, fontSize: '14px', color: 'text.primary' }}>
            {stripHtml(row.text)}
          </Typography>
        ),
      },
      {
        id: 'type',
        label: 'Type',
        minWidth: 120,
        render: (row) => (
          <Chip label={TYPE_LABELS[row.type] || row.type} size="small" sx={{ height: 22, fontSize: '11px', backgroundColor: '#EEEDE9' }} />
        ),
      },
      {
        id: 'level',
        label: 'Level',
        minWidth: 90,
        render: (row) => (
          <Typography sx={{ fontSize: '13px', textTransform: 'capitalize' }}>{row.level || '—'}</Typography>
        ),
      },
      {
        id: 'marks',
        label: 'Marks',
        minWidth: 70,
        render: (row) => <Typography sx={{ fontSize: '13px' }}>{row.marks ?? '—'}</Typography>,
      },
      {
        id: 'tags',
        label: 'Topic / tags',
        minWidth: 220,
        render: (row) => (
          <Typography sx={{ fontSize: '13px', color: NEUTRAL.muted }}>{row.description || '—'}</Typography>
        ),
      },
    ],
    []
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <TextField
          size="small"
          placeholder="Search questions by keyword..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: NEUTRAL.subtle, fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
          sx={{ width: 320, backgroundColor: 'background.paper' }}
        />
        <Typography variant="body2" sx={{ color: NEUTRAL.muted, fontSize: '13px' }}>
          Showing {rows.length} of {total} questions
        </Typography>
      </Box>
      <SwadhaarDataTable<BankQuestion>
        columns={columns}
        data={rows}
        keyExtractor={(item) => item.questionId}
        loading={loading}
        error={error}
        onRetry={load}
        hideToolbar={true}
        emptyMessage="No questions in the question bank yet."
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={total}
        onPageChange={setPage}
        onRowsPerPageChange={(size) => {
          setRowsPerPage(size);
          setPage(0);
        }}
      />
    </Box>
  );
}
