import axios from 'axios';
import { AppError, logError, withRetry } from '../utils/errorHandler.js';

const FIGMA_API_BASE_URL = 'https://api.figma.com/v1';

// Create axios instance for Figma API with enhanced configuration
const figmaApi = axios.create({
  baseURL: FIGMA_API_BASE_URL,
  timeout: 30000, // 30 second timeout
  retry: 3, // Number of retries
  retryDelay: 1000, // Initial retry delay in ms
});

// Add request interceptor for retry logic
figmaApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // If we haven't set up retry config, initialize it
    if (!config.__retryCount) {
      config.__retryCount = 0;
    }
    
    // Check if we should retry
    const shouldRetry = 
      config.__retryCount < (config.retry || 3) &&
      (error.response?.status >= 500 || // Server errors
       error.response?.status === 429 || // Rate limiting
       error.code === 'ECONNABORTED' || // Timeout
       error.code === 'NETWORK_ERROR'); // Network issues
    
    if (shouldRetry) {
      config.__retryCount++;
      
      // Calculate exponential backoff delay
      const delay = (config.retryDelay || 1000) * Math.pow(2, config.__retryCount - 1);
      
      console.log(`Retrying Figma API request (attempt ${config.__retryCount}/${config.retry || 3}) after ${delay}ms delay`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return figmaApi(config);
    }
    
    return Promise.reject(error);
  }
);

// Progress tracking for large operations
let progressCallback = null;

export const setProgressCallback = (callback) => {
  progressCallback = callback;
};

const updateProgress = (message, percentage = null) => {
  if (progressCallback) {
    progressCallback({ message, percentage });
  }
};

// Validate Figma file key format
const validateFileKey = (fileKey) => {
  if (!fileKey || typeof fileKey !== 'string') {
    throw new Error('File key is required and must be a string');
  }
  
  // Figma file keys are typically alphanumeric with some special characters
  const fileKeyPattern = /^[a-zA-Z0-9\-_]+$/;
  if (!fileKeyPattern.test(fileKey)) {
    throw new Error('Invalid Figma file key format');
  }
  
  return true;
};

// Validate access token format
const validateAccessToken = (accessToken) => {
  if (!accessToken || typeof accessToken !== 'string') {
    throw new Error('Access token is required and must be a string');
  }
  
  if (accessToken.length < 10) {
    throw new Error('Access token appears to be too short');
  }
  
  return true;
};

// Enhanced file information retrieval with validation and progress tracking
export const getFigmaFile = async (fileKey, accessToken, options = {}) => {
  try {
    // Validate inputs
    validateFileKey(fileKey);
    validateAccessToken(accessToken);
    
    updateProgress('Validating Figma credentials...', 10);
    
    // Test connection first with a simple request
    await testFigmaConnection(fileKey, accessToken);
    
    updateProgress('Fetching Figma file data...', 30);
    
    const response = await figmaApi.get(`/files/${fileKey}`, {
      headers: {
        'X-Figma-Token': accessToken,
      },
      params: {
        // Add optional parameters for better data retrieval
        geometry: options.includeGeometry ? 'paths' : undefined,
        plugin_data: options.includePluginData ? '*' : undefined,
        branch_data: options.includeBranchData ? 'true' : undefined,
      },
    });
    
    updateProgress('Processing file data...', 70);
    
    // Validate response data
    if (!response.data || !response.data.document) {
      throw new Error('Invalid response from Figma API - missing document data');
    }
    
    // Add metadata about the file
    const enhancedData = {
      ...response.data,
      metadata: {
        fetchedAt: new Date().toISOString(),
        fileKey,
        version: response.data.version,
        lastModified: response.data.lastModified,
        thumbnailUrl: response.data.thumbnailUrl,
        name: response.data.name,
        role: response.data.role,
        editorType: response.data.editorType,
        linkAccess: response.data.linkAccess,
      }
    };
    
    updateProgress('File data loaded successfully', 100);
    
    return enhancedData;
    
  } catch (error) {
    console.error('Error fetching Figma file:', error);
    
    // Provide more specific error messages
    if (error.response?.status === 401) {
      throw new Error('Invalid Figma access token. Please check your token and try again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. You may not have permission to access this Figma file.');
    } else if (error.response?.status === 404) {
      throw new Error('Figma file not found. Please check the file key and try again.');
    } else if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. The Figma file may be too large or the connection is slow.');
    } else if (error.code === 'NETWORK_ERROR') {
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    
    throw new Error(`Failed to fetch Figma file: ${error.response?.data?.message || error.message}`);
  }
};

// Test Figma API connection
const testFigmaConnection = async (fileKey, accessToken) => {
  try {
    // Make a lightweight request to test the connection
    await figmaApi.get(`/files/${fileKey}`, {
      headers: {
        'X-Figma-Token': accessToken,
      },
      params: {
        // Only fetch minimal data for connection test
        depth: 1,
        geometry: 'paths',
      },
    });
  } catch (error) {
    // Re-throw with connection-specific context
    throw new Error(`Connection test failed: ${error.message}`);
  }
};

