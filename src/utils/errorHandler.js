// Comprehensive error handling and user feedback system

// Error categories for better classification
export const ERROR_CATEGORIES = {
  NETWORK: 'network',
  API: 'api',
  VALIDATION: 'validation',
  PROCESSING: 'processing',
  USER_INPUT: 'user_input',
  SYSTEM: 'system',
  RATE_LIMIT: 'rate_limit',
  AUTHENTICATION: 'authentication',
  PERMISSION: 'permission',
  TIMEOUT: 'timeout',
};

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// User-friendly error messages with recovery suggestions
const ERROR_MESSAGES = {
  // Figma API Errors
  FIGMA_INVALID_TOKEN: {
    title: 'Invalid Figma Token',
    message: 'Your Figma access token is invalid or has expired.',
    suggestions: [
      'Check that you copied the token correctly',
      'Generate a new token from Figma Settings > Account > Personal access tokens',
      'Make sure the token has the required permissions'
    ],
    category: ERROR_CATEGORIES.AUTHENTICATION,
    severity: ERROR_SEVERITY.HIGH,
    recoverable: true,
  },
  
  FIGMA_FILE_NOT_FOUND: {
    title: 'Figma File Not Found',
    message: 'The Figma file could not be found or accessed.',
    suggestions: [
      'Check that the file URL is correct',
      'Make sure the file is shared publicly or with your account',
      'Verify that the file hasn\'t been deleted or moved'
    ],
    category: ERROR_CATEGORIES.API,
    severity: ERROR_SEVERITY.HIGH,
    recoverable: true,
  },
  
  FIGMA_RATE_LIMIT: {
    title: 'Rate Limit Exceeded',
    message: 'Too many requests to Figma API. Please wait before trying again.',
    suggestions: [
      'Wait 1-2 minutes before making another request',
      'Try processing fewer components at once',
      'Consider upgrading your Figma plan for higher rate limits'
    ],
    category: ERROR_CATEGORIES.RATE_LIMIT,
    severity: ERROR_SEVERITY.MEDIUM,
    recoverable: true,
    retryAfter: 60000, // 1 minute
  },
  
  FIGMA_NETWORK_ERROR: {
    title: 'Network Connection Error',
    message: 'Unable to connect to Figma servers.',
    suggestions: [
      'Check your internet connection',
      'Try again in a few moments',
      'Check if Figma services are experiencing issues'
    ],
    category: ERROR_CATEGORIES.NETWORK,
    severity: ERROR_SEVERITY.MEDIUM,
    recoverable: true,
  },
  
  // Gemini API Errors
  GEMINI_INVALID_KEY: {
    title: 'Invalid Gemini API Key',
    message: 'Your Gemini API key is missing or invalid.',
    suggestions: [
      'Add your Gemini API key to the .env file as VITE_GEMINI_API_KEY',
      'Get a new API key from Google AI Studio',
      'Make sure the key has the required permissions'
    ],
    category: ERROR_CATEGORIES.AUTHENTICATION,
    severity: ERROR_SEVERITY.CRITICAL,
    recoverable: true,
  },
  
  GEMINI_RATE_LIMIT: {
    title: 'AI Generation Rate Limit',
    message: 'Too many requests to the AI service. Please wait before generating more code.',
    suggestions: [
      'Wait a few minutes before generating another component',
      'Try generating simpler components',
      'Consider upgrading your API plan for higher limits'
    ],
    category: ERROR_CATEGORIES.RATE_LIMIT,
    severity: ERROR_SEVERITY.MEDIUM,
    recoverable: true,
    retryAfter: 120000, // 2 minutes
  },
  
  GEMINI_SAFETY_FILTER: {
    title: 'Content Blocked by Safety Filters',
    message: 'The AI service blocked the content due to safety policies.',
    suggestions: [
      'Try using different component names',
      'Remove any potentially problematic text content',
      'Simplify the design or component structure'
    ],
    category: ERROR_CATEGORIES.PROCESSING,
    severity: ERROR_SEVERITY.MEDIUM,
    recoverable: true,
  },
  
  GEMINI_TOKEN_LIMIT: {
    title: 'Component Too Complex',
    message: 'The component is too complex to process within current limits.',
    suggestions: [
      'Break the component into smaller parts',
      'Remove some child elements',
      'Simplify the design structure'
    ],
    category: ERROR_CATEGORIES.PROCESSING,
    severity: ERROR_SEVERITY.MEDIUM,
    recoverable: true,
  },
  
  // Processing Errors
  INVALID_COMPONENT_DATA: {
    title: 'Invalid Component Data',
    message: 'The component data from Figma is incomplete or corrupted.',
    suggestions: [
      'Try refreshing the Figma file',
      'Select a different component',
      'Check if the component has the required properties'
    ],
    category: ERROR_CATEGORIES.VALIDATION,
    severity: ERROR_SEVERITY.MEDIUM,
    recoverable: true,
  },
  
  CODE_GENERATION_FAILED: {
    title: 'Code Generation Failed',
    message: 'Unable to generate React code for this component.',
    suggestions: [
      'Try a simpler component first',
      'Check your internet connection',
      'Try again in a few moments'
    ],
    category: ERROR_CATEGORIES.PROCESSING,
    severity: ERROR_SEVERITY.HIGH,
    recoverable: true,
  },
  
  // User Input Errors
  INVALID_FIGMA_URL: {
    title: 'Invalid Figma URL',
    message: 'The Figma URL format is not recognized.',
    suggestions: [
      'Copy the URL directly from your browser while viewing the Figma file',
      'Make sure the URL contains the file ID',
      'Example: https://www.figma.com/file/ABC123/Your-File-Name'
    ],
    category: ERROR_CATEGORIES.USER_INPUT,
    severity: ERROR_SEVERITY.LOW,
    recoverable: true,
  },
  
  EMPTY_TOKEN: {
    title: 'Missing Access Token',
    message: 'Please provide your Figma access token.',
    suggestions: [
      'Get your token from Figma Settings > Account > Personal access tokens',
      'Copy and paste the token into the input field',
      'Make sure the token has file read permissions'
    ],
    category: ERROR_CATEGORIES.USER_INPUT,
    severity: ERROR_SEVERITY.LOW,
    recoverable: true,
  },
  
  // System Errors
  MEMORY_ERROR: {
    title: 'Memory Limit Exceeded',
    message: 'The file is too large to process in your browser.',
    suggestions: [
      'Try processing fewer components at once',
      'Close other browser tabs to free up memory',
      'Try with a smaller Figma file'
    ],
    category: ERROR_CATEGORIES.SYSTEM,
    severity: ERROR_SEVERITY.HIGH,
    recoverable: false,
  },
  
  TIMEOUT_ERROR: {
    title: 'Request Timeout',
    message: 'The operation took too long to complete.',
    suggestions: [
      'Try again with a simpler component',
      'Check your internet connection speed',
      'The server might be experiencing high load'
    ],
    category: ERROR_CATEGORIES.TIMEOUT,
    severity: ERROR_SEVERITY.MEDIUM,
    recoverable: true,
  },
};

