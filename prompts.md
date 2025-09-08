# Simple Maintenance Tracker - Claude Code Prompts

## Prompt 1: Backend Setup (Flask + MongoDB)

```
Create a simple Flask backend for a vehicle maintenance tracker app.

REQUIREMENTS:
- Python Flask API with MongoDB
- Connect to existing MongoDB container at mongodb://localhost:27017/maintenance_tracker
- Simple REST API - no authentication needed (single user homelab app)
- Basic error handling and logging

PROJECT STRUCTURE:
```
backend/
├── app.py                 # Main Flask app
├── models.py             # MongoDB models
├── routes/
│   ├── __init__.py
│   ├── vehicles.py       # Vehicle routes
│   ├── maintenance.py    # Maintenance routes
│   └── services.py       # Service routes
├── requirements.txt
└── Dockerfile
```

DEPENDENCIES (requirements.txt):
```
Flask==2.3.3
Flask-CORS==4.0.0
pymongo==4.5.0
python-dotenv==1.0.0
```

DATA MODELS:
Create three main collections in MongoDB:

1. **vehicles**: Store vehicle information
2. **maintenance_items**: Predefined maintenance schedule
3. **service_records**: Log of completed services

API ENDPOINTS TO IMPLEMENT:

```python
# Vehicles
GET /api/vehicles           # List all vehicles
POST /api/vehicles          # Add new vehicle
PUT /api/vehicles/<id>      # Update vehicle
DELETE /api/vehicles/<id>   # Remove vehicle

# Maintenance Items
GET /api/maintenance/<vehicle_id>    # Get maintenance schedule for vehicle
POST /api/maintenance               # Add custom maintenance item

# Service Records
GET /api/services/<vehicle_id>      # Get service history for vehicle
POST /api/services                  # Log new service
PUT /api/services/<id>              # Update service record

# Dashboard
GET /api/dashboard/<vehicle_id>     # Get due maintenance items
```

SAMPLE DATA STRUCTURE:
```python
# Vehicle document
{
    "_id": ObjectId,
    "make": "Mazda",
    "model": "CX-5",
    "year": 2016,
    "current_mileage": 54771,
    "created_at": datetime.utcnow()
}

# Maintenance item document
{
    "_id": ObjectId,
    "name": "Engine Oil & Filter",
    "category": "Engine",
    "interval_km": 8000,
    "description": "Replace engine oil and filter",
    "vehicle_id": ObjectId("vehicle_id")
}

# Service record document
{
    "_id": ObjectId,
    "vehicle_id": ObjectId("vehicle_id"),
    "maintenance_item_id": ObjectId("maintenance_id"),
    "date": "2025-09-08",
    "mileage": 54771,
    "cost": 75.50,
    "notes": "Air filter changed, oil looked good",
    "created_at": datetime.utcnow()
}
```

SPECIFIC IMPLEMENTATION:
1. Create Flask app with CORS enabled for frontend connection
2. MongoDB connection with proper error handling
3. Simple route handlers that return JSON
4. Basic validation for required fields
5. Helper function to calculate due maintenance based on current mileage vs last service + interval

MAZDA CX-5 2016 DEFAULT MAINTENANCE ITEMS:
Include these predefined maintenance items when a Mazda CX-5 2016 vehicle is added:
- Engine Oil & Filter (every 8,000 km)
- Air Filter (every 48,000 km)
- Cabin Air Filter (every 40,000 km)
- Brake Fluid (every 40,000 km)
- Tire Rotation (every 8,000 km)
- Spark Plugs (every 120,000 km)
- Coolant Level Check (every 8,000 km)

DASHBOARD LOGIC:
Calculate maintenance status:
- **Due Now**: Current mileage >= (last service mileage + interval)
- **Due Soon**: Current mileage >= (last service mileage + interval - 1000)
- **OK**: Everything else

Include Dockerfile for containerization:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]
```

Keep it simple - focus on functionality over fancy features!
```

## Prompt 2: Frontend Setup (React + ShadcnUI)

```
Create a clean React frontend for the vehicle maintenance tracker using ShadcnUI components.

REQUIREMENTS:
- React 18 + TypeScript + Vite
- ShadcnUI for components
- Tailwind CSS for styling
- Axios for API calls
- Simple, clean interface - no overengineering

PROJECT SETUP:
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label textarea select table badge
```

PROJECT STRUCTURE:
```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # ShadcnUI components
│   │   ├── VehicleCard.tsx
│   │   ├── ServiceForm.tsx
│   │   └── MaintenanceList.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Vehicles.tsx
│   │   └── ServiceHistory.tsx
│   ├── lib/
│   │   └── api.ts           # Axios API calls
│   ├── types/
│   │   └── index.ts         # TypeScript interfaces
│   └── App.tsx
├── package.json
└── Dockerfile
```

DEPENDENCIES TO ADD:
```json
{
  "axios": "^1.5.0",
  "react-router-dom": "^6.15.0",
  "lucide-react": "^0.263.1"
}
```

TYPESCRIPT INTERFACES:
```typescript
interface Vehicle {
  _id: string;
  make: string;
  model: string;
  year: number;
  current_mileage: number;
  created_at: string;
}

interface MaintenanceItem {
  _id: string;
  name: string;
  category: string;
  interval_km: number;
  description?: string;
  vehicle_id: string;
}

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

