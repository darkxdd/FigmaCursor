// Accessibility utilities and helpers

/**
 * Generate accessible IDs for form elements
 */
export const generateId = (prefix = 'element') => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * ARIA label helpers
 */
export const getAriaLabel = (action, target) => {
  const actionMap = {
    select: `Select ${target}`,
    delete: `Delete ${target}`,
    edit: `Edit ${target}`,
    view: `View ${target}`,
    download: `Download ${target}`,
    copy: `Copy ${target}`,
    generate: `Generate ${target}`,
    refresh: `Refresh ${target}`,
    toggle: `Toggle ${target}`,
    open: `Open ${target}`,
    close: `Close ${target}`,
  };
  
  return actionMap[action] || `${action} ${target}`;
};

/**
 * Screen reader announcements
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';
  
  document.body.appendChild(announcement);
  announcement.textContent = message;
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Focus management utilities
 */
export const focusManagement = {
  // Store the currently focused element
  storeFocus: () => {
    return document.activeElement;
  },
  
  // Restore focus to a previously stored element
  restoreFocus: (element) => {
    if (element && element.focus) {
      element.focus();
    }
  },
  
  // Focus the first focusable element in a container
  focusFirst: (container) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  },
  
  // Trap focus within a container (for modals, dialogs)
  trapFocus: (container) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleTabKey = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    
    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  },
};

/**
 * Keyboard navigation helpers
 */
export const keyboardNavigation = {
  // Handle arrow key navigation in lists
  handleArrowKeys: (event, items, currentIndex, onSelect) => {
    let newIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowDown':
        newIndex = Math.min(currentIndex + 1, items.length - 1);
        event.preventDefault();
        break;
      case 'ArrowUp':
        newIndex = Math.max(currentIndex - 1, 0);
        event.preventDefault();
        break;
      case 'Home':
        newIndex = 0;
        event.preventDefault();
        break;
      case 'End':
        newIndex = items.length - 1;
        event.preventDefault();
        break;
      case 'Enter':
      case ' ':
        if (onSelect) {
          onSelect(items[currentIndex]);
          event.preventDefault();
        }
        break;
      default:
        return currentIndex;
    }
    
    return newIndex;
  },
  
  // Handle escape key
  handleEscape: (callback) => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        callback();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  },
};

/**
 * Color contrast utilities
 */
export const colorContrast = {
  // Calculate relative luminance
  getLuminance: (r, g, b) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },
  
  // Calculate contrast ratio between two colors
  getContrastRatio: (color1, color2) => {
    const l1 = colorContrast.getLuminance(...color1);
    const l2 = colorContrast.getLuminance(...color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  },
  
  // Check if contrast meets WCAG standards
  meetsWCAG: (color1, color2, level = 'AA') => {
    const ratio = colorContrast.getContrastRatio(color1, color2);
    const standards = {
      'AA': 4.5,
      'AAA': 7,
      'AA-large': 3,
      'AAA-large': 4.5,
    };
    return ratio >= (standards[level] || standards.AA);
  },
};

/**
 * Reduced motion utilities
 */
export const reducedMotion = {
  // Check if user prefers reduced motion
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
  
  // Get appropriate animation duration
  getAnimationDuration: (defaultDuration = 300) => {
    return reducedMotion.prefersReducedMotion() ? 0 : defaultDuration;
  },
  
  // Get appropriate transition
  getTransition: (property = 'all', duration = 300, easing = 'ease') => {
    if (reducedMotion.prefersReducedMotion()) {
      return 'none';
    }
    return `${property} ${duration}ms ${easing}`;
  },
};

/**
 * High contrast mode detection
 */
export const highContrast = {
  // Check if high contrast mode is enabled
  isHighContrastMode: () => {
    return window.matchMedia('(prefers-contrast: high)').matches;
  },
  
  // Get appropriate border styles for high contrast
  getBorderStyle: (defaultStyle = '1px solid transparent') => {
    return highContrast.isHighContrastMode() 
      ? '2px solid currentColor' 
      : defaultStyle;
  },
};

/**
 * Text scaling utilities
 */
export const textScaling = {
  // Check if large text is preferred
  prefersLargeText: () => {
    return window.matchMedia('(prefers-reduced-data: reduce)').matches;
  },
  
  // Get appropriate font size
  getFontSize: (baseFontSize = 16) => {
    const scaleFactor = textScaling.prefersLargeText() ? 1.2 : 1;
    return baseFontSize * scaleFactor;
  },
};

/**
 * Accessibility testing helpers
 */
export const a11yTesting = {
  // Check for missing alt text on images
  checkImageAltText: () => {
    const images = document.querySelectorAll('img');
    const missingAlt = Array.from(images).filter(img => !img.alt);
    if (missingAlt.length > 0) {
      console.warn(`Found ${missingAlt.length} images without alt text:`, missingAlt);
    }
    return missingAlt;
  },
  
  // Check for proper heading hierarchy
  checkHeadingHierarchy: () => {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const levels = Array.from(headings).map(h => parseInt(h.tagName.charAt(1)));
    const issues = [];
    
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] > levels[i - 1] + 1) {
        issues.push(`Heading level jumps from h${levels[i - 1]} to h${levels[i]}`);
      }
    }
    
    if (issues.length > 0) {
      console.warn('Heading hierarchy issues:', issues);
    }
    return issues;
  },
  
  // Check for proper form labels
  checkFormLabels: () => {
    const inputs = document.querySelectorAll('input, select, textarea');
    const unlabeled = Array.from(inputs).filter(input => {
      const hasLabel = document.querySelector(`label[for="${input.id}"]`);
      const hasAriaLabel = input.getAttribute('aria-label');
      const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
      return !hasLabel && !hasAriaLabel && !hasAriaLabelledBy;
    });
    
    if (unlabeled.length > 0) {
      console.warn(`Found ${unlabeled.length} form elements without labels:`, unlabeled);
    }
    return unlabeled;
  },
};

// Export all utilities
export default {
  generateId,
  getAriaLabel,
  announceToScreenReader,
  focusManagement,
  keyboardNavigation,
  colorContrast,
  reducedMotion,
  highContrast,
  textScaling,
  a11yTesting,
};