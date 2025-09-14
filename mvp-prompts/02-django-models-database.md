## Prompt 2: Django Models and Database Schema

**Objective**: Create Django models for the Car Maintenance Tracker MVP with Philippines-specific optimizations.

**Context**: You need to implement the core data models based on the MVP PRD requirements, including vehicles, maintenance schedules, fuel tracking, and service records with Philippines-specific features.

**Requirements**:
- Create Vehicle model with Philippines vehicle support
- Create MaintenanceSchedule model with Philippines optimization
- Create FillUp model for fuel economy tracking
- Create MaintenanceService model for service records
- Include Philippines fuel types and vehicle models
- Implement severe condition adjustments (0.8 factor)

**Implementation Steps**:

1. **Vehicle Model** (vehicles/models.py):
```python
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Vehicle(models.Model):
    VEHICLE_TYPES = [
        ('sedan', 'Sedan'),
        ('suv', 'SUV'),
        ('mpv', 'MPV'),
        ('pickup', 'Pickup'),
        ('hatchback', 'Hatchback'),
        ('sports_car', 'Sports Car'),
        ('motorcycle', 'Motorcycle'),
    ]

    TRANSMISSION_TYPES = [
        ('manual', 'Manual'),
        ('automatic', 'Automatic'),
        ('cvt', 'CVT'),
        ('dct', 'DCT'),
        ('hybrid', 'Hybrid'),
    ]

    FUEL_TYPES = [
        ('gasoline', 'Gasoline'),
        ('diesel', 'Diesel'),
        ('hybrid', 'Hybrid'),
        ('electric', 'Electric'),
    ]

    # Popular Philippines vehicle models
    POPULAR_MODELS = [
        'Toyota Vios', 'Toyota Innova', 'Toyota Fortuner', 'Toyota Wigo',
        'Honda City', 'Honda CR-V', 'Honda Civic', 'Honda Brio',
        'Mitsubishi Mirage', 'Mitsubishi Montero', 'Mitsubishi Xpander',
        'Mazda CX-5', 'Mazda 3', 'Mazda 2',
        'Nissan Almera', 'Nissan Navara', 'Nissan Terra',
        'Hyundai Accent', 'Hyundai Tucson', 'Hyundai Eon',
        'Kia Picanto', 'Kia Sportage', 'Kia Soluto'
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='vehicles')
    make = models.CharField(max_length=50)
    model = models.CharField(max_length=50)
    year = models.IntegerField()
    variant = models.CharField(max_length=100, blank=True)
    license_plate = models.CharField(max_length=20, blank=True)
    vin = models.CharField(max_length=17, blank=True)
    color = models.CharField(max_length=30, blank=True)

    # Mileage tracking
    initial_odometer = models.IntegerField()
    current_odometer = models.IntegerField()

    # Vehicle specifications
    fuel_tank_capacity = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPES, default='sedan')
    transmission = models.CharField(max_length=20, choices=TRANSMISSION_TYPES, default='manual')
    fuel_type = models.CharField(max_length=20, choices=FUEL_TYPES, default='gasoline')

    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['user', 'vin']

    def __str__(self):
        return f"{self.year} {self.make} {self.model}"

    def save(self, *args, **kwargs):
        # Validate year range
        from datetime import datetime
        current_year = datetime.now().year
        if self.year < 1900 or self.year > current_year + 1:
            raise ValueError(f"Year must be between 1900 and {current_year + 1}")

        # Validate odometer progression
        if self.current_odometer < self.initial_odometer:
            raise ValueError("Current odometer cannot be less than initial odometer")

        super().save(*args, **kwargs)

    @property
    def total_distance(self):
        """Calculate total distance traveled"""
        return self.current_odometer - self.initial_odometer

    @property
    def is_popular_philippines_model(self):
        """Check if this is a popular Philippines model"""
        full_name = f"{self.make} {self.model}"
        return full_name in self.POPULAR_MODELS
```

