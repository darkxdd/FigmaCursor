import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  generateReactComponent,
  generateCompletePage,
  createMinimalPrompt,
  estimateTokenCount,
  extractPageStructure,
} from '../geminiApi.js'
import { mockGeminiResponse, mockComponentMetadata } from '../../test/utils.js'

// Mock fetch globally
global.fetch = vi.fn()

describe('geminiApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('generateReactComponent', () => {
    it('should generate React component successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeminiResponse),
      })

      const result = await generateReactComponent(mockComponentMetadata, 'test-api-key')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('Generate a React component'),
        })
      )

      expect(result).toContain('import React from \'react\'')
      expect(result).toContain('TestComponent')
    })

    it('should handle API errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      })

      await expect(
        generateReactComponent(mockComponentMetadata, 'invalid-key')
      ).rejects.toThrow('Gemini API Error: 401 Unauthorized')
    })

    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network Error'))

      await expect(
        generateReactComponent(mockComponentMetadata, 'test-api-key')
      ).rejects.toThrow('Network Error')
    })

    it('should validate required parameters', async () => {
      await expect(
        generateReactComponent(null, 'test-api-key')
      ).rejects.toThrow('Component metadata is required')

      await expect(
        generateReactComponent(mockComponentMetadata, '')
      ).rejects.toThrow('API key is required')
    })

    it('should handle empty response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ candidates: [] }),
      })

      await expect(
        generateReactComponent(mockComponentMetadata, 'test-api-key')
      ).rejects.toThrow('No response generated')
    })
  })

  describe('generateCompletePage', () => {
    it('should generate complete page successfully', async () => {
      const pageComponents = [mockComponentMetadata]
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: `import React from 'react';
                    
                    const CompletePage = () => {
                      return (
                        <div>
                          <header>Header</header>
                          <main>Main Content</main>
                          <footer>Footer</footer>
                        </div>
                      );
                    };
                    
                    export default CompletePage;`,
                  },
                ],
              },
            },
          ],
        }),
      })

      const result = await generateCompletePage(pageComponents, 'test-api-key')

      expect(result).toContain('CompletePage')
      expect(result).toContain('header')
      expect(result).toContain('main')
      expect(result).toContain('footer')
    })

    it('should handle empty components array', async () => {
      await expect(
        generateCompletePage([], 'test-api-key')
      ).rejects.toThrow('At least one component is required')
    })
  })

  describe('createMinimalPrompt', () => {
    it('should create minimal prompt for large components', () => {
      const largeComponent = {
        ...mockComponentMetadata,
        name: 'Large Component',
        children: new Array(50).fill(null).map((_, i) => ({
          id: `child-${i}`,
          name: `Child ${i}`,
          type: 'RECTANGLE',
        })),
      }

      const prompt = createMinimalPrompt(largeComponent)

      expect(prompt).toContain('Large Component')
      expect(prompt).toContain('COMPONENT')
      expect(prompt.length).toBeLessThan(1000) // Should be significantly shorter
    })

    it('should preserve essential information', () => {
      const prompt = createMinimalPrompt(mockComponentMetadata)

      expect(prompt).toContain(mockComponentMetadata.name)
      expect(prompt).toContain(mockComponentMetadata.type)
      expect(prompt).toContain('width')
      expect(prompt).toContain('height')
    })
  })

  describe('estimateTokenCount', () => {
    it('should estimate token count for text', () => {
      const text = 'This is a sample text for token estimation'
      const count = estimateTokenCount(text)

      expect(count).toBeGreaterThan(0)
      expect(count).toBeLessThan(20) // Reasonable estimate
    })

    it('should handle empty text', () => {
      expect(estimateTokenCount('')).toBe(0)
    })

    it('should handle JSON objects', () => {
      const obj = { key: 'value', nested: { array: [1, 2, 3] } }
      const count = estimateTokenCount(JSON.stringify(obj))

      expect(count).toBeGreaterThan(5)
    })
  })

  describe('extractPageStructure', () => {
    it('should extract page structure from components', () => {
      const components = [
        {
          ...mockComponentMetadata,
          name: 'Header',
          y: 0,
          height: 80,
        },
        {
          ...mockComponentMetadata,
          name: 'Main Content',
          y: 100,
          height: 400,
        },
        {
          ...mockComponentMetadata,
          name: 'Footer',
          y: 520,
          height: 60,
        },
      ]

      const structure = extractPageStructure(components)

      expect(structure.layout).toBe('header-footer')
      expect(structure.header).toBeDefined()
      expect(structure.main).toBeDefined()
      expect(structure.footer).toBeDefined()
      expect(structure.header.name).toBe('Header')
      expect(structure.footer.name).toBe('Footer')
    })

    it('should detect sidebar layout', () => {
      const components = [
        {
          ...mockComponentMetadata,
          name: 'Sidebar',
          x: 0,
          width: 200,
          height: 600,
        },
        {
          ...mockComponentMetadata,
          name: 'Main Content',
          x: 220,
          width: 800,
          height: 600,
        },
      ]

      const structure = extractPageStructure(components)

      expect(structure.layout).toBe('sidebar')
      expect(structure.sidebar).toBeDefined()
      expect(structure.main).toBeDefined()
    })

    it('should default to vertical layout', () => {
      const components = [
        {
          ...mockComponentMetadata,
          name: 'Component 1',
          y: 0,
        },
        {
          ...mockComponentMetadata,
          name: 'Component 2',
          y: 100,
        },
      ]

      const structure = extractPageStructure(components)

      expect(structure.layout).toBe('vertical')
      expect(structure.components).toHaveLength(2)
    })

    it('should handle empty components array', () => {
      const structure = extractPageStructure([])

      expect(structure.layout).toBe('vertical')
      expect(structure.components).toHaveLength(0)
      expect(structure.header).toBeNull()
      expect(structure.footer).toBeNull()
    })
  })
})