## Prompt 3: Django API Endpoints and Business Logic

**Objective**: Create Django REST Framework API endpoints with business logic for the Car Maintenance Tracker MVP.

**Context**: You need to implement API endpoints for vehicles, maintenance tracking, fuel economy calculations, and maintenance status calculations with Philippines-specific optimizations.

**Requirements**:
- Create REST API endpoints using Django REST Framework
- Implement serializers for all models
- Add authentication and permissions
- Implement fuel economy calculations
- Create maintenance status calculation engine
- Add Philippines-specific business logic

**Implementation Steps**:

1. **Create Serializers**:

**vehicles/serializers.py**:
```python
from rest_framework import serializers
from .models import Vehicle

class VehicleSerializer(serializers.ModelSerializer):
    total_distance = serializers.ReadOnlyField()
    is_popular_philippines_model = serializers.ReadOnlyField()

    class Meta:
        model = Vehicle
        fields = [
            'id', 'user', 'make', 'model', 'year', 'variant', 'license_plate',
            'vin', 'color', 'initial_odometer', 'current_odometer', 'total_distance',
            'fuel_tank_capacity', 'vehicle_type', 'transmission', 'fuel_type',
            'is_active', 'is_popular_philippines_model', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'total_distance', 'created_at', 'updated_at']

    def validate(self, data):
        # Validate year range
        from datetime import datetime
        current_year = datetime.now().year
        year = data.get('year')
        if year and (year < 1900 or year > current_year + 1):
            raise serializers.ValidationError(f"Year must be between 1900 and {current_year + 1}")

        # Validate odometer progression
        initial_odometer = data.get('initial_odometer')
        current_odometer = data.get('current_odometer')
        if initial_odometer is not None and current_odometer is not None:
            if current_odometer < initial_odometer:
                raise serializers.ValidationError("Current odometer cannot be less than initial odometer")

        return data

class VehicleDetailSerializer(VehicleSerializer):
    recent_fillups = serializers.SerializerMethodField()
    recent_services = serializers.SerializerMethodField()
    upcoming_maintenance = serializers.SerializerMethodField()

    class Meta(VehicleSerializer.Meta):
        fields = VehicleSerializer.Meta.fields + [
            'recent_fillups', 'recent_services', 'upcoming_maintenance'
        ]

    def get_recent_fillups(self, obj):
        from fuel_tracking.models import FillUp
        fillups = FillUp.objects.filter(vehicle=obj).order_by('-date')[:5]
        return [{
            'id': f.id,
            'date': f.date,
            'odometer_km': f.odometer_km,
            'liters': float(f.liters),
            'total_cost': float(f.total_cost),
            'fuel_economy_km_l': float(f.fuel_economy_km_l) if f.fuel_economy_km_l else None,
        } for f in fillups]

    def get_recent_services(self, obj):
        from maintenance.models import MaintenanceService
        services = MaintenanceService.objects.filter(vehicle=obj).order_by('-service_date')[:3]
        return [{
            'id': s.id,
            'service_date': s.service_date,
            'service_type': s.service_type,
            'total_cost': float(s.total_cost),
            'mileage_at_service': s.mileage_at_service,
        } for s in services]

    def get_upcoming_maintenance(self, obj):
        from maintenance.models import MaintenanceSchedule
        schedules = MaintenanceSchedule.objects.filter(
            vehicle_make__in=[obj.make, 'Generic'],
            is_active=True
        )

        upcoming = []
        for schedule in schedules:
            if schedule.applies_to_vehicle(obj):
                status_info = self._calculate_maintenance_status(schedule, obj)
                if status_info['status'] in ['due_soon', 'overdue']:
                    upcoming.append({
                        'item_name': schedule.item_name,
                        'category': schedule.category,
                        'action_type': schedule.action_type,
                        'status': status_info['status'],
                        'km_until_due': status_info['km_until_due'],
                        'priority': status_info['priority'],
                        'estimated_cost': status_info['estimated_cost_range'],
                    })

        return sorted(upcoming, key=lambda x: (
            {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}[x['priority']],
            x['km_until_due']
        ))[:5]

    def _calculate_maintenance_status(self, schedule, vehicle):
        """Calculate maintenance status for a schedule item"""
        from maintenance.models import MaintenanceService

        # Find last service for this item
        last_service = MaintenanceService.objects.filter(
            vehicle=vehicle,
            schedule_item=schedule
        ).order_by('-service_date').first()

        last_service_odometer = last_service.mileage_at_service if last_service else vehicle.initial_odometer

        # Calculate next due mileage
        adjusted_interval = schedule.adjusted_interval_km
        next_due_odometer = last_service_odometer + adjusted_interval

        # Calculate distance until due
        km_until_due = next_due_odometer - vehicle.current_odometer

        # Determine status and priority
        if km_until_due <= 0:
            status = 'overdue'
            priority = 'critical'
        elif km_until_due <= 500:
            status = 'due_soon'
            priority = 'high'
        elif km_until_due <= 2000:
            status = 'due_soon'
            priority = 'medium'
        else:
            status = 'ok'
            priority = 'low'

        return {
            'status': status,
            'priority': priority,
            'km_until_due': km_until_due,
            'next_due_odometer': next_due_odometer,
            'estimated_cost_range': {
                'min': float(schedule.estimated_cost_min or 0),
                'max': float(schedule.estimated_cost_max or 0)
            }
        }
```

