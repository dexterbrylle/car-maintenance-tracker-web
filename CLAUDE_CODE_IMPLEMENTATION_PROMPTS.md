# Claude Code Implementation Prompts

This document contains specialized prompts for Claude Code to implement the Car Maintenance Tracker MVP. These prompts are designed to be used by coding agents working on different aspects of the system.

## Backend Implementation Prompts

### Database Setup and Models

**Prompt 1: Initialize MongoDB Database**
```
You are a Python backend developer working on the Car Maintenance Tracker MVP. Your task is to implement the MongoDB database setup and data models for the system.

Requirements:
1. Use MongoDB with PyMongo driver
2. Implement proper user isolation (multi-tenant architecture)
3. Create database indexes for performance optimization
4. Implement data validation and security best practices
5. Set up proper error handling and logging

Models to implement:
- User (authentication and subscription management)
- Vehicle (make, model, year, mileage tracking)
- MaintenanceItem (maintenance schedule data)
- ServiceRecord (completed maintenance services)
- FillUp (fuel economy tracking data)

Key requirements:
- Dual mileage tracking system (initial_mileage and current_mileage)
- Philippines-specific maintenance schedules with 0.8 severity factor
- JWT-based authentication with refresh tokens
- Rate limiting and input validation
- Proper data serialization for API responses

Please create the models.py file with all necessary models, database connection setup, and initialization scripts.
```

**Prompt 2: Authentication System Implementation**
```
You are a security-focused Python developer implementing the authentication system for the Car Maintenance Tracker. Your task is to create a comprehensive JWT-based authentication system with proper security measures.

Requirements:
1. JWT authentication with access tokens (15 min) and refresh tokens (7 days)
2. Refresh token rotation and revocation
3. Rate limiting for authentication endpoints
4. Password hashing with bcrypt
5. Input validation and sanitization
6. Multi-tenant user isolation
7. Subscription tier management
8. Password reset functionality

Key security requirements:
- Use secure JWT secret management
- Implement proper CORS protection
- Add comprehensive input validation
- Implement rate limiting with Redis
- Create secure password policies
- Add user enumeration protection

Please implement:
- auth.py with all authentication logic
- security.py with validation and sanitization utilities
- rate_limiter.py with Redis-based rate limiting
- Authentication decorators for protected routes
- Password reset workflow
- User profile management

The system must follow the security best practices outlined in the CLAUDE.md file and address all vulnerabilities identified in the architectural review.
```

### API Routes Implementation

**Prompt 3: Vehicle Management API**
```
You are a backend developer implementing the vehicle management API endpoints for the Car Maintenance Tracker. Your task is to create robust, secure, and efficient endpoints for vehicle CRUD operations.

Requirements:
1. Implement Blueprint pattern for modular routing
2. Create RESTful endpoints for vehicle management
3. Add comprehensive validation and error handling
4. Implement user isolation for multi-tenant architecture
5. Add proper data serialization and response formatting
6. Implement dual mileage tracking system
7. Add automatic mileage progression from service records

Endpoints to implement:
- GET /api/vehicles - Get all vehicles for authenticated user
- POST /api/vehicles - Add new vehicle
- PUT /api/vehicles/{id} - Update vehicle (including mileage updates)
- DELETE /api/vehicles/{id} - Delete vehicle and associated data

Key features:
- Automatic mileage progression: current_mileage = MAX(current_mileage, service_mileage, fillup_odometer)
- Input validation for vehicle data
- Proper error handling and response codes
- Security checks for user ownership
- Data validation for mileage (cannot decrease)

Please create vehicles.py with all vehicle management endpoints, following the Flask Blueprint pattern and implementing all security requirements.
```

**Prompt 4: Maintenance Management API**
```
You are a backend developer implementing the maintenance management API for the Car Maintenance Tracker. Your task is to create endpoints for managing maintenance schedules, service records, and maintenance status calculations.

Requirements:
1. Implement maintenance item management with Philippines-specific schedules
2. Create service record tracking with automatic status updates
3. Implement intelligent maintenance status calculation (due_now, due_soon, ok)
4. Add automatic mileage progression from service records
5. Implement priority-based sorting for maintenance items
6. Create Philippines-specific maintenance schedule data

Endpoints to implement:
- GET /api/maintenance/{vehicleId} - Get maintenance items for vehicle
- POST /api/maintenance - Add maintenance item
- GET /api/services/{vehicleId} - Get service records for vehicle
- POST /api/services - Add service record
- PUT /api/services/{id} - Update service record
- DELETE /api/services/{id} - Delete service record

Key features:
- Philippines maintenance schedules with 0.8 severity factor
- Automatic maintenance status calculation based on mileage and time
- Service record creation with automatic mileage updates
- Maintenance item creation with validation
- Priority sorting (overdue items first)
- User isolation and security checks

Please create maintenance.py and services.py with all maintenance management endpoints, including the intelligent status calculation engine and Philippines-specific schedules.
```

