import React, { useState, useCallback } from 'react';
import {
  Box,
  CssBaseline,
  ThemeProvider,
  createTheme,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  Grid,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

import FileInput from './components/FileInput';
import ComponentList from './components/ComponentList';
import DesignPreview from './components/DesignPreview';
import CodeDisplay from './components/CodeDisplay';

import { getFigmaFile, getFigmaImages, findAllComponents, extractComponentMetadata } from './services/figmaApi';
import { generateReactComponent } from './services/geminiApi';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

const DRAWER_WIDTH = 300;

function App() {
  const [fileLoaded, setFileLoaded] = useState(false);
  const [fileKey, setFileKey] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [components, setComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [componentImage, setComponentImage] = useState(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleLoadFile = useCallback(async (key, token) => {
    setLoading(true);
    setError('');
    setFileKey(key);
    setAccessToken(token);
    
    try {
      const fileData = await getFigmaFile(key, token);
      const allComponents = findAllComponents(Object.values(fileData.document.children));
      
      setComponents(allComponents);
      setFileLoaded(true);
      setSnackbar({ open: true, message: `Loaded ${allComponents.length} components`, severity: 'success' });
    } catch (err) {
      setError(err.message);
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleComponentSelect = useCallback(async (component) => {
    setSelectedComponent(component);
    setGeneratedCode('');
    setComponentImage(null);
    
    try {
      // Fetch component image
      const imagesData = await getFigmaImages(fileKey, [component.id], accessToken);
      if (imagesData.images && imagesData.images[component.id]) {
        setComponentImage(imagesData.images[component.id]);
      }
    } catch (err) {
      console.warn('Failed to load component image:', err.message);
    }
  }, [fileKey, accessToken]);

  const handleGenerateCode = useCallback(async () => {
    if (!selectedComponent) return;
    
    setCodeLoading(true);
    setError('');
    
    try {
      const metadata = extractComponentMetadata(selectedComponent);
      const code = await generateReactComponent(metadata);
      setGeneratedCode(code);
      setSnackbar({ open: true, message: 'React component generated successfully!', severity: 'success' });
    } catch (err) {
      setError(err.message);
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setCodeLoading(false);
    }
  }, [selectedComponent]);

  const handleRefresh = () => {
    if (fileKey && accessToken) {
      handleLoadFile(fileKey, accessToken);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (!fileLoaded) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <FileInput 
          onLoadFile={handleLoadFile} 
          loading={loading} 
          error={error} 
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh' }}>
        {/* App Bar */}
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Figma to React
            </Typography>
            <IconButton color="inherit" onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Sidebar */}
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              top: 64, // Account for AppBar height
              height: 'calc(100vh - 64px)',
            },
          }}
        >
          <ComponentList
            components={components}
            selectedComponent={selectedComponent}
            onComponentSelect={handleComponentSelect}
            loading={loading}
          />
        </Drawer>

        {/* Main Content */}
        <Box sx={{ flexGrow: 1, display: 'flex', mt: 8 }}>
          <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
            {/* Design Preview */}
            <Box sx={{ width: '50%' }}>
              <DesignPreview
                selectedComponent={selectedComponent}
                componentImage={componentImage}
                loading={loading}
              />
            </Box>
            {/* Code Display */}
            <Box sx={{ width: '50%' }}>
              <CodeDisplay
                generatedCode={generatedCode}
                loading={codeLoading}
                error={error}
                selectedComponent={selectedComponent}
                onGenerateCode={handleGenerateCode}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;
