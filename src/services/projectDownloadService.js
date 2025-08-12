import JSZip from 'jszip';

// Generate package.json for the downloaded project
const generatePackageJson = (componentName = 'GeneratedComponent') => {
  return JSON.stringify({
    "name": `figma-generated-${componentName.toLowerCase().replace(/\s+/g, '-')}`,
    "private": true,
    "version": "0.0.0",
    "type": "module",
    "description": "React project generated from Figma design",
    "scripts": {
      "dev": "vite",
      "build": "vite build",
      "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
      "lint:fix": "eslint . --ext js,jsx --fix",
      "format": "prettier --write \"src/**/*.{js,jsx,ts,tsx,json,css,md}\"",
      "format:check": "prettier --check \"src/**/*.{js,jsx,ts,tsx,json,css,md}\"",
      "preview": "vite preview",
      "type-check": "tsc --noEmit"
    },
    "dependencies": {
      "@emotion/react": "^11.14.0",
      "@emotion/styled": "^11.14.1",
      "@mui/icons-material": "^7.3.0",
      "@mui/material": "^7.3.0",
      "react": "^19.1.0",
      "react-dom": "^19.1.0"
    },
    "devDependencies": {
      "@types/react": "^19.1.8",
      "@types/react-dom": "^19.1.6",
      "@vitejs/plugin-react": "^4.6.0",
      "eslint": "^9.30.1",
      "eslint-plugin-react-hooks": "^5.2.0",
      "eslint-plugin-react-refresh": "^0.4.20",
      "globals": "^16.3.0",
      "prettier": "^3.4.2",
      "typescript": "^5.7.3",
      "vite": "^7.0.4"
    },
    "keywords": [
      "react",
      "figma",
      "generated",
      "component"
    ],
    "author": "Figma to React Generator",
    "license": "MIT"
  }, null, 2);
};

// Generate vite.config.js
const generateViteConfig = () => {
  return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
`;
};

// Generate index.html
const generateIndexHtml = (componentName = 'Generated Component') => {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${componentName} - Generated from Figma</title>
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
    />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/icon?family=Material+Icons"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;
};

// Generate main.jsx
const generateMainFile = () => {
  return `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;
};

// Generate App.jsx wrapper
const generateAppWrapper = (generatedCode, componentName = 'GeneratedComponent', pageGenerationMode = false) => {
  // Extract component name from generated code if possible
  const componentNameMatch = generatedCode.match(/(?:function|const)\s+(\w+)/);
  const extractedName = componentNameMatch ? componentNameMatch[1] : componentName;
  
  // Clean the component name for import
  const cleanComponentName = extractedName.replace(/[^a-zA-Z0-9]/g, '');
  
  if (pageGenerationMode) {
    return `import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import GeneratedPage from './components/GeneratedPage.jsx';
import theme from './theme/index.js';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GeneratedPage />
    </ThemeProvider>
  );
}

export default App;
`;
  } else {
    return `import React from 'react';
import { ThemeProvider, CssBaseline, Container, Box } from '@mui/material';
import ${cleanComponentName} from './components/${cleanComponentName}.jsx';
import theme from './theme/index.js';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <${cleanComponentName} />
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
`;
  }
};

// Generate index.css
const generateIndexCSS = () => {
  return `/* Reset and base styles */
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #fafafa;
}

#root {
  min-height: 100vh;
}

/* Utility classes */
.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.items-center {
  align-items: center;
}

.justify-center {
  justify-content: center;
}

.w-full {
  width: 100%;
}

.h-full {
  height: 100%;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.5);
}
`;
};

// Generate .env.example
const generateEnvExample = () => {
  return `# Environment Variables Example
# Copy this file to .env and fill in your actual values

# Figma API Token (optional - for development)
VITE_FIGMA_API_TOKEN=your_figma_token_here

# Gemini API Key (optional - for development)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Development settings
VITE_DEV_MODE=true
`;
};

