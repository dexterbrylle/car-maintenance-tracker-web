import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredTier?: 'free' | 'basic' | 'premium' | 'enterprise';
  requiredFeatures?: string[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * ProtectedRoute component that checks authentication and subscription requirements
 * before rendering children. Redirects to login if not authenticated or to upgrade
 * page if subscription requirements are not met.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredTier = 'free',
  requiredFeatures = [],
  redirectTo = '/login',
  fallback,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { subscription } = useSubscription();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // Show custom fallback if provided and not authenticated
  if (!isAuthenticated && fallback) {
    return <>{fallback}</>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the attempted location for redirect after login
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check subscription tier requirements
  if (user && requiredTier !== 'free') {
    const tierHierarchy = {
      free: 0,
      basic: 1,
      premium: 2,
      enterprise: 3,
    };

    const userTierLevel = tierHierarchy[user.subscription_tier] || 0;
    const requiredTierLevel = tierHierarchy[requiredTier];

    if (userTierLevel < requiredTierLevel) {
      return <Navigate to="/upgrade" state={{ requiredTier, from: location }} replace />;
    }
  }

  // Check feature requirements
  if (requiredFeatures.length > 0 && user) {
    const missingFeatures = requiredFeatures.filter(feature => {
      return !user.limits.features[feature as keyof typeof user.limits.features];
    });

    if (missingFeatures.length > 0) {
      return <Navigate to="/upgrade" state={{ requiredFeatures: missingFeatures, from: location }} replace />;
    }
  }

  // All checks passed, render children
  return <>{children}</>;
};

/**
 * Higher-order component to protect routes
 */
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

/**
 * Hook to check if user has access to a specific feature
 */
export const useFeatureAccess = (feature: string) => {
  const { user } = useAuth();
  
  if (!user) {
    return {
      hasAccess: false,
      reason: 'Not authenticated',
      upgradeRequired: null,
    };
  }

  const hasFeatureAccess = user.limits.features[feature as keyof typeof user.limits.features];

  if (!hasFeatureAccess) {
    // Determine which tier is required for this feature
    let requiredTier: string | null = null;
    
    // This would be better handled with a feature-to-tier mapping
    // For now, we'll assume premium features require premium tier
    if (['advanced_analytics', 'custom_maintenance_schedules', 'api_access'].includes(feature)) {
      requiredTier = 'premium';
    } else if (['multi_vehicle_management', 'priority_support'].includes(feature)) {
      requiredTier = 'basic';
    }

    return {
      hasAccess: false,
      reason: `Feature requires ${requiredTier} subscription`,
      upgradeRequired: requiredTier,
    };
  }

  return {
    hasAccess: true,
    reason: null,
    upgradeRequired: null,
  };
};

/**
 * Hook to check subscription limits and usage
 */
export const useSubscriptionLimits = () => {
  const { user } = useAuth();
  const { subscription } = useSubscription();

  if (!user || !subscription) {
    return {
      canAddVehicle: false,
      canAddRecord: false,
      vehicleLimit: 0,
      recordLimit: 0,
      vehicleUsage: 0,
      recordUsage: 0,
      vehiclePercentage: 0,
      recordPercentage: 0,
      storagePercentage: 0,
      isNearLimit: false,
      isAtLimit: false,
    };
  }

  const vehicleUsage = subscription.usage.vehicles_count;
  const recordUsage = subscription.usage.total_records;
  const storageUsage = subscription.usage.storage_used_mb;

  const vehicleLimit = user.limits.max_vehicles;
  const recordLimit = user.limits.max_records_per_vehicle;
  const storageLimit = user.limits.max_storage_mb;

  const vehiclePercentage = (vehicleUsage / vehicleLimit) * 100;
  const recordPercentage = (recordUsage / recordLimit) * 100;
  const storagePercentage = (storageUsage / storageLimit) * 100;

  const isNearLimit = vehiclePercentage > 80 || recordPercentage > 80 || storagePercentage > 80;
  const isAtLimit = vehicleUsage >= vehicleLimit || recordUsage >= recordLimit || storageUsage >= storageLimit;

  return {
    canAddVehicle: vehicleUsage < vehicleLimit,
    canAddRecord: recordUsage < recordLimit,
    vehicleLimit,
    recordLimit,
    vehicleUsage,
    recordUsage,
    vehiclePercentage,
    recordPercentage,
    storagePercentage,
    isNearLimit,
    isAtLimit,
  };
};

/**
 * Component to show upgrade prompts when limits are approached
 */
export const UpgradePrompt: React.FC<{ feature?: string; compact?: boolean }> = ({ 
  feature, 
  compact = false 
}) => {
  const { hasAccess, reason, upgradeRequired } = useFeatureAccess(feature || '');
  
  if (hasAccess) {
    return null;
  }

  if (compact) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          {reason}{' '}
          <a href="/upgrade" className="font-medium text-yellow-600 hover:text-yellow-500">
            Upgrade now
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Upgrade Required
          </h3>
          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            <p>{reason}</p>
          </div>
          <div className="mt-4">
            <a
              href="/upgrade"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              {upgradeRequired ? `Upgrade to ${upgradeRequired}` : 'Upgrade Now'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Component to show usage limits and warnings
 */
export const UsageLimits: React.FC = () => {
  const limits = useSubscriptionLimits();

  if (limits.isAtLimit) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Usage Limit Reached
            </h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>
                You've reached your usage limits. Upgrade your plan to continue using all features.
              </p>
            </div>
            <div className="mt-4">
              <a
                href="/upgrade"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Upgrade Now
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (limits.isNearLimit) {
    return (
      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
              Approaching Usage Limits
            </h3>
            <div className="mt-2 text-sm text-orange-700 dark:text-orange-300">
              <p>
                You're approaching your usage limits. Consider upgrading to avoid interruptions.
              </p>
            </div>
            <div className="mt-4">
              <a
                href="/upgrade"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                View Plans
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ProtectedRoute;