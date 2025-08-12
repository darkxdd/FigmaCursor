import { analyzeVisualRelationships } from './figmaApi.js';
import { AppError, logError, withRetry, classifyError } from '../utils/errorHandler.js';

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Enhanced token estimation with more accurate calculation
const estimateTokenCount = (text) => {
  // More accurate token estimation based on Gemini's tokenization
  // Average: 1 token ≈ 3.5 characters for English text
  const baseTokens = Math.ceil(text.length / 3.5);
  
  // Add overhead for JSON structure and special tokens
  const overhead = Math.ceil(baseTokens * 0.1);
  
  return baseTokens + overhead;
};

// Retry configuration for API calls
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
};

// Enhanced API call with retry logic
const callGeminiAPI = async (prompt, options = {}) => {
  const {
    maxRetries = RETRY_CONFIG.maxRetries,
    baseDelay = RETRY_CONFIG.baseDelay,
    temperature = 0.7,
    maxOutputTokens = 4096,
  } = options;

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key not found. Please add VITE_GEMINI_API_KEY to your .env file.');
  }

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Gemini API attempt ${attempt + 1}/${maxRetries + 1}`);
      
      const response = await fetch(`${GEMINI_API_BASE_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature,
            topK: 40,
            topP: 0.95,
            maxOutputTokens,
            candidateCount: 1,
            stopSequences: [],
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle specific error types
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait before making another request.');
        } else if (response.status === 400) {
          throw new Error(`Invalid request: ${errorData.error?.message || 'Bad request'}`);
        } else if (response.status === 403) {
          throw new Error('API key invalid or insufficient permissions.');
        } else if (response.status >= 500) {
          throw new Error(`Server error (${response.status}). Please try again later.`);
        }
        
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        // Check for safety filter blocks
        if (data?.candidates?.[0]?.finishReason === 'SAFETY') {
          throw new Error('Content was blocked by safety filters. Try modifying your design or component names.');
        }
        
        // Check for other finish reasons
        if (data?.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
          throw new Error('Response was truncated due to token limit. Try simplifying the component.');
        }
        
        throw new Error('Invalid or empty response from Gemini API');
      }

      // Track API usage statistics
      apiCallCount++;
      totalTokensUsed += estimateTokenCount(prompt);
      
      return data.candidates[0].content.parts[0].text;
      
    } catch (error) {
      lastError = error;
      
      // Don't retry for certain error types
      if (error.message.includes('API key') || 
          error.message.includes('Invalid request') ||
          error.message.includes('safety filters')) {
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt),
        RETRY_CONFIG.maxDelay
      );
      
      console.log(`Retrying in ${delay}ms due to error:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// Prompt optimization strategies
const optimizePromptForTokens = (prompt, maxTokens) => {
  let optimized = prompt;
  let currentTokens = estimateTokenCount(optimized);
  
  if (currentTokens <= maxTokens) {
    return optimized;
  }
  
  console.log(`Optimizing prompt: ${currentTokens} tokens -> target: ${maxTokens} tokens`);
  
  // Progressive optimization steps
  const optimizationSteps = [
    // Step 1: Remove detailed descriptions
    () => {
      optimized = optimized.replace(/SPECIFIC INSTRUCTIONS:[\s\S]*?(?=\n\n|$)/g, '');
    },
    
    // Step 2: Simplify component descriptions
    () => {
      optimized = optimized.replace(/- Size: \d+px × \d+px\n/g, '');
      optimized = optimized.replace(/- Position: \([^)]+\)\n/g, '');
    },
    
    // Step 3: Remove relationships
    () => {
      optimized = optimized.replace(/RELATIONSHIPS:[\s\S]*?(?=\n\n|$)/g, '');
    },
    
    // Step 4: Simplify children descriptions
    () => {
      optimized = optimized.replace(/CHILDREN \(\d+\):[\s\S]*?(?=\n\n|$)/g, 'CHILDREN: Present');
    },
    
    // Step 5: Remove layout details
    () => {
      optimized = optimized.replace(/LAYOUT:[\s\S]*?(?=\n\n|$)/g, 'LAYOUT: Auto');
    },
    
    // Step 6: Simplify visual properties
    () => {
      optimized = optimized.replace(/VISUAL:[\s\S]*?(?=\n\n|$)/g, 'VISUAL: Basic styling');
    },
  ];
  
  // Apply optimization steps until we're under the token limit
  for (const step of optimizationSteps) {
    step();
    currentTokens = estimateTokenCount(optimized);
    
    if (currentTokens <= maxTokens) {
      break;
    }
  }
  
  console.log(`Prompt optimization complete: ${currentTokens} tokens`);
  return optimized;
};

// Simple caching mechanism for repeated requests
const promptCache = new Map();
const CACHE_MAX_SIZE = 50;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedResponse = (promptHash) => {
  const cached = promptCache.get(promptHash);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('Using cached response');
    return cached.response;
  }
  return null;
};

const setCachedResponse = (promptHash, response) => {
  // Simple LRU eviction
  if (promptCache.size >= CACHE_MAX_SIZE) {
    const firstKey = promptCache.keys().next().value;
    promptCache.delete(firstKey);
  }
  
  promptCache.set(promptHash, {
    response,
    timestamp: Date.now(),
  });
};

// Generate a simple hash for caching
const generatePromptHash = (prompt) => {
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
};

// Validate and clean generated code
const validateAndCleanCode = (code) => {
  if (!code || typeof code !== 'string') {
    throw new Error('Generated code is empty or invalid');
  }
  
  // Remove markdown code fences if present
  let cleaned = code.replace(/```(?:jsx|javascript|js|tsx|typescript)?\n?([\s\S]*?)```/g, '$1').trim();
  
  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();
  
  // Basic validation - ensure it looks like React code
  if (!cleaned.includes('React') && !cleaned.includes('import') && !cleaned.includes('function') && !cleaned.includes('const')) {
    throw new Error('Generated code does not appear to be valid React code');
  }
  
  // Ensure proper imports are present
  if (!cleaned.includes('import React')) {
    cleaned = "import React from 'react';\n" + cleaned;
  }
  
  // Check for common Material-UI components and add imports if needed
  const muiComponents = ['Box', 'Typography', 'Button', 'Card', 'AppBar', 'Toolbar', 'Container', 'Grid', 'Paper'];
  const usedMuiComponents = muiComponents.filter(comp => 
    cleaned.includes(`<${comp}`) || cleaned.includes(`${comp}`)
  );
  
  if (usedMuiComponents.length > 0 && !cleaned.includes('@mui/material')) {
    const importLine = `import { ${usedMuiComponents.join(', ')} } from '@mui/material';\n`;
    cleaned = cleaned.replace(/import React from 'react';\n/, `import React from 'react';\n${importLine}`);
  }
  
  // Ensure component is properly exported
  if (!cleaned.includes('export default') && !cleaned.includes('export {')) {
    // Try to find the component name and add export
    const componentMatch = cleaned.match(/(?:function|const)\s+(\w+)/);
    if (componentMatch) {
      cleaned += `\n\nexport default ${componentMatch[1]};`;
    }
  }
  
  return cleaned;
};



// Enhanced visual analysis for better design matching
const analyzeVisualProperties = (metadata) => {
  const analysis = {
    colors: extractColorPalette(metadata),
    typography: analyzeTypography(metadata),
    spacing: analyzeSpacing(metadata),
    layout: analyzeLayoutStructure(metadata),
    effects: analyzeVisualEffects(metadata),
    dimensions: analyzeDimensions(metadata),
  };
  
  return analysis;
};

// Extract comprehensive color palette from component
const extractColorPalette = (metadata) => {
  const colors = {
    primary: null,
    secondary: null,
    background: null,
    text: null,
    border: null,
    accent: null,
  };
  
  // Extract background colors
  if (metadata.fills && metadata.fills.length > 0) {
    const primaryFill = metadata.fills[0];
    if (primaryFill.color && primaryFill.color !== 'transparent') {
      colors.background = primaryFill.color;
      colors.primary = primaryFill.color;
    }
    
    // Check for gradient colors
    if (primaryFill.type && primaryFill.type.includes('GRADIENT') && primaryFill.gradientStops) {
      colors.primary = primaryFill.gradientStops[0]?.color;
      colors.secondary = primaryFill.gradientStops[primaryFill.gradientStops.length - 1]?.color;
    }
  }
  
  // Extract border colors
  if (metadata.strokes && metadata.strokes.length > 0) {
    const primaryStroke = metadata.strokes[0];
    if (primaryStroke.color && primaryStroke.color !== 'transparent') {
      colors.border = primaryStroke.color;
    }
  }
  
  // Extract text colors from children
  if (metadata.children && metadata.children.length > 0) {
    metadata.children.forEach(child => {
      if (child.type === 'TEXT' && child.fills && child.fills[0]?.color) {
        colors.text = child.fills[0].color;
      }
    });
  }
  
  return colors;
};

// Analyze typography properties for better text rendering
const analyzeTypography = (metadata) => {
  const typography = {
    hierarchy: 'body1', // Default Material-UI variant
    weight: 'normal',
    size: 'medium',
    alignment: 'left',
    lineHeight: 'normal',
    letterSpacing: 'normal',
  };
  
  if (metadata.fontSize) {
    // Map Figma font sizes to Material-UI typography variants
    if (metadata.fontSize >= 32) {
      typography.hierarchy = 'h1';
      typography.size = 'large';
    } else if (metadata.fontSize >= 24) {
      typography.hierarchy = 'h2';
      typography.size = 'large';
    } else if (metadata.fontSize >= 20) {
      typography.hierarchy = 'h3';
      typography.size = 'medium';
    } else if (metadata.fontSize >= 18) {
      typography.hierarchy = 'h4';
      typography.size = 'medium';
    } else if (metadata.fontSize >= 16) {
      typography.hierarchy = 'h5';
      typography.size = 'medium';
    } else if (metadata.fontSize >= 14) {
      typography.hierarchy = 'body1';
      typography.size = 'medium';
    } else {
      typography.hierarchy = 'body2';
      typography.size = 'small';
    }
  }
  
  if (metadata.fontWeight) {
    if (metadata.fontWeight >= 700) {
      typography.weight = 'bold';
    } else if (metadata.fontWeight >= 600) {
      typography.weight = 'semibold';
    } else if (metadata.fontWeight >= 500) {
      typography.weight = 'medium';
    } else {
      typography.weight = 'normal';
    }
  }
  
  if (metadata.textAlignHorizontal) {
    typography.alignment = metadata.textAlignHorizontal.toLowerCase();
  }
  
  if (metadata.letterSpacing) {
    typography.letterSpacing = `${metadata.letterSpacing}px`;
  }
  
  if (metadata.lineHeightPx) {
    typography.lineHeight = `${metadata.lineHeightPx}px`;
  }
  
  return typography;
};

// Analyze spacing and padding for accurate layout
const analyzeSpacing = (metadata) => {
  const spacing = {
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    gap: 0,
    density: 'normal', // compact, normal, comfortable
  };
  
  // Extract padding from layout properties
  if (metadata.paddingTop !== undefined) spacing.padding.top = metadata.paddingTop;
  if (metadata.paddingRight !== undefined) spacing.padding.right = metadata.paddingRight;
  if (metadata.paddingBottom !== undefined) spacing.padding.bottom = metadata.paddingBottom;
  if (metadata.paddingLeft !== undefined) spacing.padding.left = metadata.paddingLeft;
  
  // Extract gap from item spacing
  if (metadata.itemSpacing) {
    spacing.gap = metadata.itemSpacing;
  }
  
  // Determine density based on spacing values
  const totalPadding = spacing.padding.top + spacing.padding.right + spacing.padding.bottom + spacing.padding.left;
  if (totalPadding < 16) {
    spacing.density = 'compact';
  } else if (totalPadding > 32) {
    spacing.density = 'comfortable';
  }
  
  return spacing;
};

// Analyze layout structure for better component organization
const analyzeLayoutStructure = (metadata) => {
  const layout = {
    type: 'block', // block, flex, grid, absolute
    direction: 'column', // row, column
    alignment: {
      horizontal: 'flex-start',
      vertical: 'flex-start',
    },
    wrap: false,
    responsive: false,
  };
  
  // Determine layout type based on Figma properties
  if (metadata.layoutMode) {
    layout.type = 'flex';
    layout.direction = metadata.layoutMode === 'HORIZONTAL' ? 'row' : 'column';
  }
  
  // Map Figma alignment to CSS flexbox
  if (metadata.primaryAxisAlignItems) {
    const alignmentMap = {
      'MIN': 'flex-start',
      'MAX': 'flex-end',
      'CENTER': 'center',
      'SPACE_BETWEEN': 'space-between',
      'SPACE_AROUND': 'space-around',
    };
    layout.alignment.horizontal = alignmentMap[metadata.primaryAxisAlignItems] || 'flex-start';
  }
  
  if (metadata.counterAxisAlignItems) {
    const alignmentMap = {
      'MIN': 'flex-start',
      'MAX': 'flex-end',
      'CENTER': 'center',
      'BASELINE': 'baseline',
    };
    layout.alignment.vertical = alignmentMap[metadata.counterAxisAlignItems] || 'flex-start';
  }
  
  // Check for responsive behavior
  if (metadata.constraints) {
    layout.responsive = metadata.constraints.horizontal === 'SCALE' || metadata.constraints.vertical === 'SCALE';
  }
  
  return layout;
};

// Analyze visual effects for accurate styling
const analyzeVisualEffects = (metadata) => {
  const effects = {
    elevation: 0,
    shadow: null,
    blur: null,
    border: null,
    borderRadius: 0,
  };
  
  // Extract border radius
  if (metadata.cornerRadius) {
    effects.borderRadius = metadata.cornerRadius;
  }
  
  // Analyze effects for shadows and elevation
  if (metadata.effects && metadata.effects.length > 0) {
    metadata.effects.forEach(effect => {
      if (effect.type === 'DROP_SHADOW' && effect.visible !== false) {
        // Map shadow to Material-UI elevation
        const shadowIntensity = (effect.radius || 0) + Math.abs(effect.offset?.y || 0);
        if (shadowIntensity < 2) {
          effects.elevation = 1;
        } else if (shadowIntensity < 4) {
          effects.elevation = 2;
        } else if (shadowIntensity < 8) {
          effects.elevation = 4;
        } else if (shadowIntensity < 16) {
          effects.elevation = 8;
        } else {
          effects.elevation = 12;
        }
        
        effects.shadow = {
          offsetX: effect.offset?.x || 0,
          offsetY: effect.offset?.y || 0,
          blur: effect.radius || 0,
          color: effect.color || 'rgba(0,0,0,0.2)',
        };
      } else if (effect.type === 'LAYER_BLUR' && effect.visible !== false) {
        effects.blur = effect.radius || 0;
      }
    });
  }
  
  // Extract border information
  if (metadata.strokes && metadata.strokes.length > 0 && metadata.strokeWeight > 0) {
    effects.border = {
      width: metadata.strokeWeight,
      style: 'solid',
      color: metadata.strokes[0].color || 'rgba(0,0,0,0.12)',
    };
  }
  
  return effects;
};

// Analyze dimensions for responsive behavior
const analyzeDimensions = (metadata) => {
  const dimensions = {
    width: metadata.width || 'auto',
    height: metadata.height || 'auto',
    aspectRatio: null,
    minWidth: null,
    maxWidth: null,
    responsive: false,
  };
  
  // Calculate aspect ratio
  if (metadata.width && metadata.height) {
    dimensions.aspectRatio = (metadata.width / metadata.height).toFixed(2);
  }
  
  // Determine if component should be responsive
  if (metadata.constraints) {
    if (metadata.constraints.horizontal === 'SCALE') {
      dimensions.responsive = true;
      dimensions.minWidth = Math.max(metadata.width * 0.5, 200);
      dimensions.maxWidth = metadata.width * 1.5;
    }
  }
  
  return dimensions;
};

// Generate precise CSS-in-JS styling from Figma properties
const generatePreciseStyling = (metadata) => {
  const visual = analyzeVisualProperties(metadata);
  const styling = {};
  
  // Dimensions
  if (metadata.width) {
    styling.width = `${metadata.width}px`;
  }
  if (metadata.height) {
    styling.height = `${metadata.height}px`;
  }
  
  // Colors
  if (visual.colors.background && visual.colors.background !== 'transparent') {
    styling.backgroundColor = visual.colors.background;
  }
  if (visual.colors.text) {
    styling.color = visual.colors.text;
  }
  
  // Typography
  if (metadata.fontSize) {
    styling.fontSize = `${metadata.fontSize}px`;
  }
  if (metadata.fontFamily) {
    styling.fontFamily = `"${metadata.fontFamily}", sans-serif`;
  }
  if (metadata.fontWeight) {
    styling.fontWeight = metadata.fontWeight;
  }
  if (metadata.textAlignHorizontal) {
    styling.textAlign = metadata.textAlignHorizontal.toLowerCase();
  }
  if (metadata.letterSpacing) {
    styling.letterSpacing = `${metadata.letterSpacing}px`;
  }
  if (metadata.lineHeightPx) {
    styling.lineHeight = `${metadata.lineHeightPx}px`;
  }
  
  // Layout
  if (visual.layout.type === 'flex') {
    styling.display = 'flex';
    styling.flexDirection = visual.layout.direction;
    styling.justifyContent = visual.layout.alignment.horizontal;
    styling.alignItems = visual.layout.alignment.vertical;
  }
  
  // Spacing
  const { padding, gap } = visual.spacing;
  if (padding.top || padding.right || padding.bottom || padding.left) {
    styling.padding = `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`;
  }
  if (gap > 0) {
    styling.gap = `${gap}px`;
  }
  
  // Effects
  if (visual.effects.borderRadius > 0) {
    styling.borderRadius = `${visual.effects.borderRadius}px`;
  }
  
  if (visual.effects.border) {
    styling.border = `${visual.effects.border.width}px ${visual.effects.border.style} ${visual.effects.border.color}`;
  }
  
  if (visual.effects.shadow) {
    const { offsetX, offsetY, blur, color } = visual.effects.shadow;
    styling.boxShadow = `${offsetX}px ${offsetY}px ${blur}px ${color}`;
  }
  
  // Opacity
  if (metadata.opacity !== undefined && metadata.opacity !== 1) {
    styling.opacity = metadata.opacity;
  }
  
  return styling;
};

// Generate Material-UI theme overrides for exact color matching
const generateThemeOverrides = (metadata) => {
  const visual = analyzeVisualProperties(metadata);
  const semantic = detectComponentSemanticType(metadata);
  
  const themeOverrides = {};
  
  // Generate component-specific theme overrides
  if (semantic.type === 'button' && visual.colors.background) {
    themeOverrides.MuiButton = {
      styleOverrides: {
        root: {
          backgroundColor: visual.colors.background,
          color: visual.colors.text || '#ffffff',
          '&:hover': {
            backgroundColor: adjustColorBrightness(visual.colors.background, -0.1),
          },
        },
      },
    };
  }
  
  if (semantic.type === 'card' && visual.colors.background) {
    themeOverrides.MuiCard = {
      styleOverrides: {
        root: {
          backgroundColor: visual.colors.background,
          boxShadow: visual.effects.shadow ? 
            `${visual.effects.shadow.offsetX}px ${visual.effects.shadow.offsetY}px ${visual.effects.shadow.blur}px ${visual.effects.shadow.color}` :
            undefined,
        },
      },
    };
  }
  
  return themeOverrides;
};

// Utility function to adjust color brightness
const adjustColorBrightness = (color, amount) => {
  // Simple color adjustment - in a real implementation, you'd use a color manipulation library
  if (color.startsWith('rgba')) {
    // For rgba colors, adjust the alpha or convert to rgb
    return color.replace(/[\d.]+\)$/g, match => {
      const alpha = parseFloat(match.replace(')', ''));
      return `${Math.max(0, Math.min(1, alpha + amount))})`;
    });
  }
  return color; // Return original color if can't adjust
};

// Generate component template with exact styling
const generateComponentTemplate = (metadata) => {
  const semantic = detectComponentSemanticType(metadata);
  const visual = analyzeVisualProperties(metadata);
  const styling = generatePreciseStyling(metadata);
  
  // Convert styling object to sx prop format
  const sxProp = JSON.stringify(styling, null, 2).replace(/"/g, "'");
  
  let template = '';
  
  // Generate imports
  const imports = ['React'];
  const muiImports = [...semantic.muiComponents];
  
  if (Object.keys(styling).length > 0) {
    muiImports.push('Box');
  }
  
  template += `import ${imports.join(', ')} from 'react';\n`;
  template += `import { ${muiImports.join(', ')} } from '@mui/material';\n\n`;
  
  // Generate component based on semantic type
  const componentName = metadata.name.replace(/[^a-zA-Z0-9]/g, '') || 'GeneratedComponent';
  
  template += `const ${componentName} = () => {\n`;
  template += `  return (\n`;
  
  switch (semantic.type) {
    case 'button':
      template += `    <Button\n`;
      template += `      variant="${visual.effects.elevation > 0 ? 'contained' : 'outlined'}"\n`;
      template += `      sx={${sxProp}}\n`;
      template += `    >\n`;
      if (metadata.characters) {
        template += `      ${metadata.characters}\n`;
      }
      template += `    </Button>\n`;
      break;
      
    case 'card':
      template += `    <Card\n`;
      template += `      elevation={${visual.effects.elevation}}\n`;
      template += `      sx={${sxProp}}\n`;
      template += `    >\n`;
      template += `      <CardContent>\n`;
      if (metadata.characters) {
        template += `        <Typography variant="${visual.typography.hierarchy}">\n`;
        template += `          ${metadata.characters}\n`;
        template += `        </Typography>\n`;
      }
      template += `      </CardContent>\n`;
      template += `    </Card>\n`;
      break;
      
    case 'text':
      template += `    <Typography\n`;
      template += `      variant="${visual.typography.hierarchy}"\n`;
      template += `      sx={${sxProp}}\n`;
      template += `    >\n`;
      if (metadata.characters) {
        template += `      ${metadata.characters}\n`;
      }
      template += `    </Typography>\n`;
      break;
      
    case 'navigation':
      template += `    <AppBar position="static" sx={${sxProp}}>\n`;
      template += `      <Toolbar>\n`;
      if (metadata.characters) {
        template += `        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>\n`;
        template += `          ${metadata.characters}\n`;
        template += `        </Typography>\n`;
      }
      template += `      </Toolbar>\n`;
      template += `    </AppBar>\n`;
      break;
      
    default:
      template += `    <Box sx={${sxProp}}>\n`;
      if (metadata.characters) {
        template += `      <Typography variant="${visual.typography.hierarchy}">\n`;
        template += `        ${metadata.characters}\n`;
        template += `      </Typography>\n`;
      }
      // Add children if present
      if (metadata.children && metadata.children.length > 0) {
        metadata.children.slice(0, 3).forEach((child, index) => {
          const childStyling = generatePreciseStyling(child);
          const childSx = JSON.stringify(childStyling, null, 2).replace(/"/g, "'");
          template += `      <Box sx={${childSx}}>\n`;
          if (child.characters) {
            template += `        <Typography>\n`;
            template += `          ${child.characters}\n`;
            template += `        </Typography>\n`;
          }
          template += `      </Box>\n`;
        });
      }
      template += `    </Box>\n`;
  }
  
  template += `  );\n`;
  template += `};\n\n`;
  template += `export default ${componentName};\n`;
  
  return template;
};

// Enhanced component type detection with semantic analysis
const detectComponentSemanticType = (metadata) => {
  const name = metadata.name.toLowerCase();
  const type = metadata.type;
  const hasText = metadata.hasText;
  const dimensions = { width: metadata.width, height: metadata.height };
  
  // Navigation components
  if (name.includes('header') || name.includes('nav') || name.includes('top') || 
      name.includes('menu') || name.includes('toolbar')) {
    return {
      type: 'navigation',
      priority: 'high',
      muiComponents: ['AppBar', 'Toolbar', 'IconButton', 'Typography'],
      characteristics: ['horizontal-layout', 'fixed-position', 'elevated']
    };
  }
  
  // Button components
  if (name.includes('button') || name.includes('btn') || name.includes('cta') ||
      (hasText && dimensions.width < 200 && dimensions.height < 60)) {
    return {
      type: 'button',
      priority: 'high',
      muiComponents: ['Button'],
      characteristics: ['interactive', 'elevated', 'text-content']
    };
  }
  
  // Card components
  if (name.includes('card') || name.includes('item') || name.includes('tile') ||
      (type === 'FRAME' && dimensions.width > 200 && dimensions.height > 150)) {
    return {
      type: 'card',
      priority: 'medium',
      muiComponents: ['Card', 'CardContent', 'CardActions'],
      characteristics: ['container', 'elevated', 'rounded']
    };
  }
  
  // Text components
  if (type === 'TEXT' || name.includes('text') || name.includes('label') || 
      name.includes('title') || name.includes('heading')) {
    return {
      type: 'text',
      priority: 'high',
      muiComponents: ['Typography'],
      characteristics: ['text-content', 'typography-focused']
    };
  }
  
  // Input components
  if (name.includes('input') || name.includes('field') || name.includes('form') ||
      name.includes('textfield')) {
    return {
      type: 'input',
      priority: 'medium',
      muiComponents: ['TextField', 'FormControl', 'InputLabel'],
      characteristics: ['interactive', 'bordered', 'user-input']
    };
  }
  
  // Hero/Banner components
  if (name.includes('hero') || name.includes('banner') || name.includes('jumbotron') ||
      (dimensions.width > 800 && dimensions.height > 300)) {
    return {
      type: 'hero',
      priority: 'high',
      muiComponents: ['Box', 'Typography', 'Container'],
      characteristics: ['large-container', 'background-image', 'centered-content']
    };
  }
  
  // Footer components
  if (name.includes('footer') || name.includes('bottom')) {
    return {
      type: 'footer',
      priority: 'medium',
      muiComponents: ['Box', 'Typography', 'Grid'],
      characteristics: ['bottom-positioned', 'multi-column', 'links']
    };
  }
  
  // Container/Layout components
  if (type === 'FRAME' || name.includes('container') || name.includes('wrapper') || 
      name.includes('section') || name.includes('layout')) {
    return {
      type: 'container',
      priority: 'low',
      muiComponents: ['Box', 'Container', 'Grid'],
      characteristics: ['layout', 'spacing', 'responsive']
    };
  }
  
  // Icon components
  if (type === 'VECTOR' || name.includes('icon') || name.includes('symbol') ||
      (dimensions.width < 50 && dimensions.height < 50)) {
    return {
      type: 'icon',
      priority: 'low',
      muiComponents: ['SvgIcon', 'Icon'],
      characteristics: ['small', 'symbolic', 'decorative']
    };
  }
  
  // Default generic component
  return {
    type: 'generic',
    priority: 'medium',
    muiComponents: ['Box'],
    characteristics: ['flexible', 'basic-styling']
  };
};

// Create enhanced visual-similarity focused prompt
const createVisualSimilarityPrompt = (metadata) => {
  const semantic = detectComponentSemanticType(metadata);
  const visual = analyzeVisualProperties(metadata);
  const hasText = metadata.hasText && metadata.characters;
  
  // Start with detailed component specification
  let prompt = `Create a React component that EXACTLY matches this Figma design:\n\n`;
  prompt += `COMPONENT: "${metadata.name}" (${semantic.type})\n`;
  prompt += `DIMENSIONS: ${metadata.width}px × ${metadata.height}px\n\n`;
  
  // Add comprehensive visual specifications
  prompt += `VISUAL SPECIFICATIONS:\n`;
  
  // Color specifications
  if (visual.colors.background) {
    prompt += `• Background: ${visual.colors.background}\n`;
  }
  if (visual.colors.text) {
    prompt += `• Text Color: ${visual.colors.text}\n`;
  }
  if (visual.colors.border) {
    prompt += `• Border Color: ${visual.colors.border}\n`;
  }
  
  // Typography specifications
  if (hasText) {
    prompt += `• Text: "${metadata.characters}"\n`;
    prompt += `• Typography: ${visual.typography.hierarchy} variant, ${visual.typography.weight} weight, ${visual.typography.alignment} aligned\n`;
    if (metadata.fontSize) {
      prompt += `• Font Size: ${metadata.fontSize}px\n`;
    }
    if (metadata.fontFamily) {
      prompt += `• Font Family: ${metadata.fontFamily}\n`;
    }
  }
  
  // Layout specifications
  prompt += `• Layout: ${visual.layout.type}`;
  if (visual.layout.type === 'flex') {
    prompt += ` (${visual.layout.direction}, justify: ${visual.layout.alignment.horizontal}, align: ${visual.layout.alignment.vertical})`;
  }
  prompt += `\n`;
  
  // Spacing specifications
  const { padding, gap } = visual.spacing;
  if (padding.top || padding.right || padding.bottom || padding.left) {
    prompt += `• Padding: ${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px\n`;
  }
  if (gap > 0) {
    prompt += `• Gap: ${gap}px\n`;
  }
  
  // Effects specifications
  if (visual.effects.borderRadius > 0) {
    prompt += `• Border Radius: ${visual.effects.borderRadius}px\n`;
  }
  if (visual.effects.elevation > 0) {
    prompt += `• Elevation: ${visual.effects.elevation} (Material-UI)\n`;
  }
  if (visual.effects.border) {
    prompt += `• Border: ${visual.effects.border.width}px ${visual.effects.border.style} ${visual.effects.border.color}\n`;
  }
  if (visual.effects.shadow) {
    prompt += `• Shadow: ${visual.effects.shadow.offsetX}px ${visual.effects.shadow.offsetY}px ${visual.effects.shadow.blur}px ${visual.effects.shadow.color}\n`;
  }
  
  prompt += `\n`;
  
  // Add children information if present
  if (metadata.children && metadata.children.length > 0) {
    prompt += `CHILD ELEMENTS (${metadata.children.length}):\n`;
    metadata.children.slice(0, 3).forEach((child, index) => {
      const childVisual = analyzeVisualProperties(child);
      prompt += `${index + 1}. ${child.name} (${child.type})\n`;
      prompt += `   - Size: ${child.width}×${child.height}px\n`;
      if (child.hasText) {
        prompt += `   - Text: "${child.characters}"\n`;
      }
      if (childVisual.colors.background) {
        prompt += `   - Background: ${childVisual.colors.background}\n`;
      }
    });
    prompt += `\n`;
  }
  
  // Add Material-UI specific instructions
  prompt += `MATERIAL-UI IMPLEMENTATION:\n`;
  prompt += `• Primary Components: ${semantic.muiComponents.join(', ')}\n`;
  
  // Component-specific implementation details
  switch (semantic.type) {
    case 'button':
      prompt += `• Use Button with ${visual.effects.elevation > 0 ? 'contained' : 'outlined'} variant\n`;
      prompt += `• Apply exact colors using sx prop or custom theme\n`;
      prompt += `• Include hover states that maintain visual consistency\n`;
      break;
    case 'card':
      prompt += `• Use Card with elevation={${visual.effects.elevation}}\n`;
      prompt += `• Use CardContent for proper content spacing\n`;
      prompt += `• Apply exact background and border styling\n`;
      break;
    case 'text':
      prompt += `• Use Typography variant="${visual.typography.hierarchy}"\n`;
      prompt += `• Apply exact font size, weight, and color\n`;
      prompt += `• Preserve text alignment and spacing\n`;
      break;
    case 'navigation':
      prompt += `• Use AppBar with position="static" or "fixed" based on design\n`;
      prompt += `• Use Toolbar for proper spacing and alignment\n`;
      prompt += `• Apply exact background color and elevation\n`;
      break;
    default:
      prompt += `• Use Box component as primary container\n`;
      prompt += `• Apply all styling using sx prop for pixel-perfect matching\n`;
  }
  
  prompt += `\nCRITICAL REQUIREMENTS:\n`;
  prompt += `• Match EXACT dimensions: width: ${metadata.width}px, height: ${metadata.height}px\n`;
  prompt += `• Use sx prop for precise styling that matches Figma values\n`;
  prompt += `• Preserve all colors, spacing, and typography exactly as specified\n`;
  prompt += `• Include responsive behavior only if specified in constraints\n`;
  prompt += `• Generate clean, production-ready React code with proper imports\n`;
  prompt += `• Return ONLY the component code without markdown formatting\n`;
  
  return prompt;
};

// Create enhanced minimal prompt with semantic understanding (fallback)
const createMinimalPrompt = (metadata) => {
  const semantic = detectComponentSemanticType(metadata);
  const visual = analyzeVisualProperties(metadata);
  const hasText = metadata.hasText && metadata.characters;
  
  // Start with component identification
  let prompt = `Create ${semantic.type} React component "${metadata.name}" (${metadata.width}×${metadata.height}px).\n\n`;
  
  // Add essential visual properties
  if (visual.colors.background) {
    prompt += `Background: ${visual.colors.background}. `;
  }
  if (visual.effects.borderRadius > 0) {
    prompt += `Border radius: ${visual.effects.borderRadius}px. `;
  }
  if (visual.effects.elevation > 0) {
    prompt += `Elevation: ${visual.effects.elevation}. `;
  }
  
  // Add text content with typography
  if (hasText) {
    prompt += `Text: "${metadata.characters}" (${visual.typography.hierarchy}, ${visual.typography.weight}). `;
  }
  
  // Add layout
  if (visual.layout.type === 'flex') {
    prompt += `Layout: ${visual.layout.direction} flex, ${visual.layout.alignment.horizontal}. `;
  }
  
  // Add spacing
  const { padding, gap } = visual.spacing;
  if (padding.top || padding.right || padding.bottom || padding.left) {
    prompt += `Padding: ${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px. `;
  }
  if (gap > 0) {
    prompt += `Gap: ${gap}px. `;
  }
  
  prompt += `\nUse Material-UI: ${semantic.muiComponents.join(', ')}. `;
  prompt += `Match exact dimensions and styling. Return clean code only.`;
  
  return prompt;
};

// Generate React component with maximum visual similarity
export const generateVisuallyAccurateComponent = async (componentMetadata, options = {}) => {
  try {
    const {
      useTemplate = false,
      maxTokens = 4000,
      temperature = 0.5, // Lower temperature for more consistent output
    } = options;

    console.log(`Generating visually accurate component: ${componentMetadata.name}`);
    
    // If using template mode, generate directly from metadata
    if (useTemplate) {
      const template = generateComponentTemplate(componentMetadata);
      console.log('Generated component using template approach');
      return template;
    }
    
    // Use enhanced visual similarity prompt
    const prompt = createVisualSimilarityPrompt(componentMetadata);
    const estimatedTokens = estimateTokenCount(prompt);
    
    console.log(`Visual similarity prompt: ${estimatedTokens} tokens`);
    
    // Optimize if needed
    if (estimatedTokens > maxTokens * 0.8) {
      const optimizedPrompt = optimizePromptForTokens(prompt, Math.floor(maxTokens * 0.8));
      const optimizedTokens = estimateTokenCount(optimizedPrompt);
      console.log(`Optimized to ${optimizedTokens} tokens`);
    }
    
    // Generate with focus on visual accuracy
    const generatedText = await callGeminiAPI(prompt, {
      temperature,
      maxOutputTokens: Math.min(4096, maxTokens - estimatedTokens),
    });
    
    // Validate and enhance the generated code
    const cleanedCode = validateAndCleanCode(generatedText);
    const enhancedCode = enhanceCodeForVisualSimilarity(cleanedCode, componentMetadata);
    
    console.log(`Successfully generated visually accurate component: ${componentMetadata.name}`);
    return enhancedCode;
    
  } catch (error) {
    console.error('Error generating visually accurate component:', error);
    
    // Fallback to template generation
    console.log('Falling back to template generation');
    return generateComponentTemplate(componentMetadata);
  }
};

// Enhance generated code for better visual similarity
const enhanceCodeForVisualSimilarity = (code, metadata) => {
  let enhanced = code;
  
  // Ensure exact dimensions are preserved
  if (metadata.width && metadata.height) {
    // Add width and height to the main component if not present
    if (!enhanced.includes('width:') && !enhanced.includes('width=')) {
      enhanced = enhanced.replace(
        /sx=\{([^}]+)\}/,
        `sx={{$1, width: '${metadata.width}px', height: '${metadata.height}px'}}`
      );
    }
  }
  
  // Ensure exact colors are preserved
  const visual = analyzeVisualProperties(metadata);
  if (visual.colors.background && !enhanced.includes('backgroundColor')) {
    enhanced = enhanced.replace(
      /sx=\{([^}]+)\}/,
      `sx={{$1, backgroundColor: '${visual.colors.background}'}}`
    );
  }
  
  // Add precise spacing if missing
  const { padding } = visual.spacing;
  if ((padding.top || padding.right || padding.bottom || padding.left) && !enhanced.includes('padding')) {
    const paddingValue = `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`;
    enhanced = enhanced.replace(
      /sx=\{([^}]+)\}/,
      `sx={{$1, padding: '${paddingValue}'}}`
    );
  }
  
  return enhanced;
};

// Enhanced React component generation with intelligent optimization
export const generateReactComponent = async (componentMetadata, allComponents = [], options = {}) => {
  try {
    const {
      useDetailedPrompt = false,
      maxTokens = 6000,
      temperature = 0.7,
      includeContext = true,
    } = options;

    // Validate input metadata
    if (!componentMetadata || !componentMetadata.name) {
      throw new Error('Invalid component metadata provided');
    }

    console.log(`Generating React component: ${componentMetadata.name}`);
    
    // Determine prompt strategy based on complexity and token budget
    let prompt;
    let estimatedTokens;
    
    if (useDetailedPrompt && includeContext && allComponents.length > 0) {
      // Use detailed prompt with context for complex components
      const visualRelationships = analyzeVisualRelationships([componentMetadata, ...allComponents.slice(0, 3)]);
      prompt = createComponentPrompt(componentMetadata, visualRelationships);
      estimatedTokens = estimateTokenCount(prompt);
      
      // If too large, fall back to visual similarity prompt
      if (estimatedTokens > maxTokens) {
        console.log(`Detailed prompt too large (${estimatedTokens} tokens), using visual similarity prompt`);
        prompt = createVisualSimilarityPrompt(componentMetadata);
        estimatedTokens = estimateTokenCount(prompt);
      }
    } else {
      // Use visual similarity prompt for better matching
      prompt = createVisualSimilarityPrompt(componentMetadata);
      estimatedTokens = estimateTokenCount(prompt);
      
      // If still too large, fall back to minimal prompt
      if (estimatedTokens > maxTokens) {
        console.log(`Visual similarity prompt too large (${estimatedTokens} tokens), using minimal prompt`);
        prompt = createMinimalPrompt(componentMetadata);
        estimatedTokens = estimateTokenCount(prompt);
      }
    }
    
    // Final fallback for extremely large prompts
    if (estimatedTokens > maxTokens) {
      console.warn(`Prompt still too large (${estimatedTokens} tokens), using ultra-minimal version`);
      const semantic = detectComponentSemanticType(componentMetadata);
      prompt = `Create ${semantic.type} React component "${componentMetadata.name}" (${componentMetadata.width}×${componentMetadata.height}px). ${componentMetadata.hasText ? `Text: "${componentMetadata.characters}". ` : ''}Use ${semantic.muiComponents[0]} from Material-UI. Return clean code only.`;
      estimatedTokens = estimateTokenCount(prompt);
    }
    
    // Optimize prompt if still too large
    if (estimatedTokens > maxTokens * 0.8) { // Use 80% of max tokens for safety
      prompt = optimizePromptForTokens(prompt, Math.floor(maxTokens * 0.8));
      estimatedTokens = estimateTokenCount(prompt);
    }
    
    console.log(`Using optimized prompt with ${estimatedTokens} estimated tokens`);
    
    // Check cache first
    const promptHash = generatePromptHash(prompt);
    const cachedResponse = getCachedResponse(promptHash);
    
    if (cachedResponse) {
      return validateAndCleanCode(cachedResponse);
    }
    
    // Generate code using enhanced API call
    const generatedText = await callGeminiAPI(prompt, {
      temperature,
      maxOutputTokens: Math.min(4096, Math.max(1024, maxTokens - estimatedTokens)),
    });
    
    // Cache the response
    setCachedResponse(promptHash, generatedText);
    
    // Validate and clean the generated code
    const cleanedCode = validateAndCleanCode(generatedText);
    
    console.log(`Successfully generated React component: ${componentMetadata.name}`);
    return cleanedCode;
    
  } catch (error) {
    console.error('Error generating React component:', error);
    
    // Provide fallback for common errors
    if (error.message.includes('safety filters')) {
      throw new Error('Content was blocked by safety filters. Try using a different component name or simplifying the design.');
    } else if (error.message.includes('token limit')) {
      throw new Error('Component too complex for current token limits. Try breaking it into smaller components.');
    } else if (error.message.includes('Rate limit')) {
      throw new Error('API rate limit exceeded. Please wait a moment before generating another component.');
    }
    
    throw new Error(`Failed to generate React component: ${error.message}`);
  }
};

// Create a detailed prompt for component generation
const createComponentPrompt = (metadata, visualRelationships) => {
  // Helper function to format fills (including gradients) - simplified
  const formatFills = (fills) => {
    if (!fills || fills.length === 0) return 'transparent';
    
    // Only take the first fill to reduce token count
    const fill = fills[0];
    if (fill.type === 'SOLID') {
      return fill.color || 'transparent';
    } else if (fill.type.startsWith('GRADIENT_')) {
      const gradientType = fill.gradientType.replace('GRADIENT_', '').toLowerCase();
      const stops = fill.gradientStops && fill.gradientStops.length > 0 
        ? fill.gradientStops.map(stop => `${stop.color} ${stop.position * 100}%`).join(', ')
        : 'transparent';
      return `${gradientType}-gradient(${stops})`;
    } else if (fill.type === 'IMAGE') {
      return `url(image-${fill.imageHash || 'placeholder'})`;
    }
    return 'transparent';
  };

  // Helper function to format strokes - simplified
  const formatStrokes = (strokes, strokeWeight) => {
    if (!strokes || strokes.length === 0) return 'none';
    
    // Only take the first stroke to reduce token count
    const stroke = strokes[0];
    if (stroke.type === 'SOLID') {
      return `${strokeWeight || 1}px solid ${stroke.color || 'black'}`;
    }
    return 'none';
  };

  // Helper function to format effects - simplified
  const formatEffects = (effects) => {
    if (!effects || effects.length === 0) return '';
    
    // Only take the first effect to reduce token count
    const effect = effects[0];
    if (effect.type === 'DROP_SHADOW' && effect.offset && effect.radius) {
      return `drop-shadow(${effect.offset.x || 0}px ${effect.offset.y || 0}px ${effect.radius}px ${effect.color || 'rgba(0,0,0,0.1)'})`;
    }
    if (effect.type === 'INNER_SHADOW' && effect.offset && effect.radius) {
      return `inset ${effect.offset.x || 0}px ${effect.offset.y || 0}px ${effect.radius}px ${effect.color || 'rgba(0,0,0,0.1)'}`;
    }
    if (effect.type === 'LAYER_BLUR' && effect.radius) {
      return `blur(${effect.radius}px)`;
    }
    if (effect.type === 'BACKGROUND_BLUR' && effect.radius) {
      return `backdrop-filter: blur(${effect.radius}px)`;
    }
    return '';
  };

  // Helper function to format layout properties - simplified
  const formatLayout = (metadata) => {
    if (!metadata.autoLayout) return '';
    
    const layout = metadata.autoLayout;
    let css = '';
    
    if (layout.layoutMode === 'HORIZONTAL') {
      css += 'display: flex; flex-direction: row;';
    } else if (layout.layoutMode === 'VERTICAL') {
      css += 'display: flex; flex-direction: column;';
    }
    
    if (layout.primaryAxisAlignItems) {
      const alignMap = {
        'MIN': 'flex-start',
        'MAX': 'flex-end', 
        'CENTER': 'center',
        'SPACE_BETWEEN': 'space-between'
      };
      css += ` justify-content: ${alignMap[layout.primaryAxisAlignItems] || 'flex-start'};`;
    }
    
    if (layout.counterAxisAlignItems) {
      const alignMap = {
        'MIN': 'flex-start',
        'MAX': 'flex-end',
        'CENTER': 'center',
        'BASELINE': 'baseline'
      };
      css += ` align-items: ${alignMap[layout.counterAxisAlignItems] || 'flex-start'};`;
    }
    
    if (layout.paddingLeft || layout.paddingRight || layout.paddingTop || layout.paddingBottom) {
      css += ` padding: ${layout.paddingTop || 0}px ${layout.paddingRight || 0}px ${layout.paddingBottom || 0}px ${layout.paddingLeft || 0}px;`;
    }
    
    if (layout.itemSpacing) {
      css += ` gap: ${layout.itemSpacing}px;`;
    }
    
    return css;
  };

  // Helper function to format typography - simplified
  const formatTypography = (metadata) => {
    if (!metadata.style) return '';
    
    let css = '';
    if (metadata.fontSize) css += `font-size: ${metadata.fontSize}px;`;
    if (metadata.fontFamily) css += `font-family: "${metadata.fontFamily}";`;
    if (metadata.fontWeight) css += `font-weight: ${metadata.fontWeight};`;
    if (metadata.letterSpacing) css += `letter-spacing: ${metadata.letterSpacing}px;`;
    if (metadata.lineHeightPx) css += `line-height: ${metadata.lineHeightPx}px;`;
    if (metadata.lineHeightPercent) css += `line-height: ${metadata.lineHeightPercent}%;`;
    
    if (metadata.textAlignHorizontal) {
      const alignMap = {
        'LEFT': 'left',
        'CENTER': 'center',
        'RIGHT': 'right',
        'JUSTIFIED': 'justify'
      };
      css += `text-align: ${alignMap[metadata.textAlignHorizontal] || 'left'};`;
    }
    
    return css;
  };

  // Detect component type for better prompts
  const detectComponentType = (metadata) => {
    const name = metadata.name.toLowerCase();
    const type = metadata.type;
    
    if (name.includes('header') || name.includes('nav') || name.includes('top') || name.includes('menu')) {
      return 'navigation/top-bar';
    }
    if (name.includes('hero') || name.includes('banner') || name.includes('main')) {
      return 'hero-section';
    }
    if (name.includes('footer') || name.includes('bottom')) {
      return 'footer';
    }
    if (name.includes('card') || name.includes('item')) {
      return 'card';
    }
    if (name.includes('button') || name.includes('btn')) {
      return 'button';
    }
    if (type === 'TEXT') {
      return 'text-element';
    }
    if (type === 'RECTANGLE' || type === 'ELLIPSE') {
      return 'shape';
    }
    return 'component';
  };

  // Limit children to reduce token count - only include first 3 children
  const limitedChildren = metadata.children ? metadata.children.slice(0, 3) : [];
  
  // Limit visual relationships to reduce token count - only include first 5
  const limitedRelationships = visualRelationships ? visualRelationships.slice(0, 5) : [];

  const componentType = detectComponentType(metadata);

  // Build a more comprehensive prompt with component-specific instructions
  let prompt = `Generate a React component using Material-UI (MUI) that matches this Figma design:

COMPONENT TYPE: ${componentType.toUpperCase()}
COMPONENT: ${metadata.name} (${metadata.type}) - ${metadata.width}px × ${metadata.height}px

LAYOUT: ${metadata.autoLayout ? `${metadata.autoLayout.layoutMode || 'None'} layout, ${formatLayout(metadata)}` : 'Manual layout'}

VISUAL: Background: ${formatFills(metadata.fills)}, Border: ${formatStrokes(metadata.strokes, metadata.strokeWeight)}, Effects: ${formatEffects(metadata.effects)}, Radius: ${metadata.cornerRadius || 0}px

${metadata.hasText ? `TEXT CONTENT: "${metadata.characters}" ${formatTypography(metadata)}` : 'No text content'}
${metadata.textCount > 1 ? `ADDITIONAL TEXT ELEMENTS (${metadata.textCount - 1}): ${metadata.allTextContent.slice(1).map(text => `"${text.text}"`).join(', ')}` : ''}

${limitedChildren.length > 0 ? `CHILDREN (${limitedChildren.length}): ${limitedChildren.map((child, index) => 
  `${index + 1}. ${child.name} (${child.type}) - ${child.width}px×${child.height}px${child.hasText ? ` - "${child.characters}"` : ''}`
).join(', ')}` : 'No children'}

${limitedRelationships.length > 0 ? `RELATIONSHIPS: ${limitedRelationships.map(rel => 
  `${rel.type}: ${rel.component1} and ${rel.component2}`
).join(', ')}` : 'No relationships'}

SPECIFIC INSTRUCTIONS:
${componentType === 'navigation/top-bar' ? '- Use AppBar, Toolbar, and navigation components for top bars\n- Include proper spacing and alignment for navigation items\n- Use appropriate Material-UI navigation patterns' : ''}
${componentType === 'hero-section' ? '- Create a prominent hero section with proper visual hierarchy\n- Use large typography and spacing for impact\n- Include background styling and content positioning' : ''}
${componentType === 'footer' ? '- Use proper footer layout with organized content sections\n- Include appropriate spacing and typography hierarchy' : ''}
${componentType === 'card' ? '- Use Card, CardContent components for card layouts\n- Include proper padding and elevation' : ''}
${componentType === 'button' ? '- Use Button component with appropriate variant and styling\n- Include proper hover states and typography' : ''}
${componentType === 'text-element' ? '- Use Typography component with exact font properties\n- Preserve exact text content and styling' : ''}
${componentType === 'shape' ? '- Use Box component with exact dimensions and styling\n- Include background, border, and effects as specified' : ''}

IMPORTANT: 
- Include all text content exactly as specified. Use Typography or Text components for text elements.
- Preserve exact colors, dimensions, and visual styling from Figma.
- Use Material-UI components where appropriate (AppBar, Card, Button, Typography, Box, etc.).
- Generate a complete React functional component with minimal code and no comments.
- Return only the component code without markdown formatting.`;

  return prompt;
}; 

// Enhanced complete page generation with optimization
export const generateCompletePage = async (figmaData, selectedComponents = [], options = {}) => {
  try {
    const {
      maxTokens = 7000,
      temperature = 0.7,
      useOptimizedPrompt = false,
    } = options;

    console.log('Generating complete page from Figma design');

    // Extract page structure and key components
    const pageStructure = extractPageStructure(figmaData);
    const keyComponents = extractKeyComponents(figmaData, selectedComponents);
    
    console.log(`Extracted ${keyComponents.length} key components for page generation`);
    
    // Create appropriate prompt based on complexity
    let prompt;
    let estimatedTokens;
    
    if (useOptimizedPrompt || keyComponents.length > 10) {
      prompt = createOptimizedPagePrompt(pageStructure, keyComponents);
    } else {
      prompt = createPagePrompt(pageStructure, keyComponents);
    }
    
    estimatedTokens = estimateTokenCount(prompt);
    console.log(`Page generation estimated token count: ${estimatedTokens}`);
    
    // Optimize if needed
    if (estimatedTokens > maxTokens) {
      console.warn('Page prompt too large, optimizing...');
      
      if (!useOptimizedPrompt) {
        // Try optimized prompt first
        prompt = createOptimizedPagePrompt(pageStructure, keyComponents);
        estimatedTokens = estimateTokenCount(prompt);
      }
      
      if (estimatedTokens > maxTokens) {
        // Further optimize the prompt
        prompt = optimizePromptForTokens(prompt, maxTokens);
        estimatedTokens = estimateTokenCount(prompt);
      }
      
      if (estimatedTokens > maxTokens) {
        throw new Error(`Page too complex to generate within token limits (${estimatedTokens} tokens). Try selecting fewer components or simplifying the design.`);
      }
      
      console.log(`Optimized to ${estimatedTokens} tokens`);
    }
    
    // Check cache
    const promptHash = generatePromptHash(prompt);
    const cachedResponse = getCachedResponse(promptHash);
    
    if (cachedResponse) {
      console.log('Using cached page generation response');
      return validateAndCleanCode(cachedResponse);
    }
    
    // Generate page using enhanced API call
    const generatedText = await callGeminiAPI(prompt, {
      temperature,
      maxOutputTokens: Math.min(8192, Math.max(2048, maxTokens - estimatedTokens + 1000)),
    });
    
    // Cache the response
    setCachedResponse(promptHash, generatedText);
    
    // Validate and clean the generated code
    const cleanedCode = validateAndCleanCode(generatedText);
    
    console.log('Successfully generated complete page');
    return cleanedCode;
    
  } catch (error) {
    console.error('Error generating complete page:', error);
    
    // Provide specific error messages
    if (error.message.includes('token limits')) {
      throw new Error('Page design is too complex. Try selecting fewer components or breaking it into smaller sections.');
    } else if (error.message.includes('safety filters')) {
      throw new Error('Page content was blocked by safety filters. Try using different component names or text content.');
    } else if (error.message.includes('Rate limit')) {
      throw new Error('API rate limit exceeded. Please wait before generating another page.');
    }
    
    throw new Error(`Failed to generate complete page: ${error.message}`);
  }
};

// Extract page structure from Figma data
const extractPageStructure = (figmaData) => {
  const pages = figmaData.document.children || [];
  const mainPage = pages[0] || pages.find(page => page.name.toLowerCase().includes('main')) || pages.find(page => page.name.toLowerCase().includes('page'));
  
  if (!mainPage) {
    throw new Error('No main page found in Figma design');
  }
  
  // Extract top-level frames and components
  const topLevelElements = mainPage.children || [];
  
  // Categorize elements by type and position
  const structure = {
    pageName: mainPage.name,
    pageWidth: mainPage.absoluteBoundingBox?.width || 1440,
    pageHeight: mainPage.absoluteBoundingBox?.height || 1024,
    header: null,
    hero: null,
    main: null,
    footer: null,
    navigation: null,
    sidebar: null,
    components: [],
    layout: 'vertical' // default
  };
  
  // Sort elements by Y position to determine layout
  const sortedElements = [...topLevelElements].sort((a, b) => 
    (a.absoluteBoundingBox?.y || 0) - (b.absoluteBoundingBox?.y || 0)
  );
  
  sortedElements.forEach((element, index) => {
    const name = element.name.toLowerCase();
    const type = element.type;
    const bounds = element.absoluteBoundingBox;
    
    // Categorize by name and position
    if (name.includes('header') || name.includes('nav') || name.includes('top') || 
        (bounds && bounds.y < 100)) {
      structure.header = extractElementInfo(element);
    } else if (name.includes('hero') || name.includes('banner') || name.includes('main') ||
               (bounds && bounds.y < 300)) {
      structure.hero = extractElementInfo(element);
    } else if (name.includes('footer') || name.includes('bottom') ||
               (bounds && bounds.y > structure.pageHeight - 200)) {
      structure.footer = extractElementInfo(element);
    } else if (name.includes('sidebar') || name.includes('side') ||
               (bounds && bounds.x < 300)) {
      structure.sidebar = extractElementInfo(element);
    } else {
      structure.components.push(extractElementInfo(element));
    }
  });
  
  // Determine layout type
  if (structure.sidebar) {
    structure.layout = 'sidebar';
  } else if (structure.header && structure.footer) {
    structure.layout = 'header-footer';
  }
  
  return structure;
};

// Extract key components for detailed generation
const extractKeyComponents = (figmaData, selectedComponents) => {
  const allComponents = [];
  
  // Extract from selected components
  selectedComponents.forEach(comp => {
    allComponents.push(extractElementInfo(comp));
  });
  
  // If no components selected, extract from page structure
  if (allComponents.length === 0) {
    const pages = figmaData.document.children || [];
    const mainPage = pages[0];
    
    if (mainPage && mainPage.children) {
      // Extract first 10 components to stay within limits
      mainPage.children.slice(0, 10).forEach(element => {
        allComponents.push(extractElementInfo(element));
      });
    }
  }
  
  return allComponents;
};

// Extract essential information from an element
const extractElementInfo = (element) => {
  const bounds = element.absoluteBoundingBox;
  const fills = element.fills || [];
  const strokes = element.strokes || [];
  const effects = element.effects || [];
  
  return {
    id: element.id,
    name: element.name,
    type: element.type,
    width: bounds?.width || 0,
    height: bounds?.height || 0,
    x: bounds?.x || 0,
    y: bounds?.y || 0,
    hasText: !!element.characters,
    characters: element.characters || '',
    fontSize: element.style?.fontSize,
    fontFamily: element.style?.fontFamily,
    fontWeight: element.style?.fontWeight,
    textAlign: element.style?.textAlignHorizontal,
    backgroundColor: fills.length > 0 && fills[0].color ? fills[0].color : 'transparent',
    borderColor: strokes.length > 0 && strokes[0].color ? strokes[0].color : 'transparent',
    borderWidth: element.strokeWeight || 0,
    cornerRadius: element.cornerRadius || 0,
    layoutMode: element.layoutMode,
    children: element.children ? element.children.slice(0, 3).map(child => extractElementInfo(child)) : [],
    // Simplified effects
    hasShadow: effects.some(effect => effect.type === 'DROP_SHADOW'),
    hasBlur: effects.some(effect => effect.type === 'LAYER_BLUR'),
  };
};

// Create comprehensive page generation prompt
const createPagePrompt = (pageStructure, keyComponents) => {
  const { header, hero, main, footer, sidebar, components, layout, pageWidth, pageHeight } = pageStructure;
  
  let prompt = `Generate a complete React page using Material-UI (MUI) that matches this Figma design structure:

PAGE LAYOUT: ${layout.toUpperCase()} layout, ${pageWidth}px × ${pageHeight}px

${header ? `HEADER/NAVIGATION:
- Name: ${header.name}
- Size: ${header.width}px × ${header.height}px
- Background: ${header.backgroundColor}
- Text: "${header.characters}"
- Layout: ${header.layoutMode || 'manual'}
- Children: ${header.children.length} elements` : 'No header detected'}

${hero ? `HERO SECTION:
- Name: ${hero.name}
- Size: ${hero.width}px × ${hero.height}px
- Background: ${hero.backgroundColor}
- Text: "${hero.characters}"
- Layout: ${hero.layoutMode || 'manual'}
- Children: ${hero.children.length} elements` : 'No hero section detected'}

${footer ? `FOOTER:
- Name: ${footer.name}
- Size: ${footer.width}px × ${footer.height}px
- Background: ${footer.backgroundColor}
- Text: "${footer.characters}"
- Layout: ${footer.layoutMode || 'manual'}
- Children: ${footer.children.length} elements` : 'No footer detected'}

${sidebar ? `SIDEBAR:
- Name: ${sidebar.name}
- Size: ${sidebar.width}px × ${sidebar.height}px
- Background: ${sidebar.backgroundColor}
- Text: "${sidebar.characters}"
- Layout: ${sidebar.layoutMode || 'manual'}
- Children: ${sidebar.children.length} elements` : 'No sidebar detected'}

KEY COMPONENTS (${keyComponents.length}):
${keyComponents.map((comp, index) => `
${index + 1}. ${comp.name} (${comp.type})
   - Size: ${comp.width}px × ${comp.height}px
   - Position: (${comp.x}, ${comp.y})
   - Background: ${comp.backgroundColor}
   - Text: "${comp.characters}"
   - Border: ${comp.borderWidth}px ${comp.borderColor}
   - Radius: ${comp.cornerRadius}px
   - Layout: ${comp.layoutMode || 'manual'}
   - Effects: ${comp.hasShadow ? 'shadow' : ''} ${comp.hasBlur ? 'blur' : ''}
   - Children: ${comp.children.length} elements`).join('')}

LAYOUT INSTRUCTIONS:
${layout === 'sidebar' ? '- Use Grid or Box with flexbox for sidebar layout\n- Sidebar should be fixed width on the left\n- Main content should take remaining space' : ''}
${layout === 'header-footer' ? '- Use AppBar for header\n- Use Box with flexbox for main content area\n- Use Box for footer at bottom' : ''}
${layout === 'vertical' ? '- Use vertical stacking with Box components\n- Maintain proper spacing between sections' : ''}

COMPONENT REQUIREMENTS:
- Use Material-UI components (AppBar, Toolbar, Card, Button, Typography, Box, Grid)
- Preserve exact colors, dimensions, and positioning
- Include proper spacing and padding
- Use appropriate typography hierarchy
- Include hover states for interactive elements
- Ensure responsive design principles
- Match visual styling as closely as possible (aim for 30%+ similarity)

GENERATE:
- Complete React functional component with minimal code
- Include only necessary imports
- Use proper Material-UI theming
- Include CSS-in-JS styling for exact visual matching
- No comments or extra text - only clean code
- Return only the component code without markdown formatting`;

  return prompt;
};

// Create optimized page prompt for large designs
const createOptimizedPagePrompt = (pageStructure, keyComponents) => {
  const { header, hero, footer, layout, pageWidth, pageHeight } = pageStructure;
  
  // Limit components to most important ones
  const limitedComponents = keyComponents.slice(0, 5);
  
  let prompt = `Generate React page with Material-UI matching Figma design:

LAYOUT: ${layout}, ${pageWidth}×${pageHeight}px

${header ? `HEADER: ${header.name} (${header.width}×${header.height}px), bg:${header.backgroundColor}, text:"${header.characters}"` : ''}
${hero ? `HERO: ${hero.name} (${hero.width}×${hero.height}px), bg:${hero.backgroundColor}, text:"${hero.characters}"` : ''}
${footer ? `FOOTER: ${footer.name} (${footer.width}×${footer.height}px), bg:${footer.backgroundColor}, text:"${footer.characters}"` : ''}

COMPONENTS (${limitedComponents.length}):
${limitedComponents.map((comp, index) => 
  `${index + 1}. ${comp.name}: ${comp.width}×${comp.height}px, bg:${comp.backgroundColor}, text:"${comp.characters}", border:${comp.borderWidth}px ${comp.borderColor}`
).join('\n')}

REQUIREMENTS:
- Use AppBar, Card, Button, Typography, Box components
- Preserve colors, sizes, text content
- Include proper spacing and layout
- Match visual styling (30%+ similarity)
- Generate minimal code with no comments
- Return complete React component code only`;

  return prompt;
}; 

// Utility functions for cache management and API optimization
export const clearPromptCache = () => {
  promptCache.clear();
  console.log('Prompt cache cleared');
};

export const getCacheStats = () => {
  return {
    size: promptCache.size,
    maxSize: CACHE_MAX_SIZE,
    ttl: CACHE_TTL,
  };
};

// Get API usage statistics
let apiCallCount = 0;
let totalTokensUsed = 0;

export const getAPIStats = () => {
  return {
    totalCalls: apiCallCount,
    totalTokensUsed,
    averageTokensPerCall: apiCallCount > 0 ? Math.round(totalTokensUsed / apiCallCount) : 0,
    cacheHitRate: promptCache.size > 0 ? Math.round((promptCache.size / apiCallCount) * 100) : 0,
  };
};

export const resetAPIStats = () => {
  apiCallCount = 0;
  totalTokensUsed = 0;
  console.log('API statistics reset');
};

// Enhanced error recovery with fallback strategies
export const generateWithFallback = async (componentMetadata, allComponents = []) => {
  const fallbackStrategies = [
    // Strategy 1: Full detailed generation
    { useDetailedPrompt: true, maxTokens: 6000, temperature: 0.7 },
    
    // Strategy 2: Simplified generation
    { useDetailedPrompt: false, maxTokens: 4000, temperature: 0.7 },
    
    // Strategy 3: Ultra-minimal generation
    { useDetailedPrompt: false, maxTokens: 2000, temperature: 0.8 },
    
    // Strategy 4: Emergency fallback
    { useDetailedPrompt: false, maxTokens: 1000, temperature: 0.9 },
  ];
  
  let lastError;
  
  for (let i = 0; i < fallbackStrategies.length; i++) {
    try {
      console.log(`Attempting generation strategy ${i + 1}/${fallbackStrategies.length}`);
      
      const result = await generateReactComponent(
        componentMetadata, 
        allComponents, 
        fallbackStrategies[i]
      );
      
      if (i > 0) {
        console.log(`Successfully generated using fallback strategy ${i + 1}`);
      }
      
      return result;
      
    } catch (error) {
      lastError = error;
      console.log(`Strategy ${i + 1} failed:`, error.message);
      
      // Don't retry for certain error types
      if (error.message.includes('API key') || 
          error.message.includes('permissions')) {
        throw error;
      }
      
      // Wait before trying next strategy
      if (i < fallbackStrategies.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  throw new Error(`All generation strategies failed. Last error: ${lastError.message}`);
};