// Generate README.md
const generateReadme = (componentName = 'Generated Component', pageGenerationMode = false) => {
  const cleanComponentName = componentName.replace(/[^a-zA-Z0-9]/g, '');
  return `# ${componentName}

This React project was generated from a Figma design using the Figma-to-React Generator. It follows React best practices and includes modern development tools for an optimal development experience.

## 🚀 Quick Start

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn package manager

### Installation & Setup

1. **Extract the project:**
   Extract the downloaded ZIP file to your desired location.

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`
   
   Or with yarn:
   \`\`\`bash
   yarn install
   \`\`\`

3. **Start the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`
   
   Or with yarn:
   \`\`\`bash
   yarn dev
   \`\`\`

4. **Open your browser:**
   Navigate to \`http://localhost:3000\` to see your generated component.

## 📁 Project Structure

\`\`\`
${cleanComponentName.toLowerCase()}-react-project/
├── public/
│   └── vite.svg                    # Vite logo
├── src/
│   ├── components/
│   │   └── ${pageGenerationMode ? 'GeneratedPage.jsx' : cleanComponentName + '.jsx'}     # Your generated component
│   ├── theme/
│   │   └── index.js                # Material-UI theme configuration
│   ├── App.jsx                     # Main app component with theme provider
│   ├── main.jsx                    # React app entry point
│   └── index.css                   # Global styles and CSS reset
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore rules
├── .prettierrc                     # Prettier configuration
├── eslint.config.js                # ESLint configuration
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── tsconfig.node.json              # TypeScript Node configuration
├── vite.config.js                  # Vite build configuration
└── README.md                       # This file
\`\`\`

## 🛠️ Available Scripts

### Development
- \`npm run dev\` - Start development server with hot reload
- \`npm run preview\` - Preview production build locally

### Build & Production
- \`npm run build\` - Build optimized production bundle
- \`npm run type-check\` - Run TypeScript type checking

### Code Quality
- \`npm run lint\` - Run ESLint to check for code issues
- \`npm run lint:fix\` - Automatically fix ESLint issues
- \`npm run format\` - Format code with Prettier
- \`npm run format:check\` - Check if code is properly formatted

## 🎨 Customization

### Theme Customization
The project uses a comprehensive Material-UI theme located in \`src/theme/index.js\`. You can customize:

- **Colors**: Primary, secondary, and semantic colors
- **Typography**: Font families, sizes, and weights  
- **Spacing**: Consistent spacing scale
- **Component Overrides**: Default styles for MUI components
- **Breakpoints**: Responsive design breakpoints

### Adding New Components
1. Create new component files in \`src/components/\`
2. Follow the existing naming convention (PascalCase)
3. Import and use in your main component or App.jsx

### Styling Approaches
- **Material-UI System**: Use the \`sx\` prop for component-specific styles
- **Styled Components**: Use \`@emotion/styled\` for complex custom components
- **CSS Classes**: Add global styles to \`src/index.css\`

## 📦 Technology Stack

### Core Dependencies
- **React 19** - Modern React with latest features
- **Material-UI (MUI) v7** - Comprehensive component library
- **Emotion** - CSS-in-JS styling solution
- **Vite** - Fast build tool and development server

### Development Tools
- **ESLint** - Code linting with React-specific rules
- **Prettier** - Code formatting for consistency
- **TypeScript** - Type checking (config included)

### Key Features
- ⚡ **Fast Development**: Vite's instant hot reload
- 🎨 **Material Design**: Consistent, accessible UI components
- 📱 **Responsive**: Mobile-first responsive design
- ♿ **Accessible**: Built-in accessibility features
- 🔧 **Type Safe**: TypeScript configuration included
- 📏 **Code Quality**: ESLint and Prettier integration

## 🔧 Development Best Practices

### Code Organization
- Keep components small and focused
- Use custom hooks for reusable logic
- Organize files by feature when the project grows
- Follow consistent naming conventions

### Performance
- Use React.memo() for expensive components
- Implement proper key props for lists
- Lazy load components when appropriate
- Optimize images and assets

### Accessibility
- Use semantic HTML elements
- Provide proper ARIA labels
- Ensure keyboard navigation works
- Test with screen readers

## 🚀 Deployment

### Build for Production
\`\`\`bash
npm run build
\`\`\`

The \`dist/\` folder will contain the optimized production build.

### Deployment Options
- **Vercel**: \`vercel --prod\`
- **Netlify**: Drag and drop the \`dist/\` folder
- **GitHub Pages**: Use \`gh-pages\` package
- **AWS S3**: Upload \`dist/\` contents to S3 bucket

## 🐛 Troubleshooting

### Common Issues

**Development server won't start:**
- Ensure Node.js version 18+ is installed
- Delete \`node_modules\` and run \`npm install\` again
- Check if port 3000 is already in use

**Build fails:**
- Run \`npm run lint\` to check for code issues
- Run \`npm run type-check\` to verify TypeScript
- Check console for specific error messages

**Styling issues:**
- Verify Material-UI theme is properly imported
- Check browser developer tools for CSS conflicts
- Ensure proper component prop usage

## 📝 Notes

- This project was generated automatically from Figma designs
- The generated code aims for visual similarity within API token limits
- Some manual adjustments may be needed for complex interactions
- Consider optimizing images and assets for production use
- The project follows React 19 patterns and best practices

## 🤝 Contributing

Feel free to modify and enhance the generated components to better fit your needs! 

### Making Changes
1. Follow the existing code style and patterns
2. Run \`npm run lint\` and \`npm run format\` before committing
3. Test your changes thoroughly
4. Update documentation as needed

---

Generated with ❤️ by [Figma-to-React Generator](https://github.com/yourusername/figma-to-react-generator)
`;
};

