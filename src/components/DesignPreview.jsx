import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Grid,
  Card,
  CardContent,
  Skeleton,
} from '@mui/material';
import { Image as ImageIcon } from '@mui/icons-material';

const DesignPreview = ({ 
  selectedComponent, 
  componentImage, 
  loading,
  pageGenerationMode = false,
  selectedComponentsForPage = []
}) => {
  if (pageGenerationMode) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'background.default',
        }}
      >
        <Box sx={{ textAlign: 'center', p: 3 }}>
          <ImageIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Page Generation Mode
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedComponentsForPage.length > 0 
              ? `Selected ${selectedComponentsForPage.length} components for page generation`
              : 'Select components from the sidebar to generate a complete page'
            }
          </Typography>
          {selectedComponentsForPage.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Selected Components:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 200, overflow: 'auto' }}>
                {selectedComponentsForPage.map((comp, index) => (
                  <Chip
                    key={comp.id}
                    label={`${comp.name} (${comp.type})`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  if (!selectedComponent) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'background.default',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <ImageIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Select a component to preview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose a component from the sidebar to see its design preview
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Paper sx={{ p: 3, height: '100%', borderRadius: 0 }}>
        <Typography variant="h5" gutterBottom>
          {selectedComponent.name}
        </Typography>
        
        <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
          <Chip label={selectedComponent.type} color="primary" />
          {selectedComponent.absoluteBoundingBox && (
            <Chip
              label={`${Math.round(selectedComponent.absoluteBoundingBox.width)}×${Math.round(selectedComponent.absoluteBoundingBox.height)}px`}
              variant="outlined"
            />
          )}
        </Box>

        {/* Component Image Preview */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Design Preview
          </Typography>
          
          {loading ? (
            <Skeleton variant="rectangular" width="100%" height={300} />
          ) : componentImage ? (
            <Box
              className="design-preview-container"
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                backgroundColor: '#fafafa', // Always soft white background
                p: 2,
              }}
            >
              <img
                src={componentImage}
                alt={selectedComponent.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '400px',
                  objectFit: 'contain',
                }}
              />
            </Box>
          ) : (
            <Box
              className="design-preview-container"
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                height: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fafafa', // Always soft white background
              }}
            >
              <Typography color="text.secondary">
                No preview image available
              </Typography>
            </Box>
          )}
        </Box>

        {/* Component Metadata */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Component Details
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Card variant="outlined" sx={{ flex: '1 1 250px', minWidth: 200 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  ID
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {selectedComponent.id}
                </Typography>
              </CardContent>
            </Card>
            {selectedComponent.characters && (
              <Card variant="outlined" sx={{ flex: '1 1 250px', minWidth: 200 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Text Content
                  </Typography>
                  <Typography variant="body2">
                    "{selectedComponent.characters}"
                  </Typography>
                </CardContent>
              </Card>
            )}
            {selectedComponent.fills && selectedComponent.fills.length > 0 && (
              <Card variant="outlined" sx={{ flex: '1 1 250px', minWidth: 200 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Background Colors
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedComponent.fills.map((fill, index) => (
                      <Chip
                        key={index}
                        label={fill.type}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default DesignPreview; 