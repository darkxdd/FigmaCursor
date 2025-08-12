import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  CircularProgress,
  Paper,
  Fade,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as PendingIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

const LoadingFeedback = ({
  loading = false,
  progress = null,
  message = 'Loading...',
  steps = [],
  currentStep = 0,
  variant = 'linear', // 'linear', 'circular', 'steps'
  size = 'medium',
  showDetails = false,
  error = null,
}) => {
  if (!loading && !error) {
    return null;
  }

  const getStepIcon = (stepIndex, currentStep, error) => {
    if (error && stepIndex === currentStep) {
      return <ErrorIcon color="error" />;
    } else if (stepIndex < currentStep) {
      return <CheckIcon color="success" />;
    } else if (stepIndex === currentStep) {
      return <CircularProgress size={20} />;
    } else {
      return <PendingIcon color="disabled" />;
    }
  };

  const getStepStatus = (stepIndex, currentStep, error) => {
    if (error && stepIndex === currentStep) {
      return 'error';
    } else if (stepIndex < currentStep) {
      return 'completed';
    } else if (stepIndex === currentStep) {
      return 'active';
    } else {
      return 'pending';
    }
  };

  return (
    <Fade in={loading || !!error}>
      <Paper
        elevation={2}
        sx={{
          p: 3,
          m: 2,
          backgroundColor: error ? 'error.light' : 'background.paper',
          borderLeft: error ? '4px solid' : '4px solid',
          borderLeftColor: error ? 'error.main' : 'primary.main',
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {variant === 'circular' && !error && (
            <CircularProgress
              size={size === 'small' ? 20 : size === 'large' ? 40 : 30}
              sx={{ mr: 2 }}
            />
          )}
          {error && (
            <ErrorIcon color="error" sx={{ mr: 2 }} />
          )}
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant={size === 'small' ? 'body2' : 'h6'}
              color={error ? 'error.main' : 'text.primary'}
            >
              {error ? 'Error Occurred' : message}
            </Typography>
            {progress !== null && !error && (
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.secondary',
                  opacity: 0.9,
                  fontWeight: 500
                }}
              >
                {Math.round(progress)}% complete
              </Typography>
            )}
          </Box>
          {steps.length > 0 && (
            <Chip
              label={`${currentStep + 1}/${steps.length}`}
              size="small"
              color={error ? 'error' : 'primary'}
              variant="outlined"
            />
          )}
        </Box>

        {/* Progress Bar */}
        {variant === 'linear' && progress !== null && !error && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                },
              }}
            />
          </Box>
        )}

        {/* Error Message */}
        {error && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="error.main">
              {error.message || 'An unexpected error occurred'}
            </Typography>
            {error.suggestions && error.suggestions.length > 0 && showDetails && (
              <Box sx={{ mt: 1 }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary',
                    opacity: 0.9,
                    fontWeight: 500
                  }}
                >
                  Suggestions:
                </Typography>
                <List dense>
                  {error.suggestions.slice(0, 3).map((suggestion, index) => (
                    <ListItem key={index} sx={{ py: 0.5, pl: 2 }}>
                      <ListItemIcon sx={{ minWidth: 20 }}>
                        <InfoIcon sx={{ fontSize: 16 }} color="info" />
                      </ListItemIcon>
                      <ListItemText
                        primary={suggestion}
                        primaryTypographyProps={{
                          variant: 'caption',
                          color: 'text.secondary',
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}

        {/* Steps */}
        {variant === 'steps' && steps.length > 0 && (
          <List dense>
            {steps.map((step, index) => {
              const status = getStepStatus(index, currentStep, error);
              return (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getStepIcon(index, currentStep, error)}
                  </ListItemIcon>
                  <ListItemText
                    primary={step.title || step}
                    secondary={step.description}
                    primaryTypographyProps={{
                      color: status === 'error' ? 'error.main' :
                             status === 'completed' ? 'success.main' :
                             status === 'active' ? 'primary.main' : 'text.secondary',
                      fontWeight: status === 'active' ? 'medium' : 'normal',
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                    }}
                  />
                  {status === 'completed' && (
                    <Chip
                      label="Done"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  )}
                  {status === 'active' && !error && (
                    <Chip
                      label="In Progress"
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {status === 'error' && (
                    <Chip
                      label="Failed"
                      size="small"
                      color="error"
                      variant="outlined"
                    />
                  )}
                </ListItem>
              );
            })}
          </List>
        )}

        {/* Additional Details */}
        {showDetails && !error && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary',
                opacity: 0.9,
                fontWeight: 400
              }}
            >
              This may take a few moments depending on the complexity of your design.
            </Typography>
          </Box>
        )}
      </Paper>
    </Fade>
  );
};

export default LoadingFeedback;