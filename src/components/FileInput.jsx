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
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Link as LinkIcon,
} from '@mui/icons-material';

const FileInput = ({ onLoadFile, loading, error }) => {
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
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <LinkIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Figma to React
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Connect your Figma file and generate React components with Material-UI
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
              startIcon={loading ? <CircularProgress size={20} /> : <LinkIcon />}
            >
              {loading ? 'Loading File...' : 'Load Figma File'}
            </Button>
          </Box>
        </form>

        <Box sx={{ mt: 4, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
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
  );
};

export default FileInput; 