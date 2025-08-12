# Testing Guide

This document provides comprehensive information about testing in the Figma-to-React Generator project.

## Overview

The project uses a comprehensive testing strategy that includes:

- **Unit Tests**: Testing individual functions and components in isolation
- **Integration Tests**: Testing complete workflows and API interactions
- **Performance Tests**: Testing with large files and token optimization
- **Error Scenario Tests**: Testing error handling and recovery mechanisms

## Testing Stack

### Core Testing Tools

- **Vitest**: Fast unit test runner with native ES modules support
- **@testing-library/react**: React component testing utilities
- **@testing-library/user-event**: User interaction simulation
- **@testing-library/jest-dom**: Custom Jest matchers for DOM testing
- **jsdom**: DOM environment for Node.js testing
- **MSW (Mock Service Worker)**: API mocking for integration tests

### Coverage and Reporting

- **@vitest/coverage-v8**: Code coverage reporting
- **@vitest/ui**: Interactive test UI
- **Custom Test Runner**: Organized test execution and reporting

## Test Structure

```
src/
├── test/
│   ├── setup.js              # Global test setup and mocks
│   ├── utils.js               # Test utilities and helpers
│   ├── testRunner.js          # Custom test runner script
│   └── integration/           # Integration test suites
│       └── workflow.test.js   # End-to-end workflow tests
├── utils/__tests__/           # Utility function tests
├── services/__tests__/        # API service tests
└── components/__tests__/      # React component tests
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI interface
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Organized Test Suites

```bash
# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run performance tests
npm run test:performance

# Run all tests with reporting
npm run test:all

# Generate test configuration report
npm run test:report
```

## Test Categories

### 1. Unit Tests

#### Utility Functions (`src/utils/__tests__/`)

- **errorHandler.test.js**: Error handling and retry logic
- **codeAnalysis.test.js**: Code parsing and validation
- **performance.test.js**: Performance optimization utilities
- **accessibility.test.js**: Accessibility checking functions

#### API Services (`src/services/__tests__/`)

- **figmaApi.test.js**: Figma API integration and data processing
- **geminiApi.test.js**: Gemini API integration and code generation
- **projectDownloadService.test.js**: Project packaging and download

#### React Components (`src/components/__tests__/`)

- **FileInput.test.jsx**: File input and validation component
- **CodeDisplay.test.jsx**: Code display and interaction component
- **ComponentList.test.jsx**: Component listing and selection
- **ErrorBoundary.test.jsx**: Error boundary and recovery

### 2. Integration Tests

#### Complete Workflow (`src/test/integration/`)

- **workflow.test.js**: End-to-end user journeys
  - Figma file loading → Component selection → Code generation → Download
  - Error handling across the entire pipeline
  - Performance testing with large files
  - Token optimization workflows

### 3. Performance Tests

- Large Figma file processing (100+ components)
- Token limit optimization and fallback strategies
- Memory usage monitoring
- API response time testing

### 4. Error Scenario Tests

- Network failures and retry mechanisms
- Invalid API credentials
- Malformed API responses
- Rate limiting and backoff strategies
- Token limit exceeded scenarios

## Test Utilities

### Custom Render Function

```javascript
import { renderWithTheme } from '../../test/utils.js'

// Renders components with Material-UI theme provider
const { getByText } = renderWithTheme(<MyComponent />)
```

### Mock Data Generators

```javascript
import { 
  mockFigmaFile, 
  mockGeminiResponse, 
  createMockComponent 
} from '../../test/utils.js'

// Use predefined mock data
const component = createMockComponent({ name: 'Custom Component' })
```

### API Mocking

```javascript
// Mock successful API response
fetch.mockResolvedValueOnce({
  ok: true,
  json: () => Promise.resolve(mockFigmaFile),
})

// Mock API error
fetch.mockResolvedValueOnce({
  ok: false,
  status: 401,
  statusText: 'Unauthorized',
})
```

## Writing Tests

### Unit Test Example

```javascript
import { describe, it, expect, vi } from 'vitest'
import { extractComponentName } from '../codeAnalysis.js'

