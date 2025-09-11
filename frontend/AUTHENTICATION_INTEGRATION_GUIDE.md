# Frontend Authentication Integration Guide

This guide provides detailed instructions for integrating authentication and subscription features into the Car Maintenance Tracker React/TypeScript application.

## Overview

The authentication system includes:
- JWT token management with automatic refresh
- Subscription tier management
- Protected routes with feature-based access control
- Mobile-optimized authentication components
- Enhanced API client with automatic authentication headers

## File Structure

```
frontend/src/
├── types/
│   ├── auth.ts                 # Authentication and subscription types
│   └── index.ts                # Updated to export auth types
├── contexts/
│   └── AuthContext.tsx         # Authentication context with JWT management
├── lib/
│   ├── auth.ts                 # Authentication utility functions
│   └── api.ts                 # Enhanced API client with auth support
├── components/
│   └── auth/
│       └── ProtectedRoute.tsx  # Route protection and subscription checks
├── components/mobile/auth/
│   ├── MobileLogin.tsx         # Mobile login component
│   └── MobileRegister.tsx      # Mobile register component
└── pages/
    ├── Login.tsx               # Login page
    ├── Register.tsx            # Register page
    ├── ForgotPassword.tsx      # Forgot password page
    └── ResetPassword.tsx       # Reset password page
```

## 1. TypeScript Integration

### Using Authentication Types

```typescript
import { User, AuthContextType, SubscriptionTier } from '@/types/auth';

// Use in components
const { user, isAuthenticated } = useAuth();
const { hasFeature, isPremium } = useSubscription();

// Check subscription tier
if (user?.subscription_tier === 'premium') {
  // Premium features available
}

// Check specific features
if (hasFeature('advanced_analytics')) {
  // Show advanced analytics
}
```

### Type Safety for API Calls

```typescript
// Enhanced API client with authentication
import { api } from '@/lib/api';

// All API calls now automatically include authentication headers
const vehicles = await api.getVehicles();
const dashboard = await api.getDashboard(vehicleId);

// Authentication-specific calls
await api.auth.login({ email, password });
await api.auth.updateProfile({ first_name: 'John' });
```

## 2. Component Integration

### Protecting Existing Components

```typescript
import { ProtectedRoute, useFeatureAccess } from '@/components/auth/ProtectedRoute';

// Method 1: Wrap components with ProtectedRoute
function VehiclesPage() {
  return (
    <ProtectedRoute requiredFeatures={['multi_vehicle_management']}>
      <Vehicles />
    </ProtectedRoute>
  );
}

// Method 2: Use HOC pattern
const ProtectedVehicles = withAuth(Vehicles, {
  requiredTier: 'basic',
  requiredFeatures: ['multi_vehicle_management']
});

// Method 3: Check access within component
function AdvancedAnalytics() {
  const { hasAccess } = useFeatureAccess('advanced_analytics');
  
  if (!hasAccess) {
    return <UpgradePrompt feature="advanced_analytics" />;
  }
  
  return <AnalyticsComponent />;
}
```

### Adding Authentication to Existing Pages

#### Dashboard.tsx Example

```typescript
import { useAuth, useSubscription } from '@/contexts/AuthContext';
import { UsageLimits, UpgradePrompt } from '@/components/auth/ProtectedRoute';

function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const { subscription } = useSubscription();
  const limits = useSubscriptionLimits();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div>
      {/* User greeting */}
      <div>
        <h1>Welcome back, {user?.first_name}!</h1>
        <p>Subscription: {user?.subscription_tier}</p>
      </div>

      {/* Usage limits warning */}
      {limits.isNearLimit && <UsageLimits />}

      {/* Feature-based content */}
      {subscription?.tier === 'premium' && (
        <PremiumFeatures />
      )}

      {/* Upgrade prompts */}
      {!limits.canAddVehicle && (
        <UpgradePrompt feature="multi_vehicle_management" />
      )}
    </div>
  );
}
```

#### Vehicles.tsx Example

