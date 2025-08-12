import React from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  BugReport as BugIcon,
  Lightbulb as SuggestionIcon,
} from '@mui/icons-material';
import { logError, classifyError, ERROR_SEVERITY } from '../utils/errorHandler';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      appError: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error with context
    const appError = logError(error, {
      source: 'react_boundary',
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.name || 'Unknown',
    });

    this.setState({
      error,
      errorInfo,
      appError,
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      appError: null,
    });
    
    // Call optional retry callback
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleReportError = () => {
    const { appError } = this.state;
    if (appError) {
      const errorReport = {
        title: appError.title,
        message: appError.message,
        timestamp: appError.timestamp,
        userAgent: navigator.userAgent,
        url: window.location.href,
      };
      
      // In a real app, you'd send this to your error reporting service
      console.log('Error Report:', errorReport);
      
      // For now, copy to clipboard
      navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
      alert('Error report copied to clipboard');
    }
  };

  getSeverityColor = (severity) => {
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

  render() {
    if (this.state.hasError) {
      const { appError } = this.state;
      const userFriendly = appError?.toUserFriendly() || {
        title: 'Something went wrong',
        message: 'An unexpected error occurred in the application.',
        suggestions: ['Try refreshing the page', 'Contact support if the problem persists'],
        severity: ERROR_SEVERITY.HIGH,
        recoverable: true,
      };

      return (
        <Box
          sx={{
            minHeight: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              maxWidth: 600,
              width: '100%',
              p: 4,
              textAlign: 'center',
            }}
          >
            {/* Error Icon and Title */}
            <Box sx={{ mb: 3 }}>
              <ErrorIcon
                sx={{
                  fontSize: 64,
                  color: 'error.main',
                  mb: 2,
                }}
              />
              <Typography variant="h4" gutterBottom>
                {userFriendly.title}
              </Typography>
              <Chip
                label={userFriendly.severity}
                color={this.getSeverityColor(userFriendly.severity)}
                size="small"
                sx={{ mb: 2 }}
              />
            </Box>

            {/* Error Message */}
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              <AlertTitle>Error Details</AlertTitle>
              {userFriendly.message}
            </Alert>

            {/* Recovery Suggestions */}
            {userFriendly.suggestions && userFriendly.suggestions.length > 0 && (
              <Box sx={{ mb: 3, textAlign: 'left' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <SuggestionIcon sx={{ mr: 1 }} />
                  What you can try:
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

            <Divider sx={{ mb: 3 }} />

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              {userFriendly.recoverable && (
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRetry}
                  size="large"
                >
                  Try Again
                </Button>
              )}
              
              <Button
                variant="outlined"
                startIcon={<BugIcon />}
                onClick={this.handleReportError}
                size="large"
              >
                Report Error
              </Button>
              
              <Button
                variant="text"
                onClick={() => window.location.reload()}
                size="large"
              >
                Refresh Page
              </Button>
            </Box>

            {/* Development Info */}
            {import.meta.env.DEV && this.state.error && (
              <Box sx={{ mt: 3, textAlign: 'left' }}>
                <Typography variant="h6" gutterBottom>
                  Development Info:
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    backgroundColor: 'grey.100',
                    p: 2,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    overflow: 'auto',
                    maxHeight: 200,
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </Box>
              </Box>
            )}
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;