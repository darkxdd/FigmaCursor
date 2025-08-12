import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  generateProjectDownload,
  getProjectStructurePreview,
} from '../projectDownloadService.js'

// Mock JSZip
const mockZip = {
  file: vi.fn(),
  generateAsync: vi.fn(() => Promise.resolve(new Blob(['mock zip content'], { type: 'application/zip' }))),
}

vi.mock('jszip', () => ({
  default: vi.fn(() => mockZip),
}))

// Mock DOM methods
global.URL.createObjectURL = vi.fn(() => 'mock-blob-url')
global.URL.revokeObjectURL = vi.fn()

describe('projectDownloadService', () => {
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

  describe('generateProjectDownload', () => {
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

    it('should generate project download successfully', async () => {
      const result = await generateProjectDownload(sampleCode, 'TestComponent')

      expect(result.success).toBe(true)
      expect(result.fileName).toBe('testcomponent-react-project.zip')
      expect(result.componentName).toBe('TestComponent')
    })

    it('should create all necessary project files', async () => {
      await generateProjectDownload(sampleCode, 'TestComponent')

      // Verify that all expected files are added to the ZIP
      const expectedFiles = [
        'package.json',
        'vite.config.js',
        'index.html',
        'src/main.jsx',
        'src/App.jsx',
        'src/index.css',
        'src/theme/index.js',
        'src/components/TestComponent.jsx',
        '.env.example',
        'README.md',
        '.gitignore',
        'eslint.config.js',
        '.prettierrc',
        'tsconfig.json',
        'tsconfig.node.json',
        'public/vite.svg',
      ]

      expectedFiles.forEach(fileName => {
        expect(mockZip.file).toHaveBeenCalledWith(fileName, expect.any(String))
      })
    })

    it('should handle page generation mode', async () => {
      await generateProjectDownload(sampleCode, 'TestPage', true)

      expect(mockZip.file).toHaveBeenCalledWith(
        'src/components/GeneratedPage.jsx',
        expect.any(String)
      )
    })

    it('should clean generated code', async () => {
      const codeWithMarkdown = `\`\`\`jsx
${sampleCode}
\`\`\``

      await generateProjectDownload(codeWithMarkdown, 'TestComponent')

      // Should remove markdown code fences
      expect(mockZip.file).toHaveBeenCalledWith(
        'src/components/TestComponent.jsx',
        expect.not.stringContaining('```')
      )
    })

    it('should extract component name from code', async () => {
      const result = await generateProjectDownload(sampleCode)

      expect(result.componentName).toBe('TestComponent')
    })

    it('should handle code without component name', async () => {
      const codeWithoutName = `import React from 'react';
      
      export default function() {
        return <div>Anonymous component</div>;
      }`

      const result = await generateProjectDownload(codeWithoutName)

      expect(result.componentName).toBe('GeneratedComponent')
    })

    it('should sanitize component names for file paths', async () => {
      const codeWithSpecialChars = `import React from 'react';
      
      const Component_With$pecial123 = () => {
        return <div>Component</div>;
      };
      
      export default Component_With$pecial123;`

      await generateProjectDownload(codeWithSpecialChars)

      expect(mockZip.file).toHaveBeenCalledWith(
        'src/components/ComponentWithpecial123.jsx',
        expect.any(String)
      )
    })

    it('should generate valid package.json', async () => {
      await generateProjectDownload(sampleCode, 'TestComponent')

      const packageJsonCall = mockZip.file.mock.calls.find(call => call[0] === 'package.json')
      expect(packageJsonCall).toBeDefined()

      const packageJson = JSON.parse(packageJsonCall[1])
      expect(packageJson.name).toBe('figma-generated-testcomponent')
      expect(packageJson.dependencies).toHaveProperty('@mui/material')
      expect(packageJson.dependencies).toHaveProperty('react')
      expect(packageJson.devDependencies).toHaveProperty('vite')
      expect(packageJson.scripts).toHaveProperty('dev')
      expect(packageJson.scripts).toHaveProperty('build')
      expect(packageJson.scripts).toHaveProperty('lint')
      expect(packageJson.scripts).toHaveProperty('format')
    })

    it('should generate valid vite config', async () => {
      await generateProjectDownload(sampleCode, 'TestComponent')

      const viteConfigCall = mockZip.file.mock.calls.find(call => call[0] === 'vite.config.js')
      expect(viteConfigCall).toBeDefined()

      const viteConfig = viteConfigCall[1]
      expect(viteConfig).toContain('import { defineConfig } from \'vite\'')
      expect(viteConfig).toContain('@vitejs/plugin-react')
      expect(viteConfig).toContain('port: 3000')
    })

    it('should generate comprehensive README', async () => {
      await generateProjectDownload(sampleCode, 'TestComponent')

      const readmeCall = mockZip.file.mock.calls.find(call => call[0] === 'README.md')
      expect(readmeCall).toBeDefined()

      const readme = readmeCall[1]
      expect(readme).toContain('# TestComponent')
      expect(readme).toContain('## 🚀 Quick Start')
      expect(readme).toContain('npm install')
      expect(readme).toContain('npm run dev')
      expect(readme).toContain('## 📁 Project Structure')
      expect(readme).toContain('## 🛠️ Available Scripts')
    })

    it('should generate proper theme configuration', async () => {
      await generateProjectDownload(sampleCode, 'TestComponent')

      const themeCall = mockZip.file.mock.calls.find(call => call[0] === 'src/theme/index.js')
      expect(themeCall).toBeDefined()

      const theme = themeCall[1]
      expect(theme).toContain('createTheme')
      expect(theme).toContain('palette')
      expect(theme).toContain('typography')
      expect(theme).toContain('components')
    })

    it('should handle ZIP generation errors', async () => {
      mockZip.generateAsync.mockRejectedValueOnce(new Error('ZIP generation failed'))

      await expect(
        generateProjectDownload(sampleCode, 'TestComponent')
      ).rejects.toThrow('Failed to generate project download: ZIP generation failed')
    })

    it('should trigger download in browser', async () => {
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      }
      document.createElement.mockReturnValue(mockAnchor)

      await generateProjectDownload(sampleCode, 'TestComponent')

      expect(document.createElement).toHaveBeenCalledWith('a')
      expect(mockAnchor.href).toBe('mock-blob-url')
      expect(mockAnchor.download).toBe('testcomponent-react-project.zip')
      expect(mockAnchor.click).toHaveBeenCalled()
      expect(document.body.appendChild).toHaveBeenCalledWith(mockAnchor)
      expect(document.body.removeChild).toHaveBeenCalledWith(mockAnchor)
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-blob-url')
    })
  })

  describe('getProjectStructurePreview', () => {
    it('should return project structure for regular component', () => {
      const structure = getProjectStructurePreview('TestComponent', false)

      expect(structure.name).toBe('testcomponent-react-project')
      expect(structure.type).toBe('folder')
      expect(structure.children).toBeDefined()

      // Check for main directories
      const srcFolder = structure.children.find(child => child.name === 'src')
      expect(srcFolder).toBeDefined()
      expect(srcFolder.type).toBe('folder')

      const componentsFolder = srcFolder.children.find(child => child.name === 'components')
      expect(componentsFolder).toBeDefined()
      expect(componentsFolder.children).toContainEqual({
        name: 'TestComponent.jsx',
        type: 'file',
      })

      const themeFolder = srcFolder.children.find(child => child.name === 'theme')
      expect(themeFolder).toBeDefined()
      expect(themeFolder.children).toContainEqual({
        name: 'index.js',
        type: 'file',
      })
    })

    it('should return project structure for page generation mode', () => {
      const structure = getProjectStructurePreview('TestPage', true)

      const srcFolder = structure.children.find(child => child.name === 'src')
      const componentsFolder = srcFolder.children.find(child => child.name === 'components')
      
      expect(componentsFolder.children).toContainEqual({
        name: 'GeneratedPage.jsx',
        type: 'file',
      })
    })

    it('should include all configuration files', () => {
      const structure = getProjectStructurePreview('TestComponent')

      const expectedFiles = [
        'package.json',
        'vite.config.js',
        'index.html',
        'README.md',
        '.gitignore',
        '.prettierrc',
        'eslint.config.js',
        'tsconfig.json',
        'tsconfig.node.json',
        '.env.example',
      ]

      expectedFiles.forEach(fileName => {
        expect(structure.children).toContainEqual({
          name: fileName,
          type: 'file',
        })
      })
    })

    it('should include public folder with assets', () => {
      const structure = getProjectStructurePreview('TestComponent')

      const publicFolder = structure.children.find(child => child.name === 'public')
      expect(publicFolder).toBeDefined()
      expect(publicFolder.children).toContainEqual({
        name: 'vite.svg',
        type: 'file',
      })
    })
  })
})