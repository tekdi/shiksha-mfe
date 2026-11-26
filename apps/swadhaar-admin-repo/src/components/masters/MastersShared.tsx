import React, { useState } from 'react';
import { Box, Button, Chip, Grid, IconButton, Menu, MenuItem, TextField, Typography } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import SearchIcon from '@mui/icons-material/Search';
import { useTranslation } from 'next-i18next';
import CommonSelect from '@/components/common/CommonSelect';
import CommonDialog from '@/components/common/CommonDialog';
import { LocationOption } from '@/services/MastersService';
import { StatusFilter } from '@/utils/masters';

/** Shared parts of the Org Management and Branch Management pages. */

export const MasterStatusChip: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const { t } = useTranslation();
  return (
    <Chip
      size="small"
      label={t(isActive ? 'COMMON.ACTIVE' : 'COMMON.INACTIVE')}
      sx={{
        height: 22,
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: isActive ? '#E7F6EC' : '#F1F1F3',
        color: isActive ? '#1B7F3B' : '#52525B',
      }}
    />
  );
};

interface LocationFilters {
  states: LocationOption[];
  districts: LocationOption[];
  stateValue: string;
  districtValue: string;
  onStateChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
}

export interface MastersFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  status: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  onClear: () => void;
  /** Branch Management also filters by state and district */
  location?: LocationFilters;
}

const ALL = 'all';
const filterLabelSx = { fontWeight: 600, color: '#374151', mb: 0.6, display: 'block' };

export const MastersFilterBar: React.FC<MastersFilterBarProps> = ({
  search,
  onSearchChange,
  searchPlaceholder,
  status,
  onStatusChange,
  onClear,
  location,
}) => {
  const { t } = useTranslation();
  const toOptions = (items: LocationOption[], allLabel: string) => [
    { value: ALL, label: allLabel },
    ...items.map((item) => ({ value: item.value, label: item.name })),
  ];

  return (
    <Box sx={{ mb: 2, p: 2, backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
      <Grid container spacing={2} alignItems="flex-end">
        <Grid item xs={12} md={location ? 3.5 : 6}>
          <Typography variant="caption" sx={filterLabelSx}>
            {t('FILTERS.SEARCH')}
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={search}
            placeholder={searchPlaceholder}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} /> }}
            sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px', backgroundColor: '#FFFFFF' } }}
          />
        </Grid>

        {location && (
          <>
            <Grid item xs={12} sm={6} md={2.75} data-testid="masters-state-filter">
              <Typography variant="caption" sx={filterLabelSx}>
                {t('FILTERS.STATE')}
              </Typography>
              <CommonSelect
                value={location.stateValue || ALL}
                onChange={(value) => location.onStateChange(value === ALL ? '' : value)}
                options={toOptions(location.states, t('FILTERS.ALL_STATES'))}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.75} data-testid="masters-district-filter">
              <Typography variant="caption" sx={filterLabelSx}>
                {t('FILTERS.DISTRICT')}
              </Typography>
              <CommonSelect
                value={location.districtValue || ALL}
                onChange={(value) => location.onDistrictChange(value === ALL ? '' : value)}
                options={toOptions(location.districts, t('FILTERS.ALL_DISTRICTS'))}
                disabled={!location.stateValue}
              />
            </Grid>
          </>
        )}

        <Grid item xs={8} sm={4} md={location ? 2 : 3} data-testid="masters-status-filter">
          <Typography variant="caption" sx={filterLabelSx}>
            {t('FILTERS.STATUS')}
          </Typography>
          <CommonSelect
            value={status}
            onChange={(value) => onStatusChange(value as StatusFilter)}
            options={[
              { value: ALL, label: t('FILTERS.ALL_STATUSES') },
              { value: 'active', label: t('COMMON.ACTIVE') },
              { value: 'inactive', label: t('COMMON.INACTIVE') },
            ]}
          />
        </Grid>

        <Grid item xs={4} sm={2} md={1} sx={{ display: 'flex', alignItems: 'center', pb: 0.8 }}>
          <Button
            onClick={onClear}
            sx={{
              textTransform: 'none',
              color: '#1F2937',
              fontWeight: 600,
              fontSize: '13px',
              p: 0,
              minWidth: 'auto',
              '&:hover': { background: 'none', textDecoration: 'underline' },
            }}
          >
            {t('FILTERS.CLEAR')}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

const MENU_ITEM_SX = { fontSize: '13px', py: 0.8, color: '#1F2937', fontWeight: 500 };

export interface MasterRowActionsProps {
  isActive: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
}

/** "..." menu on each row: Edit, then Deactivate or Reactivate. */
export const MasterRowActions: React.FC<MasterRowActionsProps> = ({ isActive, onEdit, onToggleActive }) => {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const run = (action: () => void) => () => {
    setAnchor(null);
    action();
  };

  return (
    <>
      <IconButton size="small" aria-label={t('COMMON.ACTIONS')} onClick={(e) => setAnchor(e.currentTarget)}>
        <MoreHorizIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        PaperProps={{ sx: { width: 160, borderRadius: '8px', border: '1px solid #E5E7EB' } }}
      >
        <MenuItem onClick={run(onEdit)} sx={MENU_ITEM_SX}>
          {t('COMMON.EDIT')}
        </MenuItem>
        <MenuItem onClick={run(onToggleActive)} sx={MENU_ITEM_SX}>
          {t(isActive ? 'ADMINISTRATION.ACTIONS.DEACTIVATE' : 'ADMINISTRATION.ACTIONS.REACTIVATE')}
        </MenuItem>
      </Menu>
    </>
  );
};

export interface StatusChangeDialogProps {
  open: boolean;
  /** i18n group: ADMINISTRATION.ORG or ADMINISTRATION.BRANCH */
  group: 'ORG' | 'BRANCH';
  /** true when the record is active now, so the dialog deactivates it */
  deactivate: boolean;
  name: string;
  userCount: number;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Confirms a deactivate or reactivate, saying how many users hold the record. */
export const StatusChangeDialog: React.FC<StatusChangeDialogProps> = ({
  open,
  group,
  deactivate,
  name,
  userCount,
  loading,
  onConfirm,
  onClose,
}) => {
  const { t } = useTranslation();
  const verb = deactivate ? 'DEACTIVATE' : 'REACTIVATE';
  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={t(`ADMINISTRATION.${group}.${verb}_TITLE`, { name })}
      onConfirm={onConfirm}
      confirmLabel={t(`ADMINISTRATION.ACTIONS.${verb}`)}
      confirmVariant={deactivate ? 'danger' : 'primary'}
      loading={loading}
    >
      <Typography sx={{ fontSize: '14px', lineHeight: 1.5 }}>
        {t(`ADMINISTRATION.${group}.${verb}_BODY`, { count: userCount })}
      </Typography>
    </CommonDialog>
  );
};