// Enhanced image retrieval with better error handling and optimization
export const getFigmaImages = async (fileKey, nodeIds, accessToken, options = {}) => {
  try {
    // Validate inputs
    validateFileKey(fileKey);
    validateAccessToken(accessToken);
    
    if (!nodeIds || !Array.isArray(nodeIds) || nodeIds.length === 0) {
      throw new Error('Node IDs are required and must be a non-empty array');
    }
    
    // Limit the number of nodes to prevent API limits
    const maxNodes = options.maxNodes || 50;
    const limitedNodeIds = nodeIds.slice(0, maxNodes);
    
    if (nodeIds.length > maxNodes) {
      console.warn(`Limited image request to ${maxNodes} nodes (requested ${nodeIds.length})`);
    }
    
    updateProgress(`Fetching images for ${limitedNodeIds.length} components...`, 20);
    
    const response = await figmaApi.get(`/images/${fileKey}`, {
      headers: {
        'X-Figma-Token': accessToken,
      },
      params: {
        ids: limitedNodeIds.join(','),
        format: options.format || 'png',
        scale: options.scale || 2,
        svg_include_id: options.includeSvgIds ? 'true' : undefined,
        svg_simplify_stroke: options.simplifySvgStroke ? 'true' : undefined,
        use_absolute_bounds: options.useAbsoluteBounds ? 'true' : undefined,
      },
    });
    
    updateProgress('Images fetched successfully', 100);
    
    // Validate response
    if (!response.data || !response.data.images) {
      throw new Error('Invalid response from Figma API - missing images data');
    }
    
    // Check for any failed image generations
    const failedImages = Object.entries(response.data.images)
      .filter(([nodeId, imageUrl]) => !imageUrl)
      .map(([nodeId]) => nodeId);
    
    if (failedImages.length > 0) {
      console.warn(`Failed to generate images for nodes: ${failedImages.join(', ')}`);
    }
    
    return {
      ...response.data,
      metadata: {
        requestedNodes: nodeIds.length,
        processedNodes: limitedNodeIds.length,
        failedNodes: failedImages.length,
        successfulNodes: Object.keys(response.data.images).length - failedImages.length,
        fetchedAt: new Date().toISOString(),
      }
    };
    
  } catch (error) {
    console.error('Error fetching Figma images:', error);
    
    // Provide more specific error messages
    if (error.response?.status === 400) {
      throw new Error('Invalid request parameters. Please check the node IDs and try again.');
    } else if (error.response?.status === 401) {
      throw new Error('Invalid Figma access token for image generation.');
    } else if (error.response?.status === 404) {
      throw new Error('One or more nodes not found in the Figma file.');
    } else if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded for image generation. Please wait and try again.');
    }
    
    throw new Error(`Failed to fetch Figma images: ${error.response?.data?.message || error.message}`);
  }
};

// Extract component metadata from Figma node
export const extractComponentMetadata = (node) => {
  if (!node) {
    console.warn('extractComponentMetadata called with null/undefined node');
    return null;
  }

  const metadata = {
    id: node.id || 'unknown',
    name: node.name || 'Unnamed Component',
    type: node.type || 'UNKNOWN',
    
    // Basic dimensions and positioning
    width: node.absoluteBoundingBox?.width || node.size?.x || node.width || 0,
    height: node.absoluteBoundingBox?.height || node.size?.y || node.height || 0,
    x: node.absoluteBoundingBox?.x || node.x || 0,
    y: node.absoluteBoundingBox?.y || node.y || 0,
    
    // Preserve original absoluteBoundingBox for compatibility
    absoluteBoundingBox: node.absoluteBoundingBox || {
      width: node.size?.x || node.width || 0,
      height: node.size?.y || node.height || 0,
      x: node.x || 0,
      y: node.y || 0,
    },
    
    // Layout properties
    layoutMode: node.layoutMode, // HORIZONTAL, VERTICAL, or null
    primaryAxisSizingMode: node.primaryAxisSizingMode, // FIXED, AUTO
    counterAxisSizingMode: node.counterAxisSizingMode, // FIXED, AUTO
    primaryAxisAlignItems: node.primaryAxisAlignItems, // MIN, MAX, CENTER, SPACE_BETWEEN
    counterAxisAlignItems: node.counterAxisAlignItems, // MIN, MAX, CENTER, BASELINE
    paddingLeft: node.paddingLeft,
    paddingRight: node.paddingRight,
    paddingTop: node.paddingTop,
    paddingBottom: node.paddingBottom,
    itemSpacing: node.itemSpacing,
    
    // Visual properties
    fills: extractFillDetails(node.fills),
    strokes: extractStrokeDetails(node.strokes),
    strokeWeight: node.strokeWeight,
    strokeAlign: node.strokeAlign, // INSIDE, OUTSIDE, CENTER
    effects: extractEffectDetails(node.effects),
    cornerRadius: node.cornerRadius,
    rectangleCornerRadii: node.rectangleCornerRadii, // [topLeft, topRight, bottomRight, bottomLeft]
    
    // Typography properties
    characters: node.characters || '',
    style: node.style || {},
    fontSize: node.style?.fontSize,
    fontFamily: node.style?.fontFamily,
    fontWeight: node.style?.fontWeight,
    textAlignHorizontal: node.style?.textAlignHorizontal, // LEFT, CENTER, RIGHT, JUSTIFIED
    textAlignVertical: node.style?.textAlignVertical, // TOP, CENTER, BOTTOM
    letterSpacing: node.style?.letterSpacing,
    lineHeightPx: node.style?.lineHeightPx,
    lineHeightPercent: node.style?.lineHeightPercent,
    textAutoResize: node.textAutoResize, // NONE, WIDTH_AND_HEIGHT, HEIGHT, TRUNCATE
    
    // Constraints and positioning
    constraints: extractLayoutConstraints(node),
    responsiveInfo: extractResponsiveInfo(node),
    
    // Opacity and blending
    opacity: node.opacity,
    blendMode: node.blendMode,
    
    // Vector properties (for shapes, icons)
    vectorPaths: node.vectorPaths,
    strokeCap: node.strokeCap, // NONE, ROUND, SQUARE, ARROW_LINES, ARROW_EQUILATERAL
    strokeJoin: node.strokeJoin, // MITER, BEVEL, ROUND
    
    // Auto layout properties
    autoLayout: {
      layoutMode: node.layoutMode,
      primaryAxisSizingMode: node.primaryAxisSizingMode,
      counterAxisSizingMode: node.counterAxisSizingMode,
      primaryAxisAlignItems: node.primaryAxisAlignItems,
      counterAxisAlignItems: node.counterAxisAlignItems,
      paddingLeft: node.paddingLeft,
      paddingRight: node.paddingRight,
      paddingTop: node.paddingTop,
      paddingBottom: node.paddingBottom,
      itemSpacing: node.itemSpacing,
    },
    
    // Children with their metadata
    children: node.children ? node.children.map(child => extractComponentMetadata(child)).filter(Boolean) : [],
    
    // Additional properties
    visible: node.visible !== false, // Default to true if not specified
    locked: node.locked || false,
    exportSettings: node.exportSettings || [],
    reactions: node.reactions || [],
    transitionNodeID: node.transitionNodeID,
    transitionDuration: node.transitionDuration,
    transitionEasing: node.transitionEasing,
    
    // Component-specific properties
    componentId: node.componentId,
    componentProperties: node.componentProperties || {},
    componentPropertyReferences: node.componentPropertyReferences || {},
    
    // Instance properties
    mainComponent: node.mainComponent,
    
    // Frame properties
    clipsContent: node.clipsContent,
    gridStyleId: node.gridStyleId,
    layoutGrids: node.layoutGrids || [],
    
    // Text-specific properties
    characters: node.characters || '',
    characterStyleOverrides: node.characterStyleOverrides || [],
    styleOverrideTable: node.styleOverrideTable || {},
    
    // Vector-specific properties
    vectorNetwork: node.vectorNetwork,
    vectorRegions: node.vectorRegions,
    
    // Boolean operation properties
    booleanOperation: node.booleanOperation,
    
    // Image properties
    imageHash: node.imageHash,
    imageTransform: node.imageTransform,
    
    // Connector properties
    connectorStart: node.connectorStart,
    connectorEnd: node.connectorEnd,
    connectorStartStrokeCap: node.connectorStartStrokeCap,
    connectorEndStrokeCap: node.connectorEndStrokeCap,
    connectorLineType: node.connectorLineType,
  };

  return metadata;
};

