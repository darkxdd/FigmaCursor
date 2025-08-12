import React from 'react';
import { Grid, Box } from '@mui/material';
import { useTheme, useMediaQuery } from '@mui/material';

/**
 * ResponsiveGrid component - Flexible grid system with responsive breakpoints
 */
const ResponsiveGrid = ({
  children,
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
  spacing = 3,
  minItemWidth = 280,
  maxItemWidth = 400,
  autoFit = false,
  sx = {},
  ...props
}) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.up('lg'));

  // Auto-fit grid using CSS Grid
  if (autoFit) {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}px, ${maxItemWidth}px))`,
          gap: theme.spacing(spacing),
          justifyContent: 'center',
          ...sx,
        }}
        {...props}
      >
        {children}
      </Box>
    );
  }

  // Get current column count based on breakpoint
  const getCurrentColumns = () => {
    if (isXs) return columns.xs || 1;
    if (isSm) return columns.sm || 2;
    if (isMd) return columns.md || 3;
    if (isLg) return columns.lg || 4;
    return columns.xl || 4;
  };

  const currentColumns = getCurrentColumns();

  return (
    <Grid container spacing={spacing} sx={sx} {...props}>
      {React.Children.map(children, (child, index) => (
        <Grid
          item
          xs={12 / (columns.xs || 1)}
          sm={12 / (columns.sm || 2)}
          md={12 / (columns.md || 3)}
          lg={12 / (columns.lg || 4)}
          xl={12 / (columns.xl || 4)}
          key={index}
        >
          {child}
        </Grid>
      ))}
    </Grid>
  );
};

/**
 * GridItem component - Individual grid item with consistent styling
 */
export const GridItem = ({
  children,
  aspectRatio,
  minHeight,
  sx = {},
  ...props
}) => {
  const itemStyles = {
    width: '100%',
    ...(aspectRatio && {
      aspectRatio: aspectRatio,
    }),
    ...(minHeight && {
      minHeight: minHeight,
    }),
    ...sx,
  };

  return (
    <Box sx={itemStyles} {...props}>
      {children}
    </Box>
  );
};

export default ResponsiveGrid;