describe('codeAnalysis', () => {
  describe('extractComponentName', () => {
    it('should extract function component name', () => {
      const code = `function MyComponent() {
        return <div>Hello</div>;
      }`
      expect(extractComponentName(code)).toBe('MyComponent')
    })
  })
})
```

### Component Test Example

```javascript
import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithTheme } from '../../test/utils.js'
import FileInput from '../FileInput.jsx'

describe('FileInput Component', () => {
  it('should handle URL input changes', async () => {
    const mockOnLoadFile = vi.fn()
    renderWithTheme(<FileInput onLoadFile={mockOnLoadFile} />)
    
    const urlInput = screen.getByLabelText(/figma file url/i)
    await userEvent.type(urlInput, 'https://figma.com/file/test123')
    
    expect(urlInput).toHaveValue('https://figma.com/file/test123')
  })
})
```

### Integration Test Example

```javascript
import { describe, it, expect, vi } from 'vitest'
import { getFigmaFile } from '../../services/figmaApi.js'
import { generateReactComponent } from '../../services/geminiApi.js'

describe('Complete Workflow', () => {
  it('should complete full workflow', async () => {
    // Mock API responses
    fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockFigmaFile) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGeminiResponse) })
    
    // Test workflow
    const figmaData = await getFigmaFile('test-key', 'test-token')
    const code = await generateReactComponent(figmaData.components[0], 'test-key')
    
    expect(code).toContain('React')
  })
})
```

## Coverage Requirements

### Minimum Coverage Thresholds

- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

### Coverage Exclusions

- Configuration files (`*.config.js`)
- Test files (`**/*.test.js`, `**/*.test.jsx`)
- Type definitions (`**/*.d.ts`)
- Main entry point (`src/main.jsx`)
- Test utilities (`src/test/`)

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:all
      - run: npm run test:coverage
```

## Best Practices

### Test Organization

1. **Group related tests** using `describe` blocks
2. **Use descriptive test names** that explain the expected behavior
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Mock external dependencies** to isolate units under test
5. **Clean up after tests** using `beforeEach` and `afterEach`

### Mocking Guidelines

1. **Mock at the boundary** - mock external APIs, not internal functions
2. **Use realistic mock data** that matches actual API responses
3. **Test both success and failure scenarios**
4. **Verify mock interactions** when testing side effects

### Performance Testing

1. **Set reasonable timeouts** for async operations
2. **Monitor memory usage** in tests with large data sets
3. **Test with realistic data sizes** that match production scenarios
4. **Measure and assert performance metrics**

### Accessibility Testing

1. **Test keyboard navigation** in interactive components
2. **Verify ARIA labels** and semantic HTML
3. **Test screen reader compatibility** using testing-library queries
4. **Check color contrast** and visual accessibility

## Debugging Tests

### Common Issues

1. **Async operations not awaited**
   ```javascript
   // ❌ Wrong
   fireEvent.click(button)
   expect(screen.getByText('Success')).toBeInTheDocument()
   
   // ✅ Correct
   fireEvent.click(button)
   await waitFor(() => {
     expect(screen.getByText('Success')).toBeInTheDocument()
   })
   ```

2. **Missing test cleanup**
   ```javascript
   // ✅ Clean up mocks
   beforeEach(() => {
     vi.clearAllMocks()
   })
   ```

3. **Incorrect mock setup**
   ```javascript
   // ✅ Mock before importing
   vi.mock('external-library')
   import { myFunction } from './myModule.js'
   ```

### Debug Tools

- **Vitest UI**: Visual test runner with debugging capabilities
- **screen.debug()**: Print current DOM state
- **console.log()**: Debug test values and state
- **VS Code Debugger**: Set breakpoints in test files

## Maintenance

### Regular Tasks

1. **Update test dependencies** monthly
2. **Review and update mock data** when APIs change
3. **Monitor test performance** and optimize slow tests
4. **Review coverage reports** and add tests for uncovered code
5. **Update test documentation** when adding new test patterns

### Test Refactoring

1. **Extract common test utilities** to reduce duplication
2. **Update tests when refactoring code** to maintain coverage
3. **Remove obsolete tests** when features are removed
4. **Optimize test performance** by reducing unnecessary setup

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [MSW Documentation](https://mswjs.io/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)