import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { validateEmail, validatePassword } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, Loader2 } from 'lucide-react';
import { RegisterFormData } from '@/types/auth';

interface MobileRegisterProps {
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

export const MobileRegister: React.FC<MobileRegisterProps> = ({ onSuccess }) => {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    timezone: 'UTC',
    accept_terms: false,
    newsletter_opt_in: false,
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

  const handleTimezoneChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      timezone: value,
    }));
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
      
      // Handle different error types
      if (error.response?.data?.errors) {
        // Form validation errors
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        // API error message
        setSubmitError(error.response.data.message);
      } else if (error.message) {
        // Network or other error
        setSubmitError(error.message);
      } else {
        setSubmitError('An unexpected error occurred. Please try again.');
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Car className="h-8 w-8 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Car Tracker
          </h1>
        </div>
        <Link
          to="/"
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          Cancel
        </Link>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-4">
          <div className="max-w-sm mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Create account
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Start tracking your vehicle maintenance
              </p>
            </div>
            
            <Card className="mb-4">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl">Sign up</CardTitle>
                <CardDescription>
                  Fill in your details
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {submitError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{submitError}</AlertDescription>
                  </Alert>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="first_name" className="text-sm font-medium">First name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="first_name"
                          name="first_name"
                          type="text"
                          required
                          className={`pl-10 ${errors.first_name ? 'border-red-500' : ''}`}
                          placeholder="First"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          disabled={isLoading}
                        />
                      </div>
                      {errors.first_name && (
                        <p className="text-xs text-red-600">{errors.first_name}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="last_name" className="text-sm font-medium">Last name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="last_name"
                          name="last_name"
                          type="text"
                          required
                          className={`pl-10 ${errors.last_name ? 'border-red-500' : ''}`}
                          placeholder="Last"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          disabled={isLoading}
                        />
                      </div>
                      {errors.last_name && (
                        <p className="text-xs text-red-600">{errors.last_name}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-red-600">{errors.email}</p>
                    )}
                  </div>
                  
                  {/* Phone Field */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Phone (optional)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        className="pl-10"
                        placeholder="+1 (555) 123-4567"
                        value={formData.phone || ''}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  {/* Timezone Field */}
                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="text-sm font-medium">Timezone</Label>
                    <Select value={formData.timezone} onValueChange={handleTimezoneChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map((timezone) => (
                          <SelectItem key={timezone} value={timezone}>
                            {timezone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                        placeholder="••••••••"
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
                        <span className={`text-xs font-medium ${getPasswordStrengthColor()}`}>
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                    )}
                    
                    {errors.password && (
                      <p className="text-xs text-red-600">{errors.password}</p>
                    )}
                  </div>
                  
                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password" className="text-sm font-medium">Confirm password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirm_password"
                        name="confirm_password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        className={`pl-10 pr-10 ${errors.confirm_password ? 'border-red-500' : ''}`}
                        placeholder="••••••••"
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
                      <p className="text-xs text-red-600">{errors.confirm_password}</p>
                    )}
                  </div>
                  
                  {/* Newsletter Opt-in */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="newsletter_opt_in"
                      name="newsletter_opt_in"
                      checked={formData.newsletter_opt_in}
                      onCheckedChange={(checked) => {
                        setFormData(prev => ({
                          ...prev,
                          newsletter_opt_in: checked as boolean,
                        }));
                      }}
                      disabled={isLoading}
                    />
                    <Label htmlFor="newsletter_opt_in" className="text-sm">
                      Send me tips and updates
                    </Label>
                  </div>
                  
                  {/* Terms Acceptance */}
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="accept_terms"
                      name="accept_terms"
                      checked={formData.accept_terms}
                      onCheckedChange={(checked) => {
                        setFormData(prev => ({
                          ...prev,
                          accept_terms: checked as boolean,
                        }));
                      }}
                      disabled={isLoading}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="accept_terms" className="text-xs">
                        I agree to the{' '}
                        <Link to="/terms" className="text-blue-600 hover:text-blue-500">
                          Terms
                        </Link>{' '}
                        and{' '}
                        <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
                          Privacy Policy
                        </Link>
                      </Label>
                      {errors.accept_terms && (
                        <p className="text-xs text-red-600">{errors.accept_terms}</p>
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
                        Creating...
                      </>
                    ) : (
                      'Create account'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            {/* Sign In Link */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Already have an account?{' '}
                  </span>
                  <Link
                    to="/login"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Sign in
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileRegister;