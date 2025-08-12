import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  CssBaseline,
  ThemeProvider,
  Grid,
  Alert,
  Snackbar,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Assessment as AssessmentIcon,
  Code as CodeIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

import FileInput from './components/FileInput';
import ComponentList from './components/ComponentList';
import DesignPreview from './components/DesignPreview';
import CodeDisplay from './components/CodeDisplay';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingFeedback from './components/LoadingFeedback';
import ErrorDialog from './components/ErrorDialog';
import AppLayout from './components/layout/AppLayout';
import Surface from './components/ui/Surface';
import StatusIndicator from './components/ui/StatusIndicator';
import EmptyState from './components/ui/EmptyState';

import { 
  getFigmaFile, 
  getFigmaImages, 
  findAllComponents, 
  extractSimplifiedMetadata,
  getComponentsWithPagination,
  getComponentsByType,
  getTopLevelComponents,
  batchProcessComponents,
  setProgressCallback,
  optimizeMetadataForTokens,
  validateAndSanitizeComponent
} from './services/figmaApi';
import { 
  generateReactComponent, 
  generateCompletePage, 
  generateVisuallyAccurateComponent,
  generateWithFallback 
} from './services/geminiApi';
import { AppError, logError, classifyError } from './utils/errorHandler';
import { createAppTheme } from './theme';

