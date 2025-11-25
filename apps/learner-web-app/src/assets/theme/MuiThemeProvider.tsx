// app/theme/ThemeRegistry.tsx or MuiThemeProvider.tsx
'use client';

import { createTheme, ThemeProvider, alpha } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import React, { useMemo } from 'react';
import { LanguageProvider } from '@shared-lib';
import FontSizeTheme from '../../context/FontSizeTheme';
import { SpeechProvider } from '@shared-lib-v2/lib/context/SpeechContext';
import { ColorInversionProvider } from '../../context/ColorInversionContext';
import { useTenant } from '../../context/TenantContext';

// Add module augmentation for custom typography variants
declare module '@mui/material/styles' {
  interface TypographyVariants {
    body3: React.CSSProperties;
    body4: React.CSSProperties;
    body5: React.CSSProperties;
    body6: React.CSSProperties;
    body7: React.CSSProperties;
    body8: React.CSSProperties;
    body9: React.CSSProperties;
    body10: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    body3?: React.CSSProperties;
    body4?: React.CSSProperties;
    body5?: React.CSSProperties;
    body6?: React.CSSProperties;
    body7?: React.CSSProperties;
    body8?: React.CSSProperties;
    body9?: React.CSSProperties;
    body10?: React.CSSProperties;
  }

  interface Palette {
    customColors: {
      primary100: string;
      secondary200: string;
      secondary300: string;
      secondary400: string;
      warning100: string;
      warning200: string;
      warning300: string;
      warning400: string;
      warning500: string;
      warning600: string;
      warning700: string;
      warning800: string;
      warning900: string;
      warningA100: string;
      warningA200: string;
      warningA400: string;
      warningA700: string;
      warningContrastText: string;
    };
  }

  interface PaletteOptions {
    customColors?: {
      primary100?: string;
      secondary200?: string;
      secondary300?: string;
      secondary400?: string;
      warning100?: string;
      warning200?: string;
      warning300?: string;
      warning400?: string;
      warning500?: string;
      warning600?: string;
      warning700?: string;
      warning800?: string;
      warning900?: string;
      warningA100?: string;
      warningA200?: string;
      warningA400?: string;
      warningA700?: string;
      warningContrastText?: string;
    };
  }
}

// Update the Typography's variant prop options
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    body3: true;
    body4: true;
    body5: true;
    body6: true;
    body7: true;
    body8: true;
    body9: true;
    body10: true;
  }
}

export const theme = createTheme({
  typography: {
    fontFamily: 'Poppins, Arial, sans-serif',
    allVariants: {
      fontFamily: 'Poppins, Arial, sans-serif',
    },
    h1: {
      fontSize: 'calc(22px * var(--font-size-scale))',
      fontWeight: 400,
      lineHeight: 1.27,
    },
    h2: {
      fontSize: 'calc(16px * var(--font-size-scale))',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    h3: {
      fontSize: 'calc(14px * var(--font-size-scale))',
      fontWeight: 500,
      lineHeight: 1.43,
    },
    h4: {
      fontSize: 'calc(14px * var(--font-size-scale))',
      fontWeight: 400,
      lineHeight: 1.43,
      letterSpacing: '0.1px',
    },
    h5: {
      fontSize: 'calc(12px * var(--font-size-scale))',
      fontWeight: 500,
      lineHeight: 1.33,
      letterSpacing: '0.5px',
    },
    h6: {
      fontSize: 'calc(11px * var(--font-size-scale))',
      fontWeight: 500,
      lineHeight: 1.45,
      letterSpacing: '0.5px',
    },
    body1: {
      fontSize: 'calc(16px * var(--font-size-scale))',
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0.5px',
    },
    body2: {
      fontSize: 'calc(14px * var(--font-size-scale))',
      fontWeight: 400,
      lineHeight: 1.43,
      letterSpacing: '0.25px',
    },
    body3: {
      fontSize: 'calc(72px * var(--font-size-scale))',
      lineHeight: 2.43,
      letterSpacing: '0.25px',
    },
    body4: {
      fontSize: 'calc(28px * var(--font-size-scale))',
      lineHeight: 1.5,
      letterSpacing: '0.25px',
    },
    body5: {
      fontSize: 'calc(18px * var(--font-size-scale))',
      lineHeight: 1.5,
      letterSpacing: '0.15px',
    },
    body6: {
      fontSize: 'calc(36px * var(--font-size-scale))',
      lineHeight: 1.4,
      letterSpacing: '0.4px',
    },
    body7: {
      fontSize: 'calc(45px * var(--font-size-scale))',
      lineHeight: 1.4,
      letterSpacing: '0.4px',
    },
    body8: {
      fontSize: 'calc(24px * var(--font-size-scale))',
      lineHeight: 1.4,
      letterSpacing: '0.4px',
    },
    body9: {
      fontSize: 'calc(32px * var(--font-size-scale))',
      lineHeight: 1.4,
      letterSpacing: '0.4px',
    },
    body10: {
      fontSize: 'calc(40px * var(--font-size-scale))',
      lineHeight: 1.4,
      letterSpacing: '0.4px',
    },
    button: {
      textTransform: 'none',
      fontSize: 'calc(14px * var(--font-size-scale))',
      fontWeight: 600,
    },
  },
  palette: {
    primary: {
      main: '#FDBE16',
      light: '#FFDEA1',
      contrastText: '#EBE1D4',
    },
    secondary: {
      main: '#0D599E',
      light: '#E7F3F8',
      contrastText: '#cdc5bd',
    },
    success: {
      main: '#1A8825',
      light: '#C0FFC7',
      contrastText: '#fff8f2',
    },
    info: {
      main: '#064471',
      light: '#D6EEFF',
      contrastText: '#EFC570',
    },
    warning: {
      main: '#FF9800',
      light: '#FFB74D',
      dark: '#F57C00',
      contrastText: '#000000',
    },
    error: {
      main: '#BA1A1A',
      light: '#FFDAD6',
    },
    text: {
      primary: '#1F1B13',
      secondary: '#4d4639',
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
    },
    customColors: {
      primary100: '#000000',
      secondary200: '#FFFFFF',
      secondary300: '#EEEEEE',
      secondary400: '#ddd',
      warning100: '#17130B',
      warning200: '#261900',
      warning300: '#1F1B13',
      warning400: '#7C766F',
      warning500: '#969088',
      warning600: '#B1AAA2',
      warning700: '#DED8E1',
      warning800: '#F8EFE7',
      warning900: '#DADADA',
      warningA100: '#D0C5B4',
      warningA200: '#4d4639',
      warningA400: '#FFFFFF',
      warningA700: '#EDEDED',
      warningContrastText: '#3B383E',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          '& > :last-child': {
            paddingBottom: '16px !important',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: '#fff',
          paddingTop: '10px',
          paddingBottom: '10px',
          [theme.breakpoints.down('md')]: {
            paddingTop: '4px',
            paddingBottom: '4px',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {},
        }),
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: ({ theme }) => ({
          [theme.breakpoints.down('md')]: {
            minHeight: '56px',
          },
        }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {},
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          '& .MuiTab-root': {
            color: '#4D4639',
            '&.Mui-selected': {
              color: '#1F1B13',
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '50px',
          color: '#1E1B16',
          textTransform: 'none',
          boxShadow: 'unset !important',
        },
      },
      variants: [
        {
          props: { variant: 'text-filter-show-more' as any },
          style: {
            fontSize: 'calc(16px * var(--font-size-scale))',
            color: '#987100',
            '&:hover': {
              backgroundColor: 'transparent', // Change to desired hover background color
            },
            '& .MuiButton-startIcon': {
              color: '#987100',
            },
          },
        },
        {
          props: { variant: 'top-bar-link-text' as any },
          style: {
            fontSize: 'calc(16px * var(--font-size-scale))',
            lineHeight: '24px',
            fontWeight: 400,
            color: '#1F1B13',
            padding: '12px 10px',
            borderRadius: 8,
            '& .MuiButton-startIcon': {
              color: '#635E57',
            },
          },
        },
        {
          props: { variant: 'top-bar-link-button' as any },
          style: {
            fontSize: 'calc(16px * var(--font-size-scale))',
            lineHeight: '24px',
            fontWeight: 600,
            padding: '12px 10px',
            gap: 8,
            borderRadius: 8,
            borderBottomWidth: 3,
            letterSpacing: '0.22px',
            color: '#987100',
            backgroundColor: '#F7ECDF',
            '&:hover': {
              backgroundColor: '#fbf7f1',
            },
            '& .MuiButton-startIcon': {
              marginRight: 0,
            },
            '& span': {
              color: '#987100',
            },
          },
        },
      ],
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          '&.Mui-error': {
            backgroundColor: '#ff0000',
          },
        },
      },
    },
  },
});

