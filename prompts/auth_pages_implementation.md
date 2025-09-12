# Prompt: Frontend Authentication Pages Implementation with shadcn/ui

## Overview
Create comprehensive authentication pages using shadcn/ui components that match the current frontend style and integrate seamlessly with the existing authentication system. This includes Login, Register, Forgot Password, and Reset Password pages with proper routing, validation, and user experience.

## Current Frontend Architecture
- **React 18** with TypeScript and Vite
- **Component Library**: shadcn/ui components (already installed)
- **State Management**: React Context with AuthProvider
- **Routing**: React Router v6
- **Styling**: Tailwind CSS with consistent design system
- **API Client**: Axios instance with auth interceptors

## Required Pages

### 1. Login Page (`src/pages/auth/Login.tsx`)
```tsx
// Full login page with form validation and social login options
- Email/Password form with shadcn/ui components
- Remember me checkbox
- Forgot password link
- Sign up link
- Social login buttons (Google, Facebook - optional)
- Loading state on form submission
- Error display with toast notifications
- Redirect to dashboard after successful login
```

### 2. Register Page (`src/pages/auth/Register.tsx`)
```tsx
// Full registration page with validation
- First name, Last name, Email, Password fields
- Password strength indicator
- Terms and conditions checkbox
- Already have account link
- Loading state on form submission
- Error display with toast notifications
- Auto-login after successful registration
```

### 3. Forgot Password Page (`src/pages/auth/ForgotPassword.tsx`)
```tsx
// Password reset request page
- Email input field
- Submit button
- Instructions text
- Loading state
- Success message with email sent confirmation
- Back to login link
```

### 4. Reset Password Page (`src/pages/auth/ResetPassword.tsx`)
```tsx
// Password reset confirmation page
- New password field
- Confirm password field
- Password strength indicator
- Submit button
- Token validation from URL params
- Loading state
- Success redirect to login
```

### 5. Auth Layout (`src/components/auth/AuthLayout.tsx`)
```tsx
// Reusable layout for auth pages
- Centered card layout
- Logo/header
- Background styling
- Responsive design
- Children content area
```

## Implementation Requirements

### 1. shadcn/ui Components to Use
- `Card` for form containers
- `Form` with `react-hook-form` integration
- `Input` with validation states
- `Button` with loading states
- `Label` for form labels
- `Checkbox` for remember me/terms
- `Alert` for error messages
- `Toast` for notifications (using existing toast system)

### 2. Form Validation
- Use `react-hook-form` with `zod` resolver
- Comprehensive validation rules:
  - Email: valid email format
  - Password: min 8 chars, uppercase, lowercase, number, special char
  - Name: min 2 chars, letters only
  - Confirm password: matches password
- Real-time validation feedback
- Submit validation on blur and submit

### 3. Authentication Integration
- Use existing `AuthContext` for state management
- Integrate with `api.ts` client for API calls
- Handle JWT token storage in localStorage
- Implement automatic token refresh
- Redirect logic after auth actions

### 4. Routing Configuration
Update `App.tsx` to include auth routes:
```tsx
<Routes>
  {/* Auth Routes */}
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
  <Route path="/reset-password" element={<ResetPassword />} />
  
  {/* Protected Routes */}
  <Route element={<ProtectedRoute />}>
    <Route path="/dashboard" element={<Dashboard />} />
    {/* other protected routes */}
  </Route>
  
  {/* Default redirect */}
  <Route path="/" element={<Navigate to="/dashboard" replace />} />
</Routes>
```

### 5. Protected Route Component
Create `src/components/auth/ProtectedRoute.tsx`:
```tsx
// Route guard for authenticated pages
- Check authentication status
- Redirect to login if not authenticated
- Show loading spinner while checking auth
- Save attempted location for redirect after login
```

### 6. Error Handling
- API error handling with user-friendly messages
- Network error handling
- Validation error display
- Toast notifications for all operations
- Form-level error states

### 7. Loading States
- Button loading spinners
- Form disabled during submission
- Skeleton loaders for auth checking
- Smooth transitions between states

