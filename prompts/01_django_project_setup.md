# Django Project Setup and Configuration

Create a Django project with the following structure and configuration for the Car Maintenance Tracker MVP.

## Requirements:
1. Create Django project named `backend`
2. Create Django apps: `vehicles`, `fuel_tracking`, `maintenance`, `users`
3. Configure Django settings for Supabase integration
4. Set up Django REST Framework
5. Configure CORS and security settings
6. Create environment variables setup
7. Create requirements.txt

## Implementation Steps:

1. Create the Django project structure:
```bash
# Create Django project
django-admin startproject backend

# Create Django apps
python manage.py startapp vehicles
python manage.py startapp fuel_tracking
python manage.py startapp maintenance
python manage.py startapp users
```

2. Update backend/settings.py with:
- Database configuration for Supabase/PostgreSQL
- Django REST Framework integration
- CORS configuration
- Security settings
- Installed apps

3. Create backend/.env.example for environment variables

4. Create backend/requirements.txt with all dependencies

5. Create initial project structure with:
- backend/backend/urls.py (project URLs)
- backend/backend/asgi.py (ASGI config)
- backend/backend/wsgi.py (WSGI config)

The configuration should support:
- PostgreSQL database connection to Supabase
- JWT authentication (via Django REST Framework Simple JWT)
- CORS for React frontend
- Security headers
- Environment-based configuration

## Files to create:
- backend/settings.py (complete configuration)
- backend/.env.example
- backend/requirements.txt
- backend/backend/urls.py
- Update each app's apps.py with proper app configuration

Focus on creating a production-ready Django setup that can handle the MVP requirements while being secure and maintainable.