```typescript
import { useAuth, useSubscription } from '@/contexts/AuthContext';
import { ProtectedRoute, useFeatureAccess } from '@/components/auth/ProtectedRoute';

function Vehicles() {
  const { user } = useAuth();
  const { hasAccess, canAddVehicle } = useFeatureAccess('multi_vehicle_management');

  // Check if user can add more vehicles
  if (!canAddVehicle) {
    return (
      <div>
        <h2>Vehicle Limit Reached</h2>
        <p>You've reached your limit of {user?.limits.max_vehicles} vehicles.</p>
        <UpgradePrompt feature="multi_vehicle_management" />
      </div>
    );
  }

  return (
    <div>
      <h2>Your Vehicles</h2>
      {/* Vehicle list and add button */}
    </div>
  );
}

// Wrap with protection
export default withAuth(Vehicles, {
  requiredTier: 'basic',
  requiredFeatures: ['multi_vehicle_management']
});
```

## 3. Route Protection

### App.tsx Integration

```typescript
// Wrap protected routes
<Route path="/vehicles" element={
  <ProtectedRoute requiredTier="basic">
    <Suspense fallback={<RouteLoading />}>
      <LazyVehicles />
    </Suspense>
  </ProtectedRoute>
} />

// Route with specific feature requirements
<Route path="/analytics" element={
  <ProtectedRoute requiredFeatures={['advanced_analytics']}>
    <Suspense fallback={<RouteLoading />}>
      <LazyAnalytics />
    </Suspense>
  </ProtectedRoute>
} />
```

### Navigation Updates

```typescript
// Show/hide navigation items based on authentication
function Navigation() {
  const { isAuthenticated, user, logout } = useAuth();
  const { hasFeature } = useSubscription();

  return (
    <nav>
      {isAuthenticated ? (
        <>
          {/* Always visible items */}
          <Link to="/dashboard">Dashboard</Link>
          
          {/* Feature-based items */}
          {hasFeature('multi_vehicle_management') && (
            <Link to="/vehicles">Vehicles</Link>
          )}
          
          {/* Subscription-based items */}
          {user?.subscription_tier === 'premium' && (
            <Link to="/analytics">Advanced Analytics</Link>
          )}
          
          {/* User account */}
          <div>
            <span>{user?.first_name}</span>
            <button onClick={logout}>Logout</button>
          </div>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Sign Up</Link>
        </>
      )}
    </nav>
  );
}
```

## 4. Mobile Integration

### Mobile Navigation Updates

```typescript
// components/mobile/MobileNavigation.tsx
import { useAuth } from '@/contexts/AuthContext';

function MobileNavigation() {
  const { isAuthenticated, user } = useAuth();
  const { hasFeature } = useSubscription();

  const navigationItems = [
    { label: 'Dashboard', href: '/', icon: Car, show: isAuthenticated },
    { 
      label: 'Vehicles', 
      href: '/vehicles', 
      icon: Car, 
      show: isAuthenticated && hasFeature('multi_vehicle_management') 
    },
    // ... other items
  ];

  return (
    <div className="mobile-nav">
      {navigationItems.map(item => item.show && (
        <Link key={item.href} to={item.href}>
          <item.icon />
          {item.label}
        </Link>
      ))}
    </div>
  );
}
```

### Mobile Authentication

```typescript
// Use mobile-optimized auth components
import { MobileLogin } from '@/components/mobile/auth/MobileLogin';

// Detect mobile and use appropriate components
function AuthPage() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  if (isMobile) {
    return <MobileLogin />;
  }
  
  return <Login />;
}
```

## 5. API Integration

### Existing API Calls

```typescript
// All existing API calls now work seamlessly with authentication
// No changes needed to existing component code

// Example from existing component
async function loadVehicles() {
  try {
    const vehicles = await api.getVehicles();
    setVehicles(vehicles);
  } catch (error) {
    // Error handling includes authentication errors
    if (error.response?.status === 401) {
      // Redirect to login
      navigate('/login');
    }
  }
}
```

### New Authentication Endpoints