**maintenance/serializers.py**:
```python
from rest_framework import serializers
from .models import MaintenanceSchedule, MaintenanceService

class MaintenanceScheduleSerializer(serializers.ModelSerializer):
    adjusted_interval_km = serializers.ReadOnlyField()
    action_type_display = serializers.ReadOnlyField()

    class Meta:
        model = MaintenanceSchedule
        fields = [
            'id', 'vehicle_make', 'vehicle_model', 'category', 'item_name',
            'interval_km', 'adjusted_interval_km', 'interval_months',
            'action_type', 'action_type_display', 'description', 'is_critical',
            'difficulty_level', 'estimated_cost_min', 'estimated_cost_max',
            'year_start', 'year_end', 'philippines_adjustment_factor',
            'philippines_notes', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class MaintenanceServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceService
        fields = [
            'id', 'vehicle', 'schedule_item', 'service_date', 'mileage_at_service',
            'service_type', 'service_provider', 'provider_type', 'total_cost',
            'labor_cost', 'parts_cost', 'notes', 'recommendation',
            'is_warranty', 'warranty_period', 'warranty_details',
            'maintenance_items_completed', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        # Validate service date is not in future
        from datetime import date
        service_date = data.get('service_date')
        if service_date and service_date > date.today():
            raise serializers.ValidationError("Service date cannot be in the future")

        # Validate mileage is not less than vehicle initial odometer
        vehicle = self.instance.vehicle if self.instance else data.get('vehicle')
        mileage = data.get('mileage_at_service')
        if vehicle and mileage and mileage < vehicle.initial_odometer:
            raise serializers.ValidationError("Service mileage cannot be less than vehicle initial odometer")

        return data

class MaintenanceServiceDetailSerializer(MaintenanceServiceSerializer):
    schedule_item_details = MaintenanceScheduleSerializer(source='schedule_item', read_only=True)

    class Meta(MaintenanceServiceSerializer.Meta):
        fields = MaintenanceServiceSerializer.Meta.fields + ['schedule_item_details']
```