// Enhanced text extraction function
const extractTextContent = (node) => {
  let textContent = '';
  
  // Direct text content from various possible properties
  if (node.characters) {
    textContent = node.characters;
  } else if (node.textContent) {
    textContent = node.textContent;
  } else if (node.text) {
    textContent = node.text;
  } else if (node.name && node.type === 'TEXT') {
    // Sometimes text is stored in the name for text nodes
    textContent = node.name;
  }
  
  // If no direct text, check children for text content
  if (!textContent && node.children && Array.isArray(node.children)) {
    const childTexts = node.children
      .map(child => extractTextContent(child))
      .filter(text => text && text.trim().length > 0);
    
    if (childTexts.length > 0) {
      textContent = childTexts.join(' ');
    }
  }
  
  return textContent;
};

// Enhanced simplified metadata extraction with intelligent token optimization
export const extractSimplifiedMetadata = (node, options = {}) => {
  if (!node) {
    console.warn('extractSimplifiedMetadata called with null/undefined node');
    return null;
  }
  
  // Debug: Log component data to understand dimension issues
  const finalWidth = node.absoluteBoundingBox?.width || node.size?.x || node.width || 0;
  const finalHeight = node.absoluteBoundingBox?.height || node.size?.y || node.height || 0;
  
  if (finalWidth === 0 || finalHeight === 0) {
    console.warn(`Component ${node.name || 'unnamed'} (${node.type}) has zero dimensions:`, {
      finalWidth,
      finalHeight,
      absoluteBoundingBox: node.absoluteBoundingBox,
      size: node.size,
      width: node.width,
      height: node.height,
    });
  } else {
    console.log(`Component ${node.name || 'unnamed'} (${node.type}) dimensions: ${finalWidth}×${finalHeight}`);
  }

  const {
    maxDepth = 2,
    maxChildren = 3,
    includeDetailedText = true,
    includeEffects = true,
    includeConstraints = false,
    tokenBudget = 1000, // Approximate token budget for this component
  } = options;

  // Extract text content using enhanced function
  const textContent = extractTextContent(node);
  const allTextContent = includeDetailedText ? extractAllTextContent(node) : [];

  // Detect component semantic type for better optimization
  const semanticType = detectComponentSemanticType(node);
  
  const metadata = {
    id: node.id || 'unknown',
    name: node.name || 'Unnamed Component',
    type: node.type || 'UNKNOWN',
    semanticType, // Add semantic type for better code generation
    
    // Basic dimensions and positioning (always include)
    width: node.absoluteBoundingBox?.width || node.size?.x || node.width || 0,
    height: node.absoluteBoundingBox?.height || node.size?.y || node.height || 0,
    x: node.absoluteBoundingBox?.x || node.x || 0,
    y: node.absoluteBoundingBox?.y || node.y || 0,
    
    // Preserve original absoluteBoundingBox for compatibility
    absoluteBoundingBox: node.absoluteBoundingBox || {
      width: node.size?.x || node.width || 0,
      height: node.size?.y || node.height || 0,
      x: node.x || 0,
      y: node.y || 0,
    },
    
    // Enhanced text content
    characters: textContent,
    hasText: textContent.length > 0,
    allTextContent: allTextContent.slice(0, 5), // Limit to 5 text elements
    textCount: allTextContent.length,
    
    // Layout properties (prioritize based on semantic type)
    layoutMode: node.layoutMode,
    primaryAxisAlignItems: node.primaryAxisAlignItems,
    counterAxisAlignItems: node.counterAxisAlignItems,
    
    // Include padding only if it's significant or component is a container
    ...(shouldIncludePadding(node, semanticType) && {
      paddingLeft: node.paddingLeft,
      paddingRight: node.paddingRight,
      paddingTop: node.paddingTop,
      paddingBottom: node.paddingBottom,
      itemSpacing: node.itemSpacing,
    }),
    
    // Visual properties (optimized based on importance)
    fills: node.fills ? extractOptimizedFills(node.fills, semanticType) : [],
    strokes: node.strokes ? extractOptimizedStrokes(node.strokes, semanticType) : [],
    strokeWeight: node.strokeWeight,
    
    // Include effects only if requested and component benefits from them
    ...(includeEffects && shouldIncludeEffects(node, semanticType) && {
      effects: node.effects ? extractSimplifiedEffects(node.effects) : [],
    }),
    
    cornerRadius: node.cornerRadius,
    
    // Typography (prioritize for text components)
    ...(semanticType === 'text' || node.style && {
      fontSize: node.style?.fontSize,
      fontFamily: node.style?.fontFamily,
      fontWeight: node.style?.fontWeight,
      textAlignHorizontal: node.style?.textAlignHorizontal,
      letterSpacing: node.style?.letterSpacing,
      lineHeightPx: node.style?.lineHeightPx,
    }),
    
    // Constraints (only if specifically requested)
    ...(includeConstraints && {
      constraints: extractLayoutConstraints(node),
    }),
    
    // Simplified children with depth control
    children: node.children && maxDepth > 0 ? 
      node.children
        .slice(0, maxChildren)
        .map(child => extractSimplifiedMetadata(child, {
          ...options,
          maxDepth: maxDepth - 1,
          tokenBudget: Math.floor(tokenBudget / 4), // Reduce budget for children
        }))
        .filter(Boolean) : [],
    
    // Essential properties
    opacity: node.opacity !== 1 ? node.opacity : undefined, // Only include if not default
    visible: node.visible === false ? false : undefined, // Only include if hidden
    
    // Component-specific properties
    ...(node.componentId && { componentId: node.componentId }),
    ...(node.mainComponent && { isInstance: true }),
  };

  // Remove undefined values to save tokens
  return cleanMetadata(metadata);
};

