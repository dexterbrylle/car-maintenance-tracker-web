import { createContext, useContext, useCallback, ReactNode, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';
import { setGlobalErrorHandler, displayStoredErrors } from '@/lib/errorHandler';

interface ErrorContextType {
  showError: (error: Error | string, options?: {
    title?: string;
    description?: string;
    variant?: 'default' | 'success' | 'error' | 'warning';
    duration?: number;
    suppressDuplicate?: boolean;
    errorKey?: string;
  }) => void;
  showSuccess: (message: string, options?: {
    title?: string;
    duration?: number;
  }) => void;
  showWarning: (message: string, options?: {
    title?: string;
    duration?: number;
  }) => void;
  clearErrors: () => void;
  
  // Specialized error handlers
  showNetworkError: (error?: Error | string) => void;
  showAuthError: (error?: Error | string) => void;
  showValidationError: (error?: Error | string) => void;
  showServerError: (error?: Error | string) => void;
  showPermissionError: (error?: Error | string) => void;
  showNotFoundError: (error?: Error | string) => void;
  showRateLimitError: (error?: Error | string) => void;
  
  // Success messages
  showOperationSuccess: (operation: string) => void;
  showFormSuccess: (action: string) => void;
  showLoginSuccess: () => void;
  showLogoutSuccess: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorEntry {
  message: string;
  timestamp: number;
  count: number;
}

export function ErrorProvider({ children }: { children: ReactNode }) {
  const { addToast } = useToast();
  const recentErrors = new Map<string, ErrorEntry>();

  const showError = useCallback((error: Error | string, options?: {
    title?: string;
    description?: string;
    variant?: 'default' | 'success' | 'error' | 'warning';
    duration?: number;
    suppressDuplicate?: boolean;
    errorKey?: string;
  }) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorKey = options?.errorKey || errorMessage;
    const now = Date.now();
    
    // Check if we should suppress duplicate errors
    if (options?.suppressDuplicate !== false) {
      const recentError = recentErrors.get(errorKey);
      
      if (recentError && (now - recentError.timestamp) < 5000) {
        // Update count and timestamp but don't show toast
        recentErrors.set(errorKey, {
          message: errorMessage,
          timestamp: now,
          count: recentError.count + 1
        });
        console.warn(`Suppressed duplicate error (${recentError.count + 1}): ${errorMessage}`);
        return;
      }
    }
    
    // Track this error
    recentErrors.set(errorKey, {
      message: errorMessage,
      timestamp: now,
      count: 1
    });
    
    // Clean up old errors (older than 30 seconds)
    recentErrors.forEach((entry, key) => {
      if (now - entry.timestamp > 30000) {
        recentErrors.delete(key);
      }
    });
    
    // Show toast notification
    addToast({
      title: options?.title || 'Error',
      description: options?.description || errorMessage,
      variant: options?.variant || 'error',
      duration: options?.duration
    });
  }, [addToast]);

  const showSuccess = useCallback((message: string, options?: {
    title?: string;
    duration?: number;
  }) => {
    addToast({
      title: options?.title || 'Success',
      description: message,
      variant: 'success',
      duration: options?.duration
    });
  }, [addToast]);

  const showWarning = useCallback((message: string, options?: {
    title?: string;
    duration?: number;
  }) => {
    addToast({
      title: options?.title || 'Warning',
      description: message,
      variant: 'warning',
      duration: options?.duration
    });
  }, [addToast]);

  const clearErrors = useCallback(() => {
    recentErrors.clear();
  }, []);

  // Specialized error handlers
  const showNetworkError = useCallback((error?: Error | string) => {
    const errorMessage = error || 'Network error. Please check your internet connection.';
    showError(errorMessage, {
      title: 'Network Error',
      description: 'Please check your internet connection and try again.',
      errorKey: 'network_error'
    });
  }, [showError]);

  const showAuthError = useCallback((error?: Error | string) => {
    const errorMessage = error || 'Authentication required.';
    showError(errorMessage, {
      title: 'Authentication Error',
      description: 'Please login to continue.',
      errorKey: 'auth_error'
    });
  }, [showError]);

  const showValidationError = useCallback((error?: Error | string) => {
    const errorMessage = error || 'Validation error.';
    showError(errorMessage, {
      title: 'Validation Error',
      description: 'Please check your input and try again.',
      variant: 'warning',
      errorKey: 'validation_error'
    });
  }, [showError]);

  const showServerError = useCallback((error?: Error | string) => {
    const errorMessage = error || 'Server error.';
    showError(errorMessage, {
      title: 'Server Error',
      description: 'Something went wrong on our end. Please try again later.',
      errorKey: 'server_error'
    });
  }, [showError]);

  const showPermissionError = useCallback((error?: Error | string) => {
    const errorMessage = error || 'Permission denied.';
    showError(errorMessage, {
      title: 'Access Denied',
      description: 'You don\'t have permission for this action.',
      errorKey: 'permission_error'
    });
  }, [showError]);

  const showNotFoundError = useCallback((error?: Error | string) => {
    const errorMessage = error || 'Resource not found.';
    showError(errorMessage, {
      title: 'Not Found',
      description: 'The requested resource was not found.',
      errorKey: 'not_found_error'
    });
  }, [showError]);

  const showRateLimitError = useCallback((error?: Error | string) => {
    const errorMessage = error || 'Too many requests.';
    showError(errorMessage, {
      title: 'Too Many Requests',
      description: 'Please wait a moment before trying again.',
      errorKey: 'rate_limit_error'
    });
  }, [showError]);

  // Success message helpers
  const showOperationSuccess = useCallback((operation: string) => {
    showSuccess(`${operation} completed successfully!`, {
      title: 'Success'
    });
  }, [showSuccess]);

  const showFormSuccess = useCallback((action: string) => {
    showSuccess(`${action} successful!`, {
      title: 'Success'
    });
  }, [showSuccess]);

  const showLoginSuccess = useCallback(() => {
    showSuccess('Login successful! Welcome back.', {
      title: 'Welcome Back!'
    });
  }, [showSuccess]);

  const showLogoutSuccess = useCallback(() => {
    showSuccess('You have been logged out successfully.', {
      title: 'Logged Out'
    });
  }, [showSuccess]);

  const value: ErrorContextType = {
    showError,
    showSuccess,
    showWarning,
    clearErrors,
    showNetworkError,
    showAuthError,
    showValidationError,
    showServerError,
    showPermissionError,
    showNotFoundError,
    showRateLimitError,
    showOperationSuccess,
    showFormSuccess,
    showLoginSuccess,
    showLogoutSuccess
  };

  // Initialize global error handler when provider mounts
  useEffect(() => {
    const errorHandlers = { showError, showSuccess, showWarning, clearErrors };
    setGlobalErrorHandler(errorHandlers);
    displayStoredErrors(); // Display any errors that occurred before context was available
    
    // Cleanup on unmount
    return () => {
      setGlobalErrorHandler(null as any);
    };
  }, [showError, showSuccess, showWarning, clearErrors]);

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}