2. **Maintenance Schedule Model** (maintenance/models.py):
```python
from django.db import models
from vehicles.models import Vehicle

class MaintenanceSchedule(models.Model):
    CATEGORIES = [
        ('Engine', 'Engine'),
        ('Cooling System', 'Cooling System'),
        ('Fuel System', 'Fuel System'),
        ('Ignition System', 'Ignition System'),
        ('Brakes', 'Brakes'),
        ('Tires', 'Tires'),
        'Suspension', 'Suspension'),
        ('Transmission', 'Transmission'),
        ('Electrical', 'Electrical'),
        ('Air Conditioning', 'Air Conditioning'),
        ('Exhaust', 'Exhaust'),
        ('Body & Interior', 'Body & Interior'),
    ]

    ACTION_TYPES = [
        ('R', 'Replace'),
        ('I', 'Inspect'),
        ('L', 'Lubricate'),
        ('T', 'Tighten'),
        ('S', 'Service'),
        ('C', 'Clean'),
    ]

    VEHICLE_MAKES = [
        ('Toyota', 'Toyota'),
        ('Honda', 'Honda'),
        ('Mitsubishi', 'Mitsubishi'),
        ('Mazda', 'Mazda'),
        ('Nissan', 'Nissan'),
        ('Hyundai', 'Hyundai'),
        ('Kia', 'Kia'),
        ('Suzuki', 'Suzuki'),
        ('Isuzu', 'Isuzu'),
        ('Ford', 'Ford'),
        ('Chevrolet', 'Chevrolet'),
        ('Volkswagen', 'Volkswagen'),
        ('BMW', 'BMW'),
        ('Mercedes-Benz', 'Mercedes-Benz'),
        ('Generic', 'Generic'),
    ]

    # Philippines-specific adjustments
    PHILIPPINES_SEVERE_CONDITION_FACTOR = 0.8

    vehicle_make = models.CharField(max_length=50, choices=VEHICLE_MAKES)
    vehicle_model = models.CharField(max_length=50)
    category = models.CharField(max_length=50, choices=CATEGORIES)
    item_name = models.CharField(max_length=100)
    interval_km = models.IntegerField(help_text="Interval in kilometers")
    interval_months = models.IntegerField(null=True, blank=True, help_text="Interval in months")
    action_type = models.CharField(max_length=1, choices=ACTION_TYPES)
    description = models.TextField(blank=True)
    is_critical = models.BooleanField(default=False)
    difficulty_level = models.CharField(max_length=20, choices=[
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
        ('professional', 'Professional'),
    ], default='medium')

    # Cost estimates in PHP
    estimated_cost_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    estimated_cost_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Year range for this schedule
    year_start = models.IntegerField(default=2000)
    year_end = models.IntegerField(default=2030)

    # Philippines-specific adjustments
    philippines_adjustment_factor = models.DecimalField(
        max_digits=3, decimal_places=2,
        default=PHILIPPINES_SEVERE_CONDITION_FACTOR,
        help_text="Factor to adjust intervals for Philippines conditions"
    )
    philippines_notes = models.TextField(blank=True, help_text="Philippines-specific notes")

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'item_name']
        unique_together = ['vehicle_make', 'vehicle_model', 'item_name', 'year_start']

    def __str__(self):
        return f"{self.item_name} ({self.action_type}) - {self.vehicle_make} {self.vehicle_model}"

    @property
    def adjusted_interval_km(self):
        """Calculate Philippines-adjusted interval"""
        return int(self.interval_km * self.philippines_adjustment_factor)

    @property
    def action_type_display(self):
        """Get full action type name"""
        action_map = dict(self.ACTION_TYPES)
        return action_map.get(self.action_type, self.action_type)

    def applies_to_vehicle(self, vehicle):
        """Check if this schedule applies to a specific vehicle"""
        if (self.vehicle_make != 'Generic' and
            self.vehicle_make.lower() != vehicle.make.lower()):
            return False

        if (self.vehicle_model != 'Generic' and
            self.vehicle_model.lower() != vehicle.model.lower()):
            return False

        return self.year_start <= vehicle.year <= self.year_end
```