// Detect semantic type of component for better optimization
const detectComponentSemanticType = (node) => {
  const name = node.name.toLowerCase();
  const type = node.type;
  
  // Text components
  if (type === 'TEXT' || name.includes('text') || name.includes('label') || name.includes('title')) {
    return 'text';
  }
  
  // Button components
  if (name.includes('button') || name.includes('btn') || name.includes('cta')) {
    return 'button';
  }
  
  // Navigation components
  if (name.includes('nav') || name.includes('header') || name.includes('menu') || name.includes('tab')) {
    return 'navigation';
  }
  
  // Card components
  if (name.includes('card') || name.includes('item') || name.includes('tile')) {
    return 'card';
  }
  
  // Input components
  if (name.includes('input') || name.includes('field') || name.includes('form')) {
    return 'input';
  }
  
  // Container components
  if (type === 'FRAME' || name.includes('container') || name.includes('wrapper') || name.includes('section')) {
    return 'container';
  }
  
  // Icon components
  if (type === 'VECTOR' || name.includes('icon') || name.includes('symbol')) {
    return 'icon';
  }
  
  // Image components
  if (type === 'RECTANGLE' && node.fills?.some(fill => fill.type === 'IMAGE')) {
    return 'image';
  }
  
  return 'generic';
};

// Determine if padding should be included based on component type
const shouldIncludePadding = (node, semanticType) => {
  // Always include for containers and cards
  if (semanticType === 'container' || semanticType === 'card') {
    return true;
  }
  
  // Include if padding is significant (> 4px)
  const hasPadding = node.paddingLeft > 4 || node.paddingRight > 4 || 
                    node.paddingTop > 4 || node.paddingBottom > 4;
  
  return hasPadding;
};

// Determine if effects should be included
const shouldIncludeEffects = (node, semanticType) => {
  // Always include for buttons and cards (likely to have shadows)
  if (semanticType === 'button' || semanticType === 'card') {
    return true;
  }
  
  // Include if effects are present and visible
  return node.effects && node.effects.some(effect => effect.visible !== false);
};

// Optimized fill extraction based on component type
const extractOptimizedFills = (fills, semanticType) => {
  if (!fills || !Array.isArray(fills)) return [];
  
  // For icons, only include the first fill
  if (semanticType === 'icon') {
    return extractSimplifiedFills(fills.slice(0, 1));
  }
  
  // For images, include image fills but simplify others
  if (semanticType === 'image') {
    const imageFills = fills.filter(fill => fill.type === 'IMAGE');
    const otherFills = fills.filter(fill => fill.type !== 'IMAGE').slice(0, 1);
    return extractSimplifiedFills([...imageFills, ...otherFills]);
  }
  
  // For other components, include up to 2 fills
  return extractSimplifiedFills(fills.slice(0, 2));
};

