import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeDisplay = ({ 
  generatedCode, 
  loading, 
  error, 
  selectedComponent,
  onGenerateCode 
}) => {
  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
    }
  };

  const handleDownloadCode = () => {
    if (generatedCode) {
      const blob = new Blob([generatedCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedComponent?.name || 'component'}.jsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (!selectedComponent) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'grey.50',
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">
              Generated React Code
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {generatedCode && (
                <>
                  <Tooltip title="Copy code">
                    <IconButton size="small" onClick={handleCopyCode}>
                      <CopyIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download code">
                    <IconButton size="small" onClick={handleDownloadCode}>
                      <DownloadIcon />
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
              startIcon={<CodeIcon />}
              size="small"
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
                maxHeight: '100%',
                overflowY: 'scroll',
                overflowX: 'scroll',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                '& .react-syntax-highlighter': {
                  margin: 0,
                  borderRadius: 1,
                },
                '& .react-syntax-highlighter pre': {
                  margin: 0,
                  borderRadius: 1,
                  padding: '16px !important',
                },
              }}
            >
              <SyntaxHighlighter
                language="jsx"
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  borderRadius: 1,
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                }}
                showLineNumbers={true}
                wrapLines={false}
                lineNumberStyle={{
                  color: '#6e7681',
                  fontSize: '0.75rem',
                  minWidth: '2.5em',
                }}
              >
                {generatedCode}
              </SyntaxHighlighter>
            </Box>
          )}

          {!generatedCode && !loading && !error && (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'grey.50',
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
    </Box>
  );
};

export default CodeDisplay; 