import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getFigmaFile,
  getFigmaImages,
  extractSimplifiedMetadata,
  getComponentsWithPagination,
  extractAllTextContent,
} from '../figmaApi.js'
import { mockFigmaFile, mockFigmaImages, simulateNetworkError } from '../../test/utils.js'

// Mock fetch globally
global.fetch = vi.fn()

describe('figmaApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getFigmaFile', () => {
    it('should fetch Figma file successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFigmaFile),
      })

      const result = await getFigmaFile('test-file-key', 'test-token')

      expect(fetch).toHaveBeenCalledWith(
        'https://api.figma.com/v1/files/test-file-key',
        {
          headers: {
            'X-Figma-Token': 'test-token',
          },
        }
      )
      expect(result).toEqual(mockFigmaFile)
    })

    it('should handle API errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      })

      await expect(getFigmaFile('test-file-key', 'invalid-token')).rejects.toThrow(
        'Figma API Error: 401 Unauthorized'
      )
    })

    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network Error'))

      await expect(getFigmaFile('test-file-key', 'test-token')).rejects.toThrow(
        'Network Error'
      )
    })

    it('should validate required parameters', async () => {
      await expect(getFigmaFile('', 'test-token')).rejects.toThrow(
        'File key is required'
      )
      await expect(getFigmaFile('test-file-key', '')).rejects.toThrow(
        'Access token is required'
      )
    })
  })

  describe('getFigmaImages', () => {
    it('should fetch component images successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFigmaImages),
      })

      const componentIds = ['test-component-1', 'test-component-2']
      const result = await getFigmaImages('test-file-key', componentIds, 'test-token')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.figma.com/v1/images/test-file-key'),
        {
          headers: {
            'X-Figma-Token': 'test-token',
          },
        }
      )
      expect(result).toEqual(mockFigmaImages)
    })

    it('should handle empty component IDs', async () => {
      const result = await getFigmaImages('test-file-key', [], 'test-token')
      expect(result).toEqual({ images: {} })
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should handle API errors for images', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(
        getFigmaImages('test-file-key', ['invalid-id'], 'test-token')
      ).rejects.toThrow('Figma API Error: 404 Not Found')
    })
  })

  describe('extractSimplifiedMetadata', () => {
    it('should extract metadata from Figma node', () => {
      const node = {
        id: 'test-node',
        name: 'Test Node',
        type: 'FRAME',
        absoluteBoundingBox: { x: 10, y: 20, width: 100, height: 50 },
        fills: [{ type: 'SOLID', color: { r: 1, g: 0, b: 0, a: 1 } }],
        children: [],
      }

      const metadata = extractSimplifiedMetadata(node)

      expect(metadata).toEqual({
        id: 'test-node',
        name: 'Test Node',
        type: 'FRAME',
        width: 100,
        height: 50,
        x: 10,
        y: 20,
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
      })
    })

    it('should handle text nodes', () => {
      const textNode = {
        id: 'text-node',
        name: 'Text Node',
        type: 'TEXT',
        characters: 'Hello World',
        style: {
          fontSize: 18,
          fontFamily: 'Arial',
          fontWeight: 700,
          textAlignHorizontal: 'CENTER',
        },
        absoluteBoundingBox: { x: 0, y: 0, width: 200, height: 30 },
      }

      const metadata = extractSimplifiedMetadata(textNode)

      expect(metadata.characters).toBe('Hello World')
      expect(metadata.hasText).toBe(true)
      expect(metadata.fontSize).toBe(18)
      expect(metadata.fontFamily).toBe('Arial')
      expect(metadata.fontWeight).toBe(700)
      expect(metadata.textAlign).toBe('CENTER')
    })

    it('should handle nodes with children', () => {
      const parentNode = {
        id: 'parent',
        name: 'Parent',
        type: 'FRAME',
        absoluteBoundingBox: { x: 0, y: 0, width: 200, height: 100 },
        children: [
          {
            id: 'child',
            name: 'Child',
            type: 'RECTANGLE',
            absoluteBoundingBox: { x: 10, y: 10, width: 50, height: 25 },
          },
        ],
      }

      const metadata = extractSimplifiedMetadata(parentNode)

      expect(metadata.children).toHaveLength(1)
      expect(metadata.children[0].id).toBe('child')
      expect(metadata.children[0].name).toBe('Child')
    })
  })

  describe('getComponentsWithPagination', () => {
    it('should return paginated components', () => {
      const components = [
        { id: '1', name: 'Component 1', type: 'COMPONENT' },
        { id: '2', name: 'Component 2', type: 'COMPONENT' },
        { id: '3', name: 'Component 3', type: 'COMPONENT' },
        { id: '4', name: 'Component 4', type: 'COMPONENT' },
        { id: '5', name: 'Component 5', type: 'COMPONENT' },
      ]

      const result = getComponentsWithPagination(components, 1, 2)

      expect(result.components).toHaveLength(2)
      expect(result.components[0].id).toBe('1')
      expect(result.components[1].id).toBe('2')
      expect(result.totalPages).toBe(3)
      expect(result.hasMore).toBe(true)
    })

    it('should handle last page', () => {
      const components = [
        { id: '1', name: 'Component 1', type: 'COMPONENT' },
        { id: '2', name: 'Component 2', type: 'COMPONENT' },
        { id: '3', name: 'Component 3', type: 'COMPONENT' },
      ]

      const result = getComponentsWithPagination(components, 2, 2)

      expect(result.components).toHaveLength(1)
      expect(result.components[0].id).toBe('3')
      expect(result.totalPages).toBe(2)
      expect(result.hasMore).toBe(false)
    })

    it('should handle empty components array', () => {
      const result = getComponentsWithPagination([], 1, 10)

      expect(result.components).toHaveLength(0)
      expect(result.totalPages).toBe(0)
      expect(result.hasMore).toBe(false)
    })
  })

  describe('extractAllTextContent', () => {
    it('should extract text from node and children', () => {
      const node = {
        type: 'TEXT',
        characters: 'Main text',
        children: [
          {
            type: 'TEXT',
            characters: 'Child text',
            children: [
              {
                type: 'TEXT',
                characters: 'Nested text',
              },
            ],
          },
          {
            type: 'RECTANGLE',
            children: [
              {
                type: 'TEXT',
                characters: 'Deep nested text',
              },
            ],
          },
        ],
      }

      const textContent = extractAllTextContent(node)

      expect(textContent).toEqual([
        { text: 'Main text', fontSize: 16, fontFamily: 'Roboto' },
        { text: 'Child text', fontSize: 16, fontFamily: 'Roboto' },
        { text: 'Nested text', fontSize: 16, fontFamily: 'Roboto' },
        { text: 'Deep nested text', fontSize: 16, fontFamily: 'Roboto' },
      ])
    })

    it('should handle nodes without text', () => {
      const node = {
        type: 'RECTANGLE',
        children: [
          {
            type: 'FRAME',
            children: [],
          },
        ],
      }

      const textContent = extractAllTextContent(node)
      expect(textContent).toEqual([])
    })

    it('should extract text with style information', () => {
      const node = {
        type: 'TEXT',
        characters: 'Styled text',
        style: {
          fontSize: 24,
          fontFamily: 'Arial',
          fontWeight: 700,
        },
      }

      const textContent = extractAllTextContent(node)

      expect(textContent).toEqual([
        {
          text: 'Styled text',
          fontSize: 24,
          fontFamily: 'Arial',
          fontWeight: 700,
        },
      ])
    })
  })
})