// Optimized stroke extraction
const extractOptimizedStrokes = (strokes, semanticType) => {
  if (!strokes || !Array.isArray(strokes)) return [];
  
  // Buttons and inputs often have important borders
  if (semanticType === 'button' || semanticType === 'input') {
    return extractSimplifiedStrokes(strokes.slice(0, 1));
  }
  
  // For other components, only include if stroke is significant
  const significantStrokes = strokes.filter(stroke => 
    stroke.visible !== false && stroke.opacity > 0.1
  );
  
  return extractSimplifiedStrokes(significantStrokes.slice(0, 1));
};

// Clean metadata by removing undefined values
const cleanMetadata = (metadata) => {
  const cleaned = {};
  
  Object.entries(metadata).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          cleaned[key] = value;
        }
      } else if (typeof value === 'object') {
        const cleanedObject = cleanMetadata(value);
        if (Object.keys(cleanedObject).length > 0) {
          cleaned[key] = cleanedObject;
        }
      } else {
        cleaned[key] = value;
      }
    }
  });
  
  return cleaned;
};

// Simplified fill extraction
const extractSimplifiedFills = (fills) => {
  if (!fills || !Array.isArray(fills)) return [];
  
  // Only take the first fill to reduce token count
  const fill = fills[0];
  if (!fill) return [];
  
  const fillInfo = {
    type: fill.type,
    visible: fill.visible !== false,
  };

  if (fill.type === 'SOLID' && fill.color) {
    const { r, g, b } = fill.color;
    const alpha = fill.color.a || 1;
    fillInfo.color = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`;
  } else if (fill.type.startsWith('GRADIENT_')) {
    fillInfo.gradientType = fill.type;
    fillInfo.gradientStops = fill.gradientStops?.slice(0, 2).map(stop => ({
      position: stop.position,
      color: stop.color ? `rgba(${Math.round(stop.color.r * 255)}, ${Math.round(stop.color.g * 255)}, ${Math.round(stop.color.b * 255)}, ${stop.color.a || 1})` : 'transparent'
    })) || [];
  }

  return [fillInfo];
};

// Simplified stroke extraction
const extractSimplifiedStrokes = (strokes) => {
  if (!strokes || !Array.isArray(strokes)) return [];
  
  // Only take the first stroke to reduce token count
  const stroke = strokes[0];
  if (!stroke) return [];
  
  const strokeInfo = {
    type: stroke.type,
    visible: stroke.visible !== false,
  };

  if (stroke.type === 'SOLID' && stroke.color) {
    const { r, g, b } = stroke.color;
    const alpha = stroke.color.a || 1;
    strokeInfo.color = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`;
  }

  return [strokeInfo];
};

