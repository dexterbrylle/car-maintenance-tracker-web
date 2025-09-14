# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Car Maintenance Tracker** - a smart proactive maintenance system that acts like your personal mechanic. Built with React frontend, Flask backend, and MongoDB, the application transforms from simple record-keeping to intelligent maintenance management that helps users stay ahead of their vehicle's needs.

### Smart Mechanic Philosophy

**The system should essentially act like a smart mechanic who knows your vehicle's full history and can tell you exactly what needs attention and when.**

Instead of just being a digital logbook, the system proactively:
- **Identifies maintenance needs** before they become critical
- **Provides realistic assessments** for used vehicles based on age and mileage
- **Tracks mileage progression** automatically from service records and fill-ups
- **Calculates maintenance timelines** based on actual vehicle usage patterns
- **Alerts users** to upcoming service requirements and potential issues

### Real-World Usage Pattern

The system is designed for how people actually maintain vehicles:
- Users add existing vehicles with known mileage and service history
- The system assesses likely maintenance status based on vehicle age and current mileage
- Users log services and fill-ups as they occur
- The system automatically tracks mileage progression and updates maintenance status
- Users receive proactive alerts about upcoming maintenance needs

### Reactive vs Proactive Approach

**Traditional (Reactive)**:
- User only knows about maintenance when they think to check
- System shows historical data but doesn't predict future needs
- Used vehicles appear to have "all maintenance up to date" regardless of actual condition

**Smart Mechanic (Proactive)**:
- System immediately flags likely overdue maintenance when adding used vehicles
- Shows maintenance timeline with upcoming service requirements
- Automatically updates status based on actual usage patterns
- Provides actionable insights and recommendations

## Development Commands

### Frontend Development
```bash
cd frontend
pnpm install          # Install dependencies
pnpm dev              # Start development server (http://localhost:3000)
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm lint             # Run ESLint for code quality
```

### Backend Development
```bash
cd backend
source .venv/bin/activate  # Activate virtual environment
pip install -r requirements.txt  # Install dependencies
python app.py                    # Start development server (http://localhost:5005)

# Run specific tests
python test_simple.py            # Basic functionality tests
python test_fuel_tracking.py      # Fuel tracking logic tests
python test_auth_isolation.py     # Authentication and security tests
python test_mazda_data.py         # Mazda data validation
python test_maintenance_creation.py  # Maintenance creation tests
```

### Docker Development
```bash
docker-compose up -d     # Start all services in production mode
docker-compose down       # Stop all services
docker-compose logs -f    # View logs
docker-compose logs backend  # View backend logs only
docker-compose logs frontend # View frontend logs only
```

### Testing
```bash
cd backend
source .venv/bin/activate      # Activate virtual environment

# Run individual test files
python test_simple.py            # Basic functionality tests
python test_fuel_tracking.py    # Fuel tracking logic tests
python test_calculations.py     # Fuel calculation accuracy tests
python test_auth_isolation.py   # Authentication and security tests
python test_mazda_data.py       # Mazda maintenance data validation
python test_maintenance_creation.py  # Maintenance item creation tests

# Run all tests (if run_tests.py exists)
python run_tests.py             # Comprehensive test suite
```

### API Documentation
- Development: http://localhost:5005/api/docs
- Production: http://localhost:8242/api/docs

## Architecture

### Frontend Structure (`frontend/`)
- **React 18** with TypeScript and Vite
- **Component Library**: Custom UI components using Radix UI primitives in `src/components/ui/`
- **Pages**: Main application views in `src/pages/`
- **State Management**: React hooks with local state (no Redux)
- **API Client**: Axios instance in `src/lib/api.ts`
- **Routing**: React Router with SPA support
- **Build Tool**: Vite with custom path aliases (`@/` for `src/`)
- **Styling**: Tailwind CSS with PostCSS
- **Linting**: ESLint with React hooks and refresh plugins
- **Mobile Components**: Mobile-optimized components in `src/components/mobile/`
- **Performance**: Virtualized tables and debounced inputs for large datasets
- **Authentication**: JWT-based auth with refresh tokens

### Backend Structure (`backend/`)
- **Flask 2.3.3** with Blueprint pattern
- **Routes**: Modular route handling in `routes/` directory
- **Models**: Data models and MongoDB schema in `models.py`
- **Authentication**: JWT-based auth system in `auth.py`
- **Security**: Security utilities in `security.py`
- **Rate Limiting**: Redis-based rate limiting in `rate_limiter.py`
- **Utils**: Utility functions for fuel calculations and insights in `utils/` directory
- **CORS**: Configured for both development and production
- **Swagger**: Auto-generated API documentation (OpenAPI 2.0)
- **Serialization**: Custom JSON encoder for MongoDB ObjectId and datetime
- **Python Version**: 3.11 with PyMongo driver
- **Data**: Vehicle-specific maintenance schedules in `data/` directory
- **Virtual Environment**: Uses `.venv` - activate with `source .venv/bin/activate`

