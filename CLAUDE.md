# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Car Maintenance Tracker** - a full-stack web application for tracking vehicle maintenance schedules and service history. Built with React frontend, Flask backend, and MongoDB.

## Development Commands

### Frontend Development
```bash
cd frontend
pnpm install          # Install dependencies
pnpm dev              # Start development server (http://localhost:3000)
pnpm build            # Build for production
pnpm preview          # Preview production build
```

### Backend Development
```bash
cd backend
pip install -r requirements.txt  # Install dependencies
python app.py                    # Start development server (http://localhost:5005)
```

### Docker Development
```bash
docker-compose up -d     # Start all services in production mode
docker-compose down       # Stop all services
docker-compose logs -f    # View logs
```

### API Documentation
- Development: http://localhost:5005/api/docs
- Production: http://localhost/api/docs

## Architecture

### Frontend Structure (`frontend/`)
- **React 18** with TypeScript and Vite
- **Component Library**: Custom UI components using Radix UI primitives in `src/components/ui/`
- **Pages**: Main application views in `src/pages/`
- **State Management**: React hooks with local state
- **API Client**: Axios instance in `src/lib/api.ts`
- **Routing**: React Router with navigation component

### Backend Structure (`backend/`)
- **Flask 2.3.3** with Blueprint pattern
- **Routes**: Modular route handling in `routes/` directory
- **Models**: Data models and MongoDB schema in `models.py`
- **Services**: Business logic separation (for future expansion)
- **CORS**: Configured for frontend development
- **Swagger**: Auto-generated API documentation

### Database
- **MongoDB** with PyMongo driver
- **Collections**: vehicles, maintenance_items, service_records
- **ObjectIds**: Used as primary keys with proper serialization

## Key Data Models

### Vehicle
```typescript
interface Vehicle {
  _id: string;
  make: string;
  model: string;
  year: number;
  current_mileage: number;
  created_at: string;
}
```

### MaintenanceItem
```typescript
interface MaintenanceItem {
  _id: string;
  name: string;
  category: string;
  interval_km: number;
  description?: string;
  vehicle_id: string;
}
```

### ServiceRecord
```typescript
interface ServiceRecord {
  _id: string;
  vehicle_id: string;
  maintenance_item_id: string;
  date: string;
  mileage: number;
  cost: number;
  notes?: string;
  created_at: string;
}
```

## API Endpoints

### Vehicles
- `GET /api/vehicles` - Get all vehicles
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

### Dashboard
- `GET /api/dashboard/{vehicleId}` - Get maintenance status overview

### Health
- `GET /api/health` - Health check endpoint

## Development Conventions

### Frontend
- **Functional Components**: Use function components with hooks
- **TypeScript**: Strict type checking with proper interfaces
- **Imports**: Use path aliases (`@/` for `src/`)
- **Styling**: Tailwind CSS utility classes
- **Components**: Create reusable components in `src/components/`

### Backend
- **Blueprints**: Use Flask Blueprint pattern for modular routes
- **Error Handling**: Try/catch blocks with proper error responses
- **Serialization**: Convert ObjectIds to strings for JSON responses
- **Environment**: Use `os.getenv()` for configuration

### Database
- **MongoDB**: Use PyMongo for database operations
- **ObjectIds**: Convert to strings for API responses
- **Validation**: Basic validation in route handlers

## Configuration

### Environment Variables
- `VITE_API_URL`: Frontend API base URL (defaults appropriate for dev/prod)
- `FLASK_ENV`: Flask environment (development/production)
- `MONGODB_URI`: MongoDB connection string

### Docker Configuration
- **Frontend**: Nginx serving static files
- **Backend**: Gunicorn with Flask app
- **Database**: MongoDB container
- **Reverse Proxy**: Nginx routing

## Common Issues

### CORS Issues
- Frontend dev server runs on port 3000
- Backend dev server runs on port 5005
- CORS configured for both development and production

### MongoDB Connection
- Ensure MongoDB is running (Docker or local)
- Check connection string in environment variables
- Verify database permissions

### Build Issues
- Clear node modules and reinstall: `rm -rf node_modules && pnpm install`
- Check Python virtual environment activation
- Verify all dependencies are installed

## File Structure

```
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── lib/           # Utilities and API client
│   │   └── types/         # TypeScript interfaces
│   ├── public/            # Static assets
│   └── package.json       # Dependencies and scripts
├── backend/
│   ├── routes/           # Flask route blueprints
│   ├── models.py         # Data models
│   ├── app.py            # Flask application
│   └── requirements.txt  # Python dependencies
├── docker-compose.yml    # Docker orchestration
└── README.md            # Project documentation
```