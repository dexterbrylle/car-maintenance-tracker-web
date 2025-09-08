# Car Maintenance Tracker - Docker Deployment

This project provides a complete Docker deployment setup for the Car Maintenance Tracker application, including backend (Flask + MongoDB), frontend (React + nginx), and database services.

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- No local MongoDB required (included in the stack)

### Deployment Steps

1. **Build and start all containers:**
```bash
docker-compose up -d
```

2. **Check container status:**
```bash
docker-compose ps
```

3. **Access the application:**
- Frontend: http://localhost:80
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api/docs

## Architecture

The Docker stack consists of three main services:

### 1. Backend Service
- **Image**: Custom build from `./backend`
- **Port**: 5000 (host) → 5000 (container)
- **Environment**: 
  - `MONGODB_URI=mongodb://mongodb:27017/maintenance_tracker`
  - `FLASK_ENV=production`
- **Dependencies**: MongoDB service
- **Features**: Flask API with CORS, MongoDB integration, health checks

### 2. Frontend Service
- **Image**: Multi-stage build (Node.js + nginx)
- **Port**: 80 (host) → 80 (container)
- **Dependencies**: Backend service
- **Features**: React app served by nginx with API proxy

### 3. MongoDB Service
- **Image**: mongo:7
- **Port**: 27017 (host) → 27017 (container)
- **Volume**: Persistent data storage
- **Features**: Document database for vehicle maintenance data

## Configuration

### Environment Variables

#### Backend (.env.production)
```
MONGODB_URI=mongodb://mongodb:27017/maintenance_tracker
FLASK_ENV=production
FLASK_DEBUG=False
```

#### Frontend
The frontend automatically detects production environment and routes API calls through nginx proxy.

### Nginx Configuration
- **Static Files**: Served from `/usr/share/nginx/html`
- **API Proxy**: Routes `/api/*` requests to backend service
- **SPA Support**: Fallback to `index.html` for client-side routing

## Data Persistence

MongoDB data is persisted using Docker volumes:
```yaml
volumes:
  mongodb_data:
```

The volume is created automatically and persists across container restarts.

## Health Checks

### Backend Health Check
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### Service Health
```bash
# Check all services
docker-compose ps

# View logs
docker-compose logs -f [service-name]

# Test API through frontend proxy
curl http://localhost:80/api/vehicles
```

## Development vs Production

### Development (Local)
- Frontend: `http://localhost:3000` (Vite dev server)
- Backend: `http://localhost:5000` (Flask dev server)
- API calls: Direct to backend

### Production (Docker)
- Frontend: `http://localhost:80` (nginx)
- Backend: `http://localhost:5000` (Flask production)
- API calls: Proxied through nginx (`/api/*`)

## Common Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (data loss!)
docker-compose down -v

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# Rebuild and restart
docker-compose build
docker-compose up -d

# Access individual containers
docker-compose exec backend bash
docker-compose exec mongodb mongosh
```

## Cloudflare Tunnel Setup (Optional)

For remote access, configure Cloudflare tunnel:

1. **Install cloudflared:**
```bash
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
```

2. **Create tunnel:**
```bash
cloudflared tunnel create maintenance-tracker
```

3. **Configure tunnel** (`~/.cloudflared/config.yml`):
```yaml
tunnel: your-tunnel-id
credentials-file: /home/user/.cloudflared/your-tunnel-id.json

ingress:
  - hostname: maintenance.yourdomain.com
    service: http://localhost:80
  - service: http_status:404
```

## Backup Strategy

### MongoDB Backup Script
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec car-maintenance-tracker_mongodb_1 mongodump --db maintenance_tracker --out /backup/
docker cp car-maintenance-tracker_mongodb_1:/backup ./backups/backup_$DATE
```

### Automated Backup
Add to cron:
```bash
0 2 * * * /path/to/backup-script.sh
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 80, 5000, and 27017 are available
2. **MongoDB connection**: Check backend logs for MongoDB connection errors
3. **API proxy issues**: Verify nginx configuration and service names
4. **Build failures**: Check Dockerfile syntax and dependencies

### Debug Commands
```bash
# Check container status
docker-compose ps

# View specific service logs
docker-compose logs backend

# Test backend directly
curl http://localhost:5000/health

# Test frontend
curl http://localhost:80

# Test API proxy
curl http://localhost:80/api/vehicles
```

## Security Considerations

- Change default passwords in production
- Use HTTPS in production (nginx SSL configuration)
- Restrict MongoDB access to internal network only
- Regular security updates for base images
- Monitor container logs for suspicious activity

## Support

For issues and questions:
1. Check container logs: `docker-compose logs [service]`
2. Verify network connectivity: `docker-compose network ls`
3. Test individual services: `curl [endpoint]`
4. Review configuration files for typos