**Prompt 5: Fuel Tracking API**
```
You are a backend developer implementing the fuel tracking API for the Car Maintenance Tracker. Your task is to create comprehensive endpoints for fuel economy tracking with advanced calculations and analytics.

Requirements:
1. Implement fill-up record management with validation
2. Create automatic fuel economy calculations (km/L, cost per km)
3. Add fuel performance analytics and insights
4. Implement automatic mileage progression from fill-ups
5. Create comprehensive fuel statistics and trends
6. Add data validation for odometer progression

Endpoints to implement:
- POST /api/fillups - Add new fill-up record
- GET /api/fillups/{vehicleId} - Get fill-ups for vehicle with pagination
- PUT /api/fillups/{fillupId} - Update fill-up record
- DELETE /api/fillups/{fillupId} - Delete fill-up record
- GET /api/fillups/stats/{vehicleId} - Get fuel statistics for vehicle
- GET /api/fillups/recent/{vehicleId} - Get recent fill-ups for dashboard

Key features:
- Automatic fuel economy calculations: km/L = (odometer_km - previous_odometer) / liters
- Cost per km calculation: total_cost / (odometer_km - previous_odometer)
- Automatic mileage progression: current_mileage = MAX(current_mileage, odometer_km)
- Fuel performance analytics with best/worst tracking
- Trend analysis with improvement/decline detection
- Comprehensive data validation for odometer progression

Please create fillups.py with all fuel tracking endpoints, including the calculation engine and analytics features.
```

**Prompt 6: Dashboard API**
```
You are a backend developer implementing the dashboard API for the Car Maintenance Tracker. Your task is to create endpoints that provide comprehensive vehicle status overview with intelligent insights.

Requirements:
1. Implement dashboard data aggregation from multiple sources
2. Create maintenance status calculation with priority sorting
3. Add fuel performance statistics and insights
4. Implement recent activity tracking
5. Create Philippines-specific maintenance recommendations
6. Add export functionality for service history

Endpoints to implement:
- GET /api/dashboard/{vehicleId} - Get maintenance status overview
- POST /api/export/service-history - Export service history
- GET /api/export/history - Get export history
- GET /api/export/download/{exportId} - Download exported file
- GET /api/health - Health check endpoint

Key features:
- Intelligent maintenance status calculation (due_now, due_soon, ok)
- Priority sorting based on overdue status and due dates
- Fuel performance statistics with trends
- Recent service and fill-up activity
- Export functionality for CSV and Excel formats
- Health monitoring for production

Please create dashboard.py and export.py with all dashboard and export functionality, including the intelligent status calculation engine and export features.
```

### Business Logic Implementation

**Prompt 7: Fuel Calculation Engine**
```
You are a backend developer implementing the fuel calculation engine for the Car Maintenance Tracker. Your task is to create robust, accurate fuel economy calculations with comprehensive validation.

Requirements:
1. Implement fuel economy calculation algorithms
2. Create cost per kilometer calculations
3. Add fuel performance analytics and insights
4. Implement trend analysis and comparison
5. Create comprehensive validation for odometer progression
6. Add Philippines-specific fuel efficiency insights

Key calculations to implement:
- Fuel economy (km/L): (current_odometer - previous_odometer) / liters
- Cost per km: total_cost / (current_odometer - previous_odometer)
- Monthly fuel cost trends
- Best/worst fuel economy tracking
- Fuel efficiency improvement/decline detection
- Average fuel economy calculation

Features to implement:
- Odometer progression validation (cannot decrease)
- Partial fill-up handling and detection
- Fuel economy anomaly detection
- Performance insights and recommendations
- Comprehensive statistics calculation
- Data integrity validation

Please create utils/fuel_calculations.py with all fuel calculation logic, including comprehensive validation, analytics, and Philippines-specific insights.
```

