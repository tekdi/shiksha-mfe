import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Typography, useTheme } from '@mui/material';
import { useTranslation, FilterForm } from '@shared-lib';
import { useColorInversion } from '../../context/ColorInversionContext';
import { logEvent } from '@learner/utils/googleAnalytics';

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
  let cleanedUrl = '';
if (typeof window !== 'undefined') {
  const windowUrl = window.location.pathname;
  cleanedUrl = windowUrl;
}
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

  // Store previous filter state for comparison
  const prevFilterState = useRef<any>({});

  // Helper to compare arrays
  const arraysEqual = (a: any[], b: any[]) =>
    Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]);

  // Helper to check if value changed
  const hasChanged = (key: string, newVal: any) => {
    const prevVal = prevFilterState.current[key];
    if (Array.isArray(newVal)) return !arraysEqual(prevVal, newVal);
    return prevVal !== newVal;
  };

  // Filter out invalid terms from filterFramework before passing to FilterForm
  // This preserves associations for cascading filters (works generically for any framework)
  const cleanedFilterFramework = useMemo(() => {
    if (!filterFramework?.framework?.categories) return filterFramework;
    
    const cleanedCategories = filterFramework.framework.categories.map((category: any) => {
      const originalTerms = category.terms || [];
      const filteredTerms = originalTerms
        .filter((term: any) => {
          const hasTemplate = term.code?.includes('{{') || 
                              term.name?.includes('{{') || 
                              term.code?.includes('}}') || 
                              term.name?.includes('}}');
          
          const isLive = term.status === 'Live' || term.status === undefined || term.status === null;
          const hasValidName = term.name && term.name.trim() !== '';
          const hasValidCode = term.code && term.code.trim() !== '';
          
          const isValid = !hasTemplate && isLive && hasValidName && hasValidCode;
          
          if (!isValid) {
            console.log(`🚫 FilterComponent - Filtering out term: "${term.name}" ("${term.code}") - Template: ${hasTemplate}, Live: ${isLive}, ValidName: ${hasValidName}, ValidCode: ${hasValidCode}`);
          }
          
          return isValid;
        })
        .map((term: any) => {
          // Preserve the entire term object including associations for cascading filters
          // This works generically for any category that has associations (e.g., topic->subtopic, subject->topic, etc.)
          return {
            ...term,
            // If term has associations, validate and preserve them
            associations: term.associations ? term.associations.filter((assoc: any) => {
              const hasValidAssocName = assoc.name && assoc.name.trim() !== '';
              const hasValidAssocCode = assoc.code && assoc.code.trim() !== '';
              const isAssocLive = assoc.status === 'Live' || assoc.status === undefined || assoc.status === null;
              return hasValidAssocName && hasValidAssocCode && isAssocLive;
            }) : []
          };
        });
      
      // Log categories with associations for debugging (generic, not tenant-specific)
      const termsWithAssociations = filteredTerms.filter((term: any) => 
        term.associations && term.associations.length > 0
      );
      if (termsWithAssociations.length > 0) {
        console.log(`🔗 ${category.name || category.code} - ${termsWithAssociations.length} terms with associations found`);
      }
      
      return {
        ...category,
        terms: filteredTerms
      };
    });
    
    return {
      ...filterFramework,
      framework: {
        ...filterFramework.framework,
        categories: cleanedCategories
      }
    };
  }, [filterFramework]);

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
          t: t,
          _filterBody: _config?._filterBody,
          _checkbox: {
            sx: checkboxStyle,
          },
          _formControl: {
            sx: {
              '& .MuiSelect-select': {
                maxHeight: 'none', // Remove height restrictions
              },
              '& .MuiMenu-paper': {
                maxHeight: 'none !important', // Remove all height restrictions
                overflow: 'visible !important',
              },
              '& .MuiMenu-list': {
                maxHeight: 'none !important', // Remove all height restrictions
                overflow: 'visible !important',
              },
              // Hide any "show more" buttons
              '& button[class*="show-more"], & button[class*="show-more"], & .show-more, & .show-less': {
                display: 'none !important',
              },
              // Ensure all options are visible and force show all items
              '& .MuiMenuItem-root': {
                display: 'block !important',
              },
              // Force show all options without pagination
              '& [data-testid*="virtualized"], & .virtualized': {
                height: 'auto !important',
                maxHeight: 'none !important',
              },
            },
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
        filterFramework={cleanedFilterFramework}
        orginalFormData={filterState?.filters ?? {}}
        staticFilter={staticFilter}
      />
    ),
    [
      handleFilterChange,
      cleanedFilterFramework,
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
        // Global CSS overrides to disable "show more" functionality and show all options
        '& *': {
          '& button[class*="show-more"], & button[class*="show-less"], & .show-more, & .show-less': {
            display: 'none !important',
          },
          // Force all menu items to be visible
          '& .MuiMenuItem-root': {
            display: 'block !important',
          },
          // Override any height restrictions
          '& .MuiMenu-list, & .MuiMenu-paper': {
            maxHeight: 'none !important',
            height: 'auto !important',
          },
        },
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
                // Log analytics for applied filters
                if (pendingFilters?.se_domains && hasChanged('se_domains', pendingFilters.se_domains)) {
                  logEvent({
                    action: 'filter-selection-by-domain:' + pendingFilters.se_domains.join(','),
                    category: cleanedUrl,
                    label: 'Selection of domain',
                  });
                }
                if (pendingFilters?.se_subDomains && hasChanged('se_subDomains', pendingFilters.se_subDomains)) {
                  logEvent({
                    action: 'filter-selection-by-category:' + pendingFilters.se_subDomains.join(','),
                    category: cleanedUrl,
                    label: 'Selection of category',
                  });
                }
                if (pendingFilters?.se_subjects && hasChanged('se_subjects', pendingFilters.se_subjects)) {
                  logEvent({
                    action: 'filter-selection-by-subject:' + pendingFilters.se_subjects.join(','),
                    category: cleanedUrl,
                    label: 'Selection of subject',
                  });
                }
                if (pendingFilters?.targetAgeGroup && hasChanged('targetAgeGroup', pendingFilters.targetAgeGroup)) {
                  logEvent({
                    action: 'filter-selection-by-age-group:' + pendingFilters.targetAgeGroup.join(','),
                    category: cleanedUrl,
                    label: 'Selection of age group',
                  });
                }
                if (pendingFilters?.primaryUser && hasChanged('primaryUser', pendingFilters.primaryUser)) {
                  logEvent({
                    action: 'filter-selection-by-primary-user:' + pendingFilters.primaryUser.join(','),
                    category: cleanedUrl,
                    label: 'Selection of primary user',
                  });
                }
                if (pendingFilters?.contentLanguage && hasChanged('contentLanguage', pendingFilters.contentLanguage)) {
                  logEvent({
                    action: 'filter-selection-by-content-language:' + pendingFilters.contentLanguage.join(',').toString(),
                    category: cleanedUrl,
                    label: 'Selection of content language',
                  });
                }

                // Update previous filter state
                prevFilterState.current = { ...pendingFilters };

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
              // Reset the previous filter state and pending filters
              prevFilterState.current = {};
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