**fuel_tracking/serializers.py**:
```python
from rest_framework import serializers
from decimal import Decimal
from .models import FillUp

class FillUpSerializer(serializers.ModelSerializer):
    class Meta:
        model = FillUp
        fields = [
            'id', 'vehicle', 'date', 'odometer_km', 'liters', 'price_per_liter',
            'total_cost', 'fuel_type', 'gas_station', 'location', 'payment_method',
            'notes', 'fuel_economy_km_l', 'cost_per_km', 'trip_distance_km',
            'is_full_tank', 'created_at'
        ]
        read_only_fields = [
            'fuel_economy_km_l', 'cost_per_km', 'trip_distance_km', 'created_at'
        ]

    def validate(self, data):
        # Validate date is not in future
        from datetime import date
        fillup_date = data.get('date')
        if fillup_date and fillup_date > date.today():
            raise serializers.ValidationError("Fill-up date cannot be in the future")

        # Validate odometer progression
        vehicle = self.instance.vehicle if self.instance else data.get('vehicle')
        if vehicle:
            odometer = data.get('odometer_km')
            if odometer and odometer < vehicle.initial_odometer:
                raise serializers.ValidationError("Odometer reading cannot be less than vehicle initial odometer")

            # Check against previous fill-ups
            if not self.instance:  # Only for new fill-ups
                last_fillup = FillUp.objects.filter(vehicle=vehicle).order_by('-date').first()
                if last_fillup and odometer < last_fillup.odometer_km:
                    raise serializers.ValidationError("Odometer reading cannot be less than previous fill-up")

        # Validate positive values
        liters = data.get('liters')
        price_per_liter = data.get('price_per_liter')

        if liters and liters <= 0:
            raise serializers.ValidationError("Fuel amount must be positive")

        if price_per_liter and price_per_liter <= 0:
            raise serializers.ValidationError("Price per liter must be positive")

        return data

class FillUpDetailSerializer(FillUpSerializer):
    previous_fillup_distance = serializers.SerializerMethodField()

    class Meta(FillUpSerializer.Meta):
        fields = FillUpSerializer.Meta.fields + ['previous_fillup_distance']

    def get_previous_fillup_distance(self, obj):
        previous_fillup = FillUp.objects.filter(
            vehicle=obj.vehicle,
            date__lt=obj.date
        ).order_by('-date').first()

        if previous_fillup:
            return obj.odometer_km - previous_fillup.odometer_km
        return None
```

2. **Create Views**:

**vehicles/views.py**:
```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from .models import Vehicle
from .serializers import VehicleSerializer, VehicleDetailSerializer

class VehicleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = VehicleSerializer

    def get_queryset(self):
        return Vehicle.objects.filter(user=self.request.user, is_active=True)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return VehicleDetailSerializer
        return VehicleSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def update_mileage(self, request, pk=None):
        vehicle = self.get_object()
        new_mileage = request.data.get('mileage')

        if new_mileage is None:
            return Response(
                {'error': 'Mileage value is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            new_mileage = int(new_mileage)
            if new_mileage < vehicle.current_odometer:
                return Response(
                    {'error': 'New mileage cannot be less than current mileage'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            vehicle.current_odometer = new_mileage
            vehicle.save()

            return Response({
                'message': 'Mileage updated successfully',
                'new_mileage': new_mileage,
                'total_distance': vehicle.total_distance
            })

        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid mileage value'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def dashboard_summary(self, request):
        """Get dashboard summary for all user vehicles"""
        vehicles = self.get_queryset()

        total_vehicles = vehicles.count()
        total_distance = sum(v.total_distance for v in vehicles)

        # Get fuel statistics
        total_fuel_cost = 0
        total_fuel_amount = 0

        for vehicle in vehicles:
            fillups = vehicle.fillups.all()
            total_fuel_cost += sum(f.total_cost for f in fillups)
            total_fuel_amount += sum(f.liters for f in fillups)

        # Get maintenance statistics
        total_maintenance_cost = 0
        overdue_maintenance = 0

        for vehicle in vehicles:
            services = vehicle.maintenance_services.all()
            total_maintenance_cost += sum(s.total_cost for s in services)

            # Check overdue maintenance
            serializer = VehicleDetailSerializer(vehicle)
            overdue_items = [item for item in serializer.data.get('upcoming_maintenance', [])
                           if item['status'] == 'overdue']
            overdue_maintenance += len(overdue_items)

        return Response({
            'total_vehicles': total_vehicles,
            'total_distance': total_distance,
            'total_fuel_cost': float(total_fuel_cost),
            'total_fuel_amount': float(total_fuel_amount),
            'total_maintenance_cost': float(total_maintenance_cost),
            'overdue_maintenance_count': overdue_maintenance,
            'average_fuel_economy': float(total_distance / total_fuel_amount) if total_fuel_amount > 0 else 0
        })

    @action(detail=True, methods=['get'])
    def fuel_statistics(self, request, pk=None):
        """Get fuel statistics for a specific vehicle"""
        vehicle = self.get_object()
        fillups = vehicle.fillups.all()

        if not fillups.exists():
            return Response({
                'message': 'No fuel data available for this vehicle',
                'statistics': {}
            })

        # Calculate basic statistics
        total_distance = sum(f.trip_distance_km for f in fillups if f.trip_distance_km)
        total_fuel = sum(f.liters for f in fillups)
        total_cost = sum(f.total_cost for f in fillups)

        # Get valid fuel economy readings
        valid_economies = [f.fuel_economy_km_l for f in fillups if f.fuel_economy_km_l]

        statistics = {
            'total_fillups': fillups.count(),
            'total_distance': total_distance,
            'total_fuel_amount': float(total_fuel),
            'total_cost': float(total_cost),
            'average_fuel_economy': float(sum(valid_economies) / len(valid_economies)) if valid_economies else 0,
            'best_fuel_economy': float(max(valid_economies)) if valid_economies else 0,
            'worst_fuel_economy': float(min(valid_economies)) if valid_economies else 0,
            'average_cost_per_km': float(total_cost / total_distance) if total_distance > 0 else 0,
            'recent_fillups': [
                {
                    'date': f.date,
                    'odometer_km': f.odometer_km,
                    'liters': float(f.liters),
                    'fuel_economy_km_l': float(f.fuel_economy_km_l) if f.fuel_economy_km_l else None,
                    'cost_per_liter': float(f.price_per_liter)
                }
                for f in fillups.order_by('-date')[:10]
            ]
        }

        return Response(statistics)
```

