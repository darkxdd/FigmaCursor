import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import {
  Inbox as InboxIcon,
  CloudOff as CloudOffIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

/**
 * EmptyState component - Consistent empty state display with actions
 */
const EmptyState = ({
  icon: CustomIcon,
  title,
  description,
  action,
  actionText,
  onAction,
  variant = 'default', // 'default' | 'search' | 'error' | 'offline'
  size = 'medium', // 'small' | 'medium' | 'large'
  sx = {},
  ...props
}) => {
  const getVariantConfig = (variant) => {
    const configs = {
      default: {
        icon: InboxIcon,
        title: 'No items found',
        description: 'There are no items to display at the moment.',
      },
      search: {
        icon: SearchIcon,
        title: 'No results found',
        description: 'Try adjusting your search criteria or filters.',
      },
      error: {
        icon: ErrorIcon,
        title: 'Something went wrong',
        description: 'We encountered an error while loading the content.',
      },
      offline: {
        icon: CloudOffIcon,
        title: 'No connection',
        description: 'Please check your internet connection and try again.',
      },
    };
    return configs[variant] || configs.default;
  };

  const config = getVariantConfig(variant);
  const Icon = CustomIcon || config.icon;

  const getSizeConfig = (size) => {
    const configs = {
      small: {
        iconSize: 48,
        titleVariant: 'h6',
        descriptionVariant: 'body2',
        spacing: 2,
        maxWidth: 300,
      },
      medium: {
        iconSize: 64,
        titleVariant: 'h5',
        descriptionVariant: 'body1',
        spacing: 3,
        maxWidth: 400,
      },
      large: {
        iconSize: 80,
        titleVariant: 'h4',
        descriptionVariant: 'body1',
        spacing: 4,
        maxWidth: 500,
      },
    };
    return configs[size] || configs.medium;
  };

  const sizeConfig = getSizeConfig(size);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: sizeConfig.spacing * 2,
        px: 3,
        maxWidth: sizeConfig.maxWidth,
        mx: 'auto',
        ...sx,
      }}
      {...props}
    >
      <Icon
        sx={{
          fontSize: sizeConfig.iconSize,
          color: 'text.disabled',
          mb: sizeConfig.spacing,
        }}
      />
      
      <Stack spacing={sizeConfig.spacing} alignItems="center">
        <Typography
          variant={sizeConfig.titleVariant}
          color="text.primary"
          fontWeight="medium"
        >
          {title || config.title}
        </Typography>
        
        {(description || config.description) && (
          <Typography
            variant={sizeConfig.descriptionVariant}
            color="text.secondary"
            sx={{ maxWidth: '100%' }}
          >
            {description || config.description}
          </Typography>
        )}
        
        {(action || (actionText && onAction)) && (
          <Box sx={{ mt: sizeConfig.spacing }}>
            {action || (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onAction}
                size={size === 'small' ? 'small' : 'medium'}
              >
                {actionText}
              </Button>
            )}
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default EmptyState;