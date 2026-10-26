import React from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { BRAND, NEUTRAL } from '@/styles/customTheme';

export type CommonButtonVariant = 'primary' | 'secondary' | 'outlined' | 'dark' | 'danger' | 'text';

export interface CommonButtonProps extends Omit<ButtonProps, 'variant' | 'color'> {
  variant?: CommonButtonVariant;
  loading?: boolean;
}

const VARIANT_STYLES: Record<CommonButtonVariant, { muiVariant: ButtonProps['variant']; sx: object }> = {
  primary: {
    muiVariant: 'contained',
    sx: {
      backgroundColor: BRAND.primary,
      color: BRAND.buttonText,
      '&:hover': { backgroundColor: BRAND.primaryDark },
    },
  },
  secondary: {
    muiVariant: 'outlined',
    sx: {
      borderColor: BRAND.primary,
      color: BRAND.primary,
      backgroundColor: BRAND.surface,
      '&:hover': { borderColor: BRAND.primaryDark, backgroundColor: BRAND.primarySoft },
    },
  },
  outlined: {
    muiVariant: 'outlined',
    sx: {
      borderColor: NEUTRAL.borderStrong,
      color: NEUTRAL.ink,
      backgroundColor: BRAND.surface,
      '&:hover': { borderColor: NEUTRAL.subtle, backgroundColor: NEUTRAL.hover },
    },
  },
  dark: {
    muiVariant: 'contained',
    sx: {
      backgroundColor: BRAND.secondary,
      color: BRAND.buttonText,
      '&:hover': { backgroundColor: BRAND.secondaryDark },
    },
  },
  danger: {
    muiVariant: 'contained',
    sx: {
      backgroundColor: '#9F1239',
      color: BRAND.buttonText,
      '&:hover': { backgroundColor: '#881337' },
    },
  },
  text: {
    muiVariant: 'text',
    sx: {
      color: BRAND.primary,
      '&:hover': { backgroundColor: BRAND.primarySoft },
    },
  },
};

/** Brand button used across the admin portal. Extra `sx` is merged after the variant style. */
const CommonButton: React.FC<CommonButtonProps> = ({
  variant = 'primary',
  loading = false,
  disabled,
  startIcon,
  children,
  sx,
  ...rest
}) => {
  const config = VARIANT_STYLES[variant];
  const sxList = Array.isArray(sx) ? sx : [sx];

  return (
    <Button
      variant={config.muiVariant}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : startIcon}
      sx={[
        {
          fontSize: '13px',
          fontWeight: 600,
          px: 2.2,
          py: 0.8,
          whiteSpace: 'nowrap',
          '&.Mui-disabled': { opacity: 0.6 },
        },
        config.sx,
        ...sxList,
      ]}
      {...rest}
    >
      {children}
    </Button>
  );
};

export default CommonButton;
