import React from 'react';
import { Typography } from '@mui/material';
import { NEUTRAL } from '@/styles/customTheme';

interface FieldLabelProps {
  label: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}

/** Label rendered above form controls. */
const FieldLabel: React.FC<FieldLabelProps> = ({ label, required = false, htmlFor }) => (
  <Typography
    component="label"
    htmlFor={htmlFor}
    sx={{ display: 'block', fontSize: '13px', fontWeight: 600, color: NEUTRAL.ink, mb: 0.6 }}
  >
    {label}
    {required && ' *'}
  </Typography>
);

export default FieldLabel;
