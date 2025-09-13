import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useError } from '@/contexts/ErrorContext';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundaryClass extends Component<Props, State> {
  private static instance: ErrorBoundaryClass | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
    
    // Store instance for global error handling
    ErrorBoundaryClass.instance = this;
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console for debugging
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                We're sorry, but something unexpected happened. Our team has been notified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800 font-medium">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <Button onClick={this.handleReset} variant="outline" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleReload} className="w-full">
                  Reload Page
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                If this problem persists, please contact support or refresh the page.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }

  // Static method to manually trigger error boundary
  static staticHandleError(error: Error) {
    if (ErrorBoundaryClass.instance) {
      ErrorBoundaryClass.instance.componentDidCatch(error, {
        componentStack: 'Manually triggered error'
      });
    }
  }
}

// Global error handler for unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Convert to Error if it's not already
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    
    // Show error using global error handler if available
    if (typeof window !== 'undefined' && (window as any).showGlobalError) {
      (window as any).showGlobalError(error);
    }
    
    // Trigger error boundary if available
    ErrorBoundaryClass.staticHandleError(error);
  });

  // Global error handler for uncaught errors
  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
    
    const error = event.error instanceof Error 
      ? event.error 
      : new Error(String(event.error));
    
    // Show error using global error handler if available
    if (typeof window !== 'undefined' && (window as any).showGlobalError) {
      (window as any).showGlobalError(error);
    }
    
    // Trigger error boundary if available
    ErrorBoundaryClass.staticHandleError(error);
  });
}

// Functional wrapper component
export function ErrorBoundary({ children, fallback }: Props) {
  const { showError } = useError();

  // Set up global error handler when component mounts
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).showGlobalError = (error: Error) => {
        showError(error, {
          title: 'Unexpected Error',
          description: 'An unexpected error occurred. The issue has been logged.',
          errorKey: 'global_error'
        });
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).showGlobalError;
      }
    };
  }, [showError]);

  return <ErrorBoundaryClass fallback={fallback}>{children}</ErrorBoundaryClass>;
}

// Hook to manually trigger error boundary
export function useErrorBoundary() {
  return {
    triggerError: (error: Error) => {
      ErrorBoundaryClass.staticHandleError(error);
    }
  };
}