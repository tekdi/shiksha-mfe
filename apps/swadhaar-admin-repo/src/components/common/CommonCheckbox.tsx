import React from 'react';
import { Checkbox, FormControlLabel } from '@mui/material';

export interface CommonCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  indeterminate?: boolean;
  name?: string;
}

/** Brand checkbox with an optional inline label. */
const CommonCheckbox: React.FC<CommonCheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  indeterminate = false,
  name,
}) => {
  const control = (
    <Checkbox
      size="small"
      name={name}
      checked={checked}
      indeterminate={indeterminate}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
    />
  );

  if (!label) return control;

  return (
    <FormControlLabel
      control={control}
      label={label}
      disabled={disabled}
      sx={{ '& .MuiFormControlLabel-label': { fontSize: '14px' } }}
    />
  );
};

export default CommonCheckbox;