// Enhanced error class with additional context
export class AppError extends Error {
  constructor(type, originalError = null, context = {}) {
    const errorInfo = ERROR_MESSAGES[type] || {
      title: 'Unknown Error',
      message: 'An unexpected error occurred.',
      suggestions: ['Try refreshing the page', 'Contact support if the problem persists'],
      category: ERROR_CATEGORIES.SYSTEM,
      severity: ERROR_SEVERITY.MEDIUM,
      recoverable: false,
    };
    
    super(errorInfo.message);
    
    this.name = 'AppError';
    this.type = type;
    this.title = errorInfo.title;
    this.suggestions = errorInfo.suggestions;
    this.category = errorInfo.category;
    this.severity = errorInfo.severity;
    this.recoverable = errorInfo.recoverable;
    this.retryAfter = errorInfo.retryAfter;
    this.originalError = originalError;
    this.context = context;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
  
  // Convert to user-friendly object for UI display
  toUserFriendly() {
    return {
      title: this.title,
      message: this.message,
      suggestions: this.suggestions,
      severity: this.severity,
      recoverable: this.recoverable,
      retryAfter: this.retryAfter,
      category: this.category,
    };
  }
  
  // Convert to detailed object for logging
  toDetailed() {
    return {
      type: this.type,
      title: this.title,
      message: this.message,
      category: this.category,
      severity: this.severity,
      recoverable: this.recoverable,
      retryAfter: this.retryAfter,
      context: this.context,
      timestamp: this.timestamp,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack,
      } : null,
      stack: this.stack,
    };
  }
}

