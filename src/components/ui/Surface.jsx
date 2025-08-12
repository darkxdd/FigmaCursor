import React from 'react';
import { Paper, Box } from '@mui/material';
import { designTokens } from '../../theme';

/**
 * Surface component - A consistent container with elevation and spacing
 */
const Surface = ({
  children,
  elevation = 1,
  padding = 3,
  margin = 0,
  borderRadius = 'lg',
  variant = 'paper', // 'paper' | 'outlined' | 'filled'
  sx = {},
  ...props
}) => {
  const getBorderRadius = (radius) => {
    if (typeof radius === 'string') {
      return designTokens.borderRadius[radius] || designTokens.borderRadius.lg;
    }
    return radius;
  };

  const baseStyles = {
    p: padding,
    m: margin,
    borderRadius: getBorderRadius(borderRadius),
    ...sx,
  };

  if (variant === 'outlined') {
    return (
      <Box
        sx={{
          ...baseStyles,
          border: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
        {...props}
      >
        {children}
      </Box>
    );
  }

  if (variant === 'filled') {
    return (
      <Box
        sx={{
          ...baseStyles,
          backgroundColor: 'background.surface',
        }}
        {...props}
      >
        {children}
      </Box>
    );
  }

  return (
    <Paper
      elevation={elevation}
      sx={baseStyles}
      {...props}
    >
      {children}
    </Paper>
  );
};

export default Surface;