interface DashboardData {
  due_now: MaintenanceItem[];
  due_soon: MaintenanceItem[];
  ok: MaintenanceItem[];
}
```

PAGES TO CREATE:

1. **Dashboard Page**
   - Show current vehicle info
   - List maintenance items by status (Due Now, Due Soon, OK)
   - Quick "Mark as Complete" buttons
   - Current mileage update form

2. **Vehicles Page**
   - List of vehicles with basic info
   - Add new vehicle form
   - Edit vehicle details
   - Delete vehicle option

3. **Service History Page**
   - Chronological list of completed services
   - Add new service record form
   - Simple filters (date range, maintenance type)
   - Basic cost summary

API SERVICE LAYER:
```typescript
// lib/api.ts
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export const api = {
  // Vehicles
  getVehicles: () => axios.get(`${API_BASE}/vehicles`),
  addVehicle: (data: Partial<Vehicle>) => axios.post(`${API_BASE}/vehicles`, data),
  updateVehicle: (id: string, data: Partial<Vehicle>) =>
    axios.put(`${API_BASE}/vehicles/${id}`, data),

  // Dashboard
  getDashboard: (vehicleId: string) =>
    axios.get(`${API_BASE}/dashboard/${vehicleId}`),

  // Services
  getServices: (vehicleId: string) =>
    axios.get(`${API_BASE}/services/${vehicleId}`),
  addService: (data: Partial<ServiceRecord>) =>
    axios.post(`${API_BASE}/services`, data),
};
```

UI REQUIREMENTS:
- Clean, simple design with ShadcnUI components
- Mobile-responsive layout
- Loading states for API calls
- Basic error handling with toast notifications
- Simple navigation between pages

ROUTING:
```typescript
// App.tsx routes
/                    -> Dashboard
/vehicles           -> Vehicle management
/services           -> Service history
```

SPECIFIC COMPONENTS:

1. **MaintenanceCard**: Display maintenance item with status badge and "Mark Complete" button
2. **ServiceForm**: Simple form to log completed services
3. **VehicleSelector**: Dropdown to switch between vehicles
4. **StatusBadge**: Color-coded status indicators (red=due, yellow=soon, green=ok)

Include Dockerfile:
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

DESIGN GOALS:
- Functional over flashy
- Fast and responsive
- Easy to use on mobile
- Clear visual hierarchy
- Minimal clicks to complete common tasks

Focus on the core user workflow: check what's due → log completed services → update vehicle mileage. Keep it simple!
```

## Prompt 3: Docker Deployment & Integration

```
Create Docker deployment configuration and integrate the maintenance tracker components.

REQUIREMENTS:
- Docker Compose setup for easy deployment
- Connect frontend to backend API
- Integrate with existing MongoDB container
- Production-ready configuration
- Cloudflare tunnel preparation

FILES TO CREATE:

1. **docker-compose.yml** (root directory)
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/maintenance_tracker
      - FLASK_ENV=production
    depends_on:
      - mongodb
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

volumes:
  mongodb_data:
```

2. **Backend Environment Configuration**
Update backend to handle environment variables:
```python
# backend/app.py additions
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/maintenance_tracker')
```

3. **Frontend API Configuration**
Update frontend to use environment-based API URL:
```typescript
// frontend/src/lib/api.ts
const API_BASE = import.meta.env.PROD
  ? '/api'  // Production: proxy through nginx
  : 'http://localhost:5000/api';  // Development
```

4. **Nginx Configuration for Frontend**
```nginx
# frontend/nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

5. **Update Frontend Dockerfile**
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

6. **Production Environment Files**
```bash
# .env.production (backend)
MONGODB_URI=mongodb://mongodb:27017/maintenance_tracker
FLASK_ENV=production
FLASK_DEBUG=False
```

DEPLOYMENT INSTRUCTIONS:
```bash
# Clone/create the project structure
maintenance-tracker/
├── backend/          # (from Prompt 1)
├── frontend/         # (from Prompt 2)
├── docker-compose.yml
├── .env.production
└── README.md

# Deploy the application
cd maintenance-tracker
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs
```

CLOUDFLARE TUNNEL SETUP:
```bash
# Install cloudflared on your homelab server
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# Create tunnel (run once)
cloudflared tunnel create maintenance-tracker

# Configure tunnel
# ~/.cloudflared/config.yml
tunnel: your-tunnel-id
credentials-file: /home/user/.cloudflared/your-tunnel-id.json

ingress:
  - hostname: maintenance.yourdomain.com
    service: http://localhost:80
  - service: http_status:404
```

HEALTH CHECKS & MONITORING:
Add health check endpoints:
```python
# backend/app.py
@app.route('/health')
def health_check():
    try:
        # Test MongoDB connection
        db.command('ping')
        return {'status': 'healthy', 'database': 'connected'}, 200
    except Exception as e:
        return {'status': 'unhealthy', 'error': str(e)}, 500
```

BACKUP STRATEGY:
```bash
# MongoDB backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec maintenance-tracker_mongodb_1 mongodump --db maintenance_tracker --out /backup/
docker cp maintenance-tracker_mongodb_1:/backup ./backups/backup_$DATE
```

FINAL INTEGRATION CHECKLIST:
- ✅ Backend API connects to MongoDB
- ✅ Frontend communicates with backend
- ✅ Docker containers start and communicate
- ✅ Health checks pass
- ✅ Data persists across container restarts
- ✅ Accessible via localhost:80
- ✅ Ready for Cloudflare tunnel

TESTING DEPLOYMENT:
```bash
# Test the full stack
curl http://localhost:5000/health          # Backend health
curl http://localhost:80                   # Frontend loads
curl http://localhost:80/api/vehicles      # API through proxy

# Add test data
curl -X POST http://localhost:80/api/vehicles \
  -H "Content-Type: application/json" \
  -d '{"make":"Mazda","model":"CX-5","year":2016,"current_mileage":54771}'
```

This setup gives you a production-ready maintenance tracker that:
- Runs in Docker containers
- Persists data in MongoDB
- Serves a clean React frontend
- Proxies API requests properly
- Is ready for Cloudflare tunnel access
- Can be easily backed up and restored

Keep it simple and reliable!
```
