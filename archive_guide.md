Guide: Archive Current Codebase & Create MVP-Focused Django + Supabase Version

  Understanding Your Current Setup

  Based on my analysis of your project:

  Current State:
  - Branch: feature/backend-cleanup (active)
  - Backend: Flask + MongoDB with comprehensive features
  - Frontend: React + TypeScript with Tailwind CSS
  - Reference: Mazda CX-5 2016 maintenance schedule in index.html
  - Documentation: Complete planning documents we created

  Key Insights from index.html:
  - Maintenance Categories: ENGINE, COOLING SYSTEM, FUEL SYSTEM, IGNITION SYSTEM, etc.
  - Action Types: R (Replace), I (Inspect), L (Lubricate), T (Tighten)
  - Interval Pattern: Every 8,000km, 16,000km, 24,000km, etc.
  - Service Logic: Collective maintenance items completed on specific dates

  Part 1: Archive Current Codebase

  Step 1: Create Archive Branch

  # From your current branch (feature/backend-cleanup)
  git checkout main
  git pull origin main
  git checkout -b archive/current-implementation

  # Create archive directories and move code
  mkdir -p archive/backend-archive archive/frontend-archive
  mv backend/* archive/backend-archive/
  mv frontend/* archive/frontend-archive/

  # Commit the archived code
  git add .
  git commit -m "Archive current Flask+MongoDB implementation

  - Moved backend to archive/backend-archive/
  - Moved frontend to archive/frontend-archive/
  - Preserving comprehensive feature set for future reference
  - Archived implementation includes:
    * Flask REST API with JWT authentication
    * React + TypeScript frontend with Tailwind CSS
    * MongoDB database models and relationships
    * Comprehensive maintenance tracking system
    * Fuel economy calculations and analytics

  🤖 Generated with [Claude Code](https://claude.ai/code)

  Co-Authored-By: Claude <noreply@anthropic.com>"

  # Push to remote
  git push origin archive/current-implementation

  Step 2: Prepare Main Branch for MVP

  # Return to main and create MVP branch
  git checkout main
  git checkout -b feature/mvp-django-supabase

  # Remove only implementation directories (keep documents)
  rm -rf backend/ frontend/

  # Commit the cleanup
  git add .
  git commit -m "Prepare main branch for MVP implementation

  - Removed existing backend and frontend directories
  - Preserving documentation and configuration files
  - Ready for Django + Supabase MVP implementation
  - Keeping essential files for MVP development

  🤖 Generated with [Claude Code](https://claude.ai/code)

  Co-Authored-By: Claude <noreply@anthropic.com>"

  Part 2: MVP Feature Definition

  Core MVP Features (Based on index.html)

  1. Vehicle Management
  - Add vehicles with make/model/year/current mileage
  - Support multiple vehicles per user
  - Mileage tracking with validation (cannot decrease)

  2. Fuel Economy Tracking
  - Log fill-ups with odometer, fuel amount, price per liter
  - Automatic km/L calculations
  - Cost tracking (total cost, cost per km)
  - Fuel efficiency trends

  3. Maintenance Schedule System
  - Display maintenance items based on index.html pattern
  - Categories: ENGINE, COOLING SYSTEM, FUEL SYSTEM, etc.
  - Action types: R (Replace), I (Inspect), L (Lubricate), T (Tighten)
  - Status calculation: Completed, Due Soon, Overdue

  4. Service Records
  - Log completed maintenance services
  - Track date, mileage, cost, notes
  - Update maintenance schedule status based on services
  - Group multiple maintenance items into one service record

  5. Dashboard
  - Current maintenance status overview
  - Upcoming maintenance items
  - Recent fuel economy stats
  - Quick actions for common tasks

  Data Model Definitions

  Maintenance Schedule Structure (from index.html):
  MAINTENANCE_SCHEDULES = {
      'mazda_cx5_2016': {
          'engine': [
              {'name': 'Drive belts', 'interval_km': 56000, 'action': 'I'},
              {'name': 'Engine oil & filter', 'interval_km': 8000, 'action': 'R'},
          ],
          'cooling_system': [
              {'name': 'Engine coolant level', 'interval_km': 8000, 'action': 'I'},
              {'name': 'Engine coolant', 'interval_km': 192000, 'action': 'R'},
          ],
          'fuel_system': [
              {'name': 'Air filter', 'interval_km': 56000, 'action': 'R'},
              {'name': 'Fuel lines and hoses', 'interval_km': 96000, 'action': 'I'},
          ],
          # Add other categories from index.html
      }
  }

  Extended Vehicle Support:
  VEHICLE_SCHEDULES = {
      'toyota_vios': {
          'engine_oil': {'interval_km': 5000, 'action': 'R'},
          'air_filter': {'interval_km': 20000, 'action': 'R'},
          # Toyota-specific intervals
      },
      'honda_city': {
          'engine_oil': {'interval_km': 10000, 'action': 'R'},
          'spark_plugs': {'interval_km': 40000, 'action': 'R'},
          # Honda-specific intervals
      },
      # Add more vehicle types
  }

  Part 3: Django + Supabase Implementation

  Step 1: Setup Django Project

  # Create Django project
  django-admin startproject backend
  cd backend

  # Create Django apps
  python manage.py startapp vehicles
  python manage.py startapp fuel_tracking
  python manage.py startapp maintenance
  python manage.py startapp users

  # Install required packages
  pip install django djangorestframework supabase python-dotenv corsheaders psycopg2-binary

  Step 2: Configure Django Settings

  # backend/settings.py
  import os
  from dotenv import load_dotenv

  load_dotenv()

  INSTALLED_APPS = [
      'django.contrib.admin',
      'django.contrib.auth',
      'django.contrib.contenttypes',
      'django.contrib.sessions',
      'django.contrib.messages',
      'django.contrib.staticfiles',
      'rest_framework',
      'corsheaders',
      'vehicles',
      'fuel_tracking',
      'maintenance',
      'users',
  ]

  # Database configuration (Supabase)
  DATABASES = {
      'default': {
          'ENGINE': 'django.db.backends.postgresql',
          'NAME': os.getenv('DB_NAME'),
          'USER': os.getenv('DB_USER'),
          'PASSWORD': os.getenv('DB_PASSWORD'),
          'HOST': os.getenv('DB_HOST'),
          'PORT': '5432',
      }
  }

  # Supabase configuration
  SUPABASE_URL = os.getenv('SUPABASE_URL')
  SUPABASE_KEY = os.getenv('SUPABASE_KEY')

  # CORS settings
  CORS_ALLOWED_ORIGINS = [
      "http://localhost:3000",
      "http://localhost:8000",
  ]

  Step 3: Create Django Models

  # vehicles/models.py
  from django.db import models
  from django.contrib.auth.models import User

  class Vehicle(models.Model):
      user = models.ForeignKey(User, on_delete=models.CASCADE)
      make = models.CharField(max_length=50)
      model = models.CharField(max_length=50)
      year = models.IntegerField()
      initial_mileage = models.IntegerField()
      current_mileage = models.IntegerField()
      license_plate = models.CharField(max_length=20, blank=True)
      is_active = models.BooleanField(default=True)
      created_at = models.DateTimeField(auto_now_add=True)
      updated_at = models.DateTimeField(auto_now=True)

      class Meta:
          ordering = ['-created_at']

      def __str__(self):
          return f"{self.year} {self.make} {self.model}"

  # maintenance/models.py
  from django.db import models
  from vehicles.models import Vehicle

  class MaintenanceSchedule(models.Model):
      vehicle_make = models.CharField(max_length=50)
      vehicle_model = models.CharField(max_length=50)
      category = models.CharField(max_length=50)
      item_name = models.CharField(max_length=100)
      interval_km = models.IntegerField()
      interval_months = models.IntegerField(null=True, blank=True)
      action_type = models.CharField(max_length=1, choices=[
          ('R', 'Replace'),
          ('I', 'Inspect'),
          ('L', 'Lubricate'),
          ('T', 'Tighten'),
      ])
      description = models.TextField(blank=True)
      is_critical = models.BooleanField(default=False)

      class Meta:
          ordering = ['category', 'item_name']

      def __str__(self):
          return f"{self.item_name} ({self.action_type})"

  class MaintenanceService(models.Model):
      vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
      service_date = models.DateField()
      mileage_at_service = models.IntegerField()
      notes = models.TextField(blank=True)
      total_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
      performed_by = models.CharField(max_length=100, blank=True)
      created_at = models.DateTimeField(auto_now_add=True)
      updated_at = models.DateTimeField(auto_now=True)

      class Meta:
          ordering = ['-service_date']

      def __str__(self):
          return f"Service for {self.vehicle} on {self.service_date}"

  # fuel_tracking/models.py
  from django.db import models
  from vehicles.models import Vehicle

  class FillUp(models.Model):
      vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
      date = models.DateField()
      odometer_km = models.IntegerField()
      liters = models.DecimalField(max_digits=6, decimal_places=2)
      price_per_liter = models.DecimalField(max_digits=5, decimal_places=2)
      total_cost = models.DecimalField(max_digits=8, decimal_places=2)
      fuel_economy_km_l = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
      cost_per_km = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
      gas_station = models.CharField(max_length=100, blank=True)
      notes = models.TextField(blank=True)
      is_full_tank = models.BooleanField(default=True)
      created_at = models.DateTimeField(auto_now_add=True)

      class Meta:
          ordering = ['-date']

      def __str__(self):
          return f"Fill-up for {self.vehicle} on {self.date}"

      def save(self, *args, **kwargs):
          # Calculate total cost if not provided
          if not self.total_cost:
              self.total_cost = self.liters * self.price_per_liter

          # Calculate fuel economy if possible
          previous_fillup = FillUp.objects.filter(
              vehicle=self.vehicle,
              date__lt=self.date,
              is_full_tank=True
          ).order_by('-date').first()

          if previous_fillup and self.is_full_tank:
              distance = self.odometer_km - previous_fillup.odometer_km
              if distance > 0 and self.liters > 0:
                  self.fuel_economy_km_l = distance / self.liters
                  self.cost_per_km = self.total_cost / distance

          super().save(*args, **kwargs)

  Step 4: Create Django API Endpoints

  # vehicles/views.py
  from rest_framework import viewsets, status
  from rest_framework.decorators import action
  from rest_framework.response import Response
  from .models import Vehicle
  from .serializers import VehicleSerializer

  class VehicleViewSet(viewsets.ModelViewSet):
      serializer_class = VehicleSerializer

      def get_queryset(self):
          return Vehicle.objects.filter(user=self.request.user)

      def perform_create(self, serializer):
          serializer.save(user=self.request.user)

      @action(detail=True, methods=['post'])
      def update_mileage(self, request, pk=None):
          vehicle = self.get_object()
          new_mileage = request.data.get('mileage')

          if new_mileage and new_mileage >= vehicle.current_mileage:
              vehicle.current_mileage = new_mileage
              vehicle.save()
              return Response({'message': 'Mileage updated successfully'})
          else:
              return Response(
                  {'error': 'Invalid mileage value'},
                  status=status.HTTP_400_BAD_REQUEST
              )

  # maintenance/views.py
  from rest_framework import viewsets
  from django.db.models import Q
  from .models import MaintenanceSchedule, MaintenanceService
  from .serializers import MaintenanceScheduleSerializer, MaintenanceServiceSerializer
  from vehicles.models import Vehicle

  class MaintenanceScheduleViewSet(viewsets.ReadOnlyModelViewSet):
      serializer_class = MaintenanceScheduleSerializer

      def get_queryset(self):
          vehicle_id = self.kwargs.get('vehicle_id')
          if vehicle_id:
              vehicle = Vehicle.objects.get(id=vehicle_id, user=self.request.user)
              return MaintenanceSchedule.objects.filter(
                  Q(vehicle_make=vehicle.make, vehicle_model=vehicle.model) |
                  Q(vehicle_make=vehicle.make)
              )
          return MaintenanceSchedule.objects.all()

  class MaintenanceServiceViewSet(viewsets.ModelViewSet):
      serializer_class = MaintenanceServiceSerializer

      def get_queryset(self):
          vehicle_id = self.kwargs.get('vehicle_id')
          if vehicle_id:
              vehicle = Vehicle.objects.get(id=vehicle_id, user=self.request.user)
              return MaintenanceService.objects.filter(vehicle=vehicle)
          return MaintenanceService.objects.none()

      def perform_create(self, serializer):
          vehicle_id = self.kwargs.get('vehicle_id')
          vehicle = Vehicle.objects.get(id=vehicle_id, user=self.request.user)
          serializer.save(vehicle=vehicle)

          # Update vehicle mileage if service mileage is higher
          service_mileage = serializer.validated_data.get('mileage_at_service')
          if service_mileage and service_mileage > vehicle.current_mileage:
              vehicle.current_mileage = service_mileage
              vehicle.save()

  # fuel_tracking/views.py
  from rest_framework import viewsets
  from .models import FillUp
  from .serializers import FillUpSerializer

  class FillUpViewSet(viewsets.ModelViewSet):
      serializer_class = FillUpSerializer

      def get_queryset(self):
          vehicle_id = self.kwargs.get('vehicle_id')
          if vehicle_id:
              from vehicles.models import Vehicle
              vehicle = Vehicle.objects.get(id=vehicle_id, user=self.request.user)
              return FillUp.objects.filter(vehicle=vehicle)
          return FillUp.objects.none()

      def perform_create(self, serializer):
          vehicle_id = self.kwargs.get('vehicle_id')
          from vehicles.models import Vehicle
          vehicle = Vehicle.objects.get(id=vehicle_id, user=self.request.user)

          # Update vehicle mileage if fill-up odometer is higher
          fillup_mileage = serializer.validated_data.get('odometer_km')
          if fillup_mileage and fillup_mileage > vehicle.current_mileage:
              vehicle.current_mileage = fillup_mileage
              vehicle.save()

          serializer.save(vehicle=vehicle)

  Part 4: Simplified Frontend Setup

  Step 1: Create React Project

  # Create new React project
  npm create vite@latest frontend -- --template react-ts
  cd frontend
  npm install axios react-router-dom @supabase/supabase-js tailwindcss

  Step 2: Setup Tailwind CSS

  # Install and configure Tailwind
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p

  # Configure tailwind.config.js
  module.exports = {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  }

  Step 3: Create Core Components

  // src/lib/supabase.ts
  import { createClient } from '@supabase/supabase-js'

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

  export const supabase = createClient(supabaseUrl, supabaseKey)

  // src/lib/api.ts
  import axios from 'axios'

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Add auth token to requests
  api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
    return config
  })

  export default api

  // src/components/VehicleList.tsx
  import React, { useState, useEffect } from 'react'
  import api from '../lib/api'

  interface Vehicle {
    id: number
    make: string
    model: string
    year: number
    current_mileage: number
    initial_mileage: number
  }

  const VehicleList: React.FC = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      fetchVehicles()
    }, [])

    const fetchVehicles = async () => {
      try {
        const response = await api.get('/vehicles/')
        setVehicles(response.data)
      } catch (error) {
        console.error('Failed to fetch vehicles:', error)
      } finally {
        setLoading(false)
      }
    }

    if (loading) return <div>Loading vehicles...</div>

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">My Vehicles</h2>
        {vehicles.map(vehicle => (
          <div key={vehicle.id} className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
            <p>Current Mileage: {vehicle.current_mileage.toLocaleString()} km</p>
            <p>Total Distance: {(vehicle.current_mileage - vehicle.initial_mileage).toLocaleString()} km</p>
          </div>
        ))}
      </div>
    )
  }

  export default VehicleList

  // src/components/FuelEntryForm.tsx
  import React, { useState } from 'react'
  import api from '../lib/api'

  interface FuelEntryFormProps {
    vehicleId: number
    onSuccess: () => void
  }

  const FuelEntryForm: React.FC<FuelEntryFormProps> = ({ vehicleId, onSuccess }) => {
    const [formData, setFormData] = useState({
      date: new Date().toISOString().split('T')[0],
      odometer_km: '',
      liters: '',
      price_per_liter: '',
      notes: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      try {
        await api.post(`/fuel-tracking/vehicles/${vehicleId}/fillups/`, formData)
        onSuccess()
        setFormData({
          date: new Date().toISOString().split('T')[0],
          odometer_km: '',
          liters: '',
          price_per_liter: '',
          notes: '',
        })
      } catch (error) {
        console.error('Failed to add fuel entry:', error)
      }
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Odometer (km)</label>
          <input
            type="number"
            value={formData.odometer_km}
            onChange={(e) => setFormData({...formData, odometer_km: e.target.value})}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Fuel Amount (liters)</label>
          <input
            type="number"
            step="0.01"
            value={formData.liters}
            onChange={(e) => setFormData({...formData, liters: e.target.value})}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Price per Liter (₱)</label>
          <input
            type="number"
            step="0.01"
            value={formData.price_per_liter}
            onChange={(e) => setFormData({...formData, price_per_liter: e.target.value})}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            className="w-full border rounded px-3 py-2"
            rows={3}
          />
        </div>

        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
          Add Fill-up
        </button>
      </form>
    )
  }

  export default FuelEntryForm

  Part 5: Homelab + Cloudflare Tunnel Setup

  Step 1: Docker Compose for Development

  # docker-compose.yml
  version: '3.8'
  services:
    backend:
      build: ./backend
      ports:
        - "8000:8000"
      environment:
        - DEBUG=True
        - DB_NAME=${DB_NAME}
        - DB_USER=${DB_USER}
        - DB_PASSWORD=${DB_PASSWORD}
        - DB_HOST=${DB_HOST}
        - SUPABASE_URL=${SUPABASE_URL}
        - SUPABASE_KEY=${SUPABASE_KEY}
      volumes:
        - ./backend:/app

    frontend:
      build: ./frontend
      ports:
        - "3000:3000"
      environment:
        - VITE_API_URL=http://localhost:8000/api
        - VITE_SUPABASE_URL=${SUPABASE_URL}
        - VITE_SUPABASE_KEY=${SUPABASE_KEY}
      depends_on:
        - backend

  Step 2: Environment Variables

  # .env
  # Supabase Configuration
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_KEY=your-supabase-key

  # Database Configuration (for Django)
  DB_NAME=postgres
  DB_USER=postgres
  DB_PASSWORD=your-db-password
  DB_HOST=db.your-project.supabase.co

  # Frontend Configuration
  VITE_API_URL=http://localhost:8000/api
  VITE_SUPABASE_URL=${SUPABASE_URL}
  VITE_SUPABASE_KEY=${SUPABASE_KEY}

  Step 3: Cloudflare Tunnel Setup

  # Install cloudflared
  brew install cloudflared

  # Create tunnel
  cloudflared tunnel create mvp-car-tracker

  # Get tunnel credentials and save to ~/.cloudflared/config.yml
  cloudflared tunnel token mvp-car-tracker

  # Configure DNS
  cloudflared tunnel route dns mvp-car-tracker your-domain.com

  # Create config file
  cat > ~/.cloudflared/config.yml << EOF
  tunnel: mvp-car-tracker
  credentials-file: ~/.cloudflared/<tunnel-credentials-file>.json

  ingress:
    - hostname: your-domain.com
      service: http://localhost:8000
    - service: http_status:404
  EOF

  # Run tunnel
  cloudflared tunnel run mvp-car-tracker

  Step 4: Supabase Setup

  1. Create Supabase Project: Go to supabase.com and create a new project
  2. Get Connection Details: Copy database URL and service key
  3. Create Tables: Use Django migrations to create tables in Supabase
  4. Configure Auth: Set up Supabase Auth for user management

  # Run Django migrations
  cd backend
  python manage.py makemigrations
  python manage.py migrate

  # Create superuser
  python manage.py createsuperuser

  Implementation Timeline

  Week 1: Foundation

  - Archive current codebase
  - Setup Django project structure
  - Configure Supabase integration
  - Create core models (Vehicle, MaintenanceSchedule, MaintenanceService, FillUp)

  Week 2: Backend Development

  - Implement Django REST Framework endpoints
  - Create authentication with Supabase
  - Build maintenance schedule logic
  - Implement fuel economy calculations

  Week 3: Frontend Development

  - Setup React project with TypeScript
  - Create core components (VehicleList, FuelEntryForm, MaintenanceSchedule)
  - Implement routing and navigation
  - Integrate with Supabase auth

  Week 4: Integration & Testing

  - Connect frontend to backend API
  - Test end-to-end functionality
  - Setup homelab deployment
  - Configure Cloudflare tunnel

  Week 5: MVP Launch

  - Beta testing with Philippines users
  - Bug fixes and optimization
  - User feedback collection
  - Documentation finalization

  Key Benefits of This Approach

  1. Cost Effective: Uses your existing homelab + free Supabase tier
  2. Scalable: Django + Supabase can handle growth
  3. Maintainable: Clean codebase with proper separation of concerns
  4. Philippines Focused: Built for your target market from day one
  5. Preserves Work: Current implementation archived for future reference
  6. Fast Development: Django ORM and REST framework speed up development

  This guide gives you a complete path from your current Flask+MongoDB implementation to a focused MVP using Django+Supabase, while preserving your current work and leveraging your
  homelab infrastructure for cost-effective deployment.