### 8. Responsive Design
- Mobile-first approach
- Proper breakpoints for all screen sizes
- Touch-friendly input fields
- Keyboard navigation support
- Proper focus management

### 9. Accessibility
- ARIA labels and roles
- Keyboard navigation
- Screen reader support
- Color contrast compliance
- Focus indicators

## Implementation Steps

### Step 1: Create Auth Layout Component
```tsx
// src/components/auth/AuthLayout.tsx
import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
        <Card className="p-8">{children}</Card>
      </div>
    </div>
  );
}
```

### Step 2: Implement Login Page
```tsx
// src/pages/auth/Login.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Login successful!');
      // Redirect will be handled by AuthContext
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Sign in to your account">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Checkbox id="remember-me" {...register('rememberMe')} />
            <Label htmlFor="remember-me" className="ml-2">
              Remember me
            </Label>
          </div>

          <a
            href="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Forgot your password?
          </a>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a
              href="/register"
              className="text-blue-600 hover:text-blue-500"
            >
              Sign up
            </a>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
```

### Step 3: Create Additional Pages
Implement similar patterns for:
- Register page with password strength validation
- Forgot password with email submission
- Reset password with token validation

### Step 4: Update App Routing
```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';
import { ResetPassword } from '@/pages/auth/ResetPassword';
import { Dashboard } from '@/pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Add other protected routes here */}
          </Route>
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

### Step 5: Update AuthContext
Ensure AuthContext handles:
- Login/register/logout methods
- Token storage and refresh
- Redirect after auth
- Loading states
- Error handling

### Step 6: Update API Client
Update `src/lib/api.ts` to:
- Include auth endpoints
- Handle token refresh
- Proper error handling
- Request/response interceptors

## Testing Requirements

### Unit Tests
- Form validation logic
- AuthContext methods
- ProtectedRoute component
- API integration

### Integration Tests
- Login flow
- Registration flow
- Password reset flow
- Protected route access
- Token refresh

### E2E Tests
- Complete auth journey
- Error scenarios
- Redirect behavior
- Persistence across page refresh

## Security Considerations

1. **Token Storage**: Store JWT in localStorage with HttpOnly cookie fallback
2. **CSRF Protection**: Implement CSRF tokens for state-changing requests
3. **XSS Prevention**: Sanitize user inputs, use React's built-in protections
4. **Rate Limiting**: Respect backend rate limits, implement client-side throttling
5. **Password Security**: Never log passwords, use secure transmission
6. **Session Management**: Proper logout and token invalidation

## Performance Considerations

1. **Code Splitting**: Lazy load auth routes
2. **Bundle Size**: Tree-shake unused components
3. **Caching**: Cache auth state appropriately
4. **Loading States**: Provide immediate feedback for user actions
5. **Optimistic UI**: Update UI optimistically where appropriate

## Accessibility Checklist

- [ ] All form fields have proper labels
- [ ] Error messages are announced to screen readers
- [ ] Keyboard navigation works throughout
- [ ] ARIA landmarks used appropriately
- [ ] Color contrast meets WCAG standards
- [ ] Focus states are visible
- [ ] Forms can be submitted with Enter key
- [ ] Loading states are announced

## Deliverables

1. **Auth Pages**: Login, Register, Forgot Password, Reset Password
2. **Auth Layout**: Reusable layout component
3. **Protected Route**: Route guard component
4. **Updated Routing**: App.tsx with auth routes
5. **Form Validation**: Complete validation with zod
6. **Error Handling**: Comprehensive error display
7. **Loading States**: Proper UX feedback
8. **Documentation**: Component usage and integration guide

## Success Criteria

- [ ] All auth pages work end-to-end
- [ ] Form validation prevents invalid submissions
- [ ] Users can register and login successfully
- [ ] Password reset flow works completely
- [ ] Protected routes require authentication
- [ ] Pages are responsive and accessible
- [ ] Error handling is user-friendly
- [ ] Loading states provide clear feedback
- [ ] Styling matches existing design system
- [ ] All tests pass