```typescript
// User profile management
await api.auth.updateProfile({
  first_name: 'John',
  last_name: 'Doe',
  preferences: {
    theme: 'dark',
    notifications: {
      email: true,
      push: false
    }
  }
});

// Subscription management
await api.auth.updateSubscription({ tier: 'premium' });
await api.auth.cancelSubscription();

// Usage statistics
const usage = await api.auth.getUsageStats();
```

## 6. State Management

### Using Authentication Context

```typescript
import { useAuth, useSubscription } from '@/contexts/AuthContext';

function Component() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    login, 
    logout, 
    updateProfile 
  } = useAuth();
  
  const { 
    subscription, 
    hasFeature, 
    canAddVehicle, 
    getUsagePercentage 
  } = useSubscription();

  // Usage example
  const handleProfileUpdate = async (data) => {
    try {
      await updateProfile(data);
      // Show success message
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.first_name}</p>
          <p>Subscription: {subscription?.tier}</p>
          <p>Usage: {getUsagePercentage()}%</p>
          
          {canAddVehicle() && (
            <button>Add Vehicle</button>
          )}
        </div>
      ) : (
        <div>Please log in</div>
      )}
    </div>
  );
}
```

## 7. Error Handling

### Authentication Errors

```typescript
import { useAuth } from '@/contexts/AuthContext';

function Component() {
  const { logout } = useAuth();

  const handleApiError = (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      logout();
      navigate('/login');
    } else if (error.response?.status === 403) {
      // Insufficient permissions
      showError('You do not have permission to access this feature');
    } else {
      // Other errors
      showError(error.message);
    }
  };

  // Usage in API calls
  const fetchData = async () => {
    try {
      const data = await api.someEndpoint();
      setData(data);
    } catch (error) {
      handleApiError(error);
    }
  };
}
```

## 8. Testing Integration

### Mock Authentication for Testing

```typescript
// __tests__/auth.mock.ts
export const mockUser = {
  _id: '1',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  subscription_tier: 'premium' as const,
  limits: {
    max_vehicles: 10,
    features: {
      advanced_analytics: true,
      multi_vehicle_management: true
    }
  }
};

// Test component with authentication
import { renderWithAuth } from '../test-utils';

test('renders premium features for premium user', () => {
  renderWithAuth(<Component />, { user: mockUser });
  expect(screen.getByText('Premium Features')).toBeInTheDocument();
});
```

## 9. Performance Considerations

### Lazy Loading Authentication Components

```typescript
// Already implemented in App.tsx
const LazyLogin = React.lazy(() => import('./pages/Login'));
const LazyRegister = React.lazy(() => import('./pages/Register'));
```

### Caching Strategy

```typescript
// Authentication state is cached in localStorage
// Tokens are automatically refreshed
// User data is persisted across sessions
```

## 10. Security Best Practices

### Token Security

```typescript
// Tokens are stored in localStorage with security measures
// CSRF protection with tokens
// Automatic token refresh before expiry
// Secure logout that invalidates refresh tokens
```

### Input Validation

```typescript
// All inputs are sanitized and validated
// Password strength requirements
// Email format validation
// XSS protection
```

## Migration Checklist

1. **Update package.json** with new dependencies (if any)
2. **Wrap App.tsx** with AuthProvider
3. **Update routes** to use ProtectedRoute
4. **Update navigation** to check authentication state
5. **Add authentication pages** to routing
6. **Update existing components** to use authentication context
7. **Test protected routes** and access control
8. **Test mobile authentication** components
9. **Update error handling** for authentication errors
10. **Test subscription features** and upgrade flows

## Troubleshooting

### Common Issues

1. **Authentication not working**: Check AuthProvider wrapping
2. **Routes not protected**: Verify ProtectedRoute usage
3. **API calls failing**: Check token refresh mechanism
4. **Mobile issues**: Verify responsive authentication components
5. **Subscription features not working**: Check feature access hooks

### Debugging

```typescript
// Enable debug logging
localStorage.setItem('auth_debug', 'true');

// Check authentication state
console.log('Auth state:', useAuth());

// Check token validity
console.log('Token valid:', isTokenValid(getAccessToken()));
```

This comprehensive integration guide provides everything needed to successfully implement authentication and subscription features in the Car Maintenance Tracker application.