### Database
- **MongoDB** with PyMongo driver
- **Collections**: users, vehicles, maintenance_items, service_records, fillups, refresh_tokens
- **ObjectIds**: Used as primary keys with proper serialization
- **Multi-tenant Architecture**: User isolation implemented with user_id fields
- **Authentication**: JWT-based with refresh token rotation

## Authentication System

### Current Implementation
- **JWT Authentication**: Access tokens (15 min) and refresh tokens (7 days)
- **User Management**: Registration, login, profile management, password reset
- **Multi-tenant Architecture**: User isolation with user_id fields
- **Subscription Tiers**: 'free', 'personal', 'family', 'business' levels
- **Security Features**: Rate limiting, input validation, password hashing
- **Session Management**: Refresh token rotation and revocation
- **User Isolation**: Database-level isolation with MongoDB indexes
- **404 Security**: Returns 404 instead of 403 for unauthorized access to prevent user enumeration

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Security Features
- **Rate Limiting**: 5 login attempts per 15 minutes, 100 API requests per minute
- **Input Validation**: Comprehensive validation with email-validator and custom sanitization
- **Password Security**: bcrypt hashing with minimum 8 characters, uppercase, lowercase, number, special character
- **Token Security**: JWT with secret key management and refresh token rotation
- **CORS Protection**: Configured origins for development and production

## Key Data Models

### User
```python
{
    '_id': ObjectId,
    'email': str,
    'password_hash': str,  # bcrypt
    'first_name': str,
    'last_name': str,
    'subscription_tier': str,  # 'free', 'personal', 'family', 'business'
    'is_verified': bool,
    'created_at': datetime,
    'updated_at': datetime
}
```

### Vehicle
```python
{
    '_id': ObjectId,
    'make': str,
    'model': str,
    'year': int,
    'initial_mileage': int,     # Mileage when user started tracking
    'current_mileage': int,     # Latest known mileage (auto-updates)
    'user_id': ObjectId,        # Multi-tenant architecture
    'created_at': datetime
}
```

**Dual Mileage Tracking System**:
- **initial_mileage**: Mileage when user began tracking the vehicle (baseline)
- **current_mileage**: Latest actual mileage, automatically updated from service records and fill-ups
- **Auto-update Logic**: current_mileage = MAX(current_mileage, service_mileage, fillup_odometer)
- **Validation**: Ensures current_mileage never decreases, only increases or stays same

### MaintenanceItem
```python
{
    '_id': ObjectId,
    'name': str,
    'category': str,
    'interval_km': int,
    'description': str,
    'action': str,  # 'Replace', 'Inspect', 'Lubricate', 'Tighten', 'Service'
    'vehicle_id': ObjectId,
    'created_at': datetime
}
```

### ServiceRecord
```python
{
    '_id': ObjectId,
    'vehicle_id': ObjectId,
    'maintenance_item_id': ObjectId,
    'date': datetime,
    'mileage': int,
    'cost': float,
    'notes': str,
    'created_at': datetime
}
```

