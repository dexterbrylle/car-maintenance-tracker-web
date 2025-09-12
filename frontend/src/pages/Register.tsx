import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { validateEmail, validatePassword } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, Loader2, Info } from 'lucide-react';
import { RegisterFormData } from '@/types/auth';

interface RegisterProps {
  onSuccess?: () => void;
}

const timezones = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Australia/Sydney',
];

export const Register: React.FC<RegisterProps> = ({ onSuccess }) => {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    accept_terms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');
  const [passwordStrength, setPasswordStrength] = useState<{ isValid: boolean; errors: string[]; strength: 'weak' | 'medium' | 'strong' }>({
    isValid: false,
    errors: [],
    strength: 'weak',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Validate password strength when password changes
    if (name === 'password') {
      const strength = validatePassword(value);
      setPasswordStrength(strength);

      // Clear password confirmation if password changes
      setConfirmPassword('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordStrength.isValid) {
      newErrors.password = passwordStrength.errors.join(', ');
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirm_password = 'Please confirm your password';
    } else if (formData.password !== confirmPassword) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    // First name validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    // Last name validation
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    // Terms acceptance validation
    if (!formData.accept_terms) {
      newErrors.accept_terms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    try {
      await register(formData);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to dashboard or verification page
        navigate('/');
      }
    } catch (error: any) {
      console.error('Registration error:', error);

      // Handle different error types with user-friendly messages
      if (error.response?.data?.details) {
        // Form validation errors from backend
        const backendErrors = error.response.data.details;
        const formattedErrors: Record<string, string> = {};

        Object.keys(backendErrors).forEach(key => {
          const errorMessages = backendErrors[key];
          if (Array.isArray(errorMessages)) {
            formattedErrors[key] = errorMessages[0];
          } else if (typeof errorMessages === 'string') {
            formattedErrors[key] = errorMessages;
          }
        });

        setErrors(formattedErrors);

        // If there's a general error message, show it as submit error
        if (error.response.data.message) {
          setSubmitError(error.response.data.message);
        }
      } else if (error.response?.data?.message) {
        // API error message - make it user-friendly
        const apiMessage = error.response.data.message;
        let userFriendlyMessage = apiMessage;

        // Transform technical messages to user-friendly ones
        if (apiMessage.includes('User already exists')) {
          userFriendlyMessage = 'An account with this email already exists. Please try logging in or use a different email.';
        } else if (apiMessage.includes('Please provide')) {
          userFriendlyMessage = 'Please fill in all required fields.';
        } else if (apiMessage.includes('Please enter a valid email address')) {
          userFriendlyMessage = 'Please enter a valid email address.';
        } else if (apiMessage.includes('Unable to create your account')) {
          userFriendlyMessage = 'Unable to create your account. Please try again later.';
        } else if (apiMessage.includes('Invalid response format from server')) {
          userFriendlyMessage = 'Server response error. Please try again later.';
        }

        setSubmitError(userFriendlyMessage);
      } else if (error.message) {
        // Network or other error
        let networkErrorMessage = error.message;

        // Transform network errors to user-friendly messages
        if (error.message.includes('Network Error')) {
          networkErrorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('timeout')) {
          networkErrorMessage = 'Request timeout. Please try again.';
        } else if (error.message.includes('Invalid response format from server')) {
          networkErrorMessage = 'Server response error. Please try again later.';
        }

        setSubmitError(networkErrorMessage);
      } else {
        setSubmitError('An unexpected error occurred during registration. Please try again later.');
      }
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength.strength) {
      case 'weak':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'strong':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength.strength) {
      case 'weak':
        return 'Weak';
      case 'medium':
        return 'Medium';
      case 'strong':
        return 'Strong';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Car className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Start tracking your vehicle maintenance today
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign up</CardTitle>
            <CardDescription className="text-center">
              Fill in the details below to create your account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {submitError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="first_name"
                      name="first_name"
                      type="text"
                      required
                      className={`pl-10 ${errors.first_name ? 'border-red-500' : ''}`}
                      placeholder="First name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.first_name && (
                    <p className="text-sm text-red-600">{errors.first_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Last name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="last_name"
                      name="last_name"
                      type="text"
                      required
                      className={`pl-10 ${errors.last_name ? 'border-red-500' : ''}`}
                      placeholder="Last name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.last_name && (
                    <p className="text-sm text-red-600">{errors.last_name}</p>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Password strength indicator */}
                {formData.password && (
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordStrength.strength === 'weak' ? 'w-1/3 bg-red-500' :
                          passwordStrength.strength === 'medium' ? 'w-2/3 bg-yellow-500' :
                          'w-full bg-green-500'
                        }`}
                      />
                    </div>
                    <span className={`text-sm font-medium ${getPasswordStrengthColor()}`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                )}

                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className={`pl-10 pr-10 ${errors.confirm_password ? 'border-red-500' : ''}`}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirm_password && (
                  <p className="text-sm text-red-600">{errors.confirm_password}</p>
                )}
              </div>

              {/* Terms Acceptance */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="accept_terms"
                  name="accept_terms"
                  checked={formData.accept_terms}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      accept_terms: e.target.checked as boolean,
                    }));
                  }}
                  disabled={isLoading}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="accept_terms" className="text-sm">
                    I agree to the{' '}
                    <Link to="/terms" className="text-blue-600 hover:text-blue-500">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
                      Privacy Policy
                    </Link>
                  </Label>
                  {errors.accept_terms && (
                    <p className="text-sm text-red-600">{errors.accept_terms}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">
                    Already have an account?
                  </span>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-center">
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Register;
