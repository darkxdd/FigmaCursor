import React, { memo, useMemo, useCallback } from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Checkbox,
} from '@mui/material';
import {
  Apps as WidgetIcon,
  CropSquare as FrameIcon,
  ViewModule as ComponentIcon,
  Memory as MemoryIcon,
} from '@mui/icons-material';

const ComponentList = ({ 
  components, 
  selectedComponent, 
  onComponentSelect, 
  loading, 
  totalComponents, 
  currentPage, 
  pageSize,
  pageGenerationMode = false,
  selectedComponentsForPage = [],
  onComponentSelectForPage
}) => {
  const getComponentIcon = (type) => {
    switch (type) {
      case 'COMPONENT':
        return <ComponentIcon />;
      case 'INSTANCE':
        return <WidgetIcon />;
      case 'FRAME':
        return <FrameIcon />;
      default:
        return <WidgetIcon />;
    }
  };

  const getComponentTypeColor = (type) => {
    switch (type) {
      case 'COMPONENT':
        return 'primary';
      case 'INSTANCE':
        return 'secondary';
      case 'FRAME':
        return 'default';
      default:
        return 'default';
    }
  };

  // Calculate memory usage indicator
  const memoryUsage = totalComponents > 0 ? (components.length / totalComponents) * 100 : 0;
  const estimatedMemory = Math.round((components.length * 0.5) + (totalComponents * 0.1)); // Rough estimate in MB

  const handleComponentClick = (component) => {
    if (pageGenerationMode) {
      onComponentSelectForPage(component);
    } else {
      onComponentSelect(component);
    }
  };

  const isComponentSelectedForPage = (component) => {
    return selectedComponentsForPage.some(c => c.id === component.id);
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Loading components...
        </Typography>
        <LinearProgress sx={{ mt: 1 }} />
      </Box>
    );
  }

  if (!components || components.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No components found. Please check your Figma file.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {/* Memory Usage Indicator */}
      <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <MemoryIcon fontSize="small" color="action" />
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              opacity: 0.9,
              fontWeight: 500
            }}
          >
            {pageGenerationMode ? 'Page Generation Mode' : 'Memory Optimized'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              opacity: 0.9,
              fontWeight: 500
            }}
          >
            {pageGenerationMode 
              ? `Selected: ${selectedComponentsForPage.length}`
              : `Loaded: ${components.length}/${totalComponents}`
            }
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              opacity: 0.9,
              fontWeight: 500
            }}
          >
            ~{estimatedMemory}MB
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={pageGenerationMode ? (selectedComponentsForPage.length / Math.max(components.length, 1)) * 100 : memoryUsage} 
          size="small"
          sx={{ 
            height: 4, 
            borderRadius: 2,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': {
              bgcolor: pageGenerationMode 
                ? (selectedComponentsForPage.length > 0 ? '#7b1fa2' : 'grey.400')
                : (memoryUsage > 80 ? 'warning.main' : 'success.main')
            }
          }} 
        />
      </Box>
      
      <List sx={{ p: 0 }}>
        {components.map((component, index) => (
          <React.Fragment key={component.id}>
            <ListItem disablePadding>
              <ListItemButton
                selected={pageGenerationMode 
                  ? isComponentSelectedForPage(component)
                  : selectedComponent?.id === component.id
                }
                onClick={() => handleComponentClick(component)}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  my: 0.5,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  },
                  '&.Mui-selected': {
                    backgroundColor: pageGenerationMode 
                      ? 'rgba(123, 31, 162, 0.1)' 
                      : 'rgba(25, 118, 210, 0.1)',
                    background: pageGenerationMode 
                      ? 'linear-gradient(135deg, rgba(123, 31, 162, 0.15), rgba(106, 27, 154, 0.1))'
                      : 'linear-gradient(135deg, rgba(25, 118, 210, 0.15), rgba(21, 101, 192, 0.1))',
                    border: pageGenerationMode 
                      ? '1px solid rgba(123, 31, 162, 0.3)'
                      : '1px solid rgba(25, 118, 210, 0.3)',
                    boxShadow: pageGenerationMode 
                      ? '0 4px 12px rgba(123, 31, 162, 0.2)'
                      : '0 4px 12px rgba(25, 118, 210, 0.2)',
                    '&:hover': {
                      backgroundColor: pageGenerationMode 
                        ? 'rgba(123, 31, 162, 0.2)' 
                        : 'rgba(25, 118, 210, 0.2)',
                      transform: 'translateY(-2px)',
                      boxShadow: pageGenerationMode 
                        ? '0 6px 16px rgba(123, 31, 162, 0.3)'
                        : '0 6px 16px rgba(25, 118, 210, 0.3)',
                    },
                  },
                }}
              >
                {pageGenerationMode && (
                  <Checkbox
                    checked={isComponentSelectedForPage(component)}
                    size="small"
                    sx={{ 
                      mr: 1,
                      color: '#7b1fa2',
                      '&.Mui-checked': {
                        color: '#7b1fa2',
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(123, 31, 162, 0.1)',
                      },
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                <ListItemIcon>
                  {getComponentIcon(component.type)}
                </ListItemIcon>
                <ListItemText
                  primary={component.name}
                  secondary={
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: 'text.secondary',
                        opacity: 0.9,
                        fontWeight: 400
                      }}
                    >
                      {component.type} • {Math.round(component.absoluteBoundingBox?.width || 0)}×{Math.round(component.absoluteBoundingBox?.height || 0)}
                      {pageGenerationMode && isComponentSelectedForPage(component) && (
                        <Box 
                          component="span" 
                          sx={{ 
                            color: '#7b1fa2', 
                            fontWeight: 'bold',
                            opacity: 1
                          }}
                        > • Selected</Box>
                      )}
                    </Typography>
                  }
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, ml: pageGenerationMode ? 0 : 7 }}>
                  <Chip
                    label={component.type}
                    size="small"
                    color={getComponentTypeColor(component.type)}
                    variant="outlined"
                    sx={{
                      borderRadius: 1.5,
                      fontWeight: 500,
                      fontSize: '0.75rem',
                      height: 24,
                      '& .MuiChip-label': {
                        px: 1,
                      },
                    }}
                  />
                </Box>
              </ListItemButton>
            </ListItem>

          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default ComponentList; 