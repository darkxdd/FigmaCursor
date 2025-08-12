import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  BugReport as BugIcon,
  Lightbulb as SuggestionIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { ERROR_SEVERITY } from '../utils/errorHandler';

const ErrorDialog = ({
  open = false,
  onClose,
  error = null,
  onRetry = null,
  onReport = null,
  showTechnicalDetails = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!error) return null;

  const userFriendly = error.toUserFriendly ? error.toUserFriendly() : {
    title: 'Error',
    message: error.message || 'An unexpected error occurred',
    suggestions: ['Try again later'],
    severity: ERROR_SEVERITY.MEDIUM,
    recoverable: true,
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
        return 'error';
      case ERROR_SEVERITY.HIGH:
        return 'error';
      case ERROR_SEVERITY.MEDIUM:
        return 'warning';
      case ERROR_SEVERITY.LOW:
        return 'info';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
        return '🚨';
      case ERROR_SEVERITY.HIGH:
        return '❌';
      case ERROR_SEVERITY.MEDIUM:
        return '⚠️';
      case ERROR_SEVERITY.LOW:
        return 'ℹ️';
      default:
        return '❓';
    }
  };

  const handleCopyError = async () => {
    const errorDetails = {
      title: userFriendly.title,
      message: userFriendly.message,
      severity: userFriendly.severity,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...(error.toDetailed && error.toDetailed()),
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  const handleRetry = () => {
    onClose();
    if (onRetry) {
      onRetry();
    }
  };

  const handleReport = () => {
    if (onReport) {
      onReport(error);
    } else {
      handleCopyError();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderTop: 4,
          borderTopColor: getSeverityColor(userFriendly.severity) + '.main',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" component="span" sx={{ mr: 2 }}>
              {getSeverityIcon(userFriendly.severity)} {userFriendly.title}
            </Typography>
            <Chip
              label={userFriendly.severity}
              color={getSeverityColor(userFriendly.severity)}
              size="small"
            />
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Main Error Message */}
        <Alert severity={getSeverityColor(userFriendly.severity)} sx={{ mb: 3 }}>
          <AlertTitle>What happened?</AlertTitle>
          {userFriendly.message}
        </Alert>

        {/* Retry Information */}
        {userFriendly.retryAfter && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ScheduleIcon sx={{ mr: 1 }} />
              <Typography variant="body2">
                You can try again in {Math.ceil(userFriendly.retryAfter / 1000)} seconds
              </Typography>
            </Box>
          </Alert>
        )}

        {/* Recovery Suggestions */}
        {userFriendly.suggestions && userFriendly.suggestions.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <SuggestionIcon sx={{ mr: 1 }} />
              How to fix this:
            </Typography>
            <List dense>
              {userFriendly.suggestions.map((suggestion, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: 'primary.main',
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText primary={suggestion} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Technical Details */}
        {showTechnicalDetails && error.toDetailed && (
          <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Technical Details</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ position: 'relative' }}>
                <Tooltip title={copied ? 'Copied!' : 'Copy error details'}>
                  <IconButton
                    size="small"
                    onClick={handleCopyError}
                    sx={{ position: 'absolute', top: 0, right: 0 }}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Box
                  component="pre"
                  sx={{
                    backgroundColor: 'grey.100',
                    p: 2,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    overflow: 'auto',
                    maxHeight: 300,
                    pr: 5, // Make room for copy button
                  }}
                >
                  {JSON.stringify(error.toDetailed(), null, 2)}
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<BugIcon />}
              onClick={handleReport}
              variant="outlined"
              size="small"
            >
              Report Issue
            </Button>
            {showTechnicalDetails && (
              <Button
                startIcon={<CopyIcon />}
                onClick={handleCopyError}
                variant="text"
                size="small"
                disabled={copied}
              >
                {copied ? 'Copied!' : 'Copy Details'}
              </Button>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={onClose} variant="text">
              Close
            </Button>
            {userFriendly.recoverable && onRetry && (
              <Button
                startIcon={<RefreshIcon />}
                onClick={handleRetry}
                variant="contained"
                color="primary"
              >
                Try Again
              </Button>
            )}
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ErrorDialog;