3. **Maintenance Service Model** (maintenance/models.py - continued):
```python
class MaintenanceService(models.Model):
    SERVICE_PROVIDERS = [
        ('dealership', 'Dealership'),
        ('independent_shop', 'Independent Shop'),
        ('diy', 'DIY'),
        ('other', 'Other'),
    ]

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='maintenance_services')
    schedule_item = models.ForeignKey(
        MaintenanceSchedule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='services'
    )

    service_date = models.DateField()
    mileage_at_service = models.IntegerField()
    service_type = models.CharField(max_length=100)
    service_provider = models.CharField(max_length=100, blank=True)
    provider_type = models.CharField(max_length=20, choices=SERVICE_PROVIDERS, default='independent_shop')

    # Cost tracking in PHP
    total_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    labor_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    parts_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Notes and documents
    notes = models.TextField(blank=True)
    recommendation = models.TextField(blank=True)

    # Warranty information
    is_warranty = models.BooleanField(default=False)
    warranty_period = models.CharField(max_length=50, blank=True)
    warranty_details = models.TextField(blank=True)

    # Multiple maintenance items completed in one service
    maintenance_items_completed = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-service_date']

    def __str__(self):
        return f"Service for {self.vehicle} on {self.service_date}"

    def save(self, *args, **kwargs):
        # Calculate total cost if not provided
        if not self.total_cost:
            labor = self.labor_cost or 0
            parts = self.parts_cost or 0
            self.total_cost = labor + parts

        # Update vehicle current odometer if service mileage is higher
        if self.mileage_at_service > self.vehicle.current_odometer:
            self.vehicle.current_odometer = self.mileage_at_service
            self.vehicle.save()

        super().save(*args, **kwargs)
```

4. **FillUp Model** (fuel_tracking/models.py):
```python
from django.db import models
from decimal import Decimal
from vehicles.models import Vehicle

class FillUp(models.Model):
    FUEL_TYPES = [
        ('Regular', 'Regular'),
        ('Premium', 'Premium'),
        ('Diesel', 'Diesel'),
        ('Premium Plus', 'Premium Plus'),
    ]

    PAYMENT_METHODS = [
        ('cash', 'Cash'),
        ('credit', 'Credit Card'),
        ('debit', 'Debit Card'),
        ('digital', 'Digital Wallet'),
        ('other', 'Other'),
    ]

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='fillups')
    date = models.DateField()
    odometer_km = models.IntegerField()

    # Fuel details
    liters = models.DecimalField(max_digits=6, decimal_places=2)
    price_per_liter = models.DecimalField(max_digits=5, decimal_places=2)
    total_cost = models.DecimalField(max_digits=8, decimal_places=2)

    # Fuel type and station
    fuel_type = models.CharField(max_length=20, choices=FUEL_TYPES, default='Regular')
    gas_station = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=200, blank=True)

    # Payment and notes
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='cash')
    notes = models.TextField(blank=True)

    # Calculated fields
    fuel_economy_km_l = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    cost_per_km = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    trip_distance_km = models.IntegerField(null=True, blank=True)

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
        self._calculate_fuel_economy()

        # Update vehicle current odometer if fill-up odometer is higher
        if self.odometer_km > self.vehicle.current_odometer:
            self.vehicle.current_odometer = self.odometer_km
            self.vehicle.save()

        super().save(*args, **kwargs)

    def _calculate_fuel_economy(self):
        """Calculate fuel economy and related metrics"""
        try:
            # Get previous full tank fill-up
            previous_fillup = FillUp.objects.filter(
                vehicle=self.vehicle,
                date__lt=self.date,
                is_full_tank=True
            ).order_by('-date').first()

            if previous_fillup and self.is_full_tank:
                # Calculate trip distance
                distance = self.odometer_km - previous_fillup.odometer_km
                self.trip_distance_km = distance

                if distance > 0 and self.liters > 0:
                    # Calculate fuel economy (km/L)
                    economy = distance / self.liters
                    self.fuel_economy_km_l = Decimal(str(economy)).quantize(Decimal('0.01'))

                    # Calculate cost per km
                    if self.total_cost > 0:
                        cost_per_km = self.total_cost / distance
                        self.cost_per_km = Decimal(str(cost_per_km)).quantize(Decimal('0.01'))
        except Exception:
            # Silently handle calculation errors
            pass

    @property
    def is_recent(self):
        """Check if fill-up is within last 30 days"""
        from datetime import date, timedelta
        return (date.today() - self.date) <= timedelta(days=30)
```

5. **Create admin.py files**:

