import React from 'react';
import { Box, FormControl, FormHelperText, MenuItem, Select, SelectChangeEvent, SxProps, Theme } from '@mui/material';
import FieldLabel from './FieldLabel';
import { inputSx } from './CommonTextField';

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface CommonSelectProps {
  value: string;
  onChange: (value: string, event: SelectChangeEvent<string>) => void;
  options: SelectOption[];
  label?: React.ReactNode;
  /** Shown as a disabled first item and when the value is empty. */
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: React.ReactNode;
  id?: string;
  name?: string;
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
}

/** Single-value select with the admin's label-above layout. */
const CommonSelect: React.FC<CommonSelectProps> = ({
  value,
  onChange,
  options,
  label,
  placeholder,
  required = false,
  disabled = false,
  error = false,
  helperText,
  id,
  name,
  fullWidth = true,
  sx,
}) => (
  <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
    {label && <FieldLabel label={label} required={required} htmlFor={id} />}
    <FormControl fullWidth={fullWidth} size="small" error={error} disabled={disabled}>
      <Select
        id={id}
        name={name}
        value={value}
        displayEmpty={Boolean(placeholder)}
        onChange={(event) => onChange(event.target.value, event)}
        sx={[inputSx, ...(Array.isArray(sx) ? sx : [sx])]}
      >
        {placeholder && (
          <MenuItem value="" disabled>
            <em>{placeholder}</em>
          </MenuItem>
        )}
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value} disabled={option.disabled} sx={{ fontSize: '14px' }}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText sx={{ mx: 0.5, fontSize: '11px' }}>{helperText}</FormHelperText>}
    </FormControl>
  </Box>
);

export default CommonSelect;
