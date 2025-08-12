import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tabs,
  Tab,
  Snackbar,
  useTheme,
  Chip,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Code as CodeIcon,
  Folder as FolderIcon,
  Visibility as PreviewIcon,
  FormatAlignLeft as FormatIcon,
  CheckCircle as CheckIcon,
  Analytics as AnalyticsIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { 
  vscDarkPlus, 
  vs 
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { generateProjectDownload } from '../services/projectDownloadService';
import { analyzeReactCode, generatePreviewMetadata, formatCodeStatistics } from '../utils/codeAnalysis';
import prettier from 'prettier/standalone';
import parserBabel from 'prettier/parser-babel';

const CodeDisplay = ({ 
  generatedCode, 
  loading, 
  error, 
  selectedComponent,
  onGenerateCode,
  pageGenerationMode = false,
  selectedComponentsForPage = [],
  onShowNotification
}) => {
  const theme = useTheme();
  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isFormatted, setIsFormatted] = useState(false);

  // Format code using Prettier
  const formatCode = useCallback((code) => {
    if (!code) return '';
    
    try {
      return prettier.format(code, {
        parser: 'babel',
        plugins: [parserBabel],
        semi: true,
        singleQuote: true,
        tabWidth: 2,
        trailingComma: 'es5',
        printWidth: 80,
        bracketSpacing: true,
        jsxBracketSameLine: false,
        arrowParens: 'avoid',
      });
    } catch (error) {
      console.warn('Failed to format code:', error);
      return code; // Return original code if formatting fails
    }
  }, []);

  // Memoized formatted code
  const formattedCode = useMemo(() => {
    return isFormatted ? formatCode(generatedCode) : generatedCode;
  }, [generatedCode, isFormatted, formatCode]);

  // Memoized code analysis
  const codeAnalysis = useMemo(() => {
    return generatedCode ? generatePreviewMetadata(generatedCode) : null;
  }, [generatedCode]);

  // Memoized code statistics
  const codeStatistics = useMemo(() => {
    return codeAnalysis ? formatCodeStatistics(codeAnalysis) : null;
  }, [codeAnalysis]);

  // Enhanced copy functionality with better feedback
  const handleCopyCode = useCallback(async () => {
    if (formattedCode) {
      try {
        await navigator.clipboard.writeText(formattedCode);
        setCopySuccess(true);
        if (onShowNotification) {
          onShowNotification('Code copied to clipboard!', 'success');
        }
      } catch (error) {
        console.error('Failed to copy code:', error);
        if (onShowNotification) {
          onShowNotification('Failed to copy code to clipboard', 'error');
        }
      }
    }
  }, [formattedCode, onShowNotification]);

  // Toggle code formatting
  const handleToggleFormat = useCallback(() => {
    setIsFormatted(!isFormatted);
  }, [isFormatted]);

  // Reset copy success state after 2 seconds
  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  // Tab change handler
  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
  }, []);

  // Get syntax highlighting theme based on current theme
  const syntaxTheme = useMemo(() => {
    return theme.palette.mode === 'dark' ? vscDarkPlus : vs;
  }, [theme.palette.mode]);

  const handleDownloadMenuOpen = (event) => {
    setDownloadMenuAnchor(event.currentTarget);
  };

  const handleDownloadMenuClose = () => {
    setDownloadMenuAnchor(null);
  };

  const handleDownloadCodeOnly = () => {
    if (generatedCode) {
      const fileName = pageGenerationMode ? 'complete-page.jsx' : `${selectedComponent?.name || 'component'}.jsx`;
      const blob = new Blob([generatedCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      if (onShowNotification) {
        onShowNotification(`Code downloaded as ${fileName}`, 'success');
      }
    }
    handleDownloadMenuClose();
  };

  const handleDownloadCompleteProject = async () => {
    if (!generatedCode) return;
    
    setDownloadLoading(true);
    handleDownloadMenuClose();
    
    try {
      const componentName = pageGenerationMode 
        ? 'CompletePage' 
        : selectedComponent?.name || 'GeneratedComponent';
      
      const result = await generateProjectDownload(
        generatedCode, 
        componentName, 
        pageGenerationMode
      );
      
      if (onShowNotification) {
        onShowNotification(
          `Complete React project downloaded as ${result.fileName}! Ready to run with npm install && npm run dev`, 
          'success'
        );
      }
      
    } catch (error) {
      console.error('Failed to download complete project:', error);
      if (onShowNotification) {
        onShowNotification(
          `Failed to download complete project: ${error.message}`, 
          'error'
        );
      }
    } finally {
      setDownloadLoading(false);
    }
  };

  // Enhanced code display component with tabs
  const CodeDisplayTabs = ({ code, showPreview = false }) => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="code display tabs">
          <Tab 
            label="Code" 
            icon={<CodeIcon />} 
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          {showPreview && codeAnalysis && (
            <Tab 
              label="Analysis" 
              icon={<AnalyticsIcon />} 
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
          )}
          {showPreview && (
            <Tab 
              label="Preview" 
              icon={<PreviewIcon />} 
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
          )}
        </Tabs>
      </Box>
      
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 0 && (
          <Box
            sx={{
              height: '100%',
              overflowY: 'auto',
              overflowX: 'auto',
              borderRadius: 1,
              position: 'relative',
              '& .react-syntax-highlighter': {
                margin: 0,
                borderRadius: 0,
                height: 'auto',
                minHeight: '100%',
              },
              '& .react-syntax-highlighter pre': {
                margin: 0,
                borderRadius: 0,
                padding: '16px !important',
                minHeight: '100%',
              },
              '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                },
              },
            }}
          >
            <SyntaxHighlighter
              language="jsx"
              style={syntaxTheme}
              customStyle={{
                margin: 0,
                borderRadius: 0,
                fontSize: '0.875rem',
                lineHeight: 1.5,
                height: 'auto',
                maxHeight: 'none',
                overflow: 'visible',
                backgroundColor: 'transparent',
              }}
              showLineNumbers={true}
              wrapLines={false}
              wrapLongLines={false}
              lineNumberStyle={{
                color: theme.palette.mode === 'dark' ? '#6e7681' : '#656d76',
                fontSize: '0.75rem',
                minWidth: '2.5em',
                paddingRight: '1em',
                userSelect: 'none',
              }}
            >
              {code}
            </SyntaxHighlighter>
          </Box>
        )}
        
        {activeTab === 1 && showPreview && codeAnalysis && (
          <Box
            sx={{
              height: '100%',
              p: 2,
              overflow: 'auto',
              backgroundColor: 'background.default',
            }}
          >
            <Grid container spacing={2}>
              {/* Code Statistics */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AnalyticsIcon />
                      Code Statistics
                    </Typography>
                    {codeStatistics && Object.entries(codeStatistics).map(([key, value]) => (
                      <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {key}:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {value}
                        </Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              {/* Material-UI Components */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Material-UI Components
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {codeAnalysis.materialUIComponents.length > 0 ? (
                        codeAnalysis.materialUIComponents.map((component, index) => (
                          <Chip
                            key={index}
                            label={component}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No Material-UI components detected
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Color Palette */}
              {codeAnalysis.colors.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PaletteIcon />
                        Color Palette
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {codeAnalysis.colors.map((color, index) => (
                          <Chip
                            key={index}
                            label={color}
                            size="small"
                            sx={{
                              backgroundColor: color.startsWith('#') || color.startsWith('rgb') ? color : undefined,
                              color: color.startsWith('#') || color.startsWith('rgb') ? 
                                (color === '#ffffff' || color === 'white' ? 'black' : 'white') : undefined,
                            }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Recommendations */}
              {codeAnalysis.recommendations.length > 0 && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Recommendations
                      </Typography>
                      {codeAnalysis.recommendations.map((recommendation, index) => (
                        <Typography key={index} variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          • {recommendation}
                        </Typography>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
        
        {activeTab === 2 && showPreview && (
          <Box
            sx={{
              height: '100%',
              p: 2,
              overflow: 'auto',
              backgroundColor: 'background.default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <PreviewIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Visual Preview Coming Soon
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Live component preview will be available in a future update
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );

  if (pageGenerationMode) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 0 }}>
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">
                Complete Page Generation
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {generatedCode && (
                  <>
                    <Tooltip title={isFormatted ? "Show original code" : "Format code"}>
                      <IconButton 
                        size="small" 
                        onClick={handleToggleFormat}
                        color={isFormatted ? "primary" : "default"}
                      >
                        <FormatIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Copy code">
                      <IconButton size="small" onClick={handleCopyCode}>
                        {copySuccess ? <CheckIcon color="success" /> : <CopyIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download options">
                      <IconButton 
                        size="small" 
                        onClick={handleDownloadMenuOpen}
                        disabled={downloadLoading}
                      >
                        {downloadLoading ? <CircularProgress size={20} /> : <DownloadIcon />}
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {selectedComponentsForPage.length > 0 
                ? `Selected ${selectedComponentsForPage.length} components for page generation`
                : 'Select components from the sidebar to generate a complete page'
              }
            </Typography>
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
            {loading && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Generating complete page...
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    mt: 1,
                    color: 'text.secondary',
                    opacity: 0.9,
                    fontWeight: 400
                  }}
                >
                  Analyzing design structure and creating full page layout
                </Typography>
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {generatedCode && !loading && (
              <Box
                sx={{
                  height: '100%',
                  maxHeight: 'calc(100vh - 200px)',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                <CodeDisplayTabs code={formattedCode} showPreview={true} />
              </Box>
            )}

            {!generatedCode && !loading && !error && (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'background.default',
                  borderRadius: 1,
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <CodeIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {selectedComponentsForPage.length > 0 
                      ? 'Click "Generate Full Page" in the sidebar to create a complete page'
                      : 'Select components from the sidebar to generate a complete page'
                    }
                  </Typography>
                  {selectedComponentsForPage.length > 0 && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: 'text.secondary',
                        opacity: 0.9,
                        fontWeight: 400
                      }}
                    >
                      The system will analyze the design structure and generate a full page with header, footer, and all selected components.
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Download Menu for Page Generation Mode */}
        <Menu
          anchorEl={downloadMenuAnchor}
          open={Boolean(downloadMenuAnchor)}
          onClose={handleDownloadMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={handleDownloadCodeOnly}>
            <ListItemIcon>
              <CodeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Download Code Only" 
              secondary="Single .jsx file"
            />
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleDownloadCompleteProject}>
            <ListItemIcon>
              <FolderIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Download Complete Project" 
              secondary="Ready-to-run React project with all dependencies"
            />
          </MenuItem>
        </Menu>
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
          <CodeIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Select a component to generate code
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose a component from the sidebar to generate React code
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 0 }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">
              Generated React Code
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {generatedCode && (
                <>
                  <Tooltip title={isFormatted ? "Show original code" : "Format code"}>
                    <IconButton 
                      size="small" 
                      onClick={handleToggleFormat}
                      color={isFormatted ? "primary" : "default"}
                    >
                      <FormatIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Copy code">
                    <IconButton size="small" onClick={handleCopyCode}>
                      {copySuccess ? <CheckIcon color="success" /> : <CopyIcon />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download options">
                    <IconButton 
                      size="small" 
                      onClick={handleDownloadMenuOpen}
                      disabled={downloadLoading}
                    >
                      {downloadLoading ? <CircularProgress size={20} /> : <DownloadIcon />}
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          </Box>
          
          {!generatedCode && !loading && (
            <Button
              variant="contained"
              onClick={onGenerateCode}
              disabled={!selectedComponent}
              startIcon={<CodeIcon sx={{ fontSize: '1.1rem' }} />}
              size="large"
              sx={{
                height: 48,
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 2.5,
                fontSize: '1rem',
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
              Generate React Component
            </Button>
          )}
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
          {loading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <CircularProgress size={40} sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Generating React component...
              </Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {generatedCode && !loading && (
            <Box
              sx={{
                height: '100%',
                maxHeight: 'calc(100vh - 200px)',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                overflow: 'hidden',
              }}
            >
              <CodeDisplayTabs code={formattedCode} showPreview={true} />
            </Box>
          )}

          {!generatedCode && !loading && !error && (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'background.default',
                borderRadius: 1,
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <CodeIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Click "Generate React Component" to create code
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Download Menu */}
      <Menu
        anchorEl={downloadMenuAnchor}
        open={Boolean(downloadMenuAnchor)}
        onClose={handleDownloadMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleDownloadCodeOnly}>
          <ListItemIcon>
            <CodeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Download Code Only" 
            secondary="Single .jsx file"
          />
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDownloadCompleteProject}>
          <ListItemIcon>
            <FolderIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Download Complete Project" 
            secondary="Ready-to-run React project with all dependencies"
          />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default CodeDisplay; 