### FillUp
```python
{
    '_id': ObjectId,
    'vehicle_id': ObjectId,
    'date': datetime,
    'odometer_km': int,
    'liters': float,
    'price_per_liter': float,
    'total_cost': float,
    'full_tank': bool,
    'fuel_economy_kmpl': float,  # Calculated
    'cost_per_km': float,  # Calculated
    'notes': str,
    'created_at': datetime
}
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Vehicles
- `GET /api/vehicles` - Get all vehicles (user-scoped)
- `POST /api/vehicles` - Add new vehicle
- `PUT /api/vehicles/{id}` - Update vehicle
- `DELETE /api/vehicles/{id}` - Delete vehicle

### Maintenance
- `GET /api/maintenance/{vehicleId}` - Get maintenance items for vehicle
- `POST /api/maintenance` - Add maintenance item

### Services
- `GET /api/services/{vehicleId}` - Get service records for vehicle
- `POST /api/services` - Add service record
- `PUT /api/services/{id}` - Update service record
- `DELETE /api/services/{id}` - Delete service record

### Fuel Tracking
- `POST /api/fillups` - Add new fill-up record
- `GET /api/fillups/{vehicleId}` - Get fill-ups for vehicle with pagination
- `PUT /api/fillups/{fillupId}` - Update fill-up record
- `DELETE /api/fillups/{fillupId}` - Delete fill-up record
- `GET /api/fillups/stats/{vehicleId}` - Get fuel statistics for vehicle
- `GET /api/fillups/recent/{vehicleId}` - Get recent fill-ups for dashboard

### Export
- `POST /api/export/service-history` - Export service history
- `GET /api/export/history` - Get export history
- `GET /api/export/download/{exportId}` - Download exported file

### Dashboard
- `GET /api/dashboard/{vehicleId}` - Get maintenance status overview

### Health
- `GET /api/health` - Health check endpoint

## Enhanced Features

### Vehicle-Specific Maintenance Schedules
- **Mazda CX-5 2016**: Official maintenance schedule data in `backend/data/mazda_cx5_2016_philippines.py`
- **Automatic Detection**: Identifies Mazda CX-5 2014-2017 models for automatic schedule population
- **Philippines-Specific**: Optimized for severe driving conditions
- **Sync Script**: Command-line tool for updating maintenance schedules

### Dashboard Intelligence
- **Maintenance Status**: Due now, due soon, and OK items with smart calculations
- **Priority Sorting**: Overdue items first, then by due date
- **Smart Calculations**: Based on last service and purchase mileage
- **Export Functionality**: Service history export to CSV/Excel formats

### Fuel Tracking System
- **Fill-Up Management**: Complete fuel fill-up tracking with odometer readings
- **Automatic Calculations**: Fuel economy (km/L) and cost per kilometer calculations
- **Performance Analytics**: Monthly fuel cost trends and performance insights
- **Data Validation**: Comprehensive validation for odometer progression and data integrity
- **Statistics Dashboard**: Comprehensive fuel statistics with best/worst economy tracking
- **Trend Analysis**: Fuel efficiency trends with improvement/decline detection

### Export Functionality
- **Service History Export**: Export service records to CSV and Excel formats
- **Custom Date Ranges**: Flexible date range selection for exports
- **Multiple Formats**: Support for different export formats and templates
- **Download Management**: Export history and download tracking

## Development Conventions

### Frontend
- **Functional Components**: Use function components with hooks
- **TypeScript**: Strict type checking with proper interfaces
- **Imports**: Use path aliases (`@/` for `src/`)
- **Styling**: Tailwind CSS utility classes
- **Components**: Create reusable components in `src/components/`
- **Authentication**: Use JWT tokens stored in localStorage with axios interceptors

### Backend
- **Blueprints**: Use Flask Blueprint pattern for modular routes
- **Error Handling**: Try/catch blocks with proper error responses
- **Serialization**: Convert ObjectIds to strings for JSON responses
- **Environment**: Use `os.getenv()` for configuration
- **Authentication**: Use `@token_required` decorator for protected routes
- **Security**: Use input validation and sanitization from `security.py`
- **Rate Limiting**: Use `@rate_limit` decorator for API endpoints

### Database
- **MongoDB**: Use PyMongo for database operations
- **ObjectIds**: Convert to strings for API responses
- **Validation**: Basic validation in route handlers
- **User Isolation**: Always include `user_id` in queries for multi-tenant architecture
- **Security**: Use password hashing and proper session management

## Configuration

### Environment Variables
- `VITE_API_URL`: Frontend API base URL (defaults appropriate for dev/prod)
- `FLASK_ENV`: Flask environment (development/production)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET_KEY`: JWT signing secret (CRITICAL - change in production)
- `REDIS_URL`: Redis connection for rate limiting (optional)

### Docker Configuration
- **Frontend**: Nginx serving static files (port 80)
- **Backend**: Flask production server (port 5000)
- **Database**: MongoDB container (port 27017)
- **Reverse Proxy**: Nginx routing API calls to backend
- **Health Checks**: Backend health endpoint at `/health`
- **Data Persistence**: MongoDB volumes for data persistence
- **Environment**: Production configuration with security headers

**Development vs Production Ports**:
- Development: Frontend (3000), Backend (5005)
- Production: Frontend (80), Backend (5000), API proxy through nginx

## Common Issues

### CORS Issues
- Frontend dev server runs on port 3000
- Backend dev server runs on port 5005
- CORS configured for both development and production
- Docker uses different ports (80 frontend, 5000 backend)

### MongoDB Connection
- Ensure MongoDB is running (Docker or local)
- Check connection string in environment variables
- Verify database permissions
- Docker uses port 27017 for MongoDB with container networking
- Development can use local MongoDB or Docker container

### Build Issues
- Clear node modules and reinstall: `rm -rf node_modules && pnpm install`
- Check Python virtual environment activation: `source .venv/bin/activate`
- Verify all dependencies are installed
- Check Dockerfile syntax and dependencies

### Authentication Issues
- Ensure JWT_SECRET_KEY is set in environment variables
- Check Redis connection for rate limiting
- Verify user isolation in database queries
- Check token expiration and refresh logic

## File Structure