**maintenance/views.py**:
```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import MaintenanceSchedule, MaintenanceService
from .serializers import MaintenanceScheduleSerializer, MaintenanceServiceSerializer, MaintenanceServiceDetailSerializer

class MaintenanceScheduleViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = MaintenanceScheduleSerializer

    def get_queryset(self):
        vehicle_id = self.kwargs.get('vehicle_id')
        if vehicle_id:
            from vehicles.models import Vehicle
            try:
                vehicle = Vehicle.objects.get(id=vehicle_id, user=self.request.user)
                return MaintenanceSchedule.objects.filter(
                    Q(vehicle_make=vehicle.make) | Q(vehicle_make='Generic'),
                    is_active=True,
                    year_start__lte=vehicle.year,
                    year_end__gte=vehicle.year
                )
            except Vehicle.DoesNotExist:
                return MaintenanceSchedule.objects.none()
        return MaintenanceSchedule.objects.none()

    @action(detail=False, methods=['get'])
    def by_vehicle(self, request):
        """Get maintenance schedules for a specific vehicle make and model"""
        make = request.query_params.get('make')
        model = request.query_params.get('model')
        year = request.query_params.get('year')

        if not all([make, model, year]):
            return Response(
                {'error': 'Make, model, and year are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            year = int(year)
        except ValueError:
            return Response(
                {'error': 'Year must be a valid number'},
                status=status.HTTP_400_BAD_REQUEST
            )

        schedules = MaintenanceSchedule.objects.filter(
            Q(vehicle_make=make) | Q(vehicle_make='Generic'),
            is_active=True,
            year_start__lte=year,
            year_end__gte=year
        )

        # Filter by model if specific model exists
        model_specific = schedules.filter(vehicle_model=model)
        if model_specific.exists():
            schedules = model_specific

        serializer = self.get_serializer(schedules, many=True)
        return Response(serializer.data)

class MaintenanceServiceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = MaintenanceServiceSerializer

    def get_queryset(self):
        vehicle_id = self.kwargs.get('vehicle_id')
        if vehicle_id:
            from vehicles.models import Vehicle
            try:
                vehicle = Vehicle.objects.get(id=vehicle_id, user=self.request.user)
                return MaintenanceService.objects.filter(vehicle=vehicle)
            except Vehicle.DoesNotExist:
                return MaintenanceService.objects.none()
        return MaintenanceService.objects.none()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return MaintenanceServiceDetailSerializer
        return MaintenanceServiceSerializer

    def perform_create(self, serializer):
        vehicle_id = self.kwargs.get('vehicle_id')
        from vehicles.models import Vehicle
        vehicle = Vehicle.objects.get(id=vehicle_id, user=self.request.user)

        # Update vehicle mileage if service mileage is higher
        service_mileage = serializer.validated_data.get('mileage_at_service')
        if service_mileage and service_mileage > vehicle.current_odometer:
            vehicle.current_odometer = service_mileage
            vehicle.save()

        serializer.save(vehicle=vehicle)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming maintenance items for a vehicle"""
        vehicle_id = self.kwargs.get('vehicle_id')
        from vehicles.models import Vehicle
        try:
            vehicle = Vehicle.objects.get(id=vehicle_id, user=self.request.user)

            # Get applicable schedules
            schedules = MaintenanceSchedule.objects.filter(
                Q(vehicle_make=vehicle.make) | Q(vehicle_make='Generic'),
                is_active=True,
                year_start__lte=vehicle.year,
                year_end__gte=vehicle.year
            )

            upcoming_items = []
            for schedule in schedules:
                # Find last service for this item
                last_service = MaintenanceService.objects.filter(
                    vehicle=vehicle,
                    schedule_item=schedule
                ).order_by('-service_date').first()

                last_service_odometer = last_service.mileage_at_service if last_service else vehicle.initial_odometer

                # Calculate next due mileage
                adjusted_interval = schedule.adjusted_interval_km
                next_due_odometer = last_service_odometer + adjusted_interval

                # Calculate distance until due
                km_until_due = next_due_odometer - vehicle.current_odometer

                # Determine status and priority
                if km_until_due <= 0:
                    status = 'overdue'
                    priority = 'critical'
                elif km_until_due <= 500:
                    status = 'due_soon'
                    priority = 'high'
                elif km_until_due <= 2000:
                    status = 'due_soon'
                    priority = 'medium'
                else:
                    status = 'ok'
                    priority = 'low'

                if status in ['due_soon', 'overdue']:
                    upcoming_items.append({
                        'schedule_id': schedule.id,
                        'item_name': schedule.item_name,
                        'category': schedule.category,
                        'action_type': schedule.action_type,
                        'status': status,
                        'priority': priority,
                        'km_until_due': km_until_due,
                        'next_due_odometer': next_due_odometer,
                        'estimated_cost_range': {
                            'min': float(schedule.estimated_cost_min or 0),
                            'max': float(schedule.estimated_cost_max or 0)
                        },
                        'is_critical': schedule.is_critical,
                        'last_service_date': last_service.service_date if last_service else None,
                        'last_service_mileage': last_service.mileage_at_service if last_service else None
                    })

            # Sort by priority and due distance
            upcoming_items.sort(key=lambda x: (
                {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}[x['priority']],
                x['km_until_due']
            ))

            return Response(upcoming_items)

        except Vehicle.DoesNotExist:
            return Response(
                {'error': 'Vehicle not found'},
                status=status.HTTP_404_NOT_FOUND
            )
```

