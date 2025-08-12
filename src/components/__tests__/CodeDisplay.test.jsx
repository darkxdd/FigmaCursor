import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithTheme } from '../../test/utils.js'
import CodeDisplay from '../CodeDisplay.jsx'

// Mock react-syntax-highlighter
vi.mock('react-syntax-highlighter', () => ({
  Prism: ({ children, ...props }) => <pre data-testid="syntax-highlighter" {...props}>{children}</pre>,
}))

vi.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  vscDarkPlus: {},
  vs: {},
}))

describe('CodeDisplay Component', () => {
  const mockProps = {
    generatedCode: '',
    loading: false,
    error: null,
    selectedComponent: null,
    onGenerateCode: vi.fn(),
  }

  const sampleCode = `import React from 'react';
import { Box, Typography } from '@mui/material';

const TestComponent = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4">Hello World</Typography>
    </Box>
  );
};

export default TestComponent;`

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve()),
      },
    })
  })

  it('should render empty state when no code is generated', () => {
    renderWithTheme(<CodeDisplay {...mockProps} />)

    expect(screen.getByText(/no code generated yet/i)).toBeInTheDocument()
    expect(screen.getByText(/select a component and click generate/i)).toBeInTheDocument()
  })

  it('should display generated code with syntax highlighting', () => {
    renderWithTheme(<CodeDisplay {...mockProps} generatedCode={sampleCode} />)

    expect(screen.getByTestId('syntax-highlighter')).toBeInTheDocument()
    expect(screen.getByTestId('syntax-highlighter')).toHaveTextContent('TestComponent')
  })

  it('should show loading state', () => {
    renderWithTheme(<CodeDisplay {...mockProps} loading={true} />)

    expect(screen.getByText(/generating code/i)).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should display error messages', () => {
    const errorMessage = 'Failed to generate code'
    renderWithTheme(<CodeDisplay {...mockProps} error={errorMessage} />)

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('should show retry button on error', async () => {
    const user = userEvent.setup()
    const mockOnGenerateCode = vi.fn()
    renderWithTheme(
      <CodeDisplay
        {...mockProps}
        error="Generation failed"
        onGenerateCode={mockOnGenerateCode}
        selectedComponent={{ id: 'test', name: 'Test' }}
      />
    )

    const retryButton = screen.getByRole('button', { name: /retry/i })
    await user.click(retryButton)

    expect(mockOnGenerateCode).toHaveBeenCalled()
  })

  it('should copy code to clipboard', async () => {
    const user = userEvent.setup()
    renderWithTheme(<CodeDisplay {...mockProps} generatedCode={sampleCode} />)

    const copyButton = screen.getByRole('button', { name: /copy code/i })
    await user.click(copyButton)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(sampleCode)
  })

  it('should show copy success feedback', async () => {
    const user = userEvent.setup()
    renderWithTheme(<CodeDisplay {...mockProps} generatedCode={sampleCode} />)

    const copyButton = screen.getByRole('button', { name: /copy code/i })
    await user.click(copyButton)

    await waitFor(() => {
      expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument()
    })
  })

  it('should handle copy failure gracefully', async () => {
    const user = userEvent.setup()
    navigator.clipboard.writeText = vi.fn(() => Promise.reject(new Error('Copy failed')))
    
    renderWithTheme(<CodeDisplay {...mockProps} generatedCode={sampleCode} />)

    const copyButton = screen.getByRole('button', { name: /copy code/i })
    await user.click(copyButton)

    await waitFor(() => {
      expect(screen.getByText(/failed to copy/i)).toBeInTheDocument()
    })
  })

  it('should show download button when code is available', () => {
    renderWithTheme(<CodeDisplay {...mockProps} generatedCode={sampleCode} />)

    expect(screen.getByRole('button', { name: /download project/i })).toBeInTheDocument()
  })

  it('should not show download button when no code', () => {
    renderWithTheme(<CodeDisplay {...mockProps} />)

    expect(screen.queryByRole('button', { name: /download project/i })).not.toBeInTheDocument()
  })

  it('should handle download project click', async () => {
    const user = userEvent.setup()
    // Mock the download service
    const mockDownload = vi.fn(() => Promise.resolve({ success: true }))
    vi.doMock('../../services/projectDownloadService.js', () => ({
      generateProjectDownload: mockDownload,
    }))

    renderWithTheme(<CodeDisplay {...mockProps} generatedCode={sampleCode} />)

    const downloadButton = screen.getByRole('button', { name: /download project/i })
    await user.click(downloadButton)

    // Should show loading state during download
    expect(screen.getByText(/preparing download/i)).toBeInTheDocument()
  })

  it('should be scrollable for long code', () => {
    const longCode = sampleCode.repeat(50) // Very long code
    renderWithTheme(<CodeDisplay {...mockProps} generatedCode={longCode} />)

    const codeContainer = screen.getByTestId('code-container')
    expect(codeContainer).toHaveStyle({ overflow: 'auto' })
  })

  it('should show generate button when component is selected but no code', () => {
    const selectedComponent = { id: 'test', name: 'Test Component' }
    renderWithTheme(
      <CodeDisplay
        {...mockProps}
        selectedComponent={selectedComponent}
      />
    )

    expect(screen.getByRole('button', { name: /generate code/i })).toBeInTheDocument()
  })

  it('should call onGenerateCode when generate button is clicked', async () => {
    const user = userEvent.setup()
    const mockOnGenerateCode = vi.fn()
    const selectedComponent = { id: 'test', name: 'Test Component' }
    
    renderWithTheme(
      <CodeDisplay
        {...mockProps}
        selectedComponent={selectedComponent}
        onGenerateCode={mockOnGenerateCode}
      />
    )

    const generateButton = screen.getByRole('button', { name: /generate code/i })
    await user.click(generateButton)

    expect(mockOnGenerateCode).toHaveBeenCalled()
  })

  it('should disable buttons during loading', () => {
    renderWithTheme(
      <CodeDisplay
        {...mockProps}
        loading={true}
        selectedComponent={{ id: 'test', name: 'Test' }}
      />
    )

    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toBeDisabled()
    })
  })

  it('should show code statistics', () => {
    renderWithTheme(<CodeDisplay {...mockProps} generatedCode={sampleCode} />)

    // Should show line count, character count, etc.
    expect(screen.getByText(/lines/i)).toBeInTheDocument()
    expect(screen.getByText(/characters/i)).toBeInTheDocument()
  })

  it('should handle keyboard shortcuts', async () => {
    const user = userEvent.setup()
    renderWithTheme(<CodeDisplay {...mockProps} generatedCode={sampleCode} />)

    // Test Ctrl+C for copy
    await user.keyboard('{Control>}c{/Control}')
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(sampleCode)
  })

  it('should support different themes for syntax highlighting', () => {
    const { rerender } = renderWithTheme(
      <CodeDisplay {...mockProps} generatedCode={sampleCode} darkMode={false} />
    )

    let highlighter = screen.getByTestId('syntax-highlighter')
    expect(highlighter).toBeInTheDocument()

    rerender(<CodeDisplay {...mockProps} generatedCode={sampleCode} darkMode={true} />)
    
    highlighter = screen.getByTestId('syntax-highlighter')
    expect(highlighter).toBeInTheDocument()
  })
})