// Generate .gitignore
const generateGitignore = () => {
  return `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
build/
dist/

# Dependencies
node_modules/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
`;
};

// Generate ESLint config
const generateEslintConfig = () => {
  return `import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Additional React best practices
      'react/prop-types': 'warn',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-react': 'off', // Not needed with new JSX transform
      'react/jsx-uses-vars': 'error',
      'react/no-deprecated': 'warn',
      'react/no-direct-mutation-state': 'error',
      'react/no-unknown-property': 'error',
      'react/require-render-return': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
]
`;
};

// Generate Prettier config
const generatePrettierConfig = () => {
  return JSON.stringify({
    "semi": true,
    "trailingComma": "es5",
    "singleQuote": true,
    "printWidth": 80,
    "tabWidth": 2,
    "useTabs": false,
    "bracketSpacing": true,
    "bracketSameLine": false,
    "arrowParens": "avoid",
    "endOfLine": "lf",
    "jsxSingleQuote": true,
    "quoteProps": "as-needed"
  }, null, 2);
};

// Generate TypeScript config for better development experience
const generateTsConfig = () => {
  return JSON.stringify({
    "compilerOptions": {
      "target": "ES2020",
      "useDefineForClassFields": true,
      "lib": ["ES2020", "DOM", "DOM.Iterable"],
      "module": "ESNext",
      "skipLibCheck": true,
      "moduleResolution": "bundler",
      "allowImportingTsExtensions": true,
      "resolveJsonModule": true,
      "isolatedModules": true,
      "noEmit": true,
      "jsx": "react-jsx",
      "strict": true,
      "noUnusedLocals": true,
      "noUnusedParameters": true,
      "noFallthroughCasesInSwitch": true
    },
    "include": ["src"],
    "references": [{ "path": "./tsconfig.node.json" }]
  }, null, 2);
};