// Error classification helper
export const classifyError = (error, context = {}) => {
  if (error instanceof AppError) {
    return error;
  }
  
  const message = error.message || error.toString();
  const status = error.response?.status || error.status;
  
  // Figma API errors
  if (message.includes('Figma') || context.source === 'figma') {
    if (status === 401 || message.includes('Invalid Figma access token')) {
      return new AppError('FIGMA_INVALID_TOKEN', error, context);
    }
    if (status === 404 || message.includes('file not found')) {
      return new AppError('FIGMA_FILE_NOT_FOUND', error, context);
    }
    if (status === 429 || message.includes('Rate limit')) {
      return new AppError('FIGMA_RATE_LIMIT', error, context);
    }
    if (error.code === 'NETWORK_ERROR' || message.includes('Network error')) {
      return new AppError('FIGMA_NETWORK_ERROR', error, context);
    }
  }
  
  // Gemini API errors
  if (message.includes('Gemini') || message.includes('API key') || context.source === 'gemini') {
    if (message.includes('API key not found') || message.includes('invalid API key')) {
      return new AppError('GEMINI_INVALID_KEY', error, context);
    }
    if (message.includes('Rate limit') || status === 429) {
      return new AppError('GEMINI_RATE_LIMIT', error, context);
    }
    if (message.includes('safety filters')) {
      return new AppError('GEMINI_SAFETY_FILTER', error, context);
    }
    if (message.includes('token limit') || message.includes('too complex')) {
      return new AppError('GEMINI_TOKEN_LIMIT', error, context);
    }
  }
  
  // User input errors
  if (message.includes('Invalid Figma URL') || message.includes('file key')) {
    return new AppError('INVALID_FIGMA_URL', error, context);
  }
  if (message.includes('Access token') && message.includes('required')) {
    return new AppError('EMPTY_TOKEN', error, context);
  }
  
  // Processing errors
  if (message.includes('Invalid component') || message.includes('metadata')) {
    return new AppError('INVALID_COMPONENT_DATA', error, context);
  }
  if (message.includes('Failed to generate') || message.includes('generation failed')) {
    return new AppError('CODE_GENERATION_FAILED', error, context);
  }
  
  // System errors
  if (message.includes('memory') || message.includes('out of memory')) {
    return new AppError('MEMORY_ERROR', error, context);
  }
  if (message.includes('timeout') || error.code === 'ECONNABORTED') {
    return new AppError('TIMEOUT_ERROR', error, context);
  }
  
  // Default to generic system error
  return new AppError('SYSTEM_ERROR', error, context);
};

// Error logging utility
export const logError = (error, context = {}) => {
  const appError = error instanceof AppError ? error : classifyError(error, context);
  const detailed = appError.toDetailed();
  
  // Log to console in development
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    console.group(`🚨 ${detailed.severity.toUpperCase()} ERROR: ${detailed.title}`);
    console.error('Message:', detailed.message);
    console.error('Category:', detailed.category);
    console.error('Context:', detailed.context);
    if (detailed.originalError) {
      console.error('Original Error:', detailed.originalError);
    }
    console.error('Stack:', detailed.stack);
    console.groupEnd();
  }
  
  // In production, you might want to send to an error tracking service
  // Example: Sentry, LogRocket, etc.
  if (typeof import.meta !== 'undefined' && import.meta.env?.PROD && detailed.severity === ERROR_SEVERITY.CRITICAL) {
    // sendToErrorTracking(detailed);
  }
  
  return appError;
};

// Recovery suggestion helper
export const getRecoverySuggestions = (error) => {
  const appError = error instanceof AppError ? error : classifyError(error);
  return {
    canRecover: appError.recoverable,
    suggestions: appError.suggestions,
    retryAfter: appError.retryAfter,
    severity: appError.severity,
  };
};

// Retry helper with exponential backoff
export const withRetry = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = (error) => {
      const appError = classifyError(error);
      return appError.recoverable && appError.category !== ERROR_CATEGORIES.USER_INPUT;
    }
  } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries || !retryCondition(error)) {
        throw logError(error, { attempt: attempt + 1, maxRetries: maxRetries + 1 });
      }
      
      const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay);
      console.log(`Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw logError(lastError, { attempt: maxRetries + 1, maxRetries: maxRetries + 1 });
};