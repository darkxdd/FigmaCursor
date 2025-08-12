import React from 'react';
import { Box, Typography, Chip, CircularProgress } from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Schedule as PendingIcon,
} from '@mui/icons-material';

/**
 * StatusIndicator component - Consistent status display with icons and colors
 */
const StatusIndicator = ({
  status = 'info', // 'success' | 'error' | 'warning' | 'info' | 'pending' | 'loading'
  message,
  size = 'medium', // 'small' | 'medium' | 'large'
  variant = 'chip', // 'chip' | 'inline' | 'badge'
  showIcon = true,
  sx = {},
  ...props
}) => {
  const getStatusConfig = (status) => {
    const configs = {
      success: {
        color: 'success',
        icon: SuccessIcon,
        label: 'Success',
      },
      error: {
        color: 'error',
        icon: ErrorIcon,
        label: 'Error',
      },
      warning: {
        color: 'warning',
        icon: WarningIcon,
        label: 'Warning',
      },
      info: {
        color: 'info',
        icon: InfoIcon,
        label: 'Info',
      },
      pending: {
        color: 'default',
        icon: PendingIcon,
        label: 'Pending',
      },
      loading: {
        color: 'primary',
        icon: CircularProgress,
        label: 'Loading',
      },
    };
    return configs[status] || configs.info;
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const getIconSize = (size) => {
    const sizes = {
      small: 16,
      medium: 20,
      large: 24,
    };
    return sizes[size] || sizes.medium;
  };

  const iconSize = getIconSize(size);

  if (variant === 'chip') {
    return (
      <Chip
        icon={showIcon ? (
          status === 'loading' ? (
            <CircularProgress size={iconSize} />
          ) : (
            <Icon sx={{ fontSize: iconSize }} />
          )
        ) : undefined}
        label={message || config.label}
        color={config.color}
        size={size === 'large' ? 'medium' : 'small'}
        variant="outlined"
        sx={sx}
        {...props}
      />
    );
  }

  if (variant === 'inline') {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          ...sx,
        }}
        {...props}
      >
        {showIcon && (
          status === 'loading' ? (
            <CircularProgress size={iconSize} color={config.color} />
          ) : (
            <Icon
              sx={{
                fontSize: iconSize,
                color: `${config.color}.main`,
              }}
            />
          )
        )}
        {message && (
          <Typography
            variant={size === 'small' ? 'caption' : 'body2'}
            color={config.color === 'default' ? 'text.secondary' : `${config.color}.main`}
          >
            {message}
          </Typography>
        )}
      </Box>
    );
  }

  if (variant === 'badge') {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: iconSize + 8,
          height: iconSize + 8,
          borderRadius: '50%',
          backgroundColor: `${config.color}.main`,
          color: `${config.color}.contrastText`,
          ...sx,
        }}
        {...props}
      >
        {status === 'loading' ? (
          <CircularProgress size={iconSize - 4} color="inherit" />
        ) : (
          <Icon sx={{ fontSize: iconSize - 4 }} />
        )}
      </Box>
    );
  }

  return null;
};

export default StatusIndicator;