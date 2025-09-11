// Authentication and Subscription Types
export interface User {
  _id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url?: string;
  is_verified: boolean;
  is_active: boolean;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  subscription_end_date?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  preferences: UserPreferences;
  limits: UserLimits;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    maintenance_reminders: boolean;
    fuel_alerts: boolean;
    subscription_reminders: boolean;
  };
  currency: 'USD' | 'EUR' | 'GBP' | 'PHP' | 'JPY' | 'CAD' | 'AUD';
  distance_unit: 'km' | 'mi';
  fuel_unit: 'L' | 'gal';
  timezone: string;
  language: 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';
}

export interface UserLimits {
  max_vehicles: number;
  max_records_per_vehicle: number;
  max_export_records: number;
  max_storage_mb: number;
  features: {
    advanced_analytics: boolean;
    custom_maintenance_schedules: boolean;
    multi_vehicle_management: boolean;
    fuel_performance_insights: boolean;
    export_customization: boolean;
    api_access: boolean;
    priority_support: boolean;
  };
}

export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'enterprise';

export type SubscriptionStatus = 
  | 'active' 
  | 'inactive' 
  | 'cancelled' 
  | 'expired' 
  | 'pending' 
  | 'suspended'
  | 'trialing';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  price: {
    monthly: number;
    yearly: number;
    currency: string;
  };
  features: string[];
  limits: UserLimits;
  is_popular?: boolean;
  description: string;
  trial_days?: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number; // in seconds
  token_type: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  timezone?: string;
  accept_terms: boolean;
  newsletter_opt_in?: boolean;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirm_password: string;
}

export interface UpdatePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface VerifyEmailData {
  token: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  subscription: SubscriptionStatusInfo | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (data: UpdatePasswordData) => Promise<void>;
  forgotPassword: (data: ForgotPasswordData) => Promise<void>;
  resetPassword: (data: ResetPasswordData) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  requestEmailVerification: () => Promise<void>;
  updateSubscription: (tier: SubscriptionTier) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  reactivateSubscription: () => Promise<void>;
}

export interface SubscriptionStatusInfo {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  current_period_end?: string;
  trial_end?: string;
  cancel_at_period_end?: boolean;
  plan?: SubscriptionPlan;
  usage: {
    vehicles_count: number;
    total_records: number;
    storage_used_mb: number;
  };
}

export interface LoginFormData extends LoginCredentials {}

export interface RegisterFormData extends RegisterData {}

export interface ForgotPasswordFormData extends ForgotPasswordData {}

export interface ResetPasswordFormData extends ResetPasswordData {}

export interface UpdatePasswordFormData extends UpdatePasswordData {}

export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
}

export interface AuthApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string>;
}

export interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
}

// API Response Types
export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  user: User;
  tokens: AuthTokens;
  verification_required: boolean;
}

export interface SubscriptionResponse {
  subscription: SubscriptionStatusInfo;
  available_plans: SubscriptionPlan[];
}

export interface UsageStatsResponse {
  vehicles_count: number;
  total_records: number;
  storage_used_mb: number;
  monthly_active_vehicles: number;
  last_activity_at: string;
}

// Feature flags based on subscription
export type FeatureFlag = keyof UserLimits['features'];

export interface FeatureAccess {
  hasAccess: boolean;
  reason?: string;
  upgradeRequired?: SubscriptionTier;
}

// Social Login Types
export type SocialProvider = 'google' | 'facebook' | 'apple' | 'github';

export interface SocialLoginData {
  provider: SocialProvider;
  access_token: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

export interface SocialLoginResponse {
  user: User;
  tokens: AuthTokens;
  isNewUser: boolean;
}

// Security types
export interface SecuritySettings {
  two_factor_enabled: boolean;
  login_notifications: boolean;
  session_timeout: number; // in minutes
  allowed_ip_ranges?: string[];
  password_policy: {
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_special_chars: boolean;
    prevent_reuse: number;
  };
}

export interface ActivityLog {
  id: string;
  action: string;
  ip_address: string;
  user_agent: string;
  location?: string;
  timestamp: string;
  details?: Record<string, any>;
}

// Audit trail types
export interface AuditEvent {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  changes?: Record<string, any>;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

// Webhook types for real-time notifications
export interface WebhookEvent {
  event: string;
  data: any;
  timestamp: string;
  user_id: string;
}

// Push notification types
export interface PushNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  icon?: string;
  image?: string;
  actions?: NotificationAction[];
  timestamp: string;
  read: boolean;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Billing and payment types
export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank_transfer';
  last4?: string;
  brand?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default: boolean;
  added_at: string;
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  due_date: string;
  paid_at?: string;
  items: InvoiceItem[];
  pdf_url?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface PaymentHistory {
  invoices: Invoice[];
  total_paid: number;
  upcoming_invoice?: Invoice;
}