**Prompt 8: Maintenance Engine**
```
You are a backend developer implementing the maintenance engine for the Car Maintenance Tracker. Your task is create intelligent maintenance status calculation with Philippines-specific optimizations.

Requirements:
1. Implement maintenance status calculation algorithm
2. Create priority-based sorting for maintenance items
3. Add Philippines-specific maintenance schedules
4. Implement intelligent due date calculation
5. Create maintenance recommendations engine
6. Add automatic mileage progression tracking

Key algorithms to implement:
- Maintenance status calculation: due_now, due_soon, ok
- Priority sorting: overdue items first, then by due date
- Philippines maintenance intervals with 0.8 severity factor
- Next due calculation based on mileage and time
- Maintenance completion tracking
- Service interval optimization

Features to implement:
- Intelligent status calculation based on last service and mileage
- Philippines-specific schedules for different vehicle types
- Automatic due date adjustment for severe conditions
- Priority-based maintenance recommendations
- Service history analysis
- Maintenance cost tracking

Please create utils/maintenance_engine.py with all maintenance calculation logic, including Philippines-specific optimizations and intelligent status calculation.
```

### Utilities and Configuration

**Prompt 9: Application Configuration**
```
You are a DevOps engineer setting up the Flask application configuration for the Car Maintenance Tracker. Your task is to create proper configuration management for development and production environments.

Requirements:
1. Implement environment-based configuration
2. Create proper CORS setup for development and production
3. Set up security headers and middleware
4. Configure error handling and logging
5. Implement health check endpoints
6. Set up proper application structure

Key configurations to implement:
- Development and production environment settings
- CORS configuration for different origins
- Security headers and middleware
- Error handling and logging configuration
- Health check endpoints
- Application structure and initialization

Features to implement:
- Environment variable management
- Security headers configuration
- CORS setup for frontend development
- Error handling and logging
- Health monitoring
- Application initialization

Please create app.py with proper Flask application setup, configuration management, and security middleware. Include all necessary environment settings and error handling.
```

## Frontend Implementation Prompts

### Project Setup and Configuration

**Prompt 10: Frontend Project Initialization**
```
You are a React frontend developer setting up the Car Maintenance Tracker frontend. Your task is to create a modern, mobile-first React application with TypeScript and proper tooling.

Requirements:
1. Use React 18 with TypeScript and Vite
2. Set up Tailwind CSS for styling
3. Configure path aliases (@/ for src/)
4. Set up proper ESLint configuration
5. Create mobile-first responsive design
6. Implement PWA capabilities for mobile

Key technologies to use:
- React 18 with TypeScript
- Vite as build tool
- Tailwind CSS for styling
- Radix UI for component primitives
- React Router for navigation
- Axios for API communication

Setup tasks:
- Initialize Vite project with React and TypeScript
- Configure Tailwind CSS and PostCSS
- Set up path aliases in tsconfig.json
- Configure ESLint with React hooks and refresh plugins
- Create project structure with proper folders
- Set up PWA configuration for mobile
- Configure development and production builds

Please create the complete frontend project structure with all necessary configuration files, package.json, and initial components setup.
```

**Prompt 11: API Client and Authentication**
```
You are a frontend developer implementing the API client and authentication system for the Car Maintenance Tracker. Your task is to create a robust API communication layer with JWT authentication.

Requirements:
1. Create API client with Axios
2. Implement JWT token management
3. Add refresh token functionality
4. Create authentication interceptors
5. Implement error handling and retry logic
6. Add proper TypeScript interfaces

Key features to implement:
- Axios instance with base URL configuration
- JWT token storage and management
- Refresh token rotation
- Request/response interceptors
- Error handling and toast notifications
- TypeScript interfaces for all API responses
- Authentication context provider

API endpoints to support:
- Authentication (login, register, refresh, logout)
- Vehicle management
- Maintenance and service records
- Fuel tracking
- Dashboard data
- Export functionality

Please create src/lib/api.ts with complete API client implementation, src/lib/auth.ts with authentication logic, and src/contexts/AuthContext.tsx with authentication context provider.
```

### Core Components Implementation

**Prompt 12: Authentication Components**
```
You are a React frontend developer implementing the authentication components for the Car Maintenance Tracker. Your task is to create a complete authentication flow with proper validation and user experience.

Requirements:
1. Create login and registration forms
2. Implement password reset functionality
3. Add form validation and error handling
4. Create protected route components
5. Implement loading states and user feedback
6. Add mobile-optimized authentication flows

Components to create:
- LoginForm component with validation
- RegisterForm component with validation
- ForgotPasswordForm component
- ResetPasswordForm component
- ProtectedRoute component for auth protection
- AuthLayout component for authentication pages
- Profile management component

Key features:
- Form validation with proper error messages
- Loading states and user feedback
- Password strength validation
- Email validation and verification
- Mobile-optimized form layouts
- Proper error handling and toast notifications
- Redirect logic after authentication

Please create src/pages/auth/ with all authentication pages, src/components/auth/ with authentication components, and implement proper form validation and error handling.
```

