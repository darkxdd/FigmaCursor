import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithTheme } from '../../test/utils.js'
import FileInput from '../FileInput.jsx'

describe('FileInput Component', () => {
  const mockProps = {
    onLoadFile: vi.fn(),
    loading: false,
    error: null,
    darkMode: false,
    onToggleDarkMode: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render input fields', () => {
    renderWithTheme(<FileInput {...mockProps} />)

    expect(screen.getByLabelText(/figma file url/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/figma api token/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /load figma file/i })).toBeInTheDocument()
  })

  it('should handle URL input changes', async () => {
    const user = userEvent.setup()
    renderWithTheme(<FileInput {...mockProps} />)

    const urlInput = screen.getByLabelText(/figma file url/i)
    await user.type(urlInput, 'https://www.figma.com/file/test123/TestFile')

    expect(urlInput).toHaveValue('https://www.figma.com/file/test123/TestFile')
  })

  it('should handle token input changes', async () => {
    const user = userEvent.setup()
    renderWithTheme(<FileInput {...mockProps} />)

    const tokenInput = screen.getByLabelText(/figma api token/i)
    await user.type(tokenInput, 'test-token-123')

    expect(tokenInput).toHaveValue('test-token-123')
  })

  it('should validate Figma URL format', async () => {
    const user = userEvent.setup()
    renderWithTheme(<FileInput {...mockProps} />)

    const urlInput = screen.getByLabelText(/figma file url/i)
    const loadButton = screen.getByRole('button', { name: /load figma file/i })

    await user.type(urlInput, 'invalid-url')
    await user.click(loadButton)

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid figma file url/i)).toBeInTheDocument()
    })
  })

  it('should require both URL and token', async () => {
    const user = userEvent.setup()
    renderWithTheme(<FileInput {...mockProps} />)

    const loadButton = screen.getByRole('button', { name: /load figma file/i })
    await user.click(loadButton)

    await waitFor(() => {
      expect(screen.getByText(/please enter both url and token/i)).toBeInTheDocument()
    })
  })

  it('should call onLoadFile with correct parameters', async () => {
    const user = userEvent.setup()
    const mockOnLoadFile = vi.fn()
    renderWithTheme(<FileInput {...mockProps} onLoadFile={mockOnLoadFile} />)

    const urlInput = screen.getByLabelText(/figma file url/i)
    const tokenInput = screen.getByLabelText(/figma api token/i)
    const loadButton = screen.getByRole('button', { name: /load figma file/i })

    await user.type(urlInput, 'https://www.figma.com/file/test123/TestFile')
    await user.type(tokenInput, 'test-token-123')
    await user.click(loadButton)

    expect(mockOnLoadFile).toHaveBeenCalledWith('test123', 'test-token-123')
  })

  it('should show loading state', () => {
    renderWithTheme(<FileInput {...mockProps} loading={true} />)

    expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should display error messages', () => {
    const errorMessage = 'Failed to load Figma file'
    renderWithTheme(<FileInput {...mockProps} error={errorMessage} />)

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('should toggle dark mode', async () => {
    const user = userEvent.setup()
    const mockOnToggleDarkMode = vi.fn()
    renderWithTheme(<FileInput {...mockProps} onToggleDarkMode={mockOnToggleDarkMode} />)

    const darkModeToggle = screen.getByRole('checkbox', { name: /dark mode/i })
    await user.click(darkModeToggle)

    expect(mockOnToggleDarkMode).toHaveBeenCalled()
  })

  it('should reflect dark mode state', () => {
    renderWithTheme(<FileInput {...mockProps} darkMode={true} />)

    const darkModeToggle = screen.getByRole('checkbox', { name: /dark mode/i })
    expect(darkModeToggle).toBeChecked()
  })

  it('should extract file key from different URL formats', async () => {
    const user = userEvent.setup()
    const mockOnLoadFile = vi.fn()
    renderWithTheme(<FileInput {...mockProps} onLoadFile={mockOnLoadFile} />)

    const urlInput = screen.getByLabelText(/figma file url/i)
    const tokenInput = screen.getByLabelText(/figma api token/i)
    const loadButton = screen.getByRole('button', { name: /load figma file/i })

    // Test different URL formats
    const testCases = [
      {
        url: 'https://www.figma.com/file/abc123/TestFile',
        expectedKey: 'abc123',
      },
      {
        url: 'https://figma.com/file/xyz789/AnotherFile?node-id=1%3A2',
        expectedKey: 'xyz789',
      },
      {
        url: 'https://www.figma.com/design/def456/DesignFile',
        expectedKey: 'def456',
      },
    ]

    for (const testCase of testCases) {
      await user.clear(urlInput)
      await user.type(urlInput, testCase.url)
      await user.type(tokenInput, 'test-token')
      await user.click(loadButton)

      expect(mockOnLoadFile).toHaveBeenCalledWith(testCase.expectedKey, 'test-token')
      mockOnLoadFile.mockClear()
    }
  })

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup()
    renderWithTheme(<FileInput {...mockProps} />)

    const urlInput = screen.getByLabelText(/figma file url/i)
    const tokenInput = screen.getByLabelText(/figma api token/i)
    const loadButton = screen.getByRole('button', { name: /load figma file/i })

    // Tab navigation
    await user.tab()
    expect(urlInput).toHaveFocus()

    await user.tab()
    expect(tokenInput).toHaveFocus()

    await user.tab()
    expect(loadButton).toHaveFocus()
  })

  it('should clear error when user starts typing', async () => {
    const user = userEvent.setup()
    renderWithTheme(<FileInput {...mockProps} error="Previous error" />)

    expect(screen.getByText('Previous error')).toBeInTheDocument()

    const urlInput = screen.getByLabelText(/figma file url/i)
    await user.type(urlInput, 'new input')

    await waitFor(() => {
      expect(screen.queryByText('Previous error')).not.toBeInTheDocument()
    })
  })
})