**fuel_tracking/views.py**:
```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Sum, Max, Min
from django.utils import timezone
from datetime import timedelta
from .models import FillUp
from .serializers import FillUpSerializer, FillUpDetailSerializer

class FillUpViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = FillUpSerializer

    def get_queryset(self):
        vehicle_id = self.kwargs.get('vehicle_id')
        if vehicle_id:
            from vehicles.models import Vehicle
            try:
                vehicle = Vehicle.objects.get(id=vehicle_id, user=self.request.user)
                return FillUp.objects.filter(vehicle=vehicle)
            except Vehicle.DoesNotExist:
                return FillUp.objects.none()
        return FillUp.objects.none()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return FillUpDetailSerializer
        return FillUpSerializer

    def perform_create(self, serializer):
        vehicle_id = self.kwargs.get('vehicle_id')
        from vehicles.models import Vehicle
        vehicle = Vehicle.objects.get(id=vehicle_id, user=self.request.user)

        # Update vehicle mileage if fill-up odometer is higher
        fillup_mileage = serializer.validated_data.get('odometer_km')
        if fillup_mileage and fillup_mileage > vehicle.current_odometer:
            vehicle.current_odometer = fillup_mileage
            vehicle.save()

        serializer.save(vehicle=vehicle)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get fuel statistics for a vehicle"""
        vehicle_id = self.kwargs.get('vehicle_id')
        from vehicles.models import Vehicle
        try:
            vehicle = Vehicle.objects.get(id=vehicle_id, user=self.request.user)
            fillups = FillUp.objects.filter(vehicle=vehicle)

            if not fillups.exists():
                return Response({
                    'message': 'No fuel data available for this vehicle',
                    'statistics': {}
                })

            # Calculate basic statistics
            valid_fillups = fillups.filter(fuel_economy_km_l__isnull=False)

            stats = {
                'total_fillups': fillups.count(),
                'total_distance': sum(f.trip_distance_km for f in fillups if f.trip_distance_km),
                'total_fuel_amount': float(sum(f.liters for f in fillups)),
                'total_cost': float(sum(f.total_cost for f in fillups)),
                'average_price_per_liter': float(fillups.aggregate(Avg('price_per_liter'))['price_per_liter__avg'] or 0),
            }

            # Calculate economy statistics if we have valid data
            if valid_fillups.exists():
                economy_stats = valid_fillups.aggregate(
                    avg_economy=Avg('fuel_economy_km_l'),
                    best_economy=Max('fuel_economy_km_l'),
                    worst_economy=Min('fuel_economy_km_l')
                )

                stats.update({
                    'average_fuel_economy': float(economy_stats['avg_economy'] or 0),
                    'best_fuel_economy': float(economy_stats['best_economy'] or 0),
                    'worst_fuel_economy': float(economy_stats['worst_economy'] or 0),
                    'valid_economy_readings': valid_fillups.count()
                })

            # Monthly statistics (last 6 months)
            six_months_ago = timezone.now().date() - timedelta(days=180)
            recent_fillups = fillups.filter(date__gte=six_months_ago)

            if recent_fillups.exists():
                monthly_stats = []
                for i in range(6):
                    month_start = six_months_ago + timedelta(days=30 * i)
                    month_end = month_start + timedelta(days=30)

                    month_fillups = recent_fillups.filter(
                        date__gte=month_start,
                        date__lt=month_end
                    )

                    month_distance = sum(f.trip_distance_km for f in month_fillups if f.trip_distance_km)
                    month_fuel = sum(f.liters for f in month_fillups)
                    month_cost = sum(f.total_cost for f in month_fillups)

                    monthly_stats.append({
                        'month': month_start.strftime('%Y-%m'),
                        'distance': month_distance,
                        'fuel_amount': float(month_fuel),
                        'cost': float(month_cost),
                        'fillup_count': month_fillups.count()
                    })

                stats['monthly_statistics'] = monthly_stats

            return Response(stats)

        except Vehicle.DoesNotExist:
            return Response(
                {'error': 'Vehicle not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent fill-ups for a vehicle"""
        vehicle_id = self.kwargs.get('vehicle_id')
        from vehicles.models import Vehicle
        try:
            vehicle = Vehicle.objects.get(id=vehicle_id, user=self.request.user)
            fillups = FillUp.objects.filter(vehicle=vehicle).order_by('-date')[:10]

            serializer = self.get_serializer(fillups, many=True)
            return Response(serializer.data)

        except Vehicle.DoesNotExist:
            return Response(
                {'error': 'Vehicle not found'},
                status=status.HTTP_404_NOT_FOUND
            )
```

