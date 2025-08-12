import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  AppBar,
  Toolbar,
  Tooltip,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Link as LinkIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';

const FileInput = ({ onLoadFile, loading, error, darkMode, onToggleDarkMode }) => {
  const [fileKey, setFileKey] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [showToken, setShowToken] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (fileKey.trim() && accessToken.trim()) {
      onLoadFile(fileKey.trim(), accessToken.trim());
    }
  };

  const handleShowToken = () => {
    setShowToken(!showToken);
  };

  return (
    <Box 
      className="file-input-container file-input-background"
      sx={{ 
        height: '100vh', 
        width: '100vw',
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Enhanced App Bar with Dark Mode Switch */}
      <AppBar 
        position="static" 
        sx={{
          width: '100%',
          background: darkMode 
            ? 'linear-gradient(135deg, rgba(18, 18, 18, 0.98), rgba(30, 30, 30, 0.95))'
            : 'linear-gradient(135deg, rgba(25, 118, 210, 0.98), rgba(21, 101, 192, 0.95))',
          backdropFilter: 'blur(20px)',
          boxShadow: darkMode 
            ? '0 8px 32px rgba(0, 0, 0, 0.3)'
            : '0 8px 32px rgba(25, 118, 210, 0.2)',
          borderBottom: darkMode 
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <Toolbar 
          sx={{ 
            minHeight: 72,
            width: '100%',
            maxWidth: 'none',
            px: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <LinkIcon sx={{ fontSize: 28, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h5" component="div" sx={{ fontWeight: 700, color: 'white' }}>
                Figma to React Generator
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                Transform your designs into React components
              </Typography>
            </Box>
          </Box>
          <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            <IconButton 
              color="inherit" 
              onClick={onToggleDarkMode}
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.2)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                },
              }}
            >
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: '100%',
          px: 2,
        }}
      >
        <Box sx={{ maxWidth: 650, mx: 'auto', p: 3, width: '100%' }}>
          <Paper 
            className="file-input-paper"
            sx={{ 
              p: 5,
              borderRadius: 4,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #1976d2, #1565c0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                  boxShadow: '0 8px 24px rgba(25, 118, 210, 0.3)',
                }}
              >
                <LinkIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>
              <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: 'text.primary' }}>
                Get Started
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
                Connect your Figma file and generate beautiful React components
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Figma File Key"
                  value={fileKey}
                  onChange={(e) => setFileKey(e.target.value)}
                  placeholder="e.g., abcdefghijklmnop"
                  required
                  fullWidth
                  helperText="Find this in your Figma file URL: figma.com/file/KEY/..."
                  disabled={loading}
                />

                <TextField
                  label="Personal Access Token"
                  type={showToken ? 'text' : 'password'}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Enter your Figma personal access token"
                  required
                  fullWidth
                  helperText="Get this from Figma Settings > Account > Personal access tokens"
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleShowToken}
                          edge="end"
                          disabled={loading}
                        >
                          {showToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {error && (
                  <Alert severity="error">
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={!fileKey.trim() || !accessToken.trim() || loading}
                  startIcon={loading ? <CircularProgress size={22} color="inherit" /> : <LinkIcon sx={{ fontSize: '1.2rem' }} />}
                  sx={{
                    height: 56,
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: 2.5,
                    fontSize: '1.1rem',
                    background: 'linear-gradient(135deg, #1976d2, #1565c0)',
                    boxShadow: '0 6px 20px rgba(25, 118, 210, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
                      boxShadow: '0 8px 25px rgba(25, 118, 210, 0.4)',
                      transform: 'translateY(-2px)',
                    },
                    '&:disabled': {
                      background: 'linear-gradient(135deg, #bdbdbd, #9e9e9e)',
                      boxShadow: 'none',
                      transform: 'none',
                    },
                  }}
                >
                  {loading ? 'Loading File...' : 'Load Figma File'}
                </Button>
              </Box>
            </form>

            <Box sx={{ mt: 4, p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                How to get your Figma file key and access token:
              </Typography>
              <Typography variant="body2" color="text.secondary" component="div">
                <ol style={{ margin: 0, paddingLeft: 20 }}>
                  <li>
                    <strong>File Key:</strong> Open your Figma file and copy the key from the URL:
                    <br />
                    <code>figma.com/file/YOUR_FILE_KEY/...</code>
                  </li>
                  <li>
                    <strong>Access Token:</strong> Go to Figma Settings → Account → Personal access tokens → Create new token
                  </li>
                </ol>
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default FileInput; 