const DRAWER_WIDTH = 320;

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
  
  // Enhanced error handling state
  const [errorDialog, setErrorDialog] = useState({ open: false, error: null });
  const [loadingState, setLoadingState] = useState({
    active: false,
    message: '',
    progress: null,
    steps: [],
    currentStep: 0,
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalComponents, setTotalComponents] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  // Filter state
  const [componentType, setComponentType] = useState('all');
  const [allComponentsData, setAllComponentsData] = useState(null); // Store full data for filtering
  
  // Page generation state
  const [pageGenerationMode, setPageGenerationMode] = useState(false);
  const [selectedComponentsForPage, setSelectedComponentsForPage] = useState([]);
  
  // Dark mode state
  const [darkMode, setDarkMode] = useState(true);

  // Sync dark mode with CSS variables
  useEffect(() => {
    document.documentElement.setAttribute('data-mui-color-scheme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleLoadFile = useCallback(async (key, token) => {
    setLoading(true);
    setError('');
    setFileKey(key);
    setAccessToken(token);
    
    // Start enhanced loading state
    startLoading('Loading Figma file...', [
      { title: 'Validating credentials', description: 'Checking Figma access token' },
      { title: 'Fetching file data', description: 'Downloading design information' },
      { title: 'Processing components', description: 'Analyzing design structure' },
      { title: 'Optimizing data', description: 'Preparing for code generation' },
    ]);
    
    // Set up progress callback for enhanced API
    setProgressCallback((progress) => {
      updateLoadingState({
        message: progress.message,
        progress: progress.percentage,
        currentStep: Math.floor((progress.percentage || 0) / 25), // Rough step calculation
      });
    });
    
    try {
      // Use enhanced file loading with validation and progress tracking
      const fileData = await getFigmaFile(key, token, {
        includeGeometry: false, // Don't include geometry to save bandwidth
        includePluginData: false, // Don't include plugin data
        includeBranchData: false, // Don't include branch data
      });
      
      // Store the full data for filtering
      setAllComponentsData(fileData);
      
      // Use enhanced batch processing with progress tracking
      const componentOptions = {
        maxComponents: 100, // Conservative limit
        maxDepth: 2, // Shallow depth to avoid memory issues
        includeTypes: ['COMPONENT', 'INSTANCE', 'FRAME', 'TEXT'],
        excludeTypes: ['SLICE', 'VECTOR', 'BOOLEAN_OPERATION', 'LINE', 'REGULAR_POLYGON', 'STAR'],
        minSize: 30, // Filter out very small elements
        maxSize: 1500, // Filter out very large elements
        batchSize: 10, // Process in batches of 10
      };
      
      // Use batch processing for better performance and progress tracking
      const batchResult = await batchProcessComponents(
        Object.values(fileData.document.children),
        {
          ...componentOptions,
          onProgress: (progress) => {
            console.log(`Processing components: ${progress.processed}/${progress.total} (${progress.percentage}%)`);
          }
        }
      );
      
      // Validate and sanitize components
      const sanitizedComponents = batchResult.components
        .map(component => validateAndSanitizeComponent(component))
        .filter(Boolean);
      
      // Apply pagination to the processed components
      const startIndex = 0;
      const endIndex = pageSize;
      const paginatedComponents = sanitizedComponents.slice(startIndex, endIndex);
      
      setComponents(paginatedComponents);
      setTotalComponents(sanitizedComponents.length);
      setHasMore(endIndex < sanitizedComponents.length);
      setCurrentPage(0);
      setFileLoaded(true);
      
      showSuccess(
        `Successfully loaded ${paginatedComponents.length} of ${sanitizedComponents.length} components`,
        `Enhanced processing completed with ${batchResult.metadata.batchesProcessed} batches`
      );
      
    } catch (err) {
      showError(err, { 
        operation: 'loadFile', 
        source: 'figma',
        fileKey: key,
        componentCount: sanitizedComponents?.length || 0 
      });
      setError(err.message);
    } finally {
      setLoading(false);
      stopLoading();
      // Clear progress callback
      setProgressCallback(null);
    }
  }, [pageSize]);

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
    
    // Start enhanced loading for code generation
    startLoading('Generating React component...', [
      { title: 'Analyzing design', description: 'Extracting visual properties' },
      { title: 'Optimizing data', description: 'Preparing for AI generation' },
      { title: 'Generating code', description: 'Creating React component' },
      { title: 'Validating output', description: 'Ensuring code quality' },
    ]);
    
    try {
      // Extract metadata with enhanced options
      const metadata = extractSimplifiedMetadata(selectedComponent, {
        maxDepth: 2,
        maxChildren: 3,
        includeDetailedText: true,
        includeEffects: true,
        includeConstraints: false,
        tokenBudget: 1000, // Conservative token budget
      });
      
      if (!metadata) {
        throw new Error('Failed to extract component metadata');
      }
      
      // Optimize metadata for token limits
      const optimizedMetadata = optimizeMetadataForTokens(metadata, 800);
      
      // Validate and sanitize the metadata
      const sanitizedMetadata = validateAndSanitizeComponent(optimizedMetadata);
      
      if (!sanitizedMetadata) {
        throw new Error('Component metadata validation failed');
      }
      
      // Try visual similarity generation first, with fallback to standard generation
      let code;
      try {
        // Use enhanced visual similarity generation
        code = await generateVisuallyAccurateComponent(sanitizedMetadata, {
          useTemplate: false, // Use AI generation for better results
          maxTokens: 4000,
          temperature: 0.5,
        });
        
        updateLoadingState({ currentStep: 3 });
        showSuccess('React component generated with enhanced visual similarity!');
      } catch (visualError) {
        console.log('Visual similarity generation failed, using fallback:', visualError.message);
        
        updateLoadingState({ 
          message: 'Using fallback generation strategy...',
          currentStep: 2 
        });
        
        // Fallback to standard generation with multiple strategies
        const relatedComponents = components.slice(0, 3);
        code = await generateWithFallback(sanitizedMetadata, relatedComponents);
        
        showWarning('React component generated using fallback strategy');
      }
      
      setGeneratedCode(code);
    } catch (err) {
      showError(err, { 
        operation: 'generateCode', 
        source: 'gemini',
        componentName: selectedComponent?.name,
        componentType: selectedComponent?.type 
      });
      setError(err.message);
    } finally {
      setCodeLoading(false);
      stopLoading();
    }
  }, [selectedComponent, components]);

  const handleGenerateFullPage = useCallback(async () => {
    if (!allComponentsData) return;
    
    setCodeLoading(true);
    setError('');
    setPageGenerationMode(true);
    
    try {
      const code = await generateCompletePage(allComponentsData, selectedComponentsForPage);
      setGeneratedCode(code);
      setSnackbar({ open: true, message: 'Complete page generated successfully!', severity: 'success' });
    } catch (err) {
      setError(err.message);
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setCodeLoading(false);
    }
  }, [allComponentsData, selectedComponentsForPage]);

  const handleComponentSelectForPage = useCallback((component) => {
    setSelectedComponentsForPage(prev => {
      const isSelected = prev.find(c => c.id === component.id);
      if (isSelected) {
        return prev.filter(c => c.id !== component.id);
      } else {
        return [...prev, component];
      }
    });
  }, []);

  const handleTogglePageMode = () => {
    setPageGenerationMode(!pageGenerationMode);
    setSelectedComponentsForPage([]);
    setGeneratedCode('');
    setSelectedComponent(null);
  };

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleRefresh = () => {
    if (fileKey && accessToken) {
      handleLoadFile(fileKey, accessToken);
    }
  };

  const handleNextPage = () => {
    if (!hasMore || !allComponentsData) return;
    
    const nextPage = currentPage + 1;
    const componentOptions = {
      maxComponents: 100,
      maxDepth: 2,
      includeTypes: ['COMPONENT', 'INSTANCE', 'FRAME', 'TEXT'],
      excludeTypes: ['SLICE', 'VECTOR', 'BOOLEAN_OPERATION', 'LINE', 'REGULAR_POLYGON', 'STAR'],
      minSize: 30,
      maxSize: 1500,
    };
    
    const paginatedData = getComponentsWithPagination(
      Object.values(allComponentsData.document.children),
      nextPage,
      pageSize,
      componentOptions
    );
    
    setComponents(paginatedData.components);
    setCurrentPage(nextPage);
    setHasMore(paginatedData.hasMore);
  };

  const handlePrevPage = () => {
    if (currentPage === 0 || !allComponentsData) return;
    
    const prevPage = currentPage - 1;
    const componentOptions = {
      maxComponents: 100,
      maxDepth: 2,
      includeTypes: ['COMPONENT', 'INSTANCE', 'FRAME', 'TEXT'],
      excludeTypes: ['SLICE', 'VECTOR', 'BOOLEAN_OPERATION', 'LINE', 'REGULAR_POLYGON', 'STAR'],
      minSize: 30,
      maxSize: 1500,
    };
    
    const paginatedData = getComponentsWithPagination(
      Object.values(allComponentsData.document.children),
      prevPage,
      pageSize,
      componentOptions
    );
    
    setComponents(paginatedData.components);
    setCurrentPage(prevPage);
    setHasMore(paginatedData.hasMore);
  };

  const handleTypeFilter = (type) => {
    if (!allComponentsData) return;
    
    setComponentType(type);
    setCurrentPage(0);
    
    const componentOptions = {
      maxComponents: 100,
      maxDepth: 2,
      excludeTypes: ['SLICE', 'VECTOR', 'BOOLEAN_OPERATION', 'LINE', 'REGULAR_POLYGON', 'STAR'],
      minSize: 30,
      maxSize: 1500,
    };
    
    let filteredComponents;
    if (type === 'all') {
      componentOptions.includeTypes = ['COMPONENT', 'INSTANCE', 'FRAME', 'TEXT'];
      const paginatedData = getComponentsWithPagination(
        Object.values(allComponentsData.document.children),
        0,
        pageSize,
        componentOptions
      );
      filteredComponents = paginatedData.components;
      setTotalComponents(paginatedData.total);
      setHasMore(paginatedData.hasMore);
    } else {
      componentOptions.includeTypes = [type];
      filteredComponents = getComponentsByType(
        Object.values(allComponentsData.document.children),
        type,
        componentOptions
      );
      setTotalComponents(filteredComponents.length);
      setHasMore(filteredComponents.length > pageSize);
    }
    
    setComponents(filteredComponents.slice(0, pageSize));
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Enhanced error handling functions
  const showError = (error, context = {}) => {
    const appError = logError(error, context);
    const userFriendly = appError.toUserFriendly();
    
    // Show in snackbar for low severity errors
    if (userFriendly.severity === 'low') {
      setSnackbar({
        open: true,
        message: userFriendly.message,
        severity: 'error',
      });
    } else {
      // Show in dialog for medium/high severity errors
      setErrorDialog({
        open: true,
        error: appError,
      });
    }
    
    return appError;
  };

  const showSuccess = (message, details = null) => {
    setSnackbar({
      open: true,
      message,
      severity: 'success',
    });
  };

  const showWarning = (message) => {
    setSnackbar({
      open: true,
      message,
      severity: 'warning',
    });
  };

  const updateLoadingState = (updates) => {
    setLoadingState(prev => ({ ...prev, ...updates }));
  };

  const startLoading = (message, steps = []) => {
    setLoadingState({
      active: true,
      message,
      progress: 0,
      steps,
      currentStep: 0,
    });
  };

  const stopLoading = () => {
    setLoadingState({
      active: false,
      message: '',
      progress: null,
      steps: [],
      currentStep: 0,
    });
  };

  const handleErrorDialogClose = () => {
    setErrorDialog({ open: false, error: null });
  };

  const handleErrorRetry = () => {
    const { error } = errorDialog;
    handleErrorDialogClose();
    
    // Implement retry logic based on error context
    if (error?.context?.operation === 'loadFile') {
      if (fileKey && accessToken) {
        handleLoadFile(fileKey, accessToken);
      }
    } else if (error?.context?.operation === 'generateCode') {
      if (selectedComponent) {
        handleGenerateCode();
      }
    }
  };

  if (!fileLoaded) {
    return (
      <ErrorBoundary name="FileInput">
        <ThemeProvider theme={createAppTheme(darkMode)}>
          <CssBaseline />
          <Box
            sx={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'background.default',
              backgroundImage: darkMode 
                ? 'radial-gradient(circle at 25% 25%, rgba(144, 202, 249, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(244, 143, 177, 0.1) 0%, transparent 50%)'
                : 'radial-gradient(circle at 25% 25%, rgba(33, 150, 243, 0.05) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(233, 30, 99, 0.05) 0%, transparent 50%)',
            }}
          >
            <FileInput 
              onLoadFile={handleLoadFile} 
              loading={loading} 
              error={error}
              darkMode={darkMode}
              onToggleDarkMode={handleToggleDarkMode}
            />
            
            {/* Loading feedback for file input */}
            {loadingState.active && (
              <Box sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1300 }}>
                <LoadingFeedback
                  loading={loadingState.active}
                  message={loadingState.message}
                  progress={loadingState.progress}
                  steps={loadingState.steps}
                  currentStep={loadingState.currentStep}
                  variant="steps"
                  showDetails={true}
                  size="large"
                />
              </Box>
            )}
            
            {/* Error Dialog for file input */}
            <ErrorDialog
              open={errorDialog.open}
              error={errorDialog.error}
              onClose={handleErrorDialogClose}
              onRetry={handleErrorRetry}
              showTechnicalDetails={import.meta.env.DEV}
            />
          </Box>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary name="MainApp" onRetry={() => window.location.reload()}>
      <ThemeProvider theme={createAppTheme(darkMode)}>
        <CssBaseline />
        <AppLayout
          title="Figma to React Generator"
          subtitle={pageGenerationMode ? 'Page Generation Mode' : 'Component Generation Mode'}
          darkMode={darkMode}
          onToggleDarkMode={handleToggleDarkMode}
          drawerWidth={DRAWER_WIDTH}
          headerActions={
            <Stack direction="row" spacing={2} alignItems="center">
              {/* Enhanced Mode Toggle Buttons */}
              <Box 
                className="mode-toggle-container"
                sx={{ 
                  display: 'flex', 
                  gap: 0.5, 
                  p: 0.75, 
                  backgroundColor: 'background.paper',
                  borderRadius: 3,
                  border: 1,
                  borderColor: 'divider',
                  boxShadow: 1,
                }}
              >
                <Tooltip 
                  title={!pageGenerationMode ? "Currently active - Generate individual components" : "Switch to component generation mode"}
                  placement="bottom"
                >
                  <Button
                    className={`mode-toggle-button ${!pageGenerationMode ? 'active' : ''}`}
                    variant={!pageGenerationMode ? 'contained' : 'text'}
                    size="large"
                    onClick={() => pageGenerationMode ? handleTogglePageMode() : null}
                    startIcon={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CodeIcon sx={{ fontSize: '1.2rem' }} />
                        {!pageGenerationMode && (
                          <CheckCircleIcon sx={{ fontSize: '1rem', color: 'success.light' }} />
                        )}
                      </Box>
                    }
                    sx={{
                      minWidth: 160,
                      height: 48,
                      fontWeight: !pageGenerationMode ? 700 : 500,
                      textTransform: 'none',
                      borderRadius: 2,
                      fontSize: '0.95rem',
                      position: 'relative',
                      cursor: pageGenerationMode ? 'pointer' : 'default',
                      ...(!pageGenerationMode ? {
                        background: 'linear-gradient(135deg, #1976d2, #1565c0)',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
                          boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                          transform: 'translateY(-1px)',
                        },
                      } : {
                        color: 'text.secondary',
                        backgroundColor: 'transparent',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          color: 'text.primary',
                        },
                      }),
                    }}
                  >
                    Component Mode
                  </Button>
                </Tooltip>
                <Tooltip 
                  title={pageGenerationMode ? "Currently active - Generate complete pages" : "Switch to page generation mode"}
                  placement="bottom"
                >
                  <Button
                    className={`mode-toggle-button ${pageGenerationMode ? 'active' : ''}`}
                    variant={pageGenerationMode ? 'contained' : 'text'}
                    size="large"
                    onClick={() => !pageGenerationMode ? handleTogglePageMode() : null}
                    startIcon={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AssessmentIcon sx={{ fontSize: '1.2rem' }} />
                        {pageGenerationMode && (
                          <CheckCircleIcon sx={{ fontSize: '1rem', color: 'success.light' }} />
                        )}
                      </Box>
                    }
                    sx={{
                      minWidth: 160,
                      height: 48,
                      fontWeight: pageGenerationMode ? 700 : 500,
                      textTransform: 'none',
                      borderRadius: 2,
                      fontSize: '0.95rem',
                      position: 'relative',
                      cursor: !pageGenerationMode ? 'pointer' : 'default',
                      ...(pageGenerationMode ? {
                        background: 'linear-gradient(135deg, #7b1fa2, #6a1b9a)',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(123, 31, 162, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #6a1b9a, #4a148c)',
                          boxShadow: '0 6px 16px rgba(123, 31, 162, 0.4)',
                          transform: 'translateY(-1px)',
                        },
                      } : {
                        color: 'text.secondary',
                        backgroundColor: 'transparent',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          color: 'text.primary',
                        },
                      }),
                    }}
                  >
                    Page Mode
                  </Button>
                </Tooltip>
              </Box>
              
              <Tooltip title="Refresh Components">
                <span>
                  <Button
                    variant="outlined"
                    size="medium"
                    onClick={handleRefresh}
                    disabled={loading}
                    startIcon={<RefreshIcon sx={{ fontSize: '1.1rem' }} />}
                    sx={{
                      minWidth: 120,
                      height: 40,
                      fontWeight: 600,
                      textTransform: 'none',
                      borderRadius: 2,
                      fontSize: '0.9rem',
                      borderColor: 'divider',
                      color: 'text.primary',
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        borderColor: 'primary.main',
                        background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1), rgba(25, 118, 210, 0.05))',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                      },
                      '&:disabled': {
                        opacity: 0.6,
                        transform: 'none',
                      },
                    }}
                  >
                    Refresh
                  </Button>
                </span>
              </Tooltip>
            </Stack>
          }
          sidebar={

            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Filter Controls */}
              <Surface padding={2} elevation={0} variant="filled">
                {pageGenerationMode ? (
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Page Generation Mode
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Select components to include in the complete page generation. The system will analyze the design structure and generate a full page.
                      </Typography>
                    </Box>
                    
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleGenerateFullPage}
                      disabled={codeLoading || selectedComponentsForPage.length === 0}
                      size="large"
                      sx={{
                        height: 56,
                        fontWeight: 700,
                        textTransform: 'none',
                        borderRadius: 2.5,
                        fontSize: '1.1rem',
                        background: 'linear-gradient(135deg, #7b1fa2, #6a1b9a)',
                        boxShadow: '0 6px 20px rgba(123, 31, 162, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #6a1b9a, #4a148c)',
                          boxShadow: '0 8px 25px rgba(123, 31, 162, 0.4)',
                          transform: 'translateY(-2px)',
                        },
                        '&:disabled': {
                          background: 'linear-gradient(135deg, #bdbdbd, #9e9e9e)',
                          boxShadow: 'none',
                          transform: 'none',
                        },
                      }}
                    >
                      {codeLoading ? 'Generating Page...' : `Generate Full Page`}
                    </Button>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'text.secondary',
                          opacity: 0.9,
                          fontWeight: 500
                        }}
                      >
                        Selected Components
                      </Typography>
                      <Chip
                        label={selectedComponentsForPage.length}
                        size="small"
                        color={selectedComponentsForPage.length > 0 ? 'primary' : 'default'}
                      />
                    </Box>
                  </Stack>
                ) : (
                  <Stack spacing={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Component Type</InputLabel>
                      <Select
                        value={componentType}
                        label="Component Type"
                        onChange={(e) => handleTypeFilter(e.target.value)}
                      >
                        <MenuItem value="all">All Types</MenuItem>
                        <MenuItem value="COMPONENT">Components</MenuItem>
                        <MenuItem value="INSTANCE">Instances</MenuItem>
                        <MenuItem value="FRAME">Frames</MenuItem>
                        <MenuItem value="TEXT">Text</MenuItem>
                      </Select>
                    </FormControl>
                    
                    {/* Pagination Controls */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Button
                        size="medium"
                        startIcon={<PrevIcon sx={{ fontSize: '1rem' }} />}
                        onClick={handlePrevPage}
                        disabled={currentPage === 0}
                        variant="outlined"
                        sx={{
                          minWidth: 80,
                          height: 36,
                          fontWeight: 600,
                          textTransform: 'none',
                          borderRadius: 1.5,
                          fontSize: '0.85rem',
                          borderColor: 'divider',
                          '&:hover': {
                            borderColor: 'primary.main',
                            background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1), rgba(25, 118, 210, 0.05))',
                            transform: 'translateY(-1px)',
                          },
                          '&:disabled': {
                            opacity: 0.5,
                          },
                        }}
                      >
                        Prev
                      </Button>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'text.secondary',
                          opacity: 0.9,
                          fontWeight: 500
                        }}
                      >
                        {currentPage + 1} / {Math.ceil(totalComponents / pageSize)}
                      </Typography>
                      <Button
                        size="medium"
                        endIcon={<NextIcon sx={{ fontSize: '1rem' }} />}
                        onClick={handleNextPage}
                        disabled={!hasMore}
                        variant="outlined"
                        sx={{
                          minWidth: 80,
                          height: 36,
                          fontWeight: 600,
                          textTransform: 'none',
                          borderRadius: 1.5,
                          fontSize: '0.85rem',
                          borderColor: 'divider',
                          '&:hover': {
                            borderColor: 'primary.main',
                            background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1), rgba(25, 118, 210, 0.05))',
                            transform: 'translateY(-1px)',
                          },
                          '&:disabled': {
                            opacity: 0.5,
                          },
                        }}
                      >
                        Next
                      </Button>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'text.secondary',
                          opacity: 0.9,
                          fontWeight: 500
                        }}
                      >
                        Components
                      </Typography>
                      <Chip
                        label={`${components.length} / ${totalComponents}`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Stack>
                )}
              </Surface>
              
              {/* Component List */}
              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <ComponentList
                  components={components}
                  selectedComponent={selectedComponent}
                  onComponentSelect={handleComponentSelect}
                  loading={loading}
                  totalComponents={totalComponents}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  pageGenerationMode={pageGenerationMode}
                  selectedComponentsForPage={selectedComponentsForPage}
                  onComponentSelectForPage={handleComponentSelectForPage}
                />
              </Box>
            </Box>
          }
        >

          {/* Main Content Area */}
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            overflow: 'hidden',
            height: '100%', // Use full height of parent
          }}>
            {/* Design Preview */}
            <Box sx={{ 
              flex: 1, 
              borderRight: 1, 
              borderColor: 'divider',
              overflow: 'hidden',
              height: '100%',
            }}>
              <DesignPreview
                selectedComponent={selectedComponent}
                componentImage={componentImage}
                loading={loading}
                pageGenerationMode={pageGenerationMode}
                selectedComponentsForPage={selectedComponentsForPage}
              />
            </Box>
            
            {/* Code Display */}
            <Box sx={{ 
              flex: 1,
              overflow: 'hidden',
              height: '100%',
            }}>
              <CodeDisplay
                generatedCode={generatedCode}
                loading={codeLoading}
                error={error}
                selectedComponent={selectedComponent}
                onGenerateCode={handleGenerateCode}
                pageGenerationMode={pageGenerationMode}
                selectedComponentsForPage={selectedComponentsForPage}
                onShowNotification={(message, severity = 'success') => 
                  setSnackbar({ open: true, message, severity })
                }
              />
            </Box>
          </Box>
        </AppLayout>

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

        {/* Enhanced Loading Feedback */}
        {loadingState.active && (
          <Box sx={{ position: 'fixed', top: 80, right: 20, zIndex: 1300, width: 400 }}>
            <LoadingFeedback
              loading={loadingState.active}
              message={loadingState.message}
              progress={loadingState.progress}
              steps={loadingState.steps}
              currentStep={loadingState.currentStep}
              variant="steps"
              showDetails={true}
            />
          </Box>
        )}

        {/* Enhanced Error Dialog */}
        <ErrorDialog
          open={errorDialog.open}
          error={errorDialog.error}
          onClose={handleErrorDialogClose}
          onRetry={handleErrorRetry}
          showTechnicalDetails={import.meta.env.DEV}
        />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
