import React from 'react';
import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import { SxProps, Theme } from '@mui/material/styles';

interface SearchBarProps {
  placeholder?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftIconAriaLabel?: string;
  rightIconAriaLabel?: string;
  onLeftIconClick?: () => void;
  onRightIconClick?: () => void;
  inputValue?: string;
  onInputChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  sx?: SxProps<Theme>;
  onKeyPress?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const CommonSearch: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  leftIcon,
  rightIcon,
  onLeftIconClick,
  onRightIconClick,
  inputValue,
  onInputChange,
  leftIconAriaLabel,
  rightIconAriaLabel,
  sx = {},
  onKeyPress,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        // border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '2px 4px',
        ...sx,
      }}
    >
      {leftIcon && (
        <IconButton
          onClick={onLeftIconClick}
          // sx={{ p: '10px' }}
          aria-label={leftIconAriaLabel || 'search navigation button'}
        >
          {leftIcon}
        </IconButton>
      )}
      <InputBase
        sx={{ ml: 1, flex: 1 }}
        placeholder={placeholder}
        inputProps={{ 'aria-label': placeholder }}
        value={inputValue || ''}
        onChange={onInputChange}
        onKeyDown={onKeyPress}
      />
      {rightIcon && (
        <IconButton
          onClick={onRightIconClick}
          sx={{ p: '10px' }}
          aria-label={rightIconAriaLabel || 'search action button'}
        >
          {rightIcon}
        </IconButton>
      )}
    </Box>
  );
};