**Prompt 13: Vehicle Management Components**
```
You are a React frontend developer implementing the vehicle management components for the Car Maintenance Tracker. Your task is to create comprehensive vehicle management with dual mileage tracking.

Requirements:
1. Create vehicle listing and management interface
2. Implement dual mileage tracking system
3. Add vehicle selection and switching
4. Create vehicle forms with validation
5. Implement responsive design for mobile
6. Add vehicle statistics and insights

Components to create:
- VehicleList component for displaying vehicles
- VehicleForm component for adding/editing vehicles
- VehicleSelector component for switching vehicles
- VehicleHeader component with vehicle info and mileage
- VehicleStats component for vehicle overview
- VehicleCard component for mobile display

Key features:
- Dual mileage tracking (initial_mileage and current_mileage)
- Vehicle creation with validation
- Vehicle selection and switching
- Mileage update functionality
- Vehicle statistics display
- Mobile-optimized layouts
- Responsive design patterns

Please create src/pages/vehicles/ with vehicle management pages, src/components/vehicles/ with vehicle components, and implement proper dual mileage tracking functionality.
```

**Prompt 14: Dashboard Components**
```
You are a React frontend developer implementing the dashboard components for the Car Maintenance Tracker. Your task is to create a comprehensive dashboard with maintenance status, fuel performance, and insights.

Requirements:
1. Create dashboard overview with vehicle status
2. Implement maintenance status display (due_now, due_soon, ok)
3. Add fuel performance statistics
4. Create maintenance insights and recommendations
5. Implement responsive mobile design
6. Add quick action buttons for mobile

Components to create:
- Dashboard component with overview
- StatsGrid component for key metrics
- MaintenanceSection component for status display
- MaintenanceInsights component for recommendations
- FuelPerformance component for fuel stats
- QuickActions component for mobile
- DashboardSkeleton component for loading states

Key features:
- Maintenance status with priority sorting
- Fuel performance statistics and trends
- Philippines-specific maintenance insights
- Mobile-optimized layouts
- Loading states and skeletons
- Quick action buttons for common tasks
- Responsive design patterns

Please create src/pages/Dashboard.tsx with main dashboard, src/components/dashboard/ with dashboard components, and implement proper mobile-first responsive design.
```

**Prompt 15: Maintenance Tracking Components**
```
You are a React frontend developer implementing the maintenance tracking components for the Car Maintenance Tracker. Your task is to create comprehensive maintenance management with intelligent status display.

Requirements:
1. Create maintenance item listing and management
2. Implement service record tracking
3. Add maintenance status indicators
4. Create service logging forms
5. Implement Philippines-specific schedules
6. Add mobile-optimized maintenance interface

Components to create:
- MaintenanceList component for displaying items
- MaintenanceItem component for individual items
- ServiceForm component for logging services
- ServiceHistory component for service records
- MaintenanceStatus component for status display
- MaintenanceCalendar component for timeline view
- QuickServiceModal component for mobile

Key features:
- Maintenance status with color coding (critical, warning, success)
- Service record creation with validation
- Philippines maintenance schedules
- Priority-based sorting
- Mobile-optimized forms
- Maintenance timeline and history
- Quick service logging for mobile

Please create src/pages/maintenance/ with maintenance pages, src/components/maintenance/ with maintenance components, and implement proper Philippines-specific maintenance tracking.
```

**Prompt 16: Fuel Tracking Components**
```
You are a React frontend developer implementing the fuel tracking components for the Car Maintenance Tracker. Your task is to create comprehensive fuel economy tracking with advanced analytics.

Requirements:
1. Create fill-up logging interface
2. Implement fuel economy calculations and display
3. Add fuel performance analytics
4. Create fuel statistics dashboard
5. Implement mobile-optimized fuel tracking
6. Add fuel insights and recommendations

Components to create:
- FillUpForm component for logging fill-ups
- FillUpList component for fill-up history
- FuelStats component for performance metrics
- FuelEconomyChart component for trends
- FuelInsights component for recommendations
- FillUpModal component for mobile quick logging
- FuelComparison component for period comparison

Key features:
- Fill-up logging with odometer validation
- Automatic fuel economy calculations (km/L)
- Cost per kilometer tracking
- Fuel performance trends and analytics
- Best/worst economy tracking
- Mobile-optimized forms and displays
- Philippines fuel price integration

Please create src/pages/fuel/ with fuel tracking pages, src/components/fuel/ with fuel components, and implement comprehensive fuel economy tracking with analytics.
```

