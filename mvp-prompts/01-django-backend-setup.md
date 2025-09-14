# Car Maintenance Tracker MVP Implementation Prompts

## Prompt 1: Django Backend Setup

**Objective**: Create a fresh Django backend project with Supabase integration for the Car Maintenance Tracker MVP.

**Context**: You are implementing a car maintenance tracking system focused on the Philippines market. The backend will use Django with Supabase for database and authentication.

**Requirements**:
- Set up Django project with proper structure
- Configure Supabase integration
- Install required dependencies
- Create Django apps for vehicles, fuel_tracking, maintenance, and users
- Configure settings for development and production

**Steps to implement**:

1. **Create Django Project**:
```bash
# Create project directory and navigate to it
mkdir car-maintenance-tracker-mvp
cd car-maintenance-tracker-mvp

# Create Django project
django-admin startproject backend
cd backend

# Create Django apps
python manage.py startapp vehicles
python manage.py startapp fuel_tracking
python manage.py startapp maintenance
python manage.py startapp users
```

2. **Install Dependencies**:
```bash
# Create requirements.txt
cat > requirements.txt << 'EOF'
Django==4.2.7
djangorestframework==3.14.0
django-cors-headers==4.3.1
python-dotenv==1.0.0
psycopg2-binary==2.9.9
supabase==2.3.0
Pillow==10.1.0
django-filter==23.5
gunicorn==21.2.0
whitenoise==6.6.0
```

3. **Configure Django Settings** (backend/settings.py):
```python
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-change-me-in-production')

DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '.your-domain.com']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'django_filters',
    'vehicles',
    'fuel_tracking',
    'maintenance',
    'users',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# Database Configuration (Supabase)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'postgres'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': '5432',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Manila'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
    ],
}

# CORS configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://your-domain.com",
]

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
SUPABASE_JWT_SECRET = os.getenv('SUPABASE_JWT_SECRET')

# Custom user model
AUTH_USER_MODEL = 'users.User'
```

4. **Create Custom User Model** (users/models.py):
```python
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    phone = models.CharField(max_length=20, blank=True)
    subscription_tier = models.CharField(
        max_length=20,
        choices=[
            ('free', 'Free'),
            ('personal', 'Personal'),
            ('family', 'Family'),
            ('business', 'Business'),
        ],
        default='free'
    )
    is_verified = models.BooleanField(default=False)
    timezone = models.CharField(max_length=50, default='Asia/Manila')
    currency = models.CharField(max_length=3, default='PHP')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def __str__(self):
        return self.email
```

5. **Create URLs configuration** (backend/urls.py):
```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/vehicles/', include('vehicles.urls')),
    path('api/fuel-tracking/', include('fuel_tracking.urls')),
    path('api/maintenance/', include('maintenance.urls')),
]
```

6. **Create .env template** (.env.example):
```bash
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True

# Database Configuration (Supabase)
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_HOST=db.your-project.supabase.co
DB_PORT=5432

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret

# CORS Settings
ALLOWED_HOSTS=localhost,127.0.0.1
```

**Expected Output**: A fully configured Django project with Supabase integration, ready for implementing the car maintenance tracker models and API endpoints.

**Validation Steps**:
1. Run `python manage.py makemigrations` - should work without errors
2. Run `python manage.py migrate` - should connect to Supabase and create tables
3. Run `python manage.py runserver` - should start the development server
4. Access admin at http://localhost:8000/admin/ - should load properly