// Simplified effect extraction
const extractSimplifiedEffects = (effects) => {
  if (!effects || !Array.isArray(effects)) return [];
  
  // Only take the first effect to reduce token count
  const effect = effects[0];
  if (!effect) return [];
  
  const effectInfo = {
    type: effect.type,
    visible: effect.visible !== false,
  };

  if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
    effectInfo.offset = effect.offset;
    effectInfo.radius = effect.radius;
    if (effect.color) {
      const { r, g, b } = effect.color;
      const alpha = effect.color.a || 1;
      effectInfo.color = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`;
    }
  } else if (effect.type === 'LAYER_BLUR' || effect.type === 'BACKGROUND_BLUR') {
    effectInfo.radius = effect.radius;
  }

  return [effectInfo];
};

// Recursively extract all text content from a component and its children
export const extractAllTextContent = (node) => {
  const allText = [];
  
  // Extract text from current node
  const currentText = extractTextContent(node);
  if (currentText && currentText.trim().length > 0) {
    allText.push({
      text: currentText,
      nodeName: node.name,
      nodeType: node.type,
      style: node.style
    });
  }
  
  // Recursively extract text from children
  if (node.children && Array.isArray(node.children)) {
    node.children.forEach(child => {
      const childTexts = extractAllTextContent(child);
      allText.push(...childTexts);
    });
  }
  
  return allText;
};

// Batch process components with progress tracking and memory optimization
export const batchProcessComponents = async (nodes, options = {}) => {
  const {
    batchSize = 10,
    maxComponents = 100,
    onProgress = null,
  } = options;
  
  updateProgress('Starting component processing...', 0);
  
  const allComponents = findAllComponents(nodes, options);
  const totalComponents = Math.min(allComponents.length, maxComponents);
  const batches = [];
  
  // Split components into batches
  for (let i = 0; i < totalComponents; i += batchSize) {
    batches.push(allComponents.slice(i, i + batchSize));
  }
  
  const processedComponents = [];
  
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const progress = Math.round(((batchIndex + 1) / batches.length) * 100);
    
    updateProgress(`Processing batch ${batchIndex + 1}/${batches.length}...`, progress);
    
    // Process batch with simplified metadata
    const batchResults = batch.map(component => 
      extractSimplifiedMetadata(component, {
        maxDepth: 2,
        maxChildren: 3,
        includeDetailedText: true,
        includeEffects: true,
        tokenBudget: 800, // Conservative token budget per component
      })
    ).filter(Boolean);
    
    processedComponents.push(...batchResults);
    
    // Optional callback for progress updates
    if (onProgress) {
      onProgress({
        processed: processedComponents.length,
        total: totalComponents,
        percentage: progress,
        currentBatch: batchIndex + 1,
        totalBatches: batches.length,
      });
    }
    
    // Small delay to prevent overwhelming the system
    if (batchIndex < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  updateProgress('Component processing completed', 100);
  
  return {
    components: processedComponents,
    metadata: {
      totalFound: allComponents.length,
      totalProcessed: processedComponents.length,
      batchesProcessed: batches.length,
      batchSize,
      processedAt: new Date().toISOString(),
    }
  };
};

// Recursively find all components in the file with memory optimization
export const findAllComponents = (nodes, options = {}) => {
  const {
    maxComponents = 50, // Limit total components to prevent memory issues
    maxDepth = 3, // Limit recursion depth
    includeTypes = ['COMPONENT', 'INSTANCE', 'FRAME', 'TEXT'], // Only include essential types
    excludeTypes = ['SLICE', 'VECTOR', 'BOOLEAN_OPERATION', 'LINE', 'REGULAR_POLYGON', 'STAR'], // Exclude complex types
    minSize = 20, // Minimum component size to include (filter out tiny elements)
    maxSize = 2000, // Maximum component size to include (filter out huge elements)
  } = options;

  const components = [];
  let componentCount = 0;

  const traverse = (nodeList, depth = 0) => {
    if (!Array.isArray(nodeList) || depth > maxDepth || componentCount >= maxComponents) return;

    for (const node of nodeList) {
      if (componentCount >= maxComponents) break;

      // Skip excluded types
      if (excludeTypes.includes(node.type)) continue;

      // Check if component should be included
      // Use fallback dimensions if absoluteBoundingBox is not available
      const width = node.absoluteBoundingBox?.width || node.size?.x || node.width || 0;
      const height = node.absoluteBoundingBox?.height || node.size?.y || node.height || 0;
      
      const shouldInclude = includeTypes.includes(node.type) && 
        width >= minSize &&
        height >= minSize &&
        width <= maxSize &&
        height <= maxSize;

      if (shouldInclude) {
        // Use simplified metadata to reduce memory usage
        const simplifiedNode = {
          ...node,
          children: undefined // Don't include children in the main list to save memory
        };
        components.push(simplifiedNode);
        componentCount++;
      }
      
      // Continue traversing children if we haven't hit limits
      if (node.children && depth < maxDepth && componentCount < maxComponents) {
        traverse(node.children, depth + 1);
      }
    }
  };

  traverse(nodes);
  return components;
};

// New function to get components with pagination
export const getComponentsWithPagination = (nodes, page = 0, pageSize = 20, options = {}) => {
  const allComponents = findAllComponents(nodes, options);
  const startIndex = page * pageSize;
  const endIndex = startIndex + pageSize;
  
  return {
    components: allComponents.slice(startIndex, endIndex),
    total: allComponents.length,
    page,
    pageSize,
    hasMore: endIndex < allComponents.length
  };
};

// New function to get components by type
export const getComponentsByType = (nodes, type, options = {}) => {
  const typeOptions = {
    ...options,
    includeTypes: [type]
  };
  return findAllComponents(nodes, typeOptions);
};

// New function to get top-level components only
export const getTopLevelComponents = (nodes, options = {}) => {
  const topLevelOptions = {
    ...options,
    maxDepth: 1 // Only get immediate children
  };
  return findAllComponents(nodes, topLevelOptions);
};

// Extract detailed component hierarchy with visual relationships
export const extractComponentHierarchy = (node, depth = 0) => {
  const hierarchy = {
    id: node.id,
    name: node.name,
    type: node.type,
    depth: depth,
    metadata: extractComponentMetadata(node),
    children: [],
    visualRelationships: {
      above: [],
      below: [],
      leftOf: [],
      rightOf: [],
      overlapping: []
    }
  };

  // Extract children with their hierarchy
  if (node.children && Array.isArray(node.children)) {
    hierarchy.children = node.children.map(child => 
      extractComponentHierarchy(child, depth + 1)
    );
  }

  return hierarchy;
};

// Analyze visual relationships between components
export const analyzeVisualRelationships = (components) => {
  const relationships = [];

  for (let i = 0; i < components.length; i++) {
    for (let j = i + 1; j < components.length; j++) {
      const comp1 = components[i];
      const comp2 = components[j];

      if (!comp1.absoluteBoundingBox || !comp2.absoluteBoundingBox) continue;

      const box1 = comp1.absoluteBoundingBox;
      const box2 = comp2.absoluteBoundingBox;

      // Check for overlapping
      const overlap = !(box1.x + box1.width < box2.x || 
                       box2.x + box2.width < box1.x || 
                       box1.y + box1.height < box2.y || 
                       box2.y + box2.height < box1.y);

      if (overlap) {
        relationships.push({
          type: 'overlapping',
          component1: comp1.id,
          component2: comp2.id,
          overlap: {
            x: Math.max(box1.x, box2.x),
            y: Math.max(box1.y, box2.y),
            width: Math.min(box1.x + box1.width, box2.x + box2.width) - Math.max(box1.x, box2.x),
            height: Math.min(box1.y + box1.height, box2.y + box2.height) - Math.max(box1.y, box2.y)
          }
        });
      }

      // Check for alignment
      const verticalAlign = Math.abs(box1.y - box2.y) < 5;
      const horizontalAlign = Math.abs(box1.x - box2.x) < 5;

      if (verticalAlign) {
        relationships.push({
          type: 'verticallyAligned',
          component1: comp1.id,
          component2: comp2.id,
          alignment: 'top'
        });
      }

      if (horizontalAlign) {
        relationships.push({
          type: 'horizontallyAligned',
          component1: comp1.id,
          component2: comp2.id,
          alignment: 'left'
        });
      }
    }
  }

  return relationships;
}; 

// Helper function to extract detailed fill information
export const extractFillDetails = (fills) => {
  if (!fills || !Array.isArray(fills)) return [];
  
  return fills.map(fill => {
    const fillInfo = {
      type: fill.type,
      visible: fill.visible !== false,
      opacity: fill.opacity || 1,
      blendMode: fill.blendMode || 'NORMAL'
    };

    switch (fill.type) {
      case 'SOLID':
        if (fill.color) {
          const { r, g, b } = fill.color;
          const alpha = fill.color.a || 1;
          fillInfo.color = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`;
          fillInfo.hex = `#${Math.round(r * 255).toString(16).padStart(2, '0')}${Math.round(g * 255).toString(16).padStart(2, '0')}${Math.round(b * 255).toString(16).padStart(2, '0')}`;
        }
        break;
        
      case 'GRADIENT_LINEAR':
      case 'GRADIENT_RADIAL':
      case 'GRADIENT_ANGULAR':
      case 'GRADIENT_DIAMOND':
        fillInfo.gradientType = fill.type;
        fillInfo.gradientTransform = fill.gradientTransform;
        fillInfo.gradientStops = fill.gradientStops?.map(stop => ({
          position: stop.position,
          color: stop.color ? `rgba(${Math.round(stop.color.r * 255)}, ${Math.round(stop.color.g * 255)}, ${Math.round(stop.color.b * 255)}, ${stop.color.a || 1})` : 'transparent'
        })) || [];
        break;
        
      case 'IMAGE':
        fillInfo.imageHash = fill.imageHash;
        fillInfo.imageTransform = fill.imageTransform;
        fillInfo.scaleMode = fill.scaleMode;
        fillInfo.imageRef = fill.imageRef;
        break;
        
      case 'VIDEO':
        fillInfo.videoHash = fill.videoHash;
        fillInfo.videoTransform = fill.videoTransform;
        break;
    }

    return fillInfo;
  });
};

