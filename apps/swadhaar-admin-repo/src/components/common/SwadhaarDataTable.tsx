import React, { useState, useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Checkbox,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  Skeleton,
  TableSortLabel,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export interface ColumnDef<T> {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface SwadhaarDataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  hideSearch?: boolean;
  hideToolbar?: boolean;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  actionsToolbar?: React.ReactNode;
  emptyMessage?: string;
  error?: string | null;
  onRetry?: () => void;
  // Pagination
  page?: number;
  rowsPerPage?: number;
  totalCount?: number;
  onPageChange?: (newPage: number) => void;
  onRowsPerPageChange?: (newRowsPerPage: number) => void;
}

const filterRows = <T extends Record<string, any>>(rows: T[], searchValue: string): T[] => {
  if (!searchValue.trim()) return [...rows];
  const q = searchValue.toLowerCase();
  return rows.filter((row) =>
    Object.values(row).some(
      (val) => (typeof val === 'string' || typeof val === 'number') && String(val).toLowerCase().includes(q)
    )
  );
};

const compareRows = <T extends Record<string, any>>(
  a: T,
  b: T,
  sortField: string,
  sortOrder: 'asc' | 'desc'
): number => {
  const valA = a[sortField];
  const valB = b[sortField];
  if (valA === valB) return 0;
  if (valA == null) return 1;
  if (valB == null) return -1;
  const direction = sortOrder === 'asc' ? 1 : -1;
  return valA < valB ? -direction : direction;
};

interface DataTableBodyProps<T> {
  loading: boolean;
  error: React.ReactNode;
  onRetry?: () => void;
  emptyMessage: string;
  columns: ColumnDef<T>[];
  selectable: boolean;
  displayData: T[];
  selectedIds: string[];
  keyExtractor: (row: T) => string;
  onSelectRow: (rowId: string, checked: boolean) => void;
}

function DataTableBody<T extends Record<string, any>>({
  loading,
  error,
  onRetry,
  emptyMessage,
  columns,
  selectable,
  displayData,
  selectedIds,
  keyExtractor,
  onSelectRow,
}: Readonly<DataTableBodyProps<T>>) {
  const colSpan = columns.length + (selectable ? 1 : 0);

  if (loading) {
    return (
      <>
        {SKELETON_ROW_KEYS.map((skeletonKey) => (
          <TableRow key={skeletonKey}>
            {selectable && (
              <TableCell padding="checkbox">
                <Skeleton variant="rectangular" width={20} height={20} />
              </TableCell>
            )}
            {columns.map((col) => (
              <TableCell key={col.id}>
                <Skeleton width="80%" height={24} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </>
    );
  }

  if (error) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} align="center" sx={{ py: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
            <ErrorOutlineIcon sx={{ fontSize: 44, color: '#DC2626' }} />
            <Typography variant="body1" sx={{ color: '#1F2937', fontWeight: 600 }}>
              {error}
            </Typography>
            {onRetry && (
              <Button
                variant="outlined"
                size="small"
                onClick={onRetry}
                sx={{
                  borderColor: '#E6873C',
                  color: '#E6873C',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '6px',
                  mt: 0.5,
                  '&:hover': { borderColor: '#C66C23', backgroundColor: '#FDF3E9' },
                }}
              >
                Retry
              </Button>
            )}
          </Box>
        </TableCell>
      </TableRow>
    );
  }

  if (displayData.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} align="center" sx={{ py: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <InboxOutlinedIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              {emptyMessage}
            </Typography>
          </Box>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {displayData.map((row, index) => {
        const rowKey = keyExtractor(row);
        const isSelected = selectedIds.includes(rowKey);
        return (
          <TableRow
            hover
            key={rowKey}
            selected={isSelected}
            sx={{
              '&:hover': { backgroundColor: 'primary.100' },
              '&.Mui-selected': { backgroundColor: 'primary.100 !important' },
            }}
          >
            {selectable && (
              <TableCell padding="checkbox">
                <Checkbox color="primary" checked={isSelected} onChange={(e) => onSelectRow(rowKey, e.target.checked)} />
              </TableCell>
            )}
            {columns.map((column) => (
              <TableCell key={column.id} align={column.align || 'left'}>
                {column.render ? column.render(row, index) : row[column.id] ?? '—'}
              </TableCell>
            ))}
          </TableRow>
        );
      })}
    </>
  );
}

const SKELETON_ROW_KEYS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5', 'sk-6'];

export function SwadhaarDataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  loading = false,
  searchPlaceholder = 'Search records...',
  searchQuery,
  onSearchChange,
  hideSearch = false,
  hideToolbar = false,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  actionsToolbar,
  emptyMessage = 'No records found',
  error = null,
  onRetry,
  page: controlledPage,
  rowsPerPage: controlledRowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
}: Readonly<SwadhaarDataTableProps<T>>) {
  // Local state if uncontrolled
  const [localSearch, setLocalSearch] = useState('');
  const [localPage, setLocalPage] = useState(0);
  const [localRowsPerPage, setLocalRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const searchValue = searchQuery ?? localSearch;
  const isServerPaged = controlledPage !== undefined && onPageChange !== undefined;
  const currentPage = isServerPaged ? controlledPage : localPage;
  const currentRowsPerPage = controlledRowsPerPage ?? localRowsPerPage;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setLocalSearch(val);
      setLocalPage(0);
    }
  };

  const handleClearSearch = () => {
    if (onSearchChange) {
      onSearchChange('');
    } else {
      setLocalSearch('');
      setLocalPage(0);
    }
  };

  const handleSort = (columnId: string) => {
    if (sortField === columnId) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(columnId);
      setSortOrder('asc');
    }
  };

  // Client-side filtering & sorting if not server-paged
  const filteredData = useMemo(() => {
    if (isServerPaged) return data;

    let result = filterRows(data, searchValue);
    if (sortField) {
      result = [...result].sort((a, b) => compareRows(a, b, sortField, sortOrder));
    }

    return result;
  }, [data, searchValue, sortField, sortOrder, isServerPaged]);

  // Client-side slice
  const displayData = useMemo(() => {
    if (isServerPaged) return data;
    const start = currentPage * currentRowsPerPage;
    return filteredData.slice(start, start + currentRowsPerPage);
  }, [filteredData, data, currentPage, currentRowsPerPage, isServerPaged]);

  const effectiveTotal = isServerPaged
    ? totalCount || 0
    : filteredData.length;

  // Selection logic
  const isAllSelected =
    displayData.length > 0 &&
    displayData.every((row) => selectedIds.includes(keyExtractor(row)));
  const isSomeSelected =
    displayData.some((row) => selectedIds.includes(keyExtractor(row))) && !isAllSelected;

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      const currentPageIds = displayData.map(keyExtractor);
      const newSelection = Array.from(new Set([...selectedIds, ...currentPageIds]));
      onSelectionChange(newSelection);
    } else {
      const currentPageIds = new Set(displayData.map(keyExtractor));
      onSelectionChange(selectedIds.filter((id) => !currentPageIds.has(id)));
    }
  };

  const handleSelectRow = (rowId: string, checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange([...selectedIds, rowId]);
    } else {
      onSelectionChange(selectedIds.filter((id) => id !== rowId));
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '12px',
        backgroundColor: 'background.paper',
      }}
    >
      {/* Table Toolbar */}
      {!hideToolbar && (!hideSearch || actionsToolbar) && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          {!hideSearch && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 260, maxWidth: 420 }}>
              <TextField
                fullWidth
                size="small"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchValue ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleClearSearch}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
              {selectable && selectedIds.length > 0 && (
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {selectedIds.length} selected
                </Typography>
              )}
            </Box>
          )}

          {actionsToolbar && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: hideSearch ? 0 : 'auto' }}>
              {actionsToolbar}
            </Box>
          )}
        </Box>
      )}

      {/* Table Container */}
      <TableContainer sx={{ maxHeight: 650 }}>
        <Table stickyHeader aria-label="data table">
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox" sx={{ width: 48, backgroundColor: 'secondary.100' }}>
                  <Checkbox
                    color="primary"
                    indeterminate={isSomeSelected}
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    disabled={loading || displayData.length === 0}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sx={{
                    minWidth: column.minWidth,
                    fontWeight: 700,
                    fontSize: '12px',
                    letterSpacing: '0.5px',
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    backgroundColor: 'secondary.100',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={sortField === column.id}
                      direction={sortField === column.id ? sortOrder : 'asc'}
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            <DataTableBody
              loading={loading}
              error={error}
              onRetry={onRetry}
              emptyMessage={emptyMessage}
              columns={columns}
              selectable={selectable}
              displayData={displayData}
              selectedIds={selectedIds}
              keyExtractor={keyExtractor}
              onSelectRow={handleSelectRow}
            />
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={effectiveTotal}
        rowsPerPage={currentRowsPerPage}
        page={currentPage}
        onPageChange={(_, newPage) => {
          if (isServerPaged) {
            onPageChange!(newPage);
          } else {
            setLocalPage(newPage);
          }
        }}
        onRowsPerPageChange={(e) => {
          const newSize = Number.parseInt(e.target.value, 10);
          if (isServerPaged) {
            onRowsPerPageChange!(newSize);
          } else {
            setLocalRowsPerPage(newSize);
            setLocalPage(0);
          }
        }}
        sx={{ borderTop: '1px solid', borderColor: 'divider' }}
      />
    </Paper>
  );
}

export default SwadhaarDataTable;
