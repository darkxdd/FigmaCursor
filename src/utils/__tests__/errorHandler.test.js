import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  handleError,
  createErrorMessage,
  isNetworkError,
  isAPIError,
  retryWithBackoff,
} from '../errorHandler.js'

describe('errorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('handleError', () => {
    it('should handle network errors', () => {
      const networkError = new Error('Network Error')
      networkError.name = 'NetworkError'

      const result = handleError(networkError)

      expect(result).toEqual({
        type: 'network',
        message: 'Network connection failed. Please check your internet connection.',
        originalError: networkError,
        canRetry: true,
      })
    })

    it('should handle API errors with status codes', () => {
      const apiError = new Error('API Error')
      apiError.status = 401

      const result = handleError(apiError)

      expect(result).toEqual({
        type: 'api',
        message: 'Authentication failed. Please check your API token.',
        originalError: apiError,
        canRetry: false,
      })
    })

    it('should handle validation errors', () => {
      const validationError = new Error('Invalid input')
      validationError.name = 'ValidationError'

      const result = handleError(validationError)

      expect(result).toEqual({
        type: 'validation',
        message: 'Invalid input',
        originalError: validationError,
        canRetry: false,
      })
    })

    it('should handle unknown errors', () => {
      const unknownError = new Error('Something went wrong')

      const result = handleError(unknownError)

      expect(result).toEqual({
        type: 'unknown',
        message: 'An unexpected error occurred. Please try again.',
        originalError: unknownError,
        canRetry: true,
      })
    })
  })

  describe('createErrorMessage', () => {
    it('should create user-friendly messages for different error types', () => {
      expect(createErrorMessage('network')).toBe(
        'Network connection failed. Please check your internet connection.'
      )
      expect(createErrorMessage('api', 401)).toBe(
        'Authentication failed. Please check your API token.'
      )
      expect(createErrorMessage('api', 429)).toBe(
        'Rate limit exceeded. Please wait a moment and try again.'
      )
      expect(createErrorMessage('validation')).toBe(
        'Please check your input and try again.'
      )
      expect(createErrorMessage('unknown')).toBe(
        'An unexpected error occurred. Please try again.'
      )
    })
  })

  describe('isNetworkError', () => {
    it('should identify network errors', () => {
      const networkError = new Error('Network Error')
      networkError.name = 'NetworkError'
      expect(isNetworkError(networkError)).toBe(true)

      const fetchError = new Error('Failed to fetch')
      expect(isNetworkError(fetchError)).toBe(true)

      const regularError = new Error('Regular error')
      expect(isNetworkError(regularError)).toBe(false)
    })
  })

  describe('isAPIError', () => {
    it('should identify API errors', () => {
      const apiError = new Error('API Error')
      apiError.status = 500
      expect(isAPIError(apiError)).toBe(true)

      const regularError = new Error('Regular error')
      expect(isAPIError(regularError)).toBe(false)
    })
  })

  describe('retryWithBackoff', () => {
    it('should retry function with exponential backoff', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('First attempt'))
        .mockRejectedValueOnce(new Error('Second attempt'))
        .mockResolvedValueOnce('Success')

      const result = await retryWithBackoff(mockFn, 3, 10)

      expect(result).toBe('Success')
      expect(mockFn).toHaveBeenCalledTimes(3)
    })

    it('should throw error after max retries', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Always fails'))

      await expect(retryWithBackoff(mockFn, 2, 10)).rejects.toThrow('Always fails')
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should succeed on first attempt', async () => {
      const mockFn = vi.fn().mockResolvedValue('Success')

      const result = await retryWithBackoff(mockFn, 3, 10)

      expect(result).toBe('Success')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })
})