// Helper function to extract detailed stroke information
export const extractStrokeDetails = (strokes) => {
  if (!strokes || !Array.isArray(strokes)) return [];
  
  return strokes.map(stroke => {
    const strokeInfo = {
      type: stroke.type,
      visible: stroke.visible !== false,
      opacity: stroke.opacity || 1,
      blendMode: stroke.blendMode || 'NORMAL'
    };

    if (stroke.type === 'SOLID' && stroke.color) {
      const { r, g, b } = stroke.color;
      const alpha = stroke.color.a || 1;
      strokeInfo.color = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`;
    }

    return strokeInfo;
  });
};

// Helper function to extract detailed effect information
export const extractEffectDetails = (effects) => {
  if (!effects || !Array.isArray(effects)) return [];
  
  return effects.map(effect => {
    const effectInfo = {
      type: effect.type,
      visible: effect.visible !== false,
      blendMode: effect.blendMode || 'NORMAL'
    };

    switch (effect.type) {
      case 'DROP_SHADOW':
      case 'INNER_SHADOW':
        effectInfo.offset = effect.offset;
        effectInfo.radius = effect.radius;
        effectInfo.spread = effect.spread;
        if (effect.color) {
          const { r, g, b } = effect.color;
          const alpha = effect.color.a || 1;
          effectInfo.color = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`;
        }
        break;
        
      case 'LAYER_BLUR':
        effectInfo.radius = effect.radius;
        break;
        
      case 'BACKGROUND_BLUR':
        effectInfo.radius = effect.radius;
        break;
    }

    return effectInfo;
  });
}; 

// Extract layout constraints and positioning information
export const extractLayoutConstraints = (node) => {
  if (!node.constraints) return null;
  
  const constraints = {
    horizontal: node.constraints.horizontal, // LEFT, RIGHT, LEFT_RIGHT, CENTER, SCALE
    vertical: node.constraints.vertical, // TOP, BOTTOM, TOP_BOTTOM, CENTER, SCALE
    layoutGrow: node.layoutGrow || 0,
    layoutAlign: node.layoutAlign || 'INHERIT'
  };

  // Convert Figma constraints to CSS positioning hints
  const positioningHints = [];
  
  if (constraints.horizontal === 'LEFT') {
    positioningHints.push('left-aligned, fixed width');
  } else if (constraints.horizontal === 'RIGHT') {
    positioningHints.push('right-aligned, fixed width');
  } else if (constraints.horizontal === 'LEFT_RIGHT') {
    positioningHints.push('stretches horizontally');
  } else if (constraints.horizontal === 'CENTER') {
    positioningHints.push('centered horizontally');
  } else if (constraints.horizontal === 'SCALE') {
    positioningHints.push('scales horizontally');
  }

  if (constraints.vertical === 'TOP') {
    positioningHints.push('top-aligned, fixed height');
  } else if (constraints.vertical === 'BOTTOM') {
    positioningHints.push('bottom-aligned, fixed height');
  } else if (constraints.vertical === 'TOP_BOTTOM') {
    positioningHints.push('stretches vertically');
  } else if (constraints.vertical === 'CENTER') {
    positioningHints.push('centered vertically');
  } else if (constraints.vertical === 'SCALE') {
    positioningHints.push('scales vertically');
  }

  return {
    ...constraints,
    positioningHints
  };
};

// Estimate token count for metadata (rough approximation)
export const estimateMetadataTokens = (metadata) => {
  const jsonString = JSON.stringify(metadata);
  // Rough approximation: 1 token ≈ 4 characters
  return Math.ceil(jsonString.length / 4);
};

