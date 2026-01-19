import React, { memo, useState, useMemo, useEffect, use } from 'react';
import { CommonSearch, useTranslation } from '@shared-lib';
import { Search as SearchIcon } from '@mui/icons-material';
import { TextField, InputAdornment, useMediaQuery, useTheme } from '@mui/material';
import debounce from 'lodash/debounce';
import { telemetryFactory } from "../../utils/telemtery";
export default memo(function SearchComponent({
  onSearch,
  value,
}: {
  value: string;
  onSearch: (value: string) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchValue, setSearchValue] = useState(value || '');

  // Debounced function (only called for non-empty values)
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        if (value?.trim() !== '') {
          onSearch(value?.trim());
        }
      }, 300),
    [onSearch]
  );

  useEffect(() => {
    const trimmed = searchValue?.trim();

    if (trimmed === '') {
      // Immediately clear results (optional: depending on your app logic)
      debouncedSearch.cancel(); // Cancel any pending debounced call
      onSearch(''); // Notify parent to clear results
      return;
    }

    debouncedSearch(trimmed);

    return () => {
      debouncedSearch.cancel();
    };
  }, [searchValue, debouncedSearch, onSearch]);

  useEffect(() => {
    setSearchValue(value || '');
  }, [value]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
  };

  const handleSearchClick = () => {
    const trimmed = searchValue.trim();
     const telemetryInteract = {
                          context: { env: "prod", cdata: [] },
                          edata: {
                            id: "dashboard-search-click",
                            type: "CLICK",
                            pageid: `search-${trimmed}`,
                            uid: localStorage.getItem("userId") || "Anonymous",
                          },
                        };
                        telemetryFactory.interact(telemetryInteract);
    debouncedSearch.cancel(); // Cancel debounce before immediate search

    if (trimmed !== '') {
      onSearch(trimmed);
    } else {
      onSearch(''); // Ensure reset on manual clear + click
    }
  };

  const handleKeyPress = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === 'Enter') {
      handleSearchClick();
    }
  };

  // On mobile, use TextField to match Button styling exactly
  if (isMobile) {
    return (
      <TextField
        fullWidth
        placeholder={t('LEARNER_APP.SEARCH_COMPONENT.PLACEHOLDER')}
        variant="outlined"
        value={searchValue}
        onChange={handleSearchChange}
        onKeyPress={handleKeyPress}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <SearchIcon 
                sx={{ 
                  fontSize: 18, 
                  color: "#6B6B6B",
                  cursor: 'pointer',
                }}
                onClick={handleSearchClick}
              />
            </InputAdornment>
          ),
        }}
        sx={{
          height: "48px",
          // Match button exactly
          "& .MuiOutlinedInput-root": {
            height: "48px",
            borderRadius: "8px",
            paddingRight: "8px",
            backgroundColor: "transparent",
            fontSize: "13px",
            "& fieldset": {
              borderColor: "#DADADA",
              borderWidth: "1px",
            },
            "&:hover fieldset": {
              borderColor: "#DADADA",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#DADADA",
              borderWidth: "1px",
            },
          },
          // Match button text alignment
          "& input": {
            padding: "0 12px",
            height: "48px",
            display: "flex",
            alignItems: "center",
            fontSize: "13px",
            "&::placeholder": {
              opacity: 1,
              color: "#9E9E9E",
            },
          },
        }}
      />
    );
  }

  // On desktop, use CommonSearch with original styling
  return (
    <CommonSearch
      placeholder={t('LEARNER_APP.SEARCH_COMPONENT.PLACEHOLDER')}
      rightIcon={<SearchIcon />}
      onRightIconClick={handleSearchClick}
      inputValue={searchValue}
      onInputChange={handleSearchChange}
      onKeyPress={handleKeyPress}
      sx={{
        backgroundColor: '#fff',
        borderRadius: '50px',
        border: '1px solid #D0C5B4',
        width: '100%',
        padding: '2px 4px',
        display: 'flex',
        alignItems: 'center',
        '& .MuiInputBase-root': {
          fontSize: '14px',
        },
        '& .MuiIconButton-root': {
          padding: '10px',
          '& .MuiSvgIcon-root': {
            width: 20,
            height: 20,
          },
        },
      }}
    />
  );
});
