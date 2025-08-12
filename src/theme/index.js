import { createTheme } from '@mui/material/styles';

// Design tokens for consistent theming
const designTokens = {
  // Color palette
  colors: {
    primary: {
      50: '#e3f2fd',
      100: '#bbdefb',
      200: '#90caf9',
      300: '#64b5f6',
      400: '#42a5f5',
      500: '#2196f3', // Main primary
      600: '#1e88e5',
      700: '#1976d2',
      800: '#1565c0',
      900: '#0d47a1',
    },
    secondary: {
      50: '#fce4ec',
      100: '#f8bbd9',
      200: '#f48fb1',
      300: '#f06292',
      400: '#ec407a',
      500: '#e91e63',
      600: '#d81b60',
      700: '#c2185b',
      800: '#ad1457',
      900: '#880e4f',
    },
    success: {
      50: '#e8f5e8',
      100: '#c8e6c9',
      200: '#a5d6a7',
      300: '#81c784',
      400: '#66bb6a',
      500: '#4caf50', // Main success
      600: '#43a047',
      700: '#388e3c',
      800: '#2e7d32',
      900: '#1b5e20',
    },
    warning: {
      50: '#fff8e1',
      100: '#ffecb3',
      200: '#ffe082',
      300: '#ffd54f',
      400: '#ffca28',
      500: '#ffc107', // Main warning
      600: '#ffb300',
      700: '#ffa000',
      800: '#ff8f00',
      900: '#ff6f00',
    },
    error: {
      50: '#ffebee',
      100: '#ffcdd2',
      200: '#ef9a9a',
      300: '#e57373',
      400: '#ef5350',
      500: '#f44336', // Main error
      600: '#e53935',
      700: '#d32f2f',
      800: '#c62828',
      900: '#b71c1c',
    },
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
  },
  
  // Typography scale
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeights: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    fontSizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  // Spacing scale (8px base unit)
  spacing: {
    0: '0px',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
    24: '6rem',    // 96px
  },
  
  // Border radius scale
  borderRadius: {
    none: '0px',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },
  
  // Shadow scale
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  
  // Z-index scale
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },
};