// Optimize metadata for token limits
export const optimizeMetadataForTokens = (metadata, maxTokens = 1000) => {
  let currentTokens = estimateMetadataTokens(metadata);
  
  if (currentTokens <= maxTokens) {
    return metadata;
  }
  
  console.log(`Optimizing metadata: ${currentTokens} tokens -> target: ${maxTokens} tokens`);
  
  // Create a copy to modify
  let optimized = { ...metadata };
  
  // Progressive optimization steps
  const optimizationSteps = [
    // Step 1: Remove detailed text content
    () => {
      if (optimized.allTextContent && optimized.allTextContent.length > 1) {
        optimized.allTextContent = optimized.allTextContent.slice(0, 1);
      }
    },
    
    // Step 2: Reduce children depth
    () => {
      if (optimized.children && optimized.children.length > 0) {
        optimized.children = optimized.children.map(child => ({
          ...child,
          children: child.children ? child.children.slice(0, 1) : []
        }));
      }
    },
    
    // Step 3: Remove effects if not essential
    () => {
      if (optimized.effects && optimized.semanticType !== 'button' && optimized.semanticType !== 'card') {
        delete optimized.effects;
      }
    },
    
    // Step 4: Simplify fills and strokes
    () => {
      if (optimized.fills && optimized.fills.length > 1) {
        optimized.fills = optimized.fills.slice(0, 1);
      }
      if (optimized.strokes && optimized.strokes.length > 1) {
        optimized.strokes = optimized.strokes.slice(0, 1);
      }
    },
    
    // Step 5: Remove non-essential properties
    () => {
      const nonEssential = ['constraints', 'reactions', 'exportSettings', 'componentProperties'];
      nonEssential.forEach(prop => delete optimized[prop]);
    },
    
    // Step 6: Reduce children count
    () => {
      if (optimized.children && optimized.children.length > 2) {
        optimized.children = optimized.children.slice(0, 2);
      }
    },
    
    // Step 7: Remove all children if still too large
    () => {
      if (optimized.children) {
        optimized.children = [];
      }
    },
  ];
  
  // Apply optimization steps until we're under the token limit
  for (const step of optimizationSteps) {
    step();
    currentTokens = estimateMetadataTokens(optimized);
    
    if (currentTokens <= maxTokens) {
      break;
    }
  }
  
  console.log(`Optimization complete: ${currentTokens} tokens (${Math.round((currentTokens / maxTokens) * 100)}% of limit)`);
  
  return optimized;
};

// Validate and sanitize component data
export const validateAndSanitizeComponent = (component) => {
  if (!component || typeof component !== 'object') {
    return null;
  }
  
  // Ensure required fields
  const sanitized = {
    id: component.id || 'unknown',
    name: (component.name || 'Unnamed Component').substring(0, 100), // Limit name length
    type: component.type || 'UNKNOWN',
    width: Math.max(0, component.absoluteBoundingBox?.width || component.width || 0),
    height: Math.max(0, component.absoluteBoundingBox?.height || component.height || 0),
    x: component.absoluteBoundingBox?.x || component.x || 0,
    y: component.absoluteBoundingBox?.y || component.y || 0,
    absoluteBoundingBox: component.absoluteBoundingBox || {
      width: component.width || 0,
      height: component.height || 0,
      x: component.x || 0,
      y: component.y || 0,
    },
  };
  
  // Sanitize text content
  if (component.characters) {
    sanitized.characters = component.characters.substring(0, 500); // Limit text length
    sanitized.hasText = true;
  }
  
  // Sanitize colors
  if (component.fills && Array.isArray(component.fills)) {
    sanitized.fills = component.fills.map(fill => ({
      type: fill.type,
      color: fill.color,
      visible: fill.visible !== false,
    }));
  }
  
  // Sanitize layout properties
  if (component.layoutMode) {
    sanitized.layoutMode = component.layoutMode;
    sanitized.primaryAxisAlignItems = component.primaryAxisAlignItems;
    sanitized.counterAxisAlignItems = component.counterAxisAlignItems;
  }
  
  // Sanitize children (limit depth and count)
  if (component.children && Array.isArray(component.children)) {
    sanitized.children = component.children
      .slice(0, 5) // Limit to 5 children
      .map(child => validateAndSanitizeComponent(child))
      .filter(Boolean);
  }
  
  return sanitized;
};

// Extract responsive design information
export const extractResponsiveInfo = (node) => {
  const responsiveInfo = {
    isResponsive: false,
    breakpoints: [],
    minWidth: null,
    maxWidth: null,
    minHeight: null,
    maxHeight: null
  };

  // Check if component has responsive properties
  if (node.componentProperties) {
    const props = Object.values(node.componentProperties);
    const hasResponsiveProps = props.some(prop => 
      prop.type === 'BOOLEAN' && prop.name && prop.name.toLowerCase().includes('responsive') ||
      prop.type === 'VARIANT' && prop.name && prop.name.toLowerCase().includes('breakpoint')
    );
    
    if (hasResponsiveProps) {
      responsiveInfo.isResponsive = true;
    }
  }

  // Extract size constraints
  if (node.absoluteBoundingBox) {
    const { width, height } = node.absoluteBoundingBox;
    
    // Estimate responsive behavior based on constraints
    if (node.constraints) {
      if (node.constraints.horizontal === 'SCALE') {
        responsiveInfo.minWidth = Math.min(width, 320); // Mobile minimum
        responsiveInfo.maxWidth = Math.max(width, 1200); // Desktop maximum
      }
      if (node.constraints.vertical === 'SCALE') {
        responsiveInfo.minHeight = Math.min(height, 200);
        responsiveInfo.maxHeight = Math.max(height, 800);
      }
    }
  }

  return responsiveInfo;
}; 