3. **Create URL configurations**:

**vehicles/urls.py**:
```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VehicleViewSet

router = DefaultRouter()
router.register('', VehicleViewSet, basename='vehicle')

urlpatterns = [
    path('', include(router.urls)),
]
```

**maintenance/urls.py**:
```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MaintenanceScheduleViewSet, MaintenanceServiceViewSet

schedule_router = DefaultRouter()
schedule_router.register('schedules', MaintenanceScheduleViewSet, basename='maintenance-schedule')

service_router = DefaultRouter()
service_router.register('services', MaintenanceServiceViewSet, basename='maintenance-service')

urlpatterns = [
    path('', include(schedule_router.urls)),
    path('', include(service_router.urls)),
]
```

**fuel_tracking/urls.py**:
```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FillUpViewSet

router = DefaultRouter()
router.register('fillups', FillUpViewSet, basename='fillup')

urlpatterns = [
    path('', include(router.urls)),
]
```

**users/urls.py**:
```python
from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path('token/', obtain_auth_token, name='api_token_auth'),
]
```

**Expected Output**: Complete Django REST API with authentication, validation, business logic, and Philippines-specific optimizations for car maintenance tracking.

**Validation Steps**:
1. Test all API endpoints with Postman or curl
2. Verify authentication works correctly
3. Test fuel economy calculations
4. Verify maintenance status calculations
5. Check data validation and error handling