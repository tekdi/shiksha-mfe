import React from 'react';
import { Box, FormControlLabel, FormHelperText, Radio, RadioGroup } from '@mui/material';
import FieldLabel from './FieldLabel';
import { SelectOption } from './CommonSelect';

export interface CommonRadioGroupProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: React.ReactNode;
  name?: string;
  row?: boolean;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: React.ReactNode;
}

/** Radio group with the admin's label-above layout. */
const CommonRadioGroup: React.FC<CommonRadioGroupProps> = ({
  value,
  onChange,
  options,
  label,
  name,
  row = true,
  required = false,
  disabled = false,
  error = false,
  helperText,
}) => (
  <Box>
    {label && <FieldLabel label={label} required={required} />}
    <RadioGroup row={row} name={name} value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <FormControlLabel
          key={option.value}
          value={option.value}
          disabled={disabled || option.disabled}
          control={<Radio size="small" />}
          label={option.label}
          sx={{ '& .MuiFormControlLabel-label': { fontSize: '14px' } }}
        />
      ))}
    </RadioGroup>
    {helperText && (
      <FormHelperText error={error} sx={{ mx: 0.5, fontSize: '11px' }}>
        {helperText}
      </FormHelperText>
    )}
  </Box>
);

export default CommonRadioGroup;
