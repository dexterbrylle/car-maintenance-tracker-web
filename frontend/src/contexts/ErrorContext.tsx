import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { useToast } from '@/components/ui/toast';

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

  const value: ErrorContextType = {
    showError,
    showSuccess,
    showWarning,
    clearErrors
  };

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