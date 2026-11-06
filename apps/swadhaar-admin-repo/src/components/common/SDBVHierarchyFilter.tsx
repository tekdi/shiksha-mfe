import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslation } from 'next-i18next';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import MasterDataService, { LocationOption } from '@/services/MasterDataService';

export interface SDBVFilterValues {
  state?: string;
  district?: string;
  block?: string;
  village?: string;
  branch?: string;
  program?: string;
  search?: string;
  status?: string;
  role?: string;
}

export interface OptionItem {
  value: string;
  label: string;
}

export interface SDBVHierarchyFilterProps {
  values: SDBVFilterValues;
  onChange: (filters: SDBVFilterValues) => void;
  showProgram?: boolean;
  showVillage?: boolean;
  showBranch?: boolean;
  showSearch?: boolean;
  searchPlaceholder?: string;
  showStatus?: boolean;
  statusOptions?: (string | OptionItem)[];
  showRole?: boolean;
  /** Role, State, District and Branch row under the search; on by default */
  showLocation?: boolean;
  roleOptions?: (string | OptionItem)[];
  onClear?: () => void;
}

const hasSelection = (value?: string): value is string => Boolean(value) && value !== 'all';

const logLocationError = (err: unknown) => {
  console.error('Failed to load location options:', err);
};

const capitalizeLabel = (opt: string): string => opt.charAt(0).toUpperCase() + opt.slice(1).toLowerCase();

const toOptionItems = (options: (string | OptionItem)[], toLabel: (opt: string) => string): OptionItem[] =>
  options.map((opt) => (typeof opt === 'string' ? { value: opt, label: toLabel(opt) } : opt));

const hasAnyActiveFilter = (values: SDBVFilterValues): boolean => {
  const textFilters = [
    values.state,
    values.district,
    values.block,
    values.branch,
    values.village,
    values.program,
    values.search,
  ];
  return textFilters.some(Boolean) || hasSelection(values.status) || hasSelection(values.role);
};

