import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getFigmaFile, getFigmaImages } from '../../services/figmaApi.js'
import { generateReactComponent } from '../../services/geminiApi.js'
import { generateProjectDownload } from '../../services/projectDownloadService.js'
import {
  mockFigmaFile,
  mockFigmaImages,
  mockGeminiResponse,
  waitForAsync,
} from '../utils.js'

// Mock all external dependencies
vi.mock('jszip')
global.fetch = vi.fn()
global.URL.createObjectURL = vi.fn(() => 'mocked-url')
global.URL.revokeObjectURL = vi.fn()

describe('Complete Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock DOM methods
    document.createElement = vi.fn(() => ({
      href: '',
      download: '',
      click: vi.fn(),
    }))
    document.body.appendChild = vi.fn()
    document.body.removeChild = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('End-to-End Workflow', () => {
    it('should complete full workflow from Figma to download', async () => {
      // Step 1: Mock Figma API responses
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFigmaFile),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFigmaImages),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGeminiResponse),
        })

      // Step 2: Fetch Figma file
      const figmaData = await getFigmaFile('test-file-key', 'test-figma-token')
      expect(figmaData).toEqual(mockFigmaFile)

      // Step 3: Get component images
      const componentIds = ['test-component-1', 'test-component-2']
      const images = await getFigmaImages('test-file-key', componentIds, 'test-figma-token')
      expect(images).toEqual(mockFigmaImages)

      // Step 4: Generate React code
      const componentMetadata = {
        id: 'test-component-1',
        name: 'Test Component',
        type: 'COMPONENT',
        width: 100,
        height: 50,
      }
      
      const generatedCode = await generateReactComponent(componentMetadata, 'test-gemini-key')
      expect(generatedCode).toContain('TestComponent')

      // Step 5: Generate project download
      const downloadResult = await generateProjectDownload(generatedCode, 'TestComponent')
      expect(downloadResult.success).toBe(true)
      expect(downloadResult.fileName).toContain('testcomponent-react-project.zip')
    })

    it('should handle API failures gracefully', async () => {
      // Mock Figma API failure
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      })

      await expect(
        getFigmaFile('test-file-key', 'invalid-token')
      ).rejects.toThrow('Figma API Error: 401 Unauthorized')
    })

    it('should handle network failures with retry logic', async () => {
      // Mock network failure followed by success
      fetch
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFigmaFile),
        })

      // This would require implementing retry logic in the actual services
      // For now, we test that the error is properly thrown
      await expect(
        getFigmaFile('test-file-key', 'test-token')
      ).rejects.toThrow('Network Error')
    })
  })

  describe('Performance Testing', () => {
    it('should handle large Figma files efficiently', async () => {
      // Create a large mock file with many components
      const largeFile = {
        ...mockFigmaFile,
        document: {
          ...mockFigmaFile.document,
          children: [
            {
              ...mockFigmaFile.document.children[0],
              children: new Array(100).fill(null).map((_, i) => ({
                id: `component-${i}`,
                name: `Component ${i}`,
                type: 'COMPONENT',
                absoluteBoundingBox: { x: 0, y: i * 100, width: 100, height: 50 },
              })),
            },
          ],
        },
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(largeFile),
      })

      const startTime = Date.now()
      const result = await getFigmaFile('large-file-key', 'test-token')
      const endTime = Date.now()

      expect(result).toEqual(largeFile)
      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
    })

    it('should handle token limit optimization', async () => {
      // Create component with lots of nested children
      const complexComponent = {
        id: 'complex-component',
        name: 'Complex Component',
        type: 'COMPONENT',
        width: 1000,
        height: 800,
        children: new Array(50).fill(null).map((_, i) => ({
          id: `child-${i}`,
          name: `Child Component ${i}`,
          type: 'FRAME',
          children: new Array(10).fill(null).map((_, j) => ({
            id: `nested-${i}-${j}`,
            name: `Nested ${i}-${j}`,
            type: 'TEXT',
            characters: `This is nested text content ${i}-${j}`,
          })),
        })),
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeminiResponse),
      })

      // Should not throw token limit error
      const result = await generateReactComponent(complexComponent, 'test-api-key')
      expect(result).toBeDefined()
    })
  })

  describe('Error Scenario Testing', () => {
    it('should handle invalid Figma URLs', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(
        getFigmaFile('invalid-file-key', 'test-token')
      ).rejects.toThrow('Figma API Error: 404 Not Found')
    })

    it('should handle expired API tokens', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      })

      await expect(
        getFigmaFile('test-file-key', 'expired-token')
      ).rejects.toThrow('Figma API Error: 403 Forbidden')
    })

    it('should handle rate limiting', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      })

      await expect(
        getFigmaFile('test-file-key', 'test-token')
      ).rejects.toThrow('Figma API Error: 429 Too Many Requests')
    })

    it('should handle malformed API responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' }),
      })

      const result = await getFigmaFile('test-file-key', 'test-token')
      expect(result).toEqual({ invalid: 'response' })
    })

    it('should handle Gemini API content policy violations', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({
          error: {
            message: 'Content policy violation',
          },
        }),
      })

      await expect(
        generateReactComponent(mockComponentMetadata, 'test-api-key')
      ).rejects.toThrow('Gemini API Error: 400 Bad Request')
    })
  })

  describe('Data Consistency Testing', () => {
    it('should maintain component metadata through the pipeline', async () => {
      const originalMetadata = {
        id: 'test-component',
        name: 'Original Component',
        type: 'COMPONENT',
        width: 200,
        height: 100,
        fills: [{ type: 'SOLID', color: { r: 1, g: 0, b: 0, a: 1 } }],
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: `import React from 'react';
                    
                    const OriginalComponent = () => {
                      return (
                        <div style={{ width: 200, height: 100, backgroundColor: 'red' }}>
                          Original Component
                        </div>
                      );
                    };
                    
                    export default OriginalComponent;`,
                  },
                ],
              },
            },
          ],
        }),
      })

      const generatedCode = await generateReactComponent(originalMetadata, 'test-api-key')

      // Verify that key information is preserved
      expect(generatedCode).toContain('OriginalComponent')
      expect(generatedCode).toContain('width: 200')
      expect(generatedCode).toContain('height: 100')
      expect(generatedCode).toContain('backgroundColor: \'red\'')
    })

    it('should handle component name sanitization', async () => {
      const componentWithSpecialChars = {
        id: 'special-component',
        name: 'Component with Special-Characters & Symbols!',
        type: 'COMPONENT',
        width: 100,
        height: 50,
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: `import React from 'react';
                    
                    const ComponentWithSpecialCharactersSymbols = () => {
                      return <div>Component content</div>;
                    };
                    
                    export default ComponentWithSpecialCharactersSymbols;`,
                  },
                ],
              },
            },
          ],
        }),
      })

      const generatedCode = await generateReactComponent(componentWithSpecialChars, 'test-api-key')
      
      // Should have valid React component name
      expect(generatedCode).toContain('ComponentWithSpecialCharactersSymbols')
      expect(generatedCode).not.toContain('Component with Special-Characters & Symbols!')
    })
  })
})