// Create enhanced theme
export const createAppTheme = (darkMode = false) => {
  const isDark = darkMode;
  
  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        ...designTokens.colors.primary,
        main: designTokens.colors.primary[500],
        light: designTokens.colors.primary[300],
        dark: designTokens.colors.primary[700],
        contrastText: '#ffffff',
      },
      secondary: {
        ...designTokens.colors.secondary,
        main: designTokens.colors.secondary[500],
        light: designTokens.colors.secondary[300],
        dark: designTokens.colors.secondary[700],
        contrastText: '#ffffff',
      },
      success: {
        ...designTokens.colors.success,
        main: designTokens.colors.success[500],
        light: designTokens.colors.success[300],
        dark: designTokens.colors.success[700],
        contrastText: '#ffffff',
      },
      warning: {
        ...designTokens.colors.warning,
        main: designTokens.colors.warning[500],
        light: designTokens.colors.warning[300],
        dark: designTokens.colors.warning[700],
        contrastText: 'rgba(0, 0, 0, 0.87)',
      },
      error: {
        ...designTokens.colors.error,
        main: designTokens.colors.error[500],
        light: designTokens.colors.error[300],
        dark: designTokens.colors.error[700],
        contrastText: '#ffffff',
      },
      grey: designTokens.colors.grey,
      background: {
        default: isDark ? '#0a0a0a' : '#fafafa',
        paper: isDark ? '#1a1a1a' : '#ffffff',
        surface: isDark ? '#2a2a2a' : '#f5f5f5',
      },
      text: {
        primary: isDark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.87)',
        secondary: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
        disabled: isDark ? 'rgba(255, 255, 255, 0.38)' : 'rgba(0, 0, 0, 0.38)',
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
      action: {
        active: isDark ? 'rgba(255, 255, 255, 0.54)' : 'rgba(0, 0, 0, 0.54)',
        hover: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
        selected: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        disabled: isDark ? 'rgba(255, 255, 255, 0.26)' : 'rgba(0, 0, 0, 0.26)',
        disabledBackground: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
      },
    },
    
    typography: {
      fontFamily: designTokens.typography.fontFamily,
      h1: {
        fontSize: designTokens.typography.fontSizes['5xl'],
        fontWeight: designTokens.typography.fontWeights.bold,
        lineHeight: designTokens.typography.lineHeights.tight,
        letterSpacing: '-0.025em',
      },
      h2: {
        fontSize: designTokens.typography.fontSizes['4xl'],
        fontWeight: designTokens.typography.fontWeights.bold,
        lineHeight: designTokens.typography.lineHeights.tight,
        letterSpacing: '-0.025em',
      },
      h3: {
        fontSize: designTokens.typography.fontSizes['3xl'],
        fontWeight: designTokens.typography.fontWeights.semibold,
        lineHeight: designTokens.typography.lineHeights.tight,
      },
      h4: {
        fontSize: designTokens.typography.fontSizes['2xl'],
        fontWeight: designTokens.typography.fontWeights.semibold,
        lineHeight: designTokens.typography.lineHeights.normal,
      },
      h5: {
        fontSize: designTokens.typography.fontSizes.xl,
        fontWeight: designTokens.typography.fontWeights.semibold,
        lineHeight: designTokens.typography.lineHeights.normal,
      },
      h6: {
        fontSize: designTokens.typography.fontSizes.lg,
        fontWeight: designTokens.typography.fontWeights.semibold,
        lineHeight: designTokens.typography.lineHeights.normal,
      },
      body1: {
        fontSize: designTokens.typography.fontSizes.base,
        fontWeight: designTokens.typography.fontWeights.regular,
        lineHeight: designTokens.typography.lineHeights.normal,
      },
      body2: {
        fontSize: designTokens.typography.fontSizes.sm,
        fontWeight: designTokens.typography.fontWeights.regular,
        lineHeight: designTokens.typography.lineHeights.normal,
      },
      caption: {
        fontSize: designTokens.typography.fontSizes.xs,
        fontWeight: designTokens.typography.fontWeights.regular,
        lineHeight: designTokens.typography.lineHeights.normal,
        color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
      },
      button: {
        fontSize: designTokens.typography.fontSizes.sm,
        fontWeight: designTokens.typography.fontWeights.medium,
        textTransform: 'none',
        letterSpacing: '0.02em',
      },
    },
    
    spacing: (factor) => `${0.25 * factor}rem`, // 4px base unit
    
    shape: {
      borderRadius: 8,
    },
    
    shadows: [
      'none',
      designTokens.shadows.sm,
      designTokens.shadows.base,
      designTokens.shadows.md,
      designTokens.shadows.lg,
      designTokens.shadows.xl,
      designTokens.shadows['2xl'],
      // Additional Material-UI shadow levels
      '0 7px 8px -4px rgba(0,0,0,0.2),0 12px 17px 2px rgba(0,0,0,0.14),0 5px 22px 4px rgba(0,0,0,0.12)',
      '0 8px 9px -5px rgba(0,0,0,0.2),0 15px 22px 2px rgba(0,0,0,0.14),0 6px 28px 5px rgba(0,0,0,0.12)',
      '0 8px 10px -5px rgba(0,0,0,0.2),0 16px 24px 2px rgba(0,0,0,0.14),0 6px 30px 5px rgba(0,0,0,0.12)',
      '0 9px 11px -5px rgba(0,0,0,0.2),0 18px 28px 2px rgba(0,0,0,0.14),0 7px 34px 6px rgba(0,0,0,0.12)',
      '0 9px 12px -6px rgba(0,0,0,0.2),0 19px 29px 2px rgba(0,0,0,0.14),0 7px 36px 6px rgba(0,0,0,0.12)',
      '0 10px 13px -6px rgba(0,0,0,0.2),0 20px 31px 3px rgba(0,0,0,0.14),0 8px 38px 7px rgba(0,0,0,0.12)',
      '0 10px 14px -6px rgba(0,0,0,0.2),0 21px 33px 3px rgba(0,0,0,0.14),0 8px 40px 7px rgba(0,0,0,0.12)',
      '0 11px 15px -7px rgba(0,0,0,0.2),0 22px 35px 3px rgba(0,0,0,0.14),0 8px 42px 7px rgba(0,0,0,0.12)',
      '0 11px 15px -7px rgba(0,0,0,0.2),0 24px 38px 3px rgba(0,0,0,0.14),0 9px 46px 8px rgba(0,0,0,0.12)',
      '0 12px 17px -8px rgba(0,0,0,0.2),0 25px 40px 3px rgba(0,0,0,0.14),0 9px 48px 8px rgba(0,0,0,0.12)',
      '0 12px 18px -8px rgba(0,0,0,0.2),0 26px 42px 4px rgba(0,0,0,0.14),0 10px 50px 8px rgba(0,0,0,0.12)',
      '0 13px 19px -8px rgba(0,0,0,0.2),0 27px 44px 4px rgba(0,0,0,0.14),0 10px 52px 9px rgba(0,0,0,0.12)',
      '0 13px 20px -9px rgba(0,0,0,0.2),0 28px 46px 4px rgba(0,0,0,0.14),0 11px 54px 9px rgba(0,0,0,0.12)',
      '0 14px 21px -9px rgba(0,0,0,0.2),0 29px 48px 4px rgba(0,0,0,0.14),0 11px 56px 10px rgba(0,0,0,0.12)',
      '0 14px 22px -9px rgba(0,0,0,0.2),0 30px 50px 5px rgba(0,0,0,0.14),0 12px 58px 10px rgba(0,0,0,0.12)',
      '0 15px 24px -10px rgba(0,0,0,0.2),0 31px 52px 5px rgba(0,0,0,0.14),0 12px 60px 10px rgba(0,0,0,0.12)',
      '0 16px 25px -10px rgba(0,0,0,0.2),0 32px 54px 5px rgba(0,0,0,0.14),0 13px 62px 11px rgba(0,0,0,0.12)',
      '0 16px 26px -11px rgba(0,0,0,0.2),0 33px 56px 5px rgba(0,0,0,0.14),0 13px 64px 11px rgba(0,0,0,0.12)',
    ],
    
    zIndex: {
      mobileStepper: 1000,
      fab: 1050,
      speedDial: 1050,
      appBar: 1100,
      drawer: 1200,
      modal: 1300,
      snackbar: 1400,
      tooltip: 1500,
    },
    
    components: {
      // Button component overrides
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: designTokens.borderRadius.lg,
            textTransform: 'none',
            fontWeight: designTokens.typography.fontWeights.medium,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: designTokens.shadows.sm,
            },
          },
          contained: {
            '&:hover': {
              boxShadow: designTokens.shadows.md,
            },
          },
        },
      },
      
      // Card component overrides
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: designTokens.borderRadius.xl,
            boxShadow: designTokens.shadows.base,
            '&:hover': {
              boxShadow: designTokens.shadows.md,
            },
          },
        },
      },
      
      // Paper component overrides
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: designTokens.borderRadius.lg,
            '&.MuiPaper-root[style*="border-radius: 0"]': {
              borderRadius: 0,
            },
          },
          elevation1: {
            boxShadow: designTokens.shadows.sm,
          },
          elevation2: {
            boxShadow: designTokens.shadows.base,
          },
          elevation3: {
            boxShadow: designTokens.shadows.md,
          },
        },
      },
      
      // AppBar component overrides
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            backdropFilter: 'none',
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
            color: isDark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.87)',
            borderRadius: 0,
          },
        },
      },
      
      // Drawer component overrides
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.12)',
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
            borderRadius: 0,
          },
        },
      },
      
      // Chip component overrides
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: designTokens.borderRadius.full,
            fontWeight: designTokens.typography.fontWeights.medium,
          },
        },
      },
      
      // TextField component overrides
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: designTokens.borderRadius.lg,
            },
          },
        },
      },
      
      // Dialog component overrides
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: designTokens.borderRadius['2xl'],
            boxShadow: designTokens.shadows.xl,
          },
        },
      },
      
      // Tooltip component overrides
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: designTokens.borderRadius.md,
            fontSize: designTokens.typography.fontSizes.xs,
            fontWeight: designTokens.typography.fontWeights.medium,
          },
        },
      },
    },
  });
};

// Export design tokens for use in components
export { designTokens };

// Theme utilities
export const getThemeColor = (theme, color, shade = 500) => {
  return theme.palette[color]?.[shade] || theme.palette[color]?.main || color;
};

export const getSpacing = (theme, multiplier) => {
  return theme.spacing(multiplier);
};

export const getShadow = (theme, level) => {
  return theme.shadows[level] || 'none';
};

// Responsive breakpoints helper
export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
};

export const mediaQuery = {
  up: (breakpoint) => `@media (min-width: ${breakpoints[breakpoint]}px)`,
  down: (breakpoint) => `@media (max-width: ${breakpoints[breakpoint] - 1}px)`,
  between: (start, end) => `@media (min-width: ${breakpoints[start]}px) and (max-width: ${breakpoints[end] - 1}px)`,
};