### Mobile and UI Components

**Prompt 17: Mobile-Optimized Components**
```
You are a React frontend developer specializing in mobile experiences. Your task is to create mobile-optimized components for the Car Maintenance Tracker with PWA capabilities.

Requirements:
1. Create mobile-first navigation and layout
2. Implement floating action buttons for quick actions
3. Add mobile-optimized forms and modals
4. Create swipe gestures and touch interactions
5. Implement PWA features and offline support
6. Add mobile-specific UI patterns

Components to create:
- MobileNavigation component with bottom tabs
- FloatingActionButton component for quick actions
- MobileForm component with optimized input
- MobileModal component for mobile dialogs
- SwipeableList component for gesture interactions
- OfflineIndicator component for PWA status
- PullToRefresh component for content updates

Key features:
- Bottom navigation bar for mobile
- Floating action buttons with multiple actions
- Touch-optimized forms and inputs
- Swipe gestures for lists and cards
- PWA offline capabilities
- Mobile-first responsive design
- Touch feedback and animations

Please create src/components/mobile/ with mobile-specific components, implement PWA configuration, and create mobile-optimized user experience patterns.
```

**Prompt 18: UI Components and Design System**
```
You are a React frontend developer creating a design system for the Car Maintenance Tracker. Your task is to create reusable UI components with consistent styling and accessibility.

Requirements:
1. Create comprehensive UI component library
2. Implement consistent design tokens and theming
3. Add proper accessibility features
4. Create responsive component variants
5. Implement proper form validation components
6. Add loading states and error handling

Components to create:
- Button component with variants and sizes
- Input component with validation and error states
- Card component for content containers
- Modal component for dialogs
- Toast component for notifications
- Skeleton component for loading states
- Badge component for status indicators
- Progress component for completion tracking

Key features:
- Consistent design tokens and theming
- Proper accessibility (ARIA labels, keyboard navigation)
- Responsive design variants
- Form validation and error handling
- Loading states and skeletons
- Toast notifications and feedback
- Status indicators and progress tracking

Please create src/components/ui/ with comprehensive UI component library, implement proper accessibility features, and create consistent design system with Tailwind CSS.
```

### State Management and Data Handling

**Prompt 19: State Management and Hooks**
```
You are a React frontend developer implementing state management and custom hooks for the Car Maintenance Tracker. Your task is to create efficient state management without Redux, using React hooks and context.

Requirements:
1. Create custom hooks for data fetching
2. Implement efficient state management patterns
3. Add proper error handling and loading states
4. Create caching strategies for API data
5. Implement optimistic updates for forms
6. Add proper TypeScript types and interfaces

Hooks to create:
- useVehicles hook for vehicle management
- useMaintenance hook for maintenance data
- useFuelTracking hook for fuel data
- useAuth hook for authentication state
- useApi hook for API communication
- useForm hook for form validation
- useDebounce hook for search inputs
- useLocalStorage hook for client-side storage

Context providers to create:
- AuthContext for authentication state
- VehicleContext for vehicle selection
- ThemeContext for theming
- ToastContext for notifications

Key features:
- Efficient data fetching with caching
- Proper error handling and loading states
- Optimistic updates for better UX
- TypeScript types and interfaces
- Custom hooks for common patterns
- Context providers for global state
- Form validation and handling

Please create src/hooks/ with custom hooks, src/contexts/ with context providers, and implement efficient state management patterns without Redux.
```

**Prompt 20: Data Visualization and Charts**
```
You are a React frontend developer implementing data visualization for the Car Maintenance Tracker. Your task is to create charts and graphs for fuel performance, maintenance trends, and cost analysis.

Requirements:
1. Implement fuel economy trend charts
2. Create maintenance timeline visualizations
3. Add cost analysis charts
4. Create performance comparison charts
5. Implement mobile-responsive charts
6. Add interactive chart features

Charts to implement:
- FuelEconomyTrendChart for km/L over time
- CostPerKmChart for cost tracking
- MaintenanceTimelineChart for service history
- MonthlyCostChart for expense tracking
- VehicleComparisonChart for multi-vehicle comparison
- FuelPerformanceChart for efficiency analysis

Key features:
- Interactive charts with tooltips
- Mobile-responsive chart sizing
- Trend analysis and annotations
- Period comparison features
- Data aggregation and filtering
- Export functionality for charts
- Performance optimization for large datasets

Please create src/components/charts/ with chart components using Chart.js or similar library, implement proper TypeScript types, and create mobile-responsive data visualization.
```

## DevOps Implementation Prompts

### Docker and Containerization

