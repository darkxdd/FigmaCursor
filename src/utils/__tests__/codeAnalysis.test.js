import { describe, it, expect } from 'vitest'
import {
  analyzeGeneratedCode,
  extractComponentName,
  validateReactCode,
  estimateTokenCount,
  optimizeCodeForTokens,
} from '../codeAnalysis.js'

describe('codeAnalysis', () => {
  describe('extractComponentName', () => {
    it('should extract function component name', () => {
      const code = `function MyComponent() {
        return <div>Hello</div>;
      }`
      expect(extractComponentName(code)).toBe('MyComponent')
    })

    it('should extract arrow function component name', () => {
      const code = `const TestComponent = () => {
        return <div>Test</div>;
      }`
      expect(extractComponentName(code)).toBe('TestComponent')
    })

    it('should extract const function component name', () => {
      const code = `const AnotherComponent = function() {
        return <div>Another</div>;
      }`
      expect(extractComponentName(code)).toBe('AnotherComponent')
    })

    it('should return default name if no component found', () => {
      const code = `const someVariable = 'hello';`
      expect(extractComponentName(code)).toBe('GeneratedComponent')
    })
  })

  describe('validateReactCode', () => {
    it('should validate correct React code', () => {
      const validCode = `import React from 'react';
      
      function MyComponent() {
        return <div>Hello World</div>;
      }
      
      export default MyComponent;`

      const result = validateReactCode(validCode)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect missing React import', () => {
      const invalidCode = `function MyComponent() {
        return <div>Hello World</div>;
      }`

      const result = validateReactCode(invalidCode)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Missing React import')
    })

    it('should detect missing export', () => {
      const invalidCode = `import React from 'react';
      
      function MyComponent() {
        return <div>Hello World</div>;
      }`

      const result = validateReactCode(invalidCode)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Missing default export')
    })

    it('should detect unclosed JSX tags', () => {
      const invalidCode = `import React from 'react';
      
      function MyComponent() {
        return <div>Hello World;
      }
      
      export default MyComponent;`

      const result = validateReactCode(invalidCode)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('JSX'))).toBe(true)
    })
  })

  describe('estimateTokenCount', () => {
    it('should estimate token count for text', () => {
      const text = 'Hello world this is a test'
      const count = estimateTokenCount(text)
      expect(count).toBeGreaterThan(0)
      expect(count).toBeLessThan(20) // Should be reasonable estimate
    })

    it('should handle empty text', () => {
      expect(estimateTokenCount('')).toBe(0)
    })

    it('should handle code with special characters', () => {
      const code = `const component = () => { return <div className="test">Hello</div>; }`
      const count = estimateTokenCount(code)
      expect(count).toBeGreaterThan(10)
    })
  })

  describe('optimizeCodeForTokens', () => {
    it('should remove comments to reduce tokens', () => {
      const codeWithComments = `// This is a comment
      /* Multi-line comment */
      function MyComponent() {
        // Another comment
        return <div>Hello</div>;
      }`

      const optimized = optimizeCodeForTokens(codeWithComments)
      expect(optimized).not.toContain('// This is a comment')
      expect(optimized).not.toContain('/* Multi-line comment */')
      expect(optimized).not.toContain('// Another comment')
    })

    it('should remove extra whitespace', () => {
      const codeWithWhitespace = `function MyComponent() {
        
        
        return <div>Hello</div>;
        
        
      }`

      const optimized = optimizeCodeForTokens(codeWithWhitespace)
      expect(optimized).not.toMatch(/\n\s*\n\s*\n/)
    })

    it('should preserve essential code structure', () => {
      const code = `function MyComponent() {
        return <div>Hello</div>;
      }`

      const optimized = optimizeCodeForTokens(code)
      expect(optimized).toContain('function MyComponent')
      expect(optimized).toContain('return <div>Hello</div>')
    })
  })

  describe('analyzeGeneratedCode', () => {
    it('should analyze complete React component', () => {
      const code = `import React from 'react';
      import { Box, Typography } from '@mui/material';
      
      function MyComponent() {
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h4">Hello World</Typography>
          </Box>
        );
      }
      
      export default MyComponent;`

      const analysis = analyzeGeneratedCode(code)

      expect(analysis.componentName).toBe('MyComponent')
      expect(analysis.isValid).toBe(true)
      expect(analysis.tokenCount).toBeGreaterThan(0)
      expect(analysis.imports).toContain('React')
      expect(analysis.imports).toContain('@mui/material')
      expect(analysis.muiComponents).toContain('Box')
      expect(analysis.muiComponents).toContain('Typography')
    })

    it('should handle invalid code', () => {
      const invalidCode = `function BrokenComponent() {
        return <div>Unclosed div;
      }`

      const analysis = analyzeGeneratedCode(invalidCode)

      expect(analysis.componentName).toBe('BrokenComponent')
      expect(analysis.isValid).toBe(false)
      expect(analysis.errors.length).toBeGreaterThan(0)
    })
  })
})