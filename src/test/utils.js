import { render } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import theme from '../theme/index.js'

// Custom render function that includes theme provider
export const renderWithTheme = (ui, options = {}) => {
  const Wrapper = ({ children }) => (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )

  return render(ui, { wrapper: Wrapper, ...options })
}

// Mock Figma API responses
export const mockFigmaFile = {
  document: {
    id: 'test-document',
    name: 'Test Document',
    type: 'DOCUMENT',
    children: [
      {
        id: 'test-page',
        name: 'Test Page',
        type: 'CANVAS',
        children: [
          {
            id: 'test-component-1',
            name: 'Test Component 1',
            type: 'COMPONENT',
            absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 50 },
            fills: [{ type: 'SOLID', color: { r: 1, g: 0, b: 0, a: 1 } }],
            children: [],
          },
          {
            id: 'test-component-2',
            name: 'Test Component 2',
            type: 'FRAME',
            absoluteBoundingBox: { x: 0, y: 60, width: 200, height: 100 },
            fills: [{ type: 'SOLID', color: { r: 0, g: 1, b: 0, a: 1 } }],
            children: [
              {
                id: 'test-text',
                name: 'Test Text',
                type: 'TEXT',
                characters: 'Hello World',
                style: {
                  fontSize: 16,
                  fontFamily: 'Roboto',
                  fontWeight: 400,
                },
              },
            ],
          },
        ],
      },
    ],
  },
  components: {
    'test-component-1': {
      key: 'test-component-1',
      name: 'Test Component 1',
      description: 'A test component',
    },
  },
}

export const mockFigmaImages = {
  images: {
    'test-component-1': 'https://example.com/image1.png',
    'test-component-2': 'https://example.com/image2.png',
  },
}

// Mock Gemini API response
export const mockGeminiResponse = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: `import React from 'react';
import { Box, Typography } from '@mui/material';

const TestComponent = () => {
  return (
    <Box sx={{ p: 2, bgcolor: 'primary.main' }}>
      <Typography variant="h4">Hello World</Typography>
    </Box>
  );
};

export default TestComponent;`,
          },
        ],
      },
    },
  ],
}

// Mock component metadata
export const mockComponentMetadata = {
  id: 'test-component-1',
  name: 'Test Component',
  type: 'COMPONENT',
  width: 100,
  height: 50,
  x: 0,
  y: 0,
  characters: '',
  hasText: false,
  allTextContent: [],
  layoutMode: null,
  primaryAxisAlignItems: 'MIN',
  counterAxisAlignItems: 'MIN',
  padding: { left: 0, right: 0, top: 0, bottom: 0 },
  itemSpacing: 0,
  fills: [{ type: 'SOLID', color: { r: 1, g: 0, b: 0, a: 1 } }],
  strokes: [],
  effects: [],
  cornerRadius: 0,
  opacity: 1,
  fontSize: 16,
  fontFamily: 'Roboto',
  fontWeight: 400,
  textAlign: 'LEFT',
  children: [],
  visible: true,
}

// Test data generators
export const createMockComponent = (overrides = {}) => ({
  ...mockComponentMetadata,
  ...overrides,
})

export const createMockFigmaFile = (overrides = {}) => ({
  ...mockFigmaFile,
  ...overrides,
})

// Async test helpers
export const waitForAsync = (ms = 0) =>
  new Promise(resolve => setTimeout(resolve, ms))

// Error simulation helpers
export const simulateNetworkError = () => {
  throw new Error('Network Error: Failed to fetch')
}

export const simulateAPIError = (status = 500, message = 'Internal Server Error') => {
  const error = new Error(message)
  error.status = status
  throw error
}