import { ErrorContextType } from '@/contexts/ErrorContext';

// Global error handler instance for non-React environments
let globalErrorHandler: ErrorContextType | null = null;

// Set the global error handler (called from React components)
export function setGlobalErrorHandler(handler: ErrorContextType) {
  globalErrorHandler = handler;
}

// Get user-friendly error messages for common error types
export function getUserFriendlyErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.response?.data?.message) {
    const apiMessage = error.response.data.message;
    
    // Transform technical API messages to user-friendly ones
    if (apiMessage.includes('Invalid email or password')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (apiMessage.includes('Unauthorized') || apiMessage.includes('unauthorized')) {
      return 'Authentication required. Please login again.';
    }
    if (apiMessage.includes('Network Error') || error.message?.includes('Network Error')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    if (apiMessage.includes('timeout') || error.message?.includes('timeout')) {
      return 'Request timeout. Please try again.';
    }
    if (apiMessage.includes('Unable to process your login')) {
      return 'Unable to process your login request. Please try again later.';
    }
    if (apiMessage.includes('Invalid request format')) {
      return 'Invalid request format. Please refresh the page and try again.';
    }
    if (apiMessage.includes('Rate limit exceeded')) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    if (apiMessage.includes('Server error') || error.response?.status >= 500) {
      return 'Server error. Please try again later.';
    }
    if (apiMessage.includes('Not found') || error.response?.status === 404) {
      return 'The requested resource was not found.';
    }
    if (apiMessage.includes('Forbidden') || error.response?.status === 403) {
      return 'Access denied. You don\'t have permission for this action.';
    }
    
    return apiMessage;
  }
  
  if (error?.message) {
    if (error.message.includes('Network Error')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    if (error.message.includes('timeout')) {
      return 'Request timeout. Please try again.';
    }
    if (error.message.includes('Invalid response format from server')) {
      return 'Server response error. Please try again later.';
    }
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again later.';
}

// Get error title based on error type
export function getErrorTitle(error: any): string {
  if (error?.response?.status === 401) {
    return 'Authentication Required';
  }
  if (error?.response?.status === 403) {
    return 'Access Denied';
  }
  if (error?.response?.status === 404) {
    return 'Not Found';
  }
  if (error?.response?.status === 429) {
    return 'Rate Limited';
  }
  if (error?.response?.status >= 500) {
    return 'Server Error';
  }
  if (error?.code === 'ECONNABORTED') {
    return 'Request Timeout';
  }
  return 'Error';
}

// Global error handling function that works both inside and outside React components
export function showErrorToast(error: any, options?: {
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  duration?: number;
  suppressDuplicate?: boolean;
  errorKey?: string;
}) {
  const userFriendlyMessage = getUserFriendlyErrorMessage(error);
  const errorTitle = options?.title || getErrorTitle(error);
  
  if (globalErrorHandler) {
    // Inside React component
    globalErrorHandler.showError(error, {
      title: errorTitle,
      description: options?.description || userFriendlyMessage,
      variant: options?.variant || 'error',
      duration: options?.duration,
      suppressDuplicate: options?.suppressDuplicate,
      errorKey: options?.errorKey
    });
  } else {
    // Outside React component - log to console as fallback
    console.error('Error:', error);
    console.error('User-friendly message:', userFriendlyMessage);
    
    // Store error for later display if React context becomes available
    storeErrorForLaterDisplay(error, {
      title: errorTitle,
      description: userFriendlyMessage,
      variant: 'error'
    });
  }
}

// Store errors for later display when React context is available
const storedErrors: Array<{
  error: any;
  options: Parameters<typeof showErrorToast>[1];
  timestamp: number;
}> = [];

function storeErrorForLaterDisplay(error: any, options: Parameters<typeof showErrorToast>[1]) {
  storedErrors.push({
    error,
    options,
    timestamp: Date.now()
  });
  
  // Clean up old errors (older than 5 minutes)
  const now = Date.now();
  while (storedErrors.length > 0 && now - storedErrors[0].timestamp > 300000) {
    storedErrors.shift();
  }
}

// Display any stored errors when React context becomes available
export function displayStoredErrors() {
  if (!globalErrorHandler || storedErrors.length === 0) return;
  
  const now = Date.now();
  const recentErrors = storedErrors.filter(error => now - error.timestamp < 300000);
  
  recentErrors.forEach(({ error, options }) => {
    globalErrorHandler!.showError(error, options);
  });
  
  // Clear displayed errors
  storedErrors.length = 0;
}

// Specialized error handlers for common scenarios
export const errorHandlers = {
  // Authentication errors
  auth: (error: any) => {
    if (globalErrorHandler && globalErrorHandler.showAuthError) {
      globalErrorHandler.showAuthError(error);
    } else {
      showErrorToast(error, {
        title: 'Authentication Error',
        errorKey: 'auth_error'
      });
    }
  },
  
  // Network errors
  network: (error: any) => {
    if (globalErrorHandler && globalErrorHandler.showNetworkError) {
      globalErrorHandler.showNetworkError(error);
    } else {
      showErrorToast(error, {
        title: 'Network Error',
        errorKey: 'network_error'
      });
    }
  },
  
  // Server errors
  server: (error: any) => {
    if (globalErrorHandler && globalErrorHandler.showServerError) {
      globalErrorHandler.showServerError(error);
    } else {
      showErrorToast(error, {
        title: 'Server Error',
        errorKey: 'server_error'
      });
    }
  },
  
  // Validation errors
  validation: (error: any) => {
    if (globalErrorHandler && globalErrorHandler.showValidationError) {
      globalErrorHandler.showValidationError(error);
    } else {
      showErrorToast(error, {
        title: 'Validation Error',
        variant: 'warning',
        errorKey: 'validation_error'
      });
    }
  },
  
  // Permission errors
  permission: (error: any) => {
    if (globalErrorHandler && globalErrorHandler.showPermissionError) {
      globalErrorHandler.showPermissionError(error);
    } else {
      showErrorToast(error, {
        title: 'Permission Denied',
        errorKey: 'permission_error'
      });
    }
  },
  
  // Not found errors
  notFound: (error: any) => {
    if (globalErrorHandler && globalErrorHandler.showNotFoundError) {
      globalErrorHandler.showNotFoundError(error);
    } else {
      showErrorToast(error, {
        title: 'Not Found',
        errorKey: 'not_found_error'
      });
    }
  },
  
  // Rate limit errors
  rateLimit: (error: any) => {
    if (globalErrorHandler && globalErrorHandler.showRateLimitError) {
      globalErrorHandler.showRateLimitError(error);
    } else {
      showErrorToast(error, {
        title: 'Too Many Requests',
        description: 'Please wait a moment before trying again.',
        errorKey: 'rate_limit_error'
      });
    }
  },
  
  // Generic API error
  api: (error: any) => showErrorToast(error, {
    errorKey: 'api_error'
  })
};