**Prompt 21: Docker Container Setup**
```
You are a DevOps engineer setting up Docker containers for the Car Maintenance Tracker. Your task is to create production-ready Docker configuration with proper security and optimization.

Requirements:
1. Create Dockerfile for frontend React application
2. Create Dockerfile for backend Flask application
3. Set up docker-compose.yml for orchestration
4. Implement proper container security
5. Add health checks and monitoring
6. Configure production optimization

Key configurations to implement:
- Multi-stage Docker build for frontend (React + Nginx)
- Python Docker image for backend Flask application
- MongoDB container configuration
- Redis container for rate limiting
- Nginx reverse proxy configuration
- Health check endpoints
- Environment variable management
- Security hardening

Features to implement:
- Multi-stage builds for optimized images
- Security scanning and hardening
- Health check endpoints
- Log aggregation and monitoring
- Volume management for data persistence
- Network configuration for container communication
- Production optimization settings

Please create Dockerfile for frontend, Dockerfile for backend, docker-compose.yml for orchestration, and implement proper container security and monitoring.
```

**Prompt 22: Production Deployment**
```
You are a DevOps engineer setting up production deployment for the Car Maintenance Tracker. Your task is to create production-ready deployment configuration with proper security and scalability.

Requirements:
1. Set up production server configuration
2. Implement SSL/TLS certificates
3. Configure domain and DNS settings
4. Set up monitoring and logging
5. Implement backup and disaster recovery
6. Create deployment automation

Key configurations to implement:
- Nginx production configuration with SSL
- Domain and DNS setup
- SSL certificate management (Let's Encrypt)
- Production environment variables
- Security headers and middleware
- Log aggregation and monitoring
- Backup strategies for MongoDB
- Deployment automation scripts

Features to implement:
- HTTPS configuration with proper certificates
- Security headers and CORS configuration
- Production database setup and security
- Monitoring and alerting setup
- Backup automation
- Deployment pipeline automation
- Performance optimization settings

Please create production deployment scripts, Nginx configuration files, SSL setup documentation, and implement proper production security and monitoring.
```

### CI/CD and Testing

**Prompt 23: CI/CD Pipeline Setup**
```
You are a DevOps engineer setting up CI/CD pipeline for the Car Maintenance Tracker. Your task is to create automated testing and deployment pipeline with proper quality gates.

Requirements:
1. Set up GitHub Actions workflow
2. Implement automated testing
3. Create build and deployment automation
4. Add code quality checks
5. Implement security scanning
6. Create environment-specific deployments

Key workflows to implement:
- Automated testing on pull requests
- Build and deploy to staging
- Production deployment with approval
- Code quality and security scanning
- Database migration automation
- Performance testing integration

Quality gates to implement:
- Backend unit tests (80%+ coverage)
- Frontend component testing
- ESLint and TypeScript checks
- Security vulnerability scanning
- Performance testing benchmarks
- Database migration validation

Features to implement:
- Automated testing workflow
- Build and deployment automation
- Code quality checks
- Security scanning integration
- Environment-specific deployments
- Rollback capabilities
- Deployment notifications

Please create .github/workflows/ with CI/CD pipelines, implement automated testing, and create proper quality gates for deployment.
```

**Prompt 24: Testing Infrastructure**
```
You are a QA engineer setting up testing infrastructure for the Car Maintenance Tracker. Your task is to create comprehensive testing setup with proper coverage and quality assurance.

Requirements:
1. Set up backend testing with Python unittest
2. Create frontend testing with React Testing Library
3. Implement integration testing
4. Add end-to-end testing with Playwright
5. Create performance testing setup
6. Implement security testing

Testing frameworks to use:
- Python unittest for backend testing
- React Testing Library for frontend components
- Playwright for end-to-end testing
- JMeter for performance testing
- OWASP ZAP for security testing
- Coverage.py for test coverage analysis

Test categories to implement:
- Unit tests for business logic
- Integration tests for API endpoints
- Component tests for React components
- E2E tests for user flows
- Performance tests for load testing
- Security tests for vulnerability scanning

Key features:
- Test coverage reporting (80%+ target)
- Automated test execution
- Performance benchmarking
- Security vulnerability scanning
- Cross-browser testing
- Mobile device testing
- Test data management

Please create comprehensive testing setup with proper test files, testing configuration, and automated test execution pipelines.
```

### Monitoring and Security