export default function MuiThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { contentFilter } = useTenant();
  
  // Get tenant colors or use defaults
  const primaryColor = contentFilter?.theme?.primaryColor || "#FDBE16";
  const secondaryColor = contentFilter?.theme?.secondaryColor || "#1F1B13";
  const backgroundColor = contentFilter?.backgroundColor || contentFilter?.theme?.backgroundColor || "#F5F5F5";
  const buttonTextColor = contentFilter?.buttonTextColor || contentFilter?.theme?.buttonTextColor || "#FFFFFF";

  // Create dynamic theme based on tenant colors
  const dynamicTheme = useMemo(() => {
    return createTheme({
      ...theme,
      palette: {
        ...theme.palette,
        primary: {
          main: primaryColor,
          contrastText: buttonTextColor,
        },
        secondary: {
          main: secondaryColor,
          contrastText: buttonTextColor,
        },
        warning: {
          ...theme.palette.warning,
          main: primaryColor,
          light: alpha(primaryColor, 0.2),
          dark: alpha(primaryColor, 0.7),
          contrastText: buttonTextColor,
          A100: alpha(primaryColor, 0.25),
          A200: alpha(primaryColor, 0.35),
          A400: alpha(primaryColor, 0.45),
          A700: alpha(primaryColor, 0.55),
        },
        background: {
          default: backgroundColor,
          paper: "#FFFFFF",
        },
      },
      components: {
        ...theme.components,
        MuiButton: {
          ...theme.components?.MuiButton,
          styleOverrides: {
            ...theme.components?.MuiButton?.styleOverrides,
            root: {
              ...theme.components?.MuiButton?.styleOverrides?.root,
              borderRadius: '50px',
              textTransform: 'none',
              boxShadow: 'unset !important',
              // Remove hardcoded color - will use contrastText from palette
              color: 'inherit',
            },
            contained: {
              // Ensure contained buttons use the theme's contrastText
              color: buttonTextColor,
              '&.MuiButton-containedPrimary': {
                color: `${buttonTextColor} !important`,
              },
              '&.MuiButton-containedSecondary': {
                color: `${buttonTextColor} !important`,
              },
            },
          },
        },
      },
    });
  }, [primaryColor, secondaryColor, backgroundColor, buttonTextColor]);

  return (
    <ColorInversionProvider>
      <FontSizeTheme baseTheme={dynamicTheme}>
        <CssBaseline />
        <SpeechProvider>{children}</SpeechProvider>
      </FontSizeTheme>
    </ColorInversionProvider>
  );
}

export const MuiThemeProviderWithLanguage = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <LanguageProvider>{children}</LanguageProvider>;
};
