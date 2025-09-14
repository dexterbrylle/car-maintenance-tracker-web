# Django Models Implementation

Create Django models for the Car Maintenance Tracker MVP based on the PRD requirements. These models will map to Supabase PostgreSQL tables.

## Models to Implement:

### 1. User Model (users/models.py)
Extend Django's built-in User model or create a custom profile model to store:
- User preferences (fuel_unit, distance_unit, currency_format)
- Subscription tier
- Timezone and currency settings
- Philippines-specific settings

### 2. Vehicle Model (vehicles/models.py)
```python
class Vehicle(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    make = models.CharField(max_length=50)  # Toyota, Honda, Mazda
    model = models.CharField(max_length=50)  # Vios, City, CX-5
    year = models.IntegerField()
    variant = models.CharField(max_length=50, blank=True)  # 1.3L MT, 2.0L AT
    license_plate = models.CharField(max_length=20, blank=True)
    vin = models.CharField(max_length=17, blank=True, unique=True)
    color = models.CharField(max_length=30, blank=True)
    initial_odometer = models.IntegerField(validators=[MinValueValidator(0)])
    current_odometer = models.IntegerField(validators=[MinValueValidator(0)])
    fuel_tank_capacity = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPES, default='sedan')
    transmission = models.CharField(max_length=20, choices=TRANSMISSION_TYPES, default='manual')
    fuel_type = models.CharField(max_length=20, choices=FUEL_TYPES, default='gasoline')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 3. FillUp Model (fuel_tracking/models.py)
```python
class FillUp(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    date = models.DateField()
    odometer_reading = models.IntegerField()
    fuel_amount = models.DecimalField(max_digits=6, decimal_places=2)  # in liters
    price_per_liter = models.DecimalField(max_digits=5, decimal_places=2)  # in PHP
    total_cost = models.DecimalField(max_digits=8, decimal_places=2)
    is_full_tank = models.BooleanField(default=True)
    fuel_type = models.CharField(max_length=20, choices=FUEL_GRADES, default='Regular')
    gas_station = models.CharField(max_length=100, blank=True)
    location = models.PointField(null=True, blank=True)  # For future GIS features
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, blank=True)
    notes = models.TextField(blank=True)

    # Calculated fields
    trip_distance = models.IntegerField(null=True, blank=True)
    fuel_economy = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # km/L
    cost_per_km = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
```

### 4. MaintenanceSchedule Model (maintenance/models.py)
```python
class MaintenanceSchedule(models.Model):
    vehicle_make = models.CharField(max_length=50)
    vehicle_model = models.CharField(max_length=50)
    year_range_start = models.IntegerField()
    year_range_end = models.IntegerField()
    category = models.CharField(max_length=50)  # Engine, Brakes, Tires, Fluids
    item_name = models.CharField(max_length=100)
    action_type = models.CharField(max_length=1, choices=ACTION_TYPES)
    interval_km = models.IntegerField()
    interval_months = models.IntegerField(null=True, blank=True)
    description = models.TextField(blank=True)
    is_critical = models.BooleanField(default=False)
    estimated_cost_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    estimated_cost_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    difficulty_level = models.CharField(max_length=20, choices=DIFFICULTY_LEVELS, default='medium')

    # Philippines-specific adjustments
    severe_condition_factor = models.DecimalField(max_digits=3, decimal_places=2, default=0.80)
    adjusted_interval_km = models.IntegerField()
    philippines_notes = models.TextField(blank=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### 5. MaintenanceService Model (maintenance/models.py)
```python
class MaintenanceService(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    schedule_item = models.ForeignKey(MaintenanceSchedule, on_delete=models.SET_NULL, null=True, blank=True)
    service_date = models.DateField()
    odometer_reading = models.IntegerField()
    service_type = models.CharField(max_length=100)
    service_provider = models.CharField(max_length=100, blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Additional service details
    parts_used = models.JSONField(default=list, blank=True)  # List of parts with costs
    labor_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)

    # Warranty information
    is_warranty = models.BooleanField(default=False)
    warranty_period = models.CharField(max_length=50, blank=True)
    warranty_details = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 6. MaintenanceReminder Model (maintenance/models.py)
```python
class MaintenanceReminder(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    schedule_item = models.ForeignKey(MaintenanceSchedule, on_delete=models.CASCADE)
    due_at_odometer = models.IntegerField()
    due_at_date = models.DateField(null=True, blank=True)

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('due_soon', 'Due Soon'),
        ('overdue', 'Overdue'),
        ('completed', 'Completed'),
        ('dismissed', 'Dismissed'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')

    last_service_odometer = models.IntegerField(null=True, blank=True)
    last_service_date = models.DateField(null=True, blank=True)
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(blank=True)

    # Notification tracking
    notification_sent = models.BooleanField(default=False)
    notification_count = models.IntegerField(default=0)

    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

## Implementation Details:

1. Create choice fields for:
   - VEHICLE_TYPES = ['sedan', 'suv', 'mpv', 'pickup', 'hatchback', 'sports_car', 'motorcycle']
   - TRANSMISSION_TYPES = ['manual', 'automatic', 'cvt', 'dct', 'hybrid']
   - FUEL_TYPES = ['gasoline', 'diesel', 'hybrid', 'electric']
   - FUEL_GRADES = ['Regular', 'Premium', 'Diesel', 'Premium Plus']
   - ACTION_TYPES = ['R', 'I', 'L', 'T', 'S'] (Replace, Inspect, Lubricate, Tighten, Service)
   - DIFFICULTY_LEVELS = ['easy', 'medium', 'hard', 'professional']
   - PAYMENT_METHODS = ['cash', 'credit', 'debit', 'digital']

2. Add custom methods to models:
   - Vehicle: get_maintenance_schedule(), update_odometer()
   - FillUp: calculate_fuel_economy(), get_previous_fillup()
   - MaintenanceService: mark_as_completed()

3. Create model managers for custom queries:
   - VehicleManager: active_vehicles(), by_user()
   - FillUpManager: for_vehicle(), in_date_range()
   - MaintenanceReminderManager: overdue_reminders(), due_soon_reminders()

4. Add signals for:
   - Auto-updating vehicle current_odometer when FillUp or MaintenanceService is added
   - Creating maintenance reminders when vehicle is added
   - Updating reminder status when service is completed

5. Create migrations for all models

The models should support Philippines-specific features:
- PHP currency fields
- Severe condition factor (0.8) for maintenance intervals
- Philippines fuel types and grades
- Local vehicle makes and models

Focus on creating a robust model structure that can handle all MVP requirements while being extensible for future features.