**vehicles/admin.py**:
```python
from django.contrib import admin
from .models import Vehicle

@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ['user', 'make', 'model', 'year', 'current_odometer', 'is_active', 'created_at']
    list_filter = ['make', 'model', 'year', 'vehicle_type', 'fuel_type', 'is_active']
    search_fields = ['make', 'model', 'license_plate', 'vin']
    readonly_fields = ['total_distance', 'created_at', 'updated_at']

    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'make', 'model', 'year', 'variant', 'color')
        }),
        ('Identification', {
            'fields': ('license_plate', 'vin')
        }),
        ('Mileage', {
            'fields': ('initial_odometer', 'current_odometer', 'total_distance')
        }),
        ('Specifications', {
            'fields': ('vehicle_type', 'transmission', 'fuel_type', 'fuel_tank_capacity')
        }),
        ('Status', {
            'fields': ('is_active',)
        })
    )
```

**maintenance/admin.py**:
```python
from django.contrib import admin
from .models import MaintenanceSchedule, MaintenanceService

@admin.register(MaintenanceSchedule)
class MaintenanceScheduleAdmin(admin.ModelAdmin):
    list_display = ['item_name', 'vehicle_make', 'vehicle_model', 'category', 'action_type', 'interval_km', 'is_critical']
    list_filter = ['vehicle_make', 'category', 'action_type', 'is_critical', 'difficulty_level']
    search_fields = ['item_name', 'vehicle_model', 'description']

    fieldsets = (
        ('Vehicle Information', {
            'fields': ('vehicle_make', 'vehicle_model', 'year_start', 'year_end')
        }),
        ('Maintenance Details', {
            'fields': ('category', 'item_name', 'action_type', 'description', 'is_critical')
        }),
        ('Schedule', {
            'fields': ('interval_km', 'interval_months', 'difficulty_level')
        }),
        ('Cost Estimates', {
            'fields': ('estimated_cost_min', 'estimated_cost_max')
        }),
        ('Philippines Adjustments', {
            'fields': ('philippines_adjustment_factor', 'philippines_notes')
        })
    )

@admin.register(MaintenanceService)
class MaintenanceServiceAdmin(admin.ModelAdmin):
    list_display = ['vehicle', 'service_date', 'service_type', 'total_cost', 'mileage_at_service', 'service_provider']
    list_filter = ['service_date', 'service_provider', 'provider_type', 'is_warranty']
    search_fields = ['vehicle__make', 'vehicle__model', 'service_type', 'notes']
    date_hierarchy = 'service_date'

    fieldsets = (
        ('Basic Information', {
            'fields': ('vehicle', 'service_date', 'service_type', 'service_provider')
        }),
        ('Service Details', {
            'fields': ('mileage_at_service', 'schedule_item', 'maintenance_items_completed')
        }),
        ('Cost Information', {
            'fields': ('total_cost', 'labor_cost', 'parts_cost')
        }),
        ('Provider Information', {
            'fields': ('provider_type', 'is_warranty', 'warranty_period')
        }),
        ('Notes', {
            'fields': ('notes', 'recommendation', 'warranty_details')
        })
    )
```

**fuel_tracking/admin.py**:
```python
from django.contrib import admin
from .models import FillUp

@admin.register(FillUp)
class FillUpAdmin(admin.ModelAdmin):
    list_display = ['vehicle', 'date', 'odometer_km', 'liters', 'total_cost', 'fuel_economy_km_l', 'gas_station']
    list_filter = ['date', 'fuel_type', 'payment_method', 'is_full_tank']
    search_fields = ['vehicle__make', 'vehicle__model', 'gas_station', 'notes']
    date_hierarchy = 'date'
    readonly_fields = ['fuel_economy_km_l', 'cost_per_km', 'trip_distance_km']

    fieldsets = (
        ('Basic Information', {
            'fields': ('vehicle', 'date', 'odometer_km')
        }),
        ('Fuel Details', {
            'fields': ('liters', 'price_per_liter', 'total_cost', 'fuel_type')
        }),
        ('Location & Payment', {
            'fields': ('gas_station', 'location', 'payment_method')
        }),
        ('Calculated Metrics', {
            'fields': ('fuel_economy_km_l', 'cost_per_km', 'trip_distance_km', 'is_full_tank')
        }),
        ('Notes', {
            'fields': ('notes',)
        })
    )
```

**Expected Output**: Complete Django models with Philippines-specific features, admin interfaces, and proper relationships between all entities.

**Validation Steps**:
1. Run `python manage.py makemigrations` - should create migrations for all models
2. Run `python manage.py migrate` - should create all tables in Supabase
3. Access Django admin - should see all models registered
4. Create test data through admin interface