**Prompt 25: Monitoring and Logging**
```
You are a DevOps engineer setting up monitoring and logging for the Car Maintenance Tracker. Your task is to create comprehensive monitoring system with proper alerting and analytics.

Requirements:
1. Set up application monitoring
2. Implement error tracking
3. Create performance monitoring
4. Add user analytics
5. Implement log aggregation
6. Set up alerting system

Monitoring tools to implement:
- Application performance monitoring (APM)
- Error tracking and alerting
- Log aggregation and analysis
- User behavior analytics
- Server health monitoring
- Database performance monitoring
- Security event monitoring

Key features:
- Real-time application monitoring
- Error tracking with stack traces
- Performance metrics and dashboards
- User behavior analytics
- Log aggregation and search
- Automated alerting system
- Security event monitoring
- Uptime monitoring

Please create monitoring configuration, set up alerting rules, implement log aggregation, and create comprehensive monitoring dashboards for production oversight.
```

**Prompt 26: Security Hardening**
```
You are a security engineer implementing security hardening for the Car Maintenance Tracker. Your task is to create comprehensive security implementation addressing all vulnerabilities identified in the architectural review.

Requirements:
1. Implement proper JWT secret management
2. Add comprehensive input validation
3. Implement rate limiting and DDoS protection
4. Set up database security
5. Implement proper CORS and security headers
6. Create security monitoring and logging

Security measures to implement:
- Secure JWT secret key management
- Comprehensive input validation and sanitization
- Rate limiting with Redis
- Database security with authentication
- CORS protection for production
- Security headers (CSP, HSTS, XSS protection)
- SSL/TLS configuration
- Password security policies
- User enumeration protection

Key features:
- Secure configuration management
- Input validation and sanitization
- Rate limiting and abuse protection
- Database security hardening
- Web application firewall setup
- Security monitoring and logging
- Regular security scanning
- Incident response procedures

Please create comprehensive security implementation addressing all vulnerabilities from the architectural review, including proper JWT secret management, input validation, rate limiting, and production security configuration.
```

### Database and Performance

**Prompt 27: Database Optimization**
```
You are a database administrator optimizing MongoDB for the Car Maintenance Tracker. Your task is to create proper database schema, indexes, and performance optimization for production scale.

Requirements:
1. Design optimal MongoDB schema
2. Create proper database indexes
3. Implement database security
4. Set up data validation
5. Create backup and recovery procedures
6. Implement performance optimization

Database optimizations to implement:
- Schema design for efficient queries
- Index creation for performance
- Database user authentication
- Data validation rules
- Backup automation
- Query optimization
- Connection pooling
- Read/write scaling

Key features:
- Optimized MongoDB schema design
- Proper indexing strategy
- Database security configuration
- Automated backup procedures
- Performance monitoring
- Query optimization
- Data validation and integrity
- Scaling strategies

Please create optimized MongoDB schema design, proper indexing strategy, database security configuration, and performance optimization procedures for production deployment.
```

**Prompt 28: Performance Optimization**
```
You are a performance engineer optimizing the Car Maintenance Tracker for production scale. Your task is to implement comprehensive performance optimization for frontend, backend, and database.

Requirements:
1. Optimize frontend performance
2. Implement backend performance improvements
3. Optimize database queries
4. Add caching strategies
5. Implement CDN and asset optimization
6. Create performance monitoring

Performance optimizations to implement:
- Frontend: bundle splitting, lazy loading, image optimization
- Backend: query optimization, connection pooling, caching
- Database: indexing, query optimization, connection management
- Caching: Redis caching, browser caching, CDN caching
- Assets: image optimization, compression, CDN delivery
- Monitoring: performance metrics, load testing, optimization

Key features:
- Frontend bundle optimization
- Backend query optimization
- Database performance tuning
- Multi-layer caching strategy
- Asset optimization and CDN
- Performance monitoring
- Load testing and optimization
- Scalability improvements

Please create comprehensive performance optimization strategy covering frontend, backend, database, caching, and monitoring for production-scale deployment.
```

## Integration and Migration Prompts

**Prompt 29: Philippines Market Integration**
```
You are a backend developer implementing Philippines-specific features for the Car Maintenance Tracker. Your task is to integrate Philippines market requirements including fuel prices, maintenance schedules, and local optimizations.

Requirements:
1. Implement Philippines fuel price integration
2. Add Philippines-specific maintenance schedules
3. Create local currency support (PHP)
4. Implement Philippines driving condition adjustments
5. Add local vehicle model support
6. Create Philippines-specific insights and recommendations

Philippines-specific features to implement:
- Fuel price API integration for Philippines
- Maintenance schedules with 0.8 severity factor
- PHP currency support and formatting
- Local vehicle make/model database
- Philippines driving condition adjustments
- Tropical climate considerations
- Local service provider recommendations
- Philippines fuel efficiency standards

Key features:
- Real-time fuel price integration
- Philippines maintenance schedule database
- Local currency and formatting
- Vehicle model database for Philippines market
- Driving condition severity factors
- Tropical climate maintenance considerations
- Local service provider integration
- Philippines-specific insights

Please create Philippines-specific modules including fuel price integration, maintenance schedules, local vehicle database, and market-specific optimizations for the Philippines market.
```

