import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Typography, useTheme } from '@mui/material';
import { useTranslation, FilterForm } from '@shared-lib';
import { useColorInversion } from '@learner/context/ColorInversionContext';

const FilterComponent: React.FC<{
  filterState: any;
  filterFramework?: any;
  staticFilter?: Record<string, object>;
  handleFilterChange: (newFilterState: any) => void;
  onlyFields?: string[];
  isOpenColapsed?: boolean | any[];
  _config?: any;
}> = ({
  filterState,
  staticFilter,
  filterFramework,
  handleFilterChange,
  onlyFields,
  isOpenColapsed,
  _config,
}) => {
  const { t } = useTranslation();
  const [filterCount, setFilterCount] = useState<any>();
  const [pendingFilters, setPendingFilters] = useState<any>(null);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const theme = useTheme();
  const { isColorInverted } = useColorInversion();

  const checkboxStyle = useMemo(
    () => ({
      color: isColorInverted ? '#fff' : '#1F1B13',
      '&.Mui-checked': {
        color: isColorInverted ? '#fff' : '#1F1B13',
      },
    }),
    [isColorInverted]
  );

  useEffect(() => {
    // Count total number of selected filter items, not just filter categories
    let totalCount = 0;
    Object?.keys(filterState.filters ?? {}).forEach((key) => {
      const filterValue = filterState.filters[key];
      // Skip limit and static filters
      if (['limit', ...Object.keys(staticFilter ?? {})].includes(key)) {
        return;
      }
      // Count items in array or 1 for non-array values
      if (Array.isArray(filterValue)) {
        totalCount += filterValue.length;
      } else if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
        totalCount += 1;
      }
    });
    setFilterCount(totalCount);
  }, [filterState, staticFilter]);

  // Generate a key to force remount when filters are cleared
  const filterFormKey = useMemo(() => {
    const hasFilters = Object.keys(filterState?.filters ?? {}).some((key) => {
      const value = filterState.filters[key];
      return !['limit', ...Object.keys(staticFilter ?? {})].includes(key) &&
             (Array.isArray(value) ? value.length > 0 : !!value);
    });
    // Return different key when filters change from empty to non-empty or vice versa
    return hasFilters ? 'has-filters' : 'no-filters';
  }, [filterState, staticFilter]);

  const memoizedFilterForm = useMemo(
    () => (
      <FilterForm
        key={filterFormKey}
        _config={{
          _filterBody: _config?._filterBody,
          _checkbox: {
            sx: checkboxStyle,
          },
        }}
        onApply={(newFilterState: any) => {
          console.log('FilterComponent: onApply (staged)', newFilterState);
          // Stage the filters instead of applying immediately
          setPendingFilters(newFilterState);
          // Check if there are changes compared to current applied filters
          const hasChanges = JSON.stringify(newFilterState) !== JSON.stringify(filterState?.filters ?? {});
          setHasPendingChanges(hasChanges);
        }}
        onlyFields={onlyFields}
        isOpenColapsed={isOpenColapsed}
        filterFramework={filterFramework}
        orginalFormData={filterState?.filters ?? {}}
        staticFilter={staticFilter}
      />
    ),
    [
      handleFilterChange,
      filterFramework,
      isOpenColapsed,
      staticFilter,
      onlyFields,
      filterState,
      _config,
      checkboxStyle,
      filterFormKey,
    ]
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        width: '100%',
        ...(_config?._filterBox?.sx ?? {}),
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #D0C5B4',
          pb: 2,
          ...(_config?._filterText?.sx ?? {}),
        }}
      >
        <Typography
          variant="h2"
          sx={{
            fontWeight: 500,
          }}
        >
          {t('LEARNER_APP.COURSE.FILTER_BY')}{' '}
          {filterCount > 0 && `(${filterCount})`}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="text"
            sx={{
              color: theme.palette.secondary.main,
            }}
            disabled={!hasPendingChanges}
            onClick={() => {
              if (pendingFilters) {
                // Apply the filters
                handleFilterChange(pendingFilters);
                setHasPendingChanges(false);
              }
            }}
          >
            {t('LEARNER_APP.COURSE.APPLY_FILTER')}
          </Button>
          <Button
            variant="text"
            sx={{
              color: theme.palette.secondary.main,
            }}
            disabled={filterCount === 0}
            onClick={() => {
              // Clear all filters by passing empty object
              handleFilterChange({});
              setPendingFilters({});
              setHasPendingChanges(false);
            }}
          >
            {t('LEARNER_APP.COURSE.CLEAR_FILTER')}
          </Button>
        </Box>
      </Box>
      {memoizedFilterForm}
    </Box>
  );
};

export default FilterComponent;
