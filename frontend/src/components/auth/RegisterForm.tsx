import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Eye, EyeOff, UserPlus } from 'lucide-react';
import { RegisterData } from '@/types/auth';

interface RegisterFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
  showTitle?: boolean;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  redirectTo,
  showTitle = true
}) => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    accept_terms: false,
    newsletter_opt_in: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    } else if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character';
    }

    // Name validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    // Terms acceptance
    if (!formData.accept_terms) {
      newErrors.accept_terms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      await register(formData);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Navigate to redirect URL or dashboard
        navigate(redirectTo || '/dashboard', { replace: true });
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Handle different error types
      if (err.response?.data?.message) {
        // If backend returns field-specific errors
        if (err.response.data.errors) {
          setErrors(err.response.data.errors);
        } else {
          setErrors({ general: err.response.data.message });
        }
      } else if (err.message) {
        setErrors({ general: err.message });
      } else {
        setErrors({ general: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {showTitle && (
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Create account</h2>
          <p className="text-muted-foreground">
            Get started with your car maintenance tracking
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <Alert variant="destructive">
            <AlertDescription>{errors.general}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First name</Label>
            <Input
              id="first_name"
              name="first_name"
              type="text"
              autoComplete="given-name"
              placeholder="First name"
              value={formData.first_name}
              onChange={handleInputChange}
              disabled={isSubmitting}
              required
            />
            {errors.first_name && (
              <p className="text-sm text-red-600">{errors.first_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Last name</Label>
            <Input
              id="last_name"
              name="last_name"
              type="text"
              autoComplete="family-name"
              placeholder="Last name"
              value={formData.last_name}
              onChange={handleInputChange}
              disabled={isSubmitting}
              required
            />
            {errors.last_name && (
              <p className="text-sm text-red-600">{errors.last_name}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange}
            disabled={isSubmitting}
            required
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone number (optional)</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+1 (555) 123-4567"
            value={formData.phone || ''}
            onChange={handleInputChange}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={isSubmitting}
              required
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              disabled={isSubmitting}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password}</p>
          )}
          <p className="text-xs text-gray-500">
            Password must be at least 8 characters with uppercase, lowercase, number, and special character
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="accept_terms"
              name="accept_terms"
              checked={formData.accept_terms}
              onChange={(e) => 
                setFormData(prev => ({ ...prev, accept_terms: e.target.checked as boolean }))
              }
              disabled={isSubmitting}
            />
            <Label htmlFor="accept_terms" className="text-sm leading-normal">
              I agree to the{' '}
              <a href="/terms" className="text-blue-600 hover:text-blue-500" target="_blank" rel="noopener noreferrer">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-blue-600 hover:text-blue-500" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>
            </Label>
          </div>
          {errors.accept_terms && (
            <p className="text-sm text-red-600">{errors.accept_terms}</p>
          )}

          <div className="flex items-start space-x-2">
            <Checkbox
              id="newsletter_opt_in"
              name="newsletter_opt_in"
              checked={formData.newsletter_opt_in || false}
              onChange={(e) => 
                setFormData(prev => ({ ...prev, newsletter_opt_in: e.target.checked as boolean }))
              }
              disabled={isSubmitting}
            />
            <Label htmlFor="newsletter_opt_in" className="text-sm leading-normal">
              I'd like to receive updates and tips about car maintenance (optional)
            </Label>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting || isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Create account
            </>
          )}
        </Button>
      </form>

      <div className="text-center text-sm">
        <span className="text-gray-600">Already have an account? </span>
        <a
          href="/login"
          className="font-medium text-blue-600 hover:text-blue-500"
        >
          Sign in
        </a>
      </div>
    </div>
  );
};

export default RegisterForm;