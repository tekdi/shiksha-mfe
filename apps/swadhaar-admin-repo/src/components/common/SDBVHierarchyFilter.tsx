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
  showProgram = true,
  showVillage = true,
  showBranch = false,
  showSearch = false,
  searchPlaceholder = 'Name or email',
  showStatus = false,
  statusOptions = [],
  showRole = false,
  roleOptions = [],
  onClear,
}) => {
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
        <Grid container spacing={2.5} alignItems="flex-end" sx={{ mb: 2 }}>
          <Grid item xs={12} sm={8} md={showStatus ? 9 : 11}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', mb: 0.6, display: 'block' }}>
              Search
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
                Status
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
                <MenuItem value="all">All statuses</MenuItem>
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
              Clear
            </Button>
          </Grid>
        </Grid>

        {/* Row 2: Role, State, District, Branch, Program */}
        <Grid container spacing={2}>
          {showRole && (
            <Grid item xs={12} sm={6} md={2.4}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', mb: 0.6, display: 'block' }}>
                Role
              </Typography>
              <Select
                fullWidth
                size="small"
                value={values.role || 'all'}
                onChange={(e) => onChange({ ...values, role: e.target.value })}
                sx={{ borderRadius: '6px', backgroundColor: '#FFFFFF', fontSize: '13px' }}
              >
                <MenuItem value="all">All roles</MenuItem>
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

          <Grid item xs={12} sm={6} md={2.4}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', mb: 0.6, display: 'block' }}>
              State
            </Typography>
            <Select
              fullWidth
              size="small"
              value={values.state || 'all'}
              onChange={(e) => handleStateChange(e.target.value)}
              sx={{ borderRadius: '6px', backgroundColor: '#FFFFFF', fontSize: '13px' }}
            >
              <MenuItem value="all">All states</MenuItem>
              {states.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', mb: 0.6, display: 'block' }}>
              District
            </Typography>
            <Select
              fullWidth
              size="small"
              value={values.district || 'all'}
              onChange={(e) => handleDistrictChange(e.target.value)}
              sx={{ borderRadius: '6px', backgroundColor: '#FFFFFF', fontSize: '13px' }}
            >
              <MenuItem value="all">All districts</MenuItem>
              {districts.map((d) => (
                <MenuItem key={d.value} value={d.value}>
                  {d.label}
                </MenuItem>
              ))}
            </Select>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', mb: 0.6, display: 'block' }}>
              Branch
            </Typography>
            <Select
              fullWidth
              size="small"
              value={values.branch || values.block || 'all'}
              onChange={(e) => handleBlockChange(e.target.value)}
              sx={{ borderRadius: '6px', backgroundColor: '#FFFFFF', fontSize: '13px' }}
            >
              <MenuItem value="all">All branches</MenuItem>
              {blocks.length > 0 ? (
                blocks.map((b) => (
                  <MenuItem key={b.value} value={b.value}>
                    {b.label}
                  </MenuItem>
                ))
              ) : (
                <>
                  <MenuItem value="Haveli Branch">Haveli Branch</MenuItem>
                  <MenuItem value="Kamptee Branch">Kamptee Branch</MenuItem>
                  <MenuItem value="Dindori Branch">Dindori Branch</MenuItem>
                </>
              )}
            </Select>
          </Grid>

          {showProgram && (
            <Grid item xs={12} sm={6} md={2.4}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', mb: 0.6, display: 'block' }}>
                Program
              </Typography>
              <Select
                fullWidth
                size="small"
                value={values.program || 'all'}
                onChange={(e) => handleProgramChange(e.target.value)}
                sx={{ borderRadius: '6px', backgroundColor: '#FFFFFF', fontSize: '13px' }}
              >
                <MenuItem value="all">All programs</MenuItem>
                {programs.map((p) => (
                  <MenuItem key={p.value} value={p.value}>
                    {p.label}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
          )}
        </Grid>
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
            <InputLabel id="state-select-label">State</InputLabel>
            <Select
              labelId="state-select-label"
              value={values.state || ''}
              label="State"
              onChange={(e) => handleStateChange(e.target.value)}
            >
              <MenuItem value="">
                <em>All States</em>
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
            <InputLabel id="district-select-label">District</InputLabel>
            <Select
              labelId="district-select-label"
              value={values.district || ''}
              label="District"
              onChange={(e) => handleDistrictChange(e.target.value)}
            >
              <MenuItem value="">
                <em>All Districts</em>
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
            <InputLabel id="block-select-label">{showBranch ? 'Branch' : 'Block'}</InputLabel>
            <Select
              labelId="block-select-label"
              value={values.branch || values.block || ''}
              label={showBranch ? 'Branch' : 'Block'}
              onChange={(e) => handleBlockChange(e.target.value)}
            >
              <MenuItem value="">
                <em>{showBranch ? 'All Branches' : 'All Blocks'}</em>
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
              <InputLabel id="village-select-label">Village</InputLabel>
              <Select
                labelId="village-select-label"
                value={values.village || ''}
                label="Village"
                onChange={(e) => handleVillageChange(e.target.value)}
              >
                <MenuItem value="">
                  <em>All Villages</em>
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
              <InputLabel id="program-select-label">Program</InputLabel>
              <Select
                labelId="program-select-label"
                value={values.program || ''}
                label="Program"
                onChange={(e) => handleProgramChange(e.target.value)}
              >
                <MenuItem value="">
                  <em>All Programs</em>
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
            Clear
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SDBVHierarchyFilter;
