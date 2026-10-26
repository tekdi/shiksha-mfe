import React from 'react';
import { Box, TextField, TextFieldProps, Typography } from '@mui/material';
import FieldLabel from './FieldLabel';
import { NEUTRAL } from '@/styles/customTheme';

export type CommonTextFieldProps = Omit<TextFieldProps, 'label'> & {
  /** Label rendered above the input. */
  label?: React.ReactNode;
  /** Muted hint rendered below the input when there is no error. */
  hint?: React.ReactNode;
};

export const inputSx = {
  backgroundColor: 'background.paper',
  fontSize: '14px',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: NEUTRAL.borderStrong },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: NEUTRAL.subtle },
  '& .MuiOutlinedInput-input, & .MuiSelect-select': { padding: '9.5px 12px' },
};

/** Outlined text field with the admin's label-above layout. */
const CommonTextField: React.FC<CommonTextFieldProps> = ({
  label,
  hint,
  required,
  id,
  sx,
  InputProps,
  error,
  helperText,
  ...rest
}) => (
  <Box sx={{ width: '100%' }}>
    {label && <FieldLabel label={label} required={required} htmlFor={id} />}
    <TextField
      id={id}
      fullWidth
      size="small"
      required={required}
      error={error}
      helperText={helperText}
      sx={sx}
      InputProps={{ ...InputProps, sx: [inputSx, ...(InputProps?.sx ? [InputProps.sx as object] : [])] }}
      {...rest}
    />
    {hint && !(error && helperText) && (
      <Typography sx={{ fontSize: '12px', color: NEUTRAL.muted, mt: 0.5 }}>{hint}</Typography>
    )}
  </Box>
);

export default CommonTextField;
