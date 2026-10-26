import { experimental_extendTheme as extendTheme } from '@mui/material/styles';

/**
 * Swadhaar brand tokens, aligned with the Swadhaar tenant theme of learner-web-app
 * (primary #E6873C, secondary #1A1A1A, background #F5F5F5, Poppins, pill buttons).
 */
export const BRAND = {
  primary: '#E6873C',
  primaryLight: '#FFA05C',
  primaryDark: '#C66C23',
  primarySoft: '#FDF3E9',
  secondary: '#1C2B4A', // Swadhaar Dark Navy
  secondaryLight: '#2B406B',
  secondaryDark: '#101B30',
  buttonText: '#FFFFFF',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#4D4639',
} as const;

/** Neutral greys shared by tables, forms and dialogs. */
export const NEUTRAL = {
  ink: '#1F1E1C',
  muted: '#6B6862',
  subtle: '#8A867F',
  border: '#D6D3CC',
  borderStrong: '#BDB9B1',
  divider: '#ECEAE5',
  hover: '#F4F3EF',
  canvas: '#FAF9F6',
} as const;

export const FONT_FAMILY = "'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

declare module '@mui/material/styles' {
  interface Palette {
    neutral: typeof NEUTRAL;
  }
  interface PaletteOptions {
    neutral?: typeof NEUTRAL;
  }
}

const customTheme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: BRAND.primary,
          light: BRAND.primaryLight,
          dark: BRAND.primaryDark,
          contrastText: BRAND.buttonText,
          '100': BRAND.primarySoft,
          '200': '#FBE3CD',
        },
        secondary: {
          main: BRAND.secondary,
          light: BRAND.secondaryLight,
          dark: BRAND.secondaryDark,
          contrastText: BRAND.buttonText,
          '100': BRAND.background,
          '200': BRAND.surface,
          '300': '#E5E7EB',
          '400': '#D1D5DB',
        },
        success: {
          main: '#1A8825',
          light: '#E8F5E9',
          dark: '#116418',
          contrastText: '#FFFFFF',
        },
        warning: {
          main: '#E65100',
          light: '#FFF3E0',
          dark: '#B23F00',
          contrastText: '#FFFFFF',
        },
        error: {
          main: '#BA1A1A',
          light: '#FFDAD6',
          dark: '#93000A',
          contrastText: '#FFFFFF',
        },
        info: {
          main: '#064471',
          light: '#D6EEFF',
          dark: '#03263F',
          contrastText: '#FFFFFF',
        },
        text: {
          primary: BRAND.textPrimary,
          secondary: BRAND.textSecondary,
        },
        background: {
          default: BRAND.background,
          paper: BRAND.surface,
        },
        divider: NEUTRAL.divider,
        neutral: NEUTRAL,
      },
    },
    dark: {
      palette: {
        primary: {
          main: BRAND.primaryLight,
          light: '#FFBE8A',
          dark: BRAND.primary,
          contrastText: BRAND.secondary,
        },
        secondary: {
          main: '#E5E5E5',
          light: '#FFFFFF',
          dark: '#BDBDBD',
          contrastText: BRAND.secondary,
        },
        background: {
          default: '#121212',
          paper: '#1E1E1E',
        },
        text: {
          primary: '#F5F5F5',
          secondary: '#BDB9B1',
        },
        divider: '#3D3B37',
        neutral: NEUTRAL,
      },
    },
  },
  typography: {
    fontFamily: FONT_FAMILY,
    allVariants: {
      fontFamily: FONT_FAMILY,
    },
    h1: {
      fontSize: '28px',
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h2: {
      fontSize: '22px',
      fontWeight: 700,
      lineHeight: 1.35,
    },
    h3: {
      fontSize: '18px',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '16px',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '14px',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '12px',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '14px',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          },
        },
        containedPrimary: {
          backgroundColor: BRAND.primary,
          color: BRAND.buttonText,
          '&:hover': {
            backgroundColor: BRAND.primaryDark,
          },
        },
        containedSecondary: {
          backgroundColor: BRAND.secondary,
          color: BRAND.buttonText,
          '&:hover': {
            backgroundColor: BRAND.secondaryDark,
          },
        },
        outlinedPrimary: {
          borderColor: BRAND.primary,
          color: BRAND.primary,
          '&:hover': {
            borderColor: BRAND.primaryDark,
            backgroundColor: 'rgba(230, 135, 60, 0.05)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          border: `1px solid ${NEUTRAL.divider}`,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          backgroundImage: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: '16px',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '13px',
          borderColor: NEUTRAL.divider,
          padding: '12px 16px',
        },
        head: {
          fontWeight: 600,
          color: BRAND.textSecondary,
          backgroundColor: NEUTRAL.canvas,
          textTransform: 'uppercase',
          fontSize: '11px',
          letterSpacing: '0.5px',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: BRAND.primary,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: BRAND.primary,
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          '&.Mui-checked': {
            color: BRAND.primary,
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          '&.Mui-checked': {
            color: BRAND.primary,
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '14px',
          color: BRAND.textSecondary,
          '&.Mui-selected': {
            color: BRAND.primary,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: BRAND.primary,
          height: '3px',
          borderRadius: '3px 3px 0 0',
        },
      },
    },
  },
});

export default customTheme;