// Generate TypeScript Node config
const generateTsNodeConfig = () => {
  return JSON.stringify({
    "compilerOptions": {
      "composite": true,
      "skipLibCheck": true,
      "module": "ESNext",
      "moduleResolution": "bundler",
      "allowSyntheticDefaultImports": true
    },
    "include": ["vite.config.js"]
  }, null, 2);
};

// Generate comprehensive theme configuration
const generateThemeConfig = () => {
  return `import { createTheme } from '@mui/material/styles';

// Custom theme configuration following Material Design principles
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
      contrastText: '#ffffff',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    info: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.125rem',
      fontWeight: 300,
      lineHeight: 1.167,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 400,
      lineHeight: 1.2,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.167,
    },
    h4: {
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.235,
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.334,
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.6,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'uppercase',
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        elevation1: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});

export default theme;
`;
};

// Clean and format generated code
const cleanGeneratedCode = (code) => {
  // Remove markdown code fences if present
  let cleaned = code.replace(/```(?:jsx|javascript|js)?\n?([\s\S]*?)```/g, '$1').trim();
  
  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();
  
  // Ensure proper imports are present
  if (!cleaned.includes('import React') && !cleaned.includes('import { React }')) {
    cleaned = "import React from 'react';\n" + cleaned;
  }
  
  // Ensure Material-UI imports if MUI components are used
  const muiComponents = ['Box', 'Typography', 'Button', 'Card', 'AppBar', 'Toolbar', 'Container', 'Grid', 'Paper'];
  const usedMuiComponents = muiComponents.filter(comp => cleaned.includes(`<${comp}`));
  
  if (usedMuiComponents.length > 0 && !cleaned.includes('@mui/material')) {
    const importLine = `import { ${usedMuiComponents.join(', ')} } from '@mui/material';\n`;
    cleaned = cleaned.replace(/import React from 'react';\n/, `import React from 'react';\n${importLine}`);
  }
  
  return cleaned;
};

