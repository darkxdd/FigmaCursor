/**
 * Code Analysis Utilities
 * Provides functionality to analyze generated React code and extract useful information
 */

/**
 * Extract component information from React code
 * @param {string} code - The React component code
 * @returns {object} Component analysis results
 */
export const analyzeReactCode = (code) => {
  if (!code || typeof code !== 'string') {
    return {
      componentName: 'Unknown',
      imports: [],
      props: [],
      hasState: false,
      hasEffects: false,
      materialUIComponents: [],
      complexity: 'low',
      errors: []
    };
  }

  const analysis = {
    componentName: 'Unknown',
    imports: [],
    props: [],
    hasState: false,
    hasEffects: false,
    materialUIComponents: [],
    complexity: 'low',
    errors: []
  };

  try {
    // Extract component name
    const componentNameMatch = code.match(/(?:const|function)\s+(\w+)\s*[=\(]/);
    if (componentNameMatch) {
      analysis.componentName = componentNameMatch[1];
    }

    // Extract imports
    const importMatches = code.match(/import\s+.*?from\s+['"].*?['"];?/g);
    if (importMatches) {
      analysis.imports = importMatches.map(imp => imp.trim());
    }

    // Check for Material-UI components
    const muiImportMatch = code.match(/import\s+\{([^}]+)\}\s+from\s+['"]@mui\/material['"];?/);
    if (muiImportMatch) {
      analysis.materialUIComponents = muiImportMatch[1]
        .split(',')
        .map(comp => comp.trim())
        .filter(comp => comp.length > 0);
    }

    // Check for state usage
    analysis.hasState = /useState|useReducer|this\.state/.test(code);

    // Check for effects
    analysis.hasEffects = /useEffect|componentDidMount|componentDidUpdate/.test(code);

    // Extract props (basic detection)
    const propsMatch = code.match(/\(\s*\{\s*([^}]+)\s*\}\s*\)/);
    if (propsMatch) {
      analysis.props = propsMatch[1]
        .split(',')
        .map(prop => prop.trim().split(/[=:]/)[0].trim())
        .filter(prop => prop.length > 0);
    }

    // Determine complexity
    const lineCount = code.split('\n').length;
    const componentCount = analysis.materialUIComponents.length;
    const hasComplexLogic = /useCallback|useMemo|useContext|custom/.test(code);

    if (lineCount > 100 || componentCount > 10 || hasComplexLogic) {
      analysis.complexity = 'high';
    } else if (lineCount > 50 || componentCount > 5 || analysis.hasState) {
      analysis.complexity = 'medium';
    }

  } catch (error) {
    analysis.errors.push(`Analysis error: ${error.message}`);
  }

  return analysis;
};

/**
 * Extract color palette from React code
 * @param {string} code - The React component code
 * @returns {array} Array of colors found in the code
 */
export const extractColorPalette = (code) => {
  if (!code) return [];

  const colors = new Set();
  
  // Match hex colors
  const hexMatches = code.match(/#[0-9a-fA-F]{3,8}/g);
  if (hexMatches) {
    hexMatches.forEach(color => colors.add(color));
  }

  // Match rgb/rgba colors
  const rgbMatches = code.match(/rgba?\([^)]+\)/g);
  if (rgbMatches) {
    rgbMatches.forEach(color => colors.add(color));
  }

  // Match common color names
  const colorNames = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'brown', 'gray', 'grey', 'black', 'white'];
  colorNames.forEach(colorName => {
    const regex = new RegExp(`['"]${colorName}['"]`, 'gi');
    if (regex.test(code)) {
      colors.add(colorName);
    }
  });

  return Array.from(colors);
};

/**
 * Generate component preview metadata
 * @param {string} code - The React component code
 * @returns {object} Preview metadata
 */
export const generatePreviewMetadata = (code) => {
  const analysis = analyzeReactCode(code);
  const colors = extractColorPalette(code);

  return {
    ...analysis,
    colors,
    previewable: analysis.materialUIComponents.length > 0 && analysis.errors.length === 0,
    estimatedRenderTime: analysis.complexity === 'high' ? 'slow' : analysis.complexity === 'medium' ? 'medium' : 'fast',
    recommendations: generateRecommendations(analysis)
  };
};

/**
 * Generate code improvement recommendations
 * @param {object} analysis - Code analysis results
 * @returns {array} Array of recommendations
 */
const generateRecommendations = (analysis) => {
  const recommendations = [];

  if (analysis.complexity === 'high') {
    recommendations.push('Consider breaking this component into smaller, more manageable pieces');
  }

  if (analysis.materialUIComponents.length === 0) {
    recommendations.push('Consider using Material-UI components for better consistency');
  }

  if (!analysis.hasState && analysis.props.length === 0) {
    recommendations.push('This component could be converted to a simple functional component');
  }

  if (analysis.materialUIComponents.length > 10) {
    recommendations.push('Consider creating custom composite components to reduce complexity');
  }

  return recommendations;
};

/**
 * Format code statistics for display
 * @param {object} analysis - Code analysis results
 * @returns {object} Formatted statistics
 */
export const formatCodeStatistics = (analysis) => {
  return {
    'Component Name': analysis.componentName,
    'Complexity': analysis.complexity.charAt(0).toUpperCase() + analysis.complexity.slice(1),
    'Material-UI Components': analysis.materialUIComponents.length,
    'Props': analysis.props.length,
    'Has State': analysis.hasState ? 'Yes' : 'No',
    'Has Effects': analysis.hasEffects ? 'Yes' : 'No',
    'Imports': analysis.imports.length
  };
};