## Prompt 6: Deployment and Configuration

**Objective**: Set up deployment configuration for the Car Maintenance Tracker MVP using Docker Compose and Cloudflare Tunnel for homelab deployment.

**Context**: You need to configure the deployment infrastructure for both development and production environments, including Docker, environment variables, and cloud deployment.

**Requirements**:
- Create Docker configuration for Django and React
- Configure Docker Compose for development
- Set up Cloudflare Tunnel for public access
- Configure environment variables for all environments
- Create deployment scripts
- Set up database migrations and data seeding

**Implementation Steps**:

1. **Create Dockerfile for Backend** (backend/Dockerfile):
```dockerfile
# Use official Python runtime as base image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "backend.wsgi:application"]
```

2. **Create Dockerfile for Frontend** (frontend/Dockerfile):
```dockerfile
# Build stage
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

3. **Create Nginx Configuration** (frontend/nginx.conf):
```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html index.htm;

        location / {
            try_files $uri $uri/ /index.html;
            add_header Cache-Control "no-cache";
        }

        location /static/ {
            alias /app/staticfiles/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # API proxy to backend
        location /api/ {
            proxy_pass http://backend:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
}
```

4. **Create Docker Compose Configuration** (docker-compose.yml):
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DEBUG=True
      - SECRET_KEY=${SECRET_KEY}
      - DB_NAME=${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_HOST=${DB_HOST}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
      - SUPABASE_JWT_SECRET=${SUPABASE_JWT_SECRET}
    volumes:
      - ./backend:/app
    depends_on:
      - db
    networks:
      - app-network

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    environment:
      - VITE_API_URL=http://localhost:8000/api
      - VITE_SUPABASE_URL=${SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    depends_on:
      - backend
    networks:
      - app-network

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

5. **Create Production Docker Compose** (docker-compose.prod.yml):
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    environment:
      - DEBUG=False
      - SECRET_KEY=${SECRET_KEY}
      - DB_NAME=${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_HOST=${DB_HOST}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
      - SUPABASE_JWT_SECRET=${SUPABASE_JWT_SECRET}
      - ALLOWED_HOSTS=${ALLOWED_HOSTS}
    volumes:
      - static_volume:/app/staticfiles
    restart: unless-stopped
    networks:
      - app-network

  frontend:
    build: ./frontend
    environment:
      - VITE_API_URL=https://${DOMAIN_NAME}/api
      - VITE_SUPABASE_URL=${SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    restart: unless-stopped
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.prod.conf:/etc/nginx/nginx.conf
      - static_volume:/static
      - certbot-etc:/etc/letsencrypt
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
    networks:
      - app-network

  certbot:
    image: certbot/certbot
    volumes:
      - certbot-etc:/etc/letsencrypt
    entrypoint: "/bin/sh -c 'if [ -e /etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem ]; then exit 0; fi; certbot certonly --standalone --email ${EMAIL} -d ${DOMAIN_NAME} --agree-tos --no-eff-email --force-renewal'"

volumes:
  static_volume:
  certbot-etc:

networks:
  app-network:
    driver: bridge
```

6. **Create Production Nginx Configuration** (nginx.prod.conf):
```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    server {
        listen 80;
        server_name ${DOMAIN_NAME} www.${DOMAIN_NAME};
        server_tokens off;

        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name ${DOMAIN_NAME} www.${DOMAIN_NAME};
        server_tokens off;

        # SSL configuration
        ssl_certificate /etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/${DOMAIN_NAME}/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' ${SUPABASE_URL};" always;

        # Static files
        location /static/ {
            alias /static/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # API endpoints with rate limiting
        location /api/auth/ {
            limit_req zone=login burst=10 nodelay;
            proxy_pass http://backend:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Frontend
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
            add_header Cache-Control "no-cache";
        }

        # Gzip compression
        gzip on;
        gzip_vary on;
        gzip_proxied any;
        gzip_comp_level 6;
        gzip_types
            text/plain
            text/css
            text/xml
            text/javascript
            application/javascript
            application/xml+rss
            application/json;
    }
}
```

7. **Create Environment Files**:

**Development Environment** (.env.dev):
```bash
# Django Settings
SECRET_KEY=django-insecure-dev-key-change-in-production
DEBUG=True

# Database Configuration (Supabase)
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-dev-db-password
DB_HOST=db.your-project.supabase.co
DB_PORT=5432

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret

# Frontend Configuration
VITE_API_URL=http://localhost:8000/api
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SUPABASE_KEY}
```

**Production Environment** (.env.prod):
```bash
# Django Settings
SECRET_KEY=your-secure-secret-key-for-production
DEBUG=False

# Database Configuration (Supabase)
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-production-db-password
DB_HOST=db.your-project.supabase.co
DB_PORT=5432

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-service-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret

# Deployment Configuration
DOMAIN_NAME=your-domain.com
EMAIL=your-email@example.com
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# Frontend Configuration
VITE_API_URL=https://your-domain.com/api
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

8. **Create Deployment Scripts**:

**Development Setup Script** (scripts/dev-setup.sh):
```bash
#!/bin/bash

echo "🚀 Setting up Car Maintenance Tracker MVP Development Environment..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.dev .env
    echo "⚠️  Please update the .env file with your actual configuration"
fi

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run database migrations
echo "📊 Running database migrations..."
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate

# Create superuser (interactive)
echo "👤 Creating superuser..."
docker-compose exec backend python manage.py createsuperuser

# Load initial data
echo "📝 Loading initial maintenance schedules..."
docker-compose exec backend python manage.py loaddata maintenance/fixtures/initial_schedules.json

echo "✅ Development environment setup complete!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000/api"
echo "📊 Admin: http://localhost:8000/admin"
echo "📖 Documentation available at: http://localhost:8000/docs"
```

**Production Deployment Script** (scripts/deploy.sh):
```bash
#!/bin/bash

set -e

echo "🚀 Deploying Car Maintenance Tracker MVP to Production..."

# Check if .env.prod exists
if [ ! -f .env.prod ]; then
    echo "❌ .env.prod file not found. Please create it first."
    exit 1
fi

# Load production environment
export $(cat .env.prod | xargs)

# Backup current deployment
echo "💾 Creating backup..."
docker-compose -f docker-compose.prod.yml exec backend python manage.py dbbackup

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Build and deploy
echo "🏗️  Building and deploying..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 20

# Run migrations
echo "📊 Running database migrations..."
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Collect static files
echo "📁 Collecting static files..."
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput

# Update SSL certificates
echo "🔒 Updating SSL certificates..."
docker-compose -f docker-compose.prod.yml up certbot

# Restart nginx to apply new certificates
docker-compose -f docker-compose.prod.yml restart nginx

echo "✅ Production deployment complete!"
echo "🌐 Application available at: https://${DOMAIN_NAME}"
echo "📊 Health check: https://${DOMAIN_NAME}/api/health"
```

9. **Create Cloudflare Tunnel Setup** (scripts/cloudflare-setup.sh):
```bash
#!/bin/bash

echo "🌐 Setting up Cloudflare Tunnel..."

# Install cloudflared if not installed
if ! command -v cloudflared &> /dev/null; then
    echo "Installing cloudflared..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install cloudflared
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Add Linux installation commands
        wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
        sudo dpkg -i cloudflared-linux-amd64.deb
    fi
fi

# Create tunnel
echo "Creating Cloudflare tunnel..."
cloudflared tunnel create car-maintenance-tracker

# Get tunnel credentials
TUNNEL_UUID=$(cloudflared tunnel list | grep car-maintenance-tracker | awk '{print $1}')
echo "Tunnel UUID: ${TUNNEL_UUID}"

# Create config file
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml << EOF
tunnel: ${TUNNEL_UUID}
credentials-file: ~/.cloudflared/${TUNNEL_UUID}.json

ingress:
  - hostname: ${DOMAIN_NAME}
    service: http://localhost:8000
  - service: http_status:404
EOF

# Configure DNS
echo "Configuring DNS records..."
cloudflared tunnel route dns ${TUNNEL_UUID} ${DOMAIN_NAME}

# Run tunnel
echo "Starting Cloudflare tunnel..."
cloudflared tunnel run ${TUNNEL_UUID}

echo "✅ Cloudflare tunnel setup complete!"
echo "🌐 Your application is now accessible via Cloudflare tunnel"
```

10. **Create Health Check Endpoint** (backend/health_check.py):
```python
import json
from django.http import JsonResponse
from django.db import connections
from django.core.cache import cache
from django.views.decorators.http import require_http_methods

@require_http_methods(["GET"])
def health_check(request):
    """Health check endpoint for monitoring"""
    try:
        # Check database connection
        with connections['default'].cursor() as cursor:
            cursor.execute("SELECT 1")
            db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    # Check cache
    try:
        cache.set('health_check', 'ok', 1)
        cache.get('health_check')
        cache_status = "healthy"
    except Exception as e:
        cache_status = f"unhealthy: {str(e)}"

    # Check external services (Supabase)
    try:
        # Add Supabase health check here
        external_status = "healthy"
    except Exception as e:
        external_status = f"unhealthy: {str(e)}"

    health_data = {
        "status": "healthy" if all([
            db_status == "healthy",
            cache_status == "healthy",
            external_status == "healthy"
        ]) else "degraded",
        "timestamp": timezone.now().isoformat(),
        "version": "1.0.0",
        "components": {
            "database": db_status,
            "cache": cache_status,
            "external_services": external_status,
        },
        "checks": {
            "database": db_status == "healthy",
            "cache": cache_status == "healthy",
            "external_services": external_status == "healthy",
        }
    }

    status_code = 200 if health_data["status"] == "healthy" else 503
    return JsonResponse(health_data, status=status_code)
```

**Expected Output**: Complete deployment configuration including Docker setup, Cloudflare tunnel, environment variables, and deployment scripts for the Car Maintenance Tracker MVP.

**Validation Steps**:
1. Test Docker Compose development setup
2. Verify all services start correctly
3. Test database migrations
4. Verify SSL certificate generation
5. Test Cloudflare tunnel configuration
6. Validate health check endpoint