**Prompt 30: PostgreSQL Migration Strategy**
```
You are a database architect creating PostgreSQL migration strategy for the Car Maintenance Tracker. Your task is to design comprehensive migration plan from MongoDB to PostgreSQL with proper data modeling and migration scripts.

Requirements:
1. Design PostgreSQL schema for all data models
2. Create migration scripts from MongoDB to PostgreSQL
3. Implement proper data validation during migration
4. Create rollback procedures
5. Set up performance optimization for PostgreSQL
6. Implement proper database security

PostgreSQL schema to design:
- Users table with authentication data
- Vehicles table with mileage tracking
- Maintenance items table with schedules
- Service records table with history
- Fill-ups table with fuel data
- Proper indexes and constraints
- Relationships and foreign keys

Migration strategy to implement:
- Data model conversion from MongoDB to PostgreSQL
- Migration scripts with validation
- Data integrity checks
- Performance optimization
- Rollback procedures
- Testing strategy
- Deployment plan

Key features:
- PostgreSQL schema design
- Data migration scripts
- Validation and integrity checks
- Performance optimization
- Security configuration
- Testing and validation
- Deployment automation

Please create comprehensive PostgreSQL migration strategy including schema design, migration scripts, validation procedures, and deployment plan for migrating from MongoDB to PostgreSQL.
```

## Usage Instructions

### How to Use These Prompts

1. **Backend Development**: Use prompts 1-9 for complete backend implementation
2. **Frontend Development**: Use prompts 10-20 for complete frontend implementation
3. **DevOps Implementation**: Use prompts 21-30 for deployment and operations

### Implementation Order

**Phase 1: Backend Foundation**
1. Database Setup and Models (Prompt 1)
2. Authentication System (Prompt 2)
3. Application Configuration (Prompt 9)

**Phase 2: Core Backend Features**
1. Vehicle Management API (Prompt 3)
2. Maintenance Management API (Prompt 4)
3. Fuel Tracking API (Prompt 5)
4. Dashboard API (Prompt 6)

**Phase 3: Business Logic**
1. Fuel Calculation Engine (Prompt 7)
2. Maintenance Engine (Prompt 8)

**Phase 4: Frontend Foundation**
1. Frontend Project Initialization (Prompt 10)
2. API Client and Authentication (Prompt 11)
3. UI Components and Design System (Prompt 18)

**Phase 5: Frontend Features**
1. Authentication Components (Prompt 12)
2. Vehicle Management Components (Prompt 13)
3. Dashboard Components (Prompt 14)
4. State Management and Hooks (Prompt 19)

**Phase 6: Advanced Frontend Features**
1. Maintenance Tracking Components (Prompt 15)
2. Fuel Tracking Components (Prompt 16)
3. Mobile-Optimized Components (Prompt 17)
4. Data Visualization and Charts (Prompt 20)

**Phase 7: DevOps and Deployment**
1. Docker Container Setup (Prompt 21)
2. Production Deployment (Prompt 22)
3. Testing Infrastructure (Prompt 24)
4. Security Hardening (Prompt 26)

**Phase 8: Advanced Features**
1. Philippines Market Integration (Prompt 29)
2. CI/CD Pipeline Setup (Prompt 23)
3. Monitoring and Logging (Prompt 25)
4. Database Optimization (Prompt 27)
5. Performance Optimization (Prompt 28)
6. PostgreSQL Migration Strategy (Prompt 30)

### Customization Guidelines

1. **Environment Specific**: Adjust prompts based on development environment
2. **Team Size**: Modify implementation approach based on team size and expertise
3. **Timeline**: Prioritize prompts based on project timeline and MVP requirements
4. **Technology Stack**: Adjust prompts if technology stack changes from specifications
5. **Market Requirements**: Customize Philippines-specific features for other markets if needed

### Quality Assurance

Each prompt includes requirements for:
- Comprehensive testing coverage
- Proper error handling
- Security best practices
- Performance optimization
- Mobile responsiveness
- Accessibility compliance
- Code quality standards

These prompts provide complete implementation guidance for building the Car Maintenance Tracker MVP with production-ready quality and security.