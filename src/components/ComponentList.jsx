import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import {
  Apps as WidgetIcon,
  CropSquare as FrameIcon,
  ViewModule as ComponentIcon,
} from '@mui/icons-material';

const ComponentList = ({ components, selectedComponent, onComponentSelect, loading }) => {
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

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Loading components...
        </Typography>
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
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Components ({components.length})
        </Typography>
      </Box>
      
      <List sx={{ p: 0 }}>
        {components.map((component, index) => (
          <React.Fragment key={component.id}>
            <ListItem disablePadding>
              <ListItemButton
                selected={selectedComponent?.id === component.id}
                onClick={() => onComponentSelect(component)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                    },
                  },
                }}
              >
                <ListItemIcon>
                  {getComponentIcon(component.type)}
                </ListItemIcon>
                <ListItemText
                  primary={component.name}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, ml: 7 }}>
                  <Chip
                    label={component.type}
                    size="small"
                    color={getComponentTypeColor(component.type)}
                    variant="outlined"
                  />
                  {component.absoluteBoundingBox && (
                    <Typography variant="caption" color="text.secondary">
                      {Math.round(component.absoluteBoundingBox.width)}×{Math.round(component.absoluteBoundingBox.height)}
                    </Typography>
                  )}
                </Box>
              </ListItemButton>
            </ListItem>
            {index < components.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default ComponentList; 