```
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── ui/        # Radix UI components
│   │   │   └── mobile/    # Mobile-specific components
│   │   ├── pages/          # Page components
│   │   ├── lib/           # Utilities and API client
│   │   └── types/         # TypeScript interfaces
│   ├── public/            # Static assets
│   └── package.json       # Dependencies and scripts
├── backend/
│   ├── routes/           # Flask route blueprints
│   │   ├── auth.py       # Authentication routes
│   │   ├── vehicles.py   # Vehicle management
│   │   ├── maintenance.py # Maintenance tracking
│   │   ├── services.py   # Service records
│   │   ├── fillups.py    # Fuel tracking
│   │   ├── export.py     # Export functionality
│   │   └── dashboard.py  # Dashboard data
│   ├── utils/            # Business logic utilities
│   │   ├── fuel_calculations.py  # Fuel economy calculations
│   │   └── insights.py           # Data insights
│   ├── data/             # Vehicle-specific data
│   │   └── mazda_cx5_2016_philippines.py
│   ├── models.py         # Data models
│   ├── auth.py           # Authentication system
│   ├── security.py       # Security utilities
│   ├── rate_limiter.py   # Rate limiting
│   ├── app.py            # Flask application
│   └── requirements.txt  # Python dependencies
├── docs/                 # Documentation
│   ├── PRODUCTION_READINESS_ANALYSIS.md
│   └── security_gaps.md
├── backend/TESTING_STRATEGY.md  # Comprehensive testing strategy
├── BACKEND_DOCUMENTATION.md    # Detailed backend documentation
├── docker-compose.yml    # Docker orchestration
└── README.md            # Project documentation
```

## Security Considerations

### Current Security Status (feature/authentication branch)
- **Authentication**: JWT-based with refresh tokens
- **User Isolation**: Multi-tenant architecture with user_id fields
- **Rate Limiting**: Redis-based rate limiting for API endpoints
- **Input Validation**: Comprehensive validation and sanitization
- **Password Security**: bcrypt hashing with complexity requirements
- **CORS Protection**: Configured for development and production
- **Security Headers**: Basic security headers implemented

### Production Security Requirements
- **JWT Secret**: Must change default JWT_SECRET_KEY
- **HTTPS**: Enable SSL/TLS for production
- **Database Security**: Enable MongoDB authentication and SSL
- **Environment Variables**: Secure all sensitive configuration
- **Monitoring**: Implement security monitoring and logging

## Testing

### Backend Tests
- `test_simple.py` - Basic functionality tests
- `test_fuel_tracking.py` - Fuel tracking logic tests
- `test_calculations.py` - Fuel calculation accuracy tests
- `test_auth_isolation.py` - Authentication and user isolation tests
- `test_mazda_data.py` - Mazda maintenance schedule data validation
- `test_maintenance_creation.py` - Maintenance item creation and interval verification
- Tests use Python's built-in unittest framework

### Test Coverage
- Authentication flow and security measures
- Fuel calculations and validation
- Data model operations
- API endpoint responses
- Error handling scenarios
- User isolation and multi-tenant architecture
- Vehicle-specific maintenance schedules
- Database security patterns

### Testing Strategy
The project follows a comprehensive testing strategy documented in `backend/TESTING_STRATEGY.md`:
- **Unit Tests**: 80%+ coverage for core business logic
- **Integration Tests**: Database operations and API interactions
- **Security Tests**: Authentication, authorization, and input validation
- **Performance Tests**: Calculation efficiency and query optimization
- **Test Categories**: Unit, integration, functional, security, and performance tests
- **Test Data Management**: Builders, fixtures, and isolation patterns

**Important**: Always activate the virtual environment when working with backend:
```bash
cd backend
source .venv/bin/activate
```

## Project Documentation

The project includes comprehensive documentation:

### Backend Documentation (`BACKEND_DOCUMENTATION.md`)
- Complete system architecture and component overview
- API endpoint documentation with examples
- Security implementation details
- Database schema and indexes
- Performance optimization strategies
- Production deployment recommendations

### Testing Strategy (`backend/TESTING_STRATEGY.md`)
- Comprehensive testing philosophy and framework
- Test coverage analysis and goals
- Test categories (unit, integration, security, performance)
- Test data management and mocking strategies
- CI/CD integration plans
- Future testing improvements roadmap

### Security Analysis
- `docs/PRODUCTION_READINESS_ANALYSIS.md` - Production readiness assessment
- `docs/security_gaps.md` - Security vulnerability analysis
- Authentication and authorization patterns
- Rate limiting and input validation
- Multi-tenant security implementation

### API Collection Files
- `car-maintenance-tracker-api-postman.json` - Postman collection
- `car-maintenance-tracker-api-insomnia.json` - Insomnia collection
- Pre-configured API requests for testing and development