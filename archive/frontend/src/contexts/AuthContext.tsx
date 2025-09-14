import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { AuthContextType, User, AuthTokens, LoginCredentials, RegisterData, UpdatePasswordData, ForgotPasswordData, ResetPasswordData, SubscriptionTier, SubscriptionStatusInfo } from '@/types/auth';
import { api } from '@/lib/api';
import { useError } from '@/contexts/ErrorContext';

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'car_maintenance_tracker_access_token',
  REFRESH_TOKEN: 'car_maintenance_tracker_refresh_token',
  USER_DATA: 'car_maintenance_tracker_user_data',
  TOKEN_EXPIRY: 'car_maintenance_tracker_token_expiry',
};

// Token refresh buffer (5 minutes before expiry)
const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionStatusInfo | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const { 
  showAuthError, 
  showServerError, 
  showFormSuccess, 
  showLoginSuccess 
} = useError();

  // Store tokens in localStorage
  const storeTokens = useCallback((newTokens: AuthTokens) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newTokens.access_token);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newTokens.refresh_token);
    const expiryTime = Date.now() + (newTokens.expires_in * 1000);
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
    setTokens(newTokens);
  }, []);

  // Clear tokens from localStorage
  const clearTokens = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    setTokens(null);
  }, []);

  // Store user data in localStorage
  const storeUserData = useCallback((userData: User) => {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    setUser(userData);
  }, []);

  // Check if token is expired or needs refresh
  const isTokenExpired = useCallback(() => {
    const expiryTime = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    if (!expiryTime) return true;
    
    const expiry = parseInt(expiryTime, 10);
    return Date.now() >= (expiry - TOKEN_REFRESH_BUFFER);
  }, []);

  // Load user data from localStorage
  const loadUserData = useCallback(() => {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    
    if (userData && accessToken) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        return true;
      } catch (error) {
        console.error('Failed to parse user data:', error);
        return false;
      }
    }
    return false;
  }, []);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      const hasUserData = loadUserData();
      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      
      if (hasUserData && accessToken && !isTokenExpired()) {
        // Token is still valid, refresh subscription info
        try {
          await fetchSubscriptionInfo();
        } catch (error) {
          console.error('Failed to fetch subscription info:', error);
        }
      } else if (accessToken && isTokenExpired()) {
        // Token expired, try to refresh
        const refreshed = await refreshToken();
        if (!refreshed) {
          // Refresh failed, clear authentication state
          await logout();
        }
      } else {
        // No valid authentication found
        clearTokens();
        setUser(null);
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, [loadUserData, isTokenExpired, clearTokens]);

  // Token refresh function
  const refreshToken = useCallback(async (): Promise<boolean> => {
    const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!storedRefreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5005/api'}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: storedRefreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        const newTokens: AuthTokens = {
          access_token: data.access_token,
          refresh_token: data.refresh_token || storedRefreshToken,
          expires_in: data.expires_in || 3600,
          token_type: data.token_type || 'Bearer',
        };
        
        storeTokens(newTokens);
        return true;
      } else {
        // Refresh token is invalid or expired - try to parse error response
        try {
          const errorData = await response.json();
          console.error('Token refresh failed:', errorData.message || 'Unknown error');
        } catch (e) {
          console.error('Token refresh failed: Unable to parse error response');
        }
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }, [storeTokens]);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    
    try {
      const response = await api.auth.login(credentials);
      
      if (response.success && response.data) {
        // Backend returns: {message, user, tokens}
        const user = response.data.user;
        const tokens = response.data.tokens;
        
        if (!user || !tokens) {
          throw new Error('Invalid response format from server');
        }
        
        // Transform user data to match expected User interface
        const transformedUser: User = {
          _id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          full_name: `${user.first_name} ${user.last_name}`,
          is_verified: user.is_verified,
          is_active: true,
          subscription_tier: user.subscription_tier || 'free',
          subscription_status: 'active',
          last_login_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          preferences: user.preferences || {
            notifications: {
              email: true,
              push: true,
              maintenance_reminders: true,
              fuel_alerts: true,
              subscription_reminders: true,
            },
            currency: 'USD',
            distance_unit: 'km',
            fuel_unit: 'L',
            timezone: 'UTC',
            language: 'en',
          },
          limits: {
            max_vehicles: 5,
            max_records_per_vehicle: 1000,
            max_export_records: 5000,
            max_storage_mb: 100,
            features: {
              advanced_analytics: false,
              custom_maintenance_schedules: false,
              multi_vehicle_management: true,
              fuel_performance_insights: true,
              export_customization: false,
              api_access: false,
              priority_support: false,
            },
          },
        };
        
        storeTokens(tokens);
        storeUserData(transformedUser);
        setIsAuthenticated(true);
        
        // Fetch subscription info
        await fetchSubscriptionInfo();
        
        // Show success message
        showLoginSuccess();
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      showAuthError(error as Error | string);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [storeTokens, storeUserData]);

  // Register function
  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    
    try {
      const response = await api.auth.register(data);
      
      if (response.success && response.data) {
        // Backend returns: {message, user, tokens}
        const user = response.data.user;
        const tokens = response.data.tokens;
        
        if (!user || !tokens) {
          throw new Error('Invalid response format from server');
        }
        
        // Transform user data to match expected User interface
        const transformedUser: User = {
          _id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          full_name: `${user.first_name} ${user.last_name}`,
          is_verified: user.is_verified,
          is_active: true,
          subscription_tier: user.subscription_tier || 'free',
          subscription_status: 'active',
          last_login_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          preferences: user.preferences || {
            notifications: {
              email: true,
              push: true,
              maintenance_reminders: true,
              fuel_alerts: true,
              subscription_reminders: true,
            },
            currency: 'USD',
            distance_unit: 'km',
            fuel_unit: 'L',
            timezone: 'UTC',
            language: 'en',
          },
          limits: {
            max_vehicles: 5,
            max_records_per_vehicle: 1000,
            max_export_records: 5000,
            max_storage_mb: 100,
            features: {
              advanced_analytics: false,
              custom_maintenance_schedules: false,
              multi_vehicle_management: true,
              fuel_performance_insights: true,
              export_customization: false,
              api_access: false,
              priority_support: false,
            },
          },
        };
        
        storeTokens(tokens);
        storeUserData(transformedUser);
        setIsAuthenticated(true);
        
        // Fetch subscription info
        await fetchSubscriptionInfo();
        
        // Show success message
        showFormSuccess('Account created');
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: unknown) {
      console.error('Registration error:', error);
      showAuthError(error as Error | string);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [storeTokens, storeUserData]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to invalidate refresh token
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (refreshToken) {
        await api.auth.logout({ refresh_token: refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call success
      clearTokens();
      setUser(null);
      setIsAuthenticated(false);
      setSubscription(null);
    }
  }, [clearTokens]);

  // Update profile function
  const updateProfile = useCallback(async (data: Partial<User>) => {
    if (!user) return;
    
    try {
      const response = await api.auth.updateProfile(data);
      
      if (response.success && response.data) {
        const updatedUser = { ...user, ...response.data };
        storeUserData(updatedUser);
        showFormSuccess('Profile updated');
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error: unknown) {
      console.error('Profile update error:', error);
      showServerError(error as Error | string);
      throw error;
    }
  }, [user, storeUserData]);

  // Change password function
  const changePassword = useCallback(async (data: UpdatePasswordData) => {
    try {
      const response = await api.auth.changePassword(data);
      
      if (!response.success) {
        throw new Error(response.message || 'Password change failed');
      }
    } catch (error) {
      console.error('Password change error:', error);
      
      // Transform error to user-friendly message
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes('Current password is incorrect')) {
          throw new Error('Current password is incorrect. Please try again.');
        } else if (errorMessage.includes('Unable to change password')) {
          throw new Error('Unable to change password. Please try again later.');
        } else if (errorMessage.includes('Password change failed')) {
          throw new Error('Failed to change password. Please ensure your new password meets the requirements.');
        } else if (errorMessage.includes('VALIDATION_ERROR')) {
          throw new Error('Password validation failed. Please ensure your password meets all requirements.');
        }
        throw error;
      }
      throw new Error('An unexpected error occurred while changing your password.');
    }
  }, []);

  // Forgot password function
  const forgotPassword = useCallback(async (data: ForgotPasswordData) => {
    try {
      const response = await api.auth.forgotPassword(data);
      
      if (!response.success) {
        throw new Error(response.message || 'Password reset request failed');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      
      // Transform error to user-friendly message
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes('Unable to process your password reset request')) {
          throw new Error('Unable to process your password reset request. Please try again later.');
        } else if (errorMessage.includes('Password reset request failed')) {
          throw new Error('Failed to send password reset email. Please check your email address and try again.');
        } else if (errorMessage.includes('Please enter a valid email address')) {
          throw new Error('Please enter a valid email address.');
        }
        throw error;
      }
      throw new Error('An unexpected error occurred while requesting password reset.');
    }
  }, []);

  // Reset password function
  const resetPassword = useCallback(async (data: ResetPasswordData) => {
    try {
      const response = await api.auth.resetPassword(data);
      
      if (response.success && response.data) {
        const { user, tokens } = response.data;
        
        // Transform user data to match expected User interface
        const transformedUser: User = {
          _id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          full_name: `${user.first_name} ${user.last_name}`,
          is_verified: user.is_verified,
          is_active: true,
          subscription_tier: user.subscription_tier || 'free',
          subscription_status: 'active',
          last_login_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          preferences: user.preferences || {
            notifications: {
              email: true,
              push: true,
              maintenance_reminders: true,
              fuel_alerts: true,
              subscription_reminders: true,
            },
            currency: 'USD',
            distance_unit: 'km',
            fuel_unit: 'L',
            timezone: 'UTC',
            language: 'en',
          },
          limits: {
            max_vehicles: 5,
            max_records_per_vehicle: 1000,
            max_export_records: 5000,
            max_storage_mb: 100,
            features: {
              advanced_analytics: false,
              custom_maintenance_schedules: false,
              multi_vehicle_management: true,
              fuel_performance_insights: true,
              export_customization: false,
              api_access: false,
              priority_support: false,
            },
          },
        };
        
        storeTokens(tokens);
        storeUserData(transformedUser);
        setIsAuthenticated(true);
        
        // Fetch subscription info
        await fetchSubscriptionInfo();
      } else {
        throw new Error(response.message || 'Password reset failed');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      
      // Transform error to user-friendly message
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes('Invalid or expired reset token')) {
          throw new Error('Invalid or expired reset token. Please request a new password reset email.');
        } else if (errorMessage.includes('Reset token has expired')) {
          throw new Error('Reset token has expired. Please request a new password reset email.');
        } else if (errorMessage.includes('Unable to reset your password')) {
          throw new Error('Unable to reset your password. Please try again later.');
        } else if (errorMessage.includes('Password reset failed')) {
          throw new Error('Failed to reset password. Please ensure your new password meets the requirements.');
        }
        throw error;
      }
      throw new Error('An unexpected error occurred while resetting your password.');
    }
  }, [storeTokens, storeUserData]);

  // Verify email function
  const verifyEmail = useCallback(async (token: string) => {
    try {
      const response = await api.auth.verifyEmail({ token });
      
      if (response.success && response.data && user) {
        const updatedUser = { ...user, is_verified: true };
        storeUserData(updatedUser);
      } else {
        throw new Error(response.message || 'Email verification failed');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }, [user, storeUserData]);

  // Request email verification
  const requestEmailVerification = useCallback(async () => {
    try {
      const response = await api.auth.requestEmailVerification();
      
      if (!response.success) {
        throw new Error(response.message || 'Email verification request failed');
      }
    } catch (error) {
      console.error('Email verification request error:', error);
      throw error;
    }
  }, []);

  // Fetch subscription info
  const fetchSubscriptionInfo = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await api.auth.getSubscription();
      
      if (response.success && response.data) {
        setSubscription(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription info:', error);
    }
  }, [user]);

  // Update subscription
  const updateSubscription = useCallback(async (tier: SubscriptionTier) => {
    try {
      const response = await api.auth.updateSubscription({ tier });
      
      if (response.success && response.data) {
        setSubscription(response.data);
        
        // Update user subscription tier
        if (user) {
          const updatedUser = { ...user, subscription_tier: tier };
          storeUserData(updatedUser);
        }
      } else {
        throw new Error(response.message || 'Subscription update failed');
      }
    } catch (error) {
      console.error('Subscription update error:', error);
      throw error;
    }
  }, [user, storeUserData]);

  // Cancel subscription
  const cancelSubscription = useCallback(async () => {
    try {
      const response = await api.auth.cancelSubscription();
      
      if (response.success && response.data) {
        setSubscription(response.data);
      } else {
        throw new Error(response.message || 'Subscription cancellation failed');
      }
    } catch (error) {
      console.error('Subscription cancellation error:', error);
      throw error;
    }
  }, []);

  // Reactivate subscription
  const reactivateSubscription = useCallback(async () => {
    try {
      const response = await api.auth.reactivateSubscription();
      
      if (response.success && response.data) {
        setSubscription(response.data);
      } else {
        throw new Error(response.message || 'Subscription reactivation failed');
      }
    } catch (error) {
      console.error('Subscription reactivation error:', error);
      throw error;
    }
  }, []);

  // Set up token refresh timer
  useEffect(() => {
    if (!tokens || !isAuthenticated) return;

    const checkTokenExpiry = () => {
      if (isTokenExpired()) {
        refreshToken();
      }
    };

    // Check every minute
    const interval = setInterval(checkTokenExpiry, 60000);

    return () => clearInterval(interval);
  }, [tokens, isAuthenticated, isTokenExpired, refreshToken]);

  // Set up inactivity timeout
  useEffect(() => {
    if (!isAuthenticated) return;

    let inactivityTimer: ReturnType<typeof setTimeout>;
    
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        // Auto-logout after 30 minutes of inactivity
        logout();
      }, 30 * 60 * 1000); // 30 minutes
    };

    // Listen for user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });

    resetInactivityTimer();

    return () => {
      clearTimeout(inactivityTimer);
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer, true);
      });
    };
  }, [isAuthenticated, logout]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    subscription,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    requestEmailVerification,
    updateSubscription,
    cancelSubscription,
    reactivateSubscription,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Hook to check subscription features
export const useSubscription = () => {
  const { subscription, user } = useAuth();
  
  const hasFeature = (feature: string) => {
    if (!subscription || !user) return false;
    
    const limits = user.limits;
    return limits.features[feature as keyof typeof limits.features] || false;
  };

  const canAddVehicle = () => {
    if (!subscription || !user) return false;
    return subscription.usage.vehicles_count < user.limits.max_vehicles;
  };

  const canAddRecord = () => {
    if (!subscription || !user) return false;
    return subscription.usage.total_records < user.limits.max_records_per_vehicle;
  };

  const getUsagePercentage = () => {
    if (!subscription || !user) return 0;
    return (subscription.usage.storage_used_mb / user.limits.max_storage_mb) * 100;
  };

  return {
    subscription,
    hasFeature,
    canAddVehicle,
    canAddRecord,
    getUsagePercentage,
    isPremium: user?.subscription_tier === 'premium' || user?.subscription_tier === 'enterprise',
    isBasic: user?.subscription_tier === 'basic',
    isFree: user?.subscription_tier === 'free',
  };
};