export const SDBVHierarchyFilter: React.FC<SDBVHierarchyFilterProps> = ({
  values,
  onChange,
  showProgram,
  showVillage = true,
  showBranch,
  showSearch = false,
  searchPlaceholder = 'Name or email',
  showStatus = false,
  statusOptions = [],
  showRole = false,
  showLocation = true,
  roleOptions = [],
  onClear,
}) => {
  const { t } = useTranslation();
  const [states, setStates] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [blocks, setBlocks] = useState<LocationOption[]>([]);
  const [villages, setVillages] = useState<LocationOption[]>([]);
  const programs = MasterDataService.getPrograms();

  useEffect(() => {
    MasterDataService.getStates().then(setStates).catch(logLocationError);
  }, []);

  useEffect(() => {
    if (hasSelection(values.state)) {
      MasterDataService.getDistricts(values.state).then(setDistricts).catch(logLocationError);
    } else {
      setDistricts([]);
      setBlocks([]);
      setVillages([]);
    }
  }, [values.state]);

  useEffect(() => {
    if (hasSelection(values.district)) {
      MasterDataService.getBlocks(values.district).then(setBlocks).catch(logLocationError);
    } else {
      setBlocks([]);
      setVillages([]);
    }
  }, [values.district]);

  useEffect(() => {
    const activeBlock = values.branch || values.block;
    if (showVillage && hasSelection(activeBlock)) {
      MasterDataService.getVillages(activeBlock).then(setVillages).catch(logLocationError);
    } else {
      setVillages([]);
    }
  }, [values.block, values.branch, showVillage]);

  const handleStateChange = (stateVal: string) => {
    onChange({
      ...values,
      state: stateVal,
      district: '',
      block: '',
      branch: '',
      village: '',
    });
  };

  const handleDistrictChange = (districtVal: string) => {
    onChange({
      ...values,
      district: districtVal,
      block: '',
      branch: '',
      village: '',
    });
  };

  const handleBlockChange = (blockVal: string) => {
    onChange({
      ...values,
      block: blockVal,
      branch: blockVal,
      village: '',
    });
  };

  const handleVillageChange = (villageVal: string) => {
    onChange({
      ...values,
      village: villageVal,
    });
  };

  const handleProgramChange = (progVal: string) => {
    onChange({
      ...values,
      program: progVal,
    });
  };

  const handleReset = () => {
    onChange({
      state: '',
      district: '',
      block: '',
      branch: '',
      village: '',
      program: '',
      search: '',
      status: 'all',
      role: 'all',
    });
    if (onClear) onClear();
  };

  const formattedStatuses = toOptionItems(statusOptions, capitalizeLabel);
  const formattedRoles = toOptionItems(roleOptions, (opt) => opt);
  const hasActiveFilters = hasAnyActiveFilter(values);

  // If two-row search layout requested (matching media_1792067589917.png)
  if (showSearch) {
    return (
      <Box
        sx={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          boxShadow: 'none',
          p: 2.5,
          mb: 2.5,
        }}
      >
        {/* Row 1: Search, Status, Clear */}
        <Grid container spacing={2.5} alignItems="flex-end" sx={{ mb: showLocation ? 2 : 0 }}>
          <Grid item xs={12} sm={8} md={showStatus ? 9 : 11}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', mb: 0.6, display: 'block' }}>
              {t('FILTERS.SEARCH')}
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder={searchPlaceholder}
              value={values.search || ''}
              onChange={(e) => onChange({ ...values, search: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  fontSize: '13px',
                  borderColor: '#D1D5DB',
                },
              }}
            />
          </Grid>

          {showStatus && (
            <Grid item xs={8} sm={3} md={2.3}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', mb: 0.6, display: 'block' }}>
                {t('FILTERS.STATUS')}
              </Typography>
              <Select
                fullWidth
                size="small"
                value={values.status || 'all'}
                onChange={(e) => onChange({ ...values, status: e.target.value })}
                sx={{
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  fontSize: '13px',
                  borderColor: '#D1D5DB',
                }}
              >
                <MenuItem value="all">{t('FILTERS.ALL_STATUSES')}</MenuItem>
                {formattedStatuses.map((st) => (
                  <MenuItem key={st.value} value={st.value}>
                    {st.label}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
          )}

          <Grid item xs={4} sm={1} md={0.7} sx={{ display: 'flex', alignItems: 'center', pb: 0.8 }}>
            <Button
              onClick={handleReset}
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

        {showLocation && (
          <>
        {/* Row 2: Role, State, District, Branch, Program */}
        <Grid container spacing={2}>
          {showRole && (
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', mb: 0.6, display: 'block' }}>
                {t('FILTERS.ROLE')}
              </Typography>
              <Select
                fullWidth
                size="small"
                value={values.role || 'all'}
                onChange={(e) => onChange({ ...values, role: e.target.value })}
                sx={{ borderRadius: '6px', backgroundColor: '#FFFFFF', fontSize: '13px' }}
              >
                <MenuItem value="all">{t('FILTERS.ALL_ROLES')}</MenuItem>
                {formattedRoles.length > 0 ? (
                  formattedRoles.map((r) => (
                    <MenuItem key={r.value} value={r.value}>
                      {r.label}
                    </MenuItem>
                  ))
                ) : (
                  <>
                    <MenuItem value="Learner">Learner</MenuItem>
                    <MenuItem value="Trainer">Trainer</MenuItem>
                    <MenuItem value="DI">DI</MenuItem>
                    <MenuItem value="ARM">ARM</MenuItem>
                    <MenuItem value="Admin">Admin</MenuItem>
                  </>
                )}
              </Select>
            </Grid>
          )}

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', mb: 0.6, display: 'block' }}>
              {t('FILTERS.STATE')}
            </Typography>
            <Select
              fullWidth
              size="small"
              value={values.state || 'all'}
              onChange={(e) => handleStateChange(e.target.value)}
              sx={{ borderRadius: '6px', backgroundColor: '#FFFFFF', fontSize: '13px' }}
            >
              <MenuItem value="all">{t('FILTERS.ALL_STATES')}</MenuItem>
              {states.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', mb: 0.6, display: 'block' }}>
              {t('FILTERS.DISTRICT')}
            </Typography>
            <Select
              fullWidth
              size="small"
              value={values.district || 'all'}
              onChange={(e) => handleDistrictChange(e.target.value)}
              sx={{ borderRadius: '6px', backgroundColor: '#FFFFFF', fontSize: '13px' }}
            >
              <MenuItem value="all">{t('FILTERS.ALL_DISTRICTS')}</MenuItem>
              {districts.map((d) => (
                <MenuItem key={d.value} value={d.value}>
                  {d.label}
                </MenuItem>
              ))}
            </Select>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', mb: 0.6, display: 'block' }}>
              {t('FILTERS.BRANCH')}
            </Typography>
            <Select
              fullWidth
              size="small"
              value={values.branch || values.block || 'all'}
              onChange={(e) => handleBlockChange(e.target.value)}
              sx={{ borderRadius: '6px', backgroundColor: '#FFFFFF', fontSize: '13px' }}
            >
              <MenuItem value="all">{t('FILTERS.ALL_BRANCHES')}</MenuItem>
              {blocks.map((b) => (
                <MenuItem key={b.value} value={b.value}>
                  {b.label}
                </MenuItem>
              ))}
            </Select>
          </Grid>


        </Grid>
          </>
        )}
      </Box>
    );
  }

  // Default single-row layout (for backward compatibility with Dashboard, Cohorts, etc.)
  return (
    <Box
      sx={{
        backgroundColor: 'background.paper',
        borderRadius: '10px',
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        mb: 2.5,
      }}
    >
      <Grid container spacing={2} alignItems="center">
        {/* State */}
        <Grid item xs={12} sm={6} md={showProgram ? 2.2 : 2.75}>
          <FormControl fullWidth size="small">
            <InputLabel id="state-select-label">{t('FILTERS.STATE')}</InputLabel>
            <Select
              labelId="state-select-label"
              value={values.state || ''}
              label={t('FILTERS.STATE')}
              onChange={(e) => handleStateChange(e.target.value)}
            >
              <MenuItem value="">
                <em>{t('FILTERS.ALL_STATES')}</em>
              </MenuItem>
              {states.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* District */}
        <Grid item xs={12} sm={6} md={showProgram ? 2.2 : 2.75}>
          <FormControl fullWidth size="small" disabled={!values.state || values.state === 'all'}>
            <InputLabel id="district-select-label">{t('FILTERS.DISTRICT')}</InputLabel>
            <Select
              labelId="district-select-label"
              value={values.district || ''}
              label={t('FILTERS.DISTRICT')}
              onChange={(e) => handleDistrictChange(e.target.value)}
            >
              <MenuItem value="">
                <em>{t('FILTERS.ALL_DISTRICTS')}</em>
              </MenuItem>
              {districts.map((d) => (
                <MenuItem key={d.value} value={d.value}>
                  {d.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Block / Branch */}
        <Grid item xs={12} sm={6} md={showProgram ? 2.2 : 2.75}>
          <FormControl fullWidth size="small" disabled={!values.district || values.district === 'all'}>
            <InputLabel id="block-select-label">{showBranch ? t('FILTERS.BRANCH') : t('FILTERS.BLOCK')}</InputLabel>
            <Select
              labelId="block-select-label"
              value={values.branch || values.block || ''}
              label={showBranch ? t('FILTERS.BRANCH') : t('FILTERS.BLOCK')}
              onChange={(e) => handleBlockChange(e.target.value)}
            >
              <MenuItem value="">
                <em>{showBranch ? t('FILTERS.ALL_BRANCHES') : t('FILTERS.ALL_BLOCKS')}</em>
              </MenuItem>
              {blocks.map((b) => (
                <MenuItem key={b.value} value={b.value}>
                  {b.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Village */}
        {showVillage && !showBranch && (
          <Grid item xs={12} sm={6} md={showProgram ? 2.2 : 2.75}>
            <FormControl fullWidth size="small" disabled={!values.block || values.block === 'all'}>
              <InputLabel id="village-select-label">{t('FILTERS.VILLAGE')}</InputLabel>
              <Select
                labelId="village-select-label"
                value={values.village || ''}
                label={t('FILTERS.VILLAGE')}
                onChange={(e) => handleVillageChange(e.target.value)}
              >
                <MenuItem value="">
                  <em>{t('FILTERS.ALL_VILLAGES')}</em>
                </MenuItem>
                {villages.map((v) => (
                  <MenuItem key={v.value} value={v.value}>
                    {v.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* Program */}
        {showProgram && (
          <Grid item xs={12} sm={6} md={2.2}>
            <FormControl fullWidth size="small">
              <InputLabel id="program-select-label">{t('FILTERS.PROGRAM')}</InputLabel>
              <Select
                labelId="program-select-label"
                value={values.program || ''}
                label={t('FILTERS.PROGRAM')}
                onChange={(e) => handleProgramChange(e.target.value)}
              >
                <MenuItem value="">
                  <em>{t('FILTERS.ALL_PROGRAMS')}</em>
                </MenuItem>
                {programs.map((p) => (
                  <MenuItem key={p.value} value={p.value}>
                    {p.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* Reset Action */}
        <Grid item xs={12} sm={6} md={1}>
          <Button
            variant="text"
            color="secondary"
            size="small"
            disabled={!hasActiveFilters}
            onClick={handleReset}
            startIcon={<FilterAltOffIcon />}
            sx={{ minWidth: 'auto', px: 1, textTransform: 'none', fontSize: '12px' }}
          >
            {t('FILTERS.CLEAR')}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SDBVHierarchyFilter;