// Main function to generate complete project download
export const generateProjectDownload = async (generatedCode, componentName = 'GeneratedComponent', pageGenerationMode = false) => {
  try {
    const zip = new JSZip();
    
    // Clean the generated code
    const cleanedCode = cleanGeneratedCode(generatedCode);
    
    // Extract actual component name from code
    const componentNameMatch = cleanedCode.match(/(?:function|const)\s+(\w+)/);
    const actualComponentName = componentNameMatch ? componentNameMatch[1] : componentName;
    const cleanComponentName = actualComponentName.replace(/[^a-zA-Z0-9]/g, '');
    
    // Generate all project files
    const projectFiles = {
      'package.json': generatePackageJson(cleanComponentName),
      'vite.config.js': generateViteConfig(),
      'index.html': generateIndexHtml(actualComponentName),
      'src/main.jsx': generateMainFile(),
      'src/App.jsx': generateAppWrapper(cleanedCode, cleanComponentName, pageGenerationMode),
      'src/index.css': generateIndexCSS(),
      'src/theme/index.js': generateThemeConfig(),
      '.env.example': generateEnvExample(),
      'README.md': generateReadme(actualComponentName, pageGenerationMode),
      '.gitignore': generateGitignore(),
      'eslint.config.js': generateEslintConfig(),
      '.prettierrc': generatePrettierConfig(),
      'tsconfig.json': generateTsConfig(),
      'tsconfig.node.json': generateTsNodeConfig(),
    };
    
    // Add the generated component file
    const componentFileName = pageGenerationMode ? 'GeneratedPage.jsx' : `${cleanComponentName}.jsx`;
    projectFiles[`src/components/${componentFileName}`] = cleanedCode;
    
    // Add Vite logo
    const viteLogo = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--logos" width="31.88" height="32" preserveAspectRatio="xMidYMid meet" viewBox="0 0 256 257"><defs><linearGradient id="IconifyId1813088fe1fbc01fb466" x1="-.828%" x2="57.636%" y1="7.652%" y2="78.411%"><stop offset="0%" stop-color="#41D1FF"></stop><stop offset="100%" stop-color="#BD34FE"></stop></linearGradient><linearGradient id="IconifyId1813088fe1fbc01fb467" x1="43.376%" x2="50.316%" y1="2.242%" y2="89.03%"><stop offset="0%" stop-color="#FFEA83"></stop><stop offset="8.333%" stop-color="#FFDD35"></stop><stop offset="100%" stop-color="#FFA800"></stop></linearGradient></defs><path fill="url(#IconifyId1813088fe1fbc01fb466)" d="M255.153 37.938L134.897 252.976c-2.483 4.44-8.862 4.466-11.382.048L.875 37.958c-2.746-4.814 1.371-10.646 6.827-9.67l120.385 21.517a6.537 6.537 0 0 0 2.322-.004l117.867-21.483c5.438-.991 9.574 4.796 6.877 9.62Z"></path><path fill="url(#IconifyId1813088fe1fbc01fb467)" d="M185.432.063L96.44 17.501a3.268 3.268 0 0 0-2.634 3.014l-5.474 92.456a3.268 3.268 0 0 0 3.997 3.378l24.777-5.718c2.318-.535 4.413 1.507 3.936 3.838l-7.361 36.047c-.495 2.426 1.782 4.5 4.151 3.78l15.304-4.649c2.372-.72 4.652 1.36 4.15 3.788l-11.698 56.621c-.732 3.542 3.979 5.473 5.943 2.437l1.313-2.028l72.516-144.72c1.215-2.423-.88-5.186-3.54-4.672l-25.505 4.922c-2.396.462-4.435-1.77-3.759-4.114l16.646-57.705c.677-2.35-1.37-4.583-3.769-4.113Z"></path></svg>`;
    projectFiles['public/vite.svg'] = viteLogo;
    
    // Add all files to the ZIP
    Object.entries(projectFiles).forEach(([filePath, content]) => {
      zip.file(filePath, content);
    });
    
    // Generate the ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    // Create download
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanComponentName.toLowerCase()}-react-project.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return {
      success: true,
      fileName: `${cleanComponentName.toLowerCase()}-react-project.zip`,
      componentName: actualComponentName
    };
    
  } catch (error) {
    console.error('Error generating project download:', error);
    throw new Error(`Failed to generate project download: ${error.message}`);
  }
};

// Generate project structure preview (for UI display)
export const getProjectStructurePreview = (componentName = 'GeneratedComponent', pageGenerationMode = false) => {
  const cleanComponentName = componentName.replace(/[^a-zA-Z0-9]/g, '');
  const componentFileName = pageGenerationMode ? 'GeneratedPage.jsx' : `${cleanComponentName}.jsx`;
  
  return {
    name: `${cleanComponentName.toLowerCase()}-react-project`,
    type: 'folder',
    children: [
      {
        name: 'public',
        type: 'folder',
        children: [
          { name: 'vite.svg', type: 'file' }
        ]
      },
      {
        name: 'src',
        type: 'folder',
        children: [
          {
            name: 'components',
            type: 'folder',
            children: [
              { name: componentFileName, type: 'file' }
            ]
          },
          {
            name: 'theme',
            type: 'folder',
            children: [
              { name: 'index.js', type: 'file' }
            ]
          },
          { name: 'App.jsx', type: 'file' },
          { name: 'main.jsx', type: 'file' },
          { name: 'index.css', type: 'file' }
        ]
      },
      { name: '.env.example', type: 'file' },
      { name: '.gitignore', type: 'file' },
      { name: '.prettierrc', type: 'file' },
      { name: 'eslint.config.js', type: 'file' },
      { name: 'index.html', type: 'file' },
      { name: 'package.json', type: 'file' },
      { name: 'README.md', type: 'file' },
      { name: 'tsconfig.json', type: 'file' },
      { name: 'tsconfig.node.json', type: 'file' },
      { name: 'vite.config.js', type: 'file' }
    ]
  };
};