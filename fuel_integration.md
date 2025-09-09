# Claude Code Prompts - Add Fuel Tracking to Maintenance Tracker

## Prompt 1: Backend Fuel Tracking Integration

```
Enhance the existing maintenance tracker Flask backend to include fuel tracking capabilities.

CURRENT STATUS:
- Working Flask backend with MongoDB
- Vehicle management, maintenance schedules, service records
- Dashboard endpoint calculating maintenance status

TASK: Add comprehensive fuel tracking functionality

1. **New Data Model: FillUp Collection**
Add to `backend/models.py`:
```python
# FillUp collection schema
{
    "_id": ObjectId,
    "vehicle_id": ObjectId,
    "date": "2025-09-09",
    "odometer_km": 54800,
    "liters": 45.5,
    "price_per_liter": 58.50,
    "total_cost": 2661.75,
    "full_tank": True,
    "fuel_economy_kmpl": 12.8,  # calculated
    "cost_per_km": 4.85,        # calculated
    "notes": "Shell V-Power",
    "created_at": datetime
}
```

2. **New Routes: Fill-ups Management**
Create `backend/routes/fillups.py`:
```python
@fillups_bp.route('', methods=['POST'])
def add_fillup():
    # Validate input data
    # Calculate fuel economy based on previous fill-up
    # Calculate cost per km
    # Save to database
    # Update vehicle fuel stats

@fillups_bp.route('/<vehicle_id>', methods=['GET'])
def get_fillups(vehicle_id):
    # Return all fill-ups for vehicle, sorted by date desc
    # Include pagination support

@fillups_bp.route('/<fillup_id>', methods=['PUT'])
def update_fillup(fillup_id):
    # Update fill-up record
    # Recalculate fuel economy for affected records

@fillups_bp.route('/<fillup_id>', methods=['DELETE'])
def delete_fillup(fillup_id):
    # Delete fill-up record
    # Recalculate fuel economy for affected records
```

3. **Fuel Economy Calculation Logic**
Create `backend/utils/fuel_calculations.py`:
```python
def calculate_fuel_economy(current_fillup, previous_fillup):
    """
    Calculate km/L between two fill-ups
    Returns None if no previous fill-up or if not full tank
    """
    if not previous_fillup or not current_fillup.get('full_tank'):
        return None

    distance = current_fillup['odometer_km'] - previous_fillup['odometer_km']
    liters = current_fillup['liters']

    if distance <= 0 or liters <= 0:
        return None

    return round(distance / liters, 2)

def calculate_cost_per_km(distance, total_cost):
    """Calculate cost per kilometer"""
    if distance <= 0:
        return None
    return round(total_cost / distance, 2)

def update_vehicle_fuel_stats(vehicle_id):
    """Update vehicle's aggregate fuel statistics"""
    fillups = get_fillups_for_vehicle(vehicle_id)

    if not fillups:
        return

    # Calculate aggregates
    economies = [f['fuel_economy_kmpl'] for f in fillups if f.get('fuel_economy_kmpl')]

    stats = {
        'avg_fuel_economy': round(sum(economies) / len(economies), 2) if economies else None,
        'best_fuel_economy': max(economies) if economies else None,
        'worst_fuel_economy': min(economies) if economies else None,
        'total_fuel_cost_ytd': sum(f['total_cost'] for f in fillups if f['date'].year == datetime.now().year),
        'last_fillup_date': max(f['date'] for f in fillups).isoformat()
    }

    # Update vehicle document
    db.vehicles.update_one(
        {"_id": ObjectId(vehicle_id)},
        {"$set": {"fuel_stats": stats}}
    )
```

4. **Enhanced Dashboard Endpoint**
Update `backend/routes/dashboard.py`:
```python
@dashboard_bp.route('/<vehicle_id>')
def get_dashboard(vehicle_id):
    # Existing maintenance status calculation
    maintenance_status = calculate_maintenance_status(vehicle_id)

    # New: Add fuel performance data
    fuel_stats = get_fuel_performance(vehicle_id)

    # New: Generate smart insights
    insights = generate_insights(vehicle_id)

    return jsonify({
        "vehicle": get_vehicle(vehicle_id),
        "maintenance": maintenance_status,
        "fuel_performance": fuel_stats,
        "insights": insights
    })

def get_fuel_performance(vehicle_id):
    """Get current fuel performance metrics"""
    recent_fillups = get_recent_fillups(vehicle_id, limit=5)

    if not recent_fillups:
        return None

    latest = recent_fillups[0]
    economies = [f['fuel_economy_kmpl'] for f in recent_fillups if f.get('fuel_economy_kmpl')]

    return {
        "current_economy": latest.get('fuel_economy_kmpl'),
        "avg_economy_recent": round(sum(economies) / len(economies), 2) if economies else None,
        "cost_per_km": latest.get('cost_per_km'),
        "last_fillup_date": latest['date'],
        "monthly_fuel_cost": calculate_monthly_fuel_cost(vehicle_id)
    }
```

5. **Smart Insights Engine**
Create `backend/utils/insights.py`:
```python
def generate_insights(vehicle_id):
    """Generate actionable insights correlating fuel and maintenance"""
    insights = []

    # Get recent fuel economy trend
    recent_economy = get_recent_avg_economy(vehicle_id, days=30)
    historical_economy = get_historical_avg_economy(vehicle_id)

    if recent_economy and historical_economy:
        economy_change = (recent_economy - historical_economy) / historical_economy

        # Fuel economy declining
        if economy_change < -0.1:  # 10% worse
            due_maintenance = get_due_maintenance_items(vehicle_id)
            engine_items = [item for item in due_maintenance
                          if item['category'] in ['Engine', 'Fuel System', 'Air System']]

            if engine_items:
                insights.append({
                    "type": "fuel_maintenance_correlation",
                    "severity": "warning",
                    "title": "Fuel Economy Declining",
                    "message": f"Fuel economy down {abs(economy_change)*100:.0f}% - check {engine_items[0]['name']}",
                    "action_items": engine_items,
                    "trend": economy_change
                })

    return insights
```

6. **API Integration**
Update `backend/app.py` to register new blueprint:
```python
from routes.fillups import fillups_bp

app.register_blueprint(fillups_bp, url_prefix='/api/fillups')
```

7. **Data Validation**
Add validation for fill-up data:
- Odometer must be >= previous odometer
- Liters must be positive
- Price per liter must be positive
- Date cannot be in future
- Fuel economy recalculation on updates/deletes

SPECIFIC REQUIREMENTS:
- Maintain existing API structure and patterns
- Add proper error handling for fuel calculations
- Ensure fill-up deletion recalculates dependent records
- Include MongoDB indexes for performance
- Add Swagger documentation for new endpoints

Focus on robust calculation logic - fuel economy accuracy is critical for user trust.
```

## Prompt 2: Frontend Fuel Tracking UI & Mobile Optimization

```
Enhance the existing React frontend to include fuel tracking with mobile-optimized UI components.

CURRENT STATUS:
- Working React frontend with ShadcnUI components
- Dashboard, vehicle management, service logging
- Desktop-focused layout

TASK: Add fuel tracking UI with mobile-first approach

1. **Enhanced Dashboard with Fuel Stats**
Update `src/pages/Dashboard.tsx`:
```typescript
interface DashboardData {
  vehicle: Vehicle;
  maintenance: MaintenanceStatus;
  fuel_performance: FuelPerformance | null;
  insights: Insight[];
}

interface FuelPerformance {
  current_economy: number;
  avg_economy_recent: number;
  cost_per_km: number;
  last_fillup_date: string;
  monthly_fuel_cost: number;
}

// New dashboard layout
<div className="space-y-6">
  {/* Vehicle Header */}
  <VehicleHeader vehicle={vehicle} />

  {/* Stats Cards Grid - Mobile Responsive */}
  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
    <StatsCard
      title="Fuel Economy"
      value={`${fuelPerformance?.current_economy || '--'} km/L`}
      subtitle={`Avg: ${fuelPerformance?.avg_economy_recent || '--'} km/L`}
      trend={calculateTrend(fuelPerformance)}
      icon={<Fuel className="h-4 w-4" />}
    />
    <StatsCard
      title="Cost/KM"
      value={`₱${fuelPerformance?.cost_per_km || '--'}`}
      subtitle="Current rate"
      icon={<Calculator className="h-4 w-4" />}
    />
    <StatsCard
      title="Due Soon"
      value={`${maintenance.due_soon.length} items`}
      subtitle="Maintenance"
      icon={<Wrench className="h-4 w-4" />}
    />
    <StatsCard
      title="This Month"
      value={`₱${fuelPerformance?.monthly_fuel_cost || '--'}`}
      subtitle="Fuel cost"
      icon={<TrendingUp className="h-4 w-4" />}
    />
  </div>

  {/* Insights Section */}
  {insights.length > 0 && (
    <InsightsSection insights={insights} />
  )}

  {/* Maintenance Status */}
  <MaintenanceStatusSection maintenance={maintenance} />

  {/* Recent Fill-ups */}
  <RecentFillups vehicleId={vehicle._id} />

  {/* Floating Action Buttons - Mobile */}
  <div className="fixed bottom-6 right-6 flex flex-col gap-3 md:hidden">
    <FloatingActionButton
      icon={<Plus />}
      onClick={() => setShowAddFillup(true)}
      label="Add Fill-up"
      color="blue"
    />
    <FloatingActionButton
      icon={<Wrench />}
      onClick={() => setShowAddService(true)}
      label="Log Service"
      color="green"
    />
  </div>
</div>
```

2. **Mobile-Optimized Stats Cards**
Create `src/components/StatsCard.tsx`:
```typescript
interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  onClick?: () => void;
}

export function StatsCard({ title, value, subtitle, trend, icon, onClick }: StatsCardProps) {
  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        onClick ? 'hover:bg-gray-50' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>

      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500">{subtitle}</p>
        )}
        {trend && (
          <div className={`flex items-center text-xs ${
            trend === 'up' ? 'text-green-600' :
            trend === 'down' ? 'text-red-600' : 'text-gray-500'
          }`}>
            {trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
            {trend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
          </div>
        )}
      </div>
    </Card>
  );
}
```

3. **Add Fill-up Modal (Mobile-First)**
Create `src/components/AddFillupModal.tsx`:
```typescript
interface AddFillupModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  currentMileage?: number;
}

export function AddFillupModal({ isOpen, onClose, vehicleId, currentMileage }: AddFillupModalProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    odometer_km: currentMileage || '',
    liters: '',
    price_per_liter: '',
    full_tank: true,
    notes: ''
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Add Fill-up
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date */}
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              type="date"
              id="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>

          {/* Odometer - Large, touch-friendly */}
          <div>
            <Label htmlFor="odometer">Odometer (km)</Label>
            <Input
              type="number"
              id="odometer"
              placeholder="54800"
              value={formData.odometer_km}
              onChange={(e) => setFormData({...formData, odometer_km: e.target.value})}
              className="text-lg h-12"
            />
          </div>

          {/* Two-column layout for mobile */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="liters">Liters</Label>
              <Input
                type="number"
                step="0.1"
                id="liters"
                placeholder="45.5"
                value={formData.liters}
                onChange={(e) => setFormData({...formData, liters: e.target.value})}
                className="h-12"
              />
            </div>
            <div>
              <Label htmlFor="price">₱ per Liter</Label>
              <Input
                type="number"
                step="0.01"
                id="price"
                placeholder="58.50"
                value={formData.price_per_liter}
                onChange={(e) => setFormData({...formData, price_per_liter: e.target.value})}
                className="h-12"
              />
            </div>
          </div>

          {/* Auto-calculated total */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <Label className="text-sm text-gray-600">Total Cost</Label>
            <p className="text-xl font-bold">
              ₱{calculateTotal(formData.liters, formData.price_per_liter)}
            </p>
          </div>

          {/* Full tank toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="full-tank"
              checked={formData.full_tank}
              onCheckedChange={(checked) => setFormData({...formData, full_tank: checked})}
            />
            <Label htmlFor="full-tank">Full tank (required for fuel economy calculation)</Label>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Shell V-Power, highway driving..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="resize-none"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => handleSubmit(formData)}
            disabled={!isFormValid(formData)}
            className="min-w-[100px]"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Fill-up'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

4. **Recent Fill-ups Component**
Create `src/components/RecentFillups.tsx`:
```typescript
export function RecentFillups({ vehicleId }: { vehicleId: string }) {
  const [fillups, setFillups] = useState<Fillup[]>([]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Fuel className="h-5 w-5" />
          Recent Fill-ups
        </h3>
        <Button variant="outline" size="sm" onClick={() => navigate('/fuel-history')}>
          View All
        </Button>
      </div>

      <div className="space-y-3">
        {fillups.map((fillup) => (
          <div key={fillup._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">{formatDate(fillup.date)}</p>
              <p className="text-sm text-gray-600">
                {fillup.odometer_km.toLocaleString()} km • {fillup.liters}L
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">₱{fillup.total_cost.toFixed(2)}</p>
              {fillup.fuel_economy_kmpl && (
                <p className="text-sm text-gray-600">{fillup.fuel_economy_kmpl} km/L</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
```

5. **Insights Component**
Create `src/components/InsightsSection.tsx`:
```typescript
export function InsightsSection({ insights }: { insights: Insight[] }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Lightbulb className="h-5 w-5" />
        Insights
      </h3>

      <div className="space-y-3">
        {insights.map((insight, index) => (
          <Alert key={index} className={
            insight.severity === 'warning' ? 'border-yellow-200 bg-yellow-50' :
            insight.severity === 'error' ? 'border-red-200 bg-red-50' :
            'border-blue-200 bg-blue-50'
          }>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{insight.title}</AlertTitle>
            <AlertDescription className="mt-2">
              {insight.message}
              {insight.action_items && insight.action_items.length > 0 && (
                <div className="mt-2">
                  <Button size="sm" variant="outline">
                    Schedule {insight.action_items[0].name}
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        ))}
      </div>
    </Card>
  );
}
```

6. **Floating Action Button (Mobile)**
Create `src/components/FloatingActionButton.tsx`:
```typescript
interface FloatingActionButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  label: string;
  color?: 'blue' | 'green' | 'red';
}

export function FloatingActionButton({ icon, onClick, label, color = 'blue' }: FloatingActionButtonProps) {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    red: 'bg-red-600 hover:bg-red-700'
  };

  return (
    <Button
      onClick={onClick}
      className={`
        h-14 w-14 rounded-full shadow-lg transition-all hover:shadow-xl
        ${colorClasses[color]}
        md:hidden
      `}
      size="icon"
      title={label}
    >
      {icon}
    </Button>
  );
}
```

7. **Enhanced API Client**
Update `src/lib/api.ts`:
```typescript
export const api = {
  // ... existing methods

  // Fuel tracking
  addFillup: (data: Partial<Fillup>) =>
    axios.post(`${API_BASE}/fillups`, data),

  getFillups: (vehicleId: string) =>
    axios.get(`${API_BASE}/fillups/${vehicleId}`),

  updateFillup: (fillupId: string, data: Partial<Fillup>) =>
    axios.put(`${API_BASE}/fillups/${fillupId}`, data),

  deleteFillup: (fillupId: string) =>
    axios.delete(`${API_BASE}/fillups/${fillupId}`),

  // Enhanced dashboard
  getDashboard: (vehicleId: string) =>
    axios.get(`${API_BASE}/dashboard/${vehicleId}`), // Now includes fuel data
};
```

IMPLEMENTATION FOCUS:
- Mobile-first design with touch-friendly inputs
- Quick fill-up entry workflow (minimal taps)
- Visual correlation between fuel and maintenance
- Responsive grid layouts
- Loading states and error handling
- Progressive enhancement for desktop

The goal is a smooth mobile experience where users can quickly log fill-ups and immediately see the correlation with their maintenance schedule.
```

## Prompt 3: Smart Analytics & Complete Integration

```
Complete the fuel tracking integration by adding advanced analytics, export capabilities, and final polish.

CURRENT STATUS:
- Fuel tracking backend with calculation engine
- Enhanced dashboard with fuel performance metrics
- Mobile-optimized fill-up entry

TASK: Add comprehensive analytics and complete the integration

1. **Fuel History Page**
Create `src/pages/FuelHistory.tsx`:
```typescript
export function FuelHistoryPage() {
  const [fillups, setFillups] = useState<Fillup[]>([]);
  const [filters, setFilters] = useState({
    dateRange: 'last_6_months',
    fuelType: 'all'
  });
  const [analytics, setAnalytics] = useState<FuelAnalytics | null>(null);

  return (
    <div className="space-y-6">
      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnalyticsCard
          title="Average Fuel Economy"
          value={`${analytics?.avg_fuel_economy || '--'} km/L`}
          comparison={`${analytics?.economy_trend > 0 ? '+' : ''}${analytics?.economy_trend || 0}%`}
          trend={analytics?.economy_trend > 0 ? 'up' : analytics?.economy_trend < 0 ? 'down' : 'neutral'}
        />
        <AnalyticsCard
          title="Total Fuel Cost"
          value={`₱${analytics?.total_fuel_cost?.toLocaleString() || '--'}`}
          comparison="This year"
        />
        <AnalyticsCard
          title="Cost per Kilometer"
          value={`₱${analytics?.avg_cost_per_km || '--'}`}
          comparison="Average"
        />
      </div>

      {/* Fuel Economy Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Fuel Economy Trend</h3>
          <Select value={filters.dateRange} onValueChange={(value) => setFilters({...filters, dateRange: value})}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_3_months">Last 3 months</SelectItem>
              <SelectItem value="last_6_months">Last 6 months</SelectItem>
              <SelectItem value="last_year">Last year</SelectItem>
              <SelectItem value="all_time">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <FuelEconomyChart fillups={fillups} />
      </Card>

      {/* Cost Analysis Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Monthly Fuel Spending</h3>
        <MonthlyCostChart fillups={fillups} />
      </Card>

      {/* Fill-up Records Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Fill-up Records</h3>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportToCSV(fillups)}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
        <FillupTable fillups={fillups} onEdit={handleEdit} onDelete={handleDelete} />
      </Card>
    </div>
  );
}
```

2. **Fuel Economy Chart Component**
Create `src/components/charts/FuelEconomyChart.tsx`:
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function FuelEconomyChart({ fillups }: { fillups: Fillup[] }) {
  const chartData = fillups
    .filter(f => f.fuel_economy_kmpl)
    .map(f => ({
      date: format(new Date(f.date), 'MMM dd'),
      economy: f.fuel_economy_kmpl,
      cost_per_km: f.cost_per_km,
      odometer: f.odometer_km
    }))
    .slice(-20); // Last 20 fill-ups

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={['dataMin - 1', 'dataMax + 1']}
            tick={{ fontSize: 12 }}
            label={{ value: 'km/L', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={(value, name) => [
              name === 'economy' ? `${value} km/L` : `₱${value}`,
              name === 'economy' ? 'Fuel Economy' : 'Cost per KM'
            ]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="economy"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
            name="Fuel Economy (km/L)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

3. **Enhanced Backend Analytics**
Update `backend/routes/analytics.py`:
```python
@analytics_bp.route('/<vehicle_id>/fuel')
def get_fuel_analytics(vehicle_id):
    """Get comprehensive fuel analytics for vehicle"""
    fillups = list(db.fill_ups.find({"vehicle_id": ObjectId(vehicle_id)}).sort("date", 1))

    if not fillups:
        return jsonify({"error": "No fuel data found"}), 404

    # Calculate analytics
    analytics = {
        "total_fillups": len(fillups),
        "total_fuel_cost": sum(f["total_cost"] for f in fillups),
        "total_liters": sum(f["liters"] for f in fillups),
        "avg_fuel_economy": calculate_avg_fuel_economy(fillups),
        "best_fuel_economy": max((f["fuel_economy_kmpl"] for f in fillups if f.get("fuel_economy_kmpl")), default=None),
        "worst_fuel_economy": min((f["fuel_economy_kmpl"] for f in fillups if f.get("fuel_economy_kmpl")), default=None),
        "economy_trend": calculate_economy_trend(fillups),
        "avg_cost_per_km": calculate_avg_cost_per_km(fillups),
        "monthly_breakdown": get_monthly_breakdown(fillups),
        "fuel_economy_history": get_economy_history(fillups)
    }

    return jsonify(analytics)

def calculate_economy_trend(fillups):
    """Calculate fuel economy trend percentage"""
    if len(fillups) < 4:
        return 0

    # Compare recent 25% vs previous 25%
    quarter = len(fillups) // 4
    recent = fillups[-quarter:]
    previous = fillups[-quarter*2:-quarter]

    recent_avg = calculate_avg_fuel_economy(recent)
    previous_avg = calculate_avg_fuel_economy(previous)

    if not recent_avg or not previous_avg:
        return 0

    return round(((recent_avg - previous_avg) / previous_avg) * 100, 1)

def get_monthly_breakdown(fillups):
    """Get monthly fuel spending breakdown"""
    monthly = {}

    for fillup in fillups:
        month_key = fillup["date"].strftime("%Y-%m")
        if month_key not in monthly:
            monthly[month_key] = {
                "month": fillup["date"].strftime("%b %Y"),
                "total_cost": 0,
                "total_liters": 0,
                "fillup_count": 0,
                "avg_economy": []
            }

        monthly[month_key]["total_cost"] += fillup["total_cost"]
        monthly[month_key]["total_liters"] += fillup["liters"]
        monthly[month_key]["fillup_count"] += 1

        if fillup.get("fuel_economy_kmpl"):
            monthly[month_key]["avg_economy"].append(fillup["fuel_economy_kmpl"])

    # Calculate averages
    for month_data in monthly.values():
        if month_data["avg_economy"]:
            month_data["avg_economy"] = sum(month_data["avg_economy"]) / len(month_data["avg_economy"])
        else:
            month_data["avg_economy"] = None

    return list(monthly.values())
```

4. **Combined Cost Analysis**
Create `backend/routes/cost_analysis.py`:
```python
@cost_analysis_bp.route('/<vehicle_id>')
def get_combined_cost_analysis(vehicle_id):
    """Get combined maintenance + fuel cost analysis"""

    # Get maintenance costs
    maintenance_costs = get_maintenance_costs(vehicle_id)

    # Get fuel costs
    fuel_costs = get_fuel_costs(vehicle_id)

    # Combine and analyze
    analysis = {
        "total_cost_ytd": maintenance_costs["total_ytd"] + fuel_costs["total_ytd"],
        "monthly_breakdown": combine_monthly_costs(maintenance_costs["monthly"], fuel_costs["monthly"]),
        "cost_per_km": {
            "maintenance": maintenance_costs["cost_per_km"],
            "fuel": fuel_costs["cost_per_km"],
            "total": maintenance_costs["cost_per_km"] + fuel_costs["cost_per_km"]
        },
        "projections": {
            "annual_maintenance": maintenance_costs["projected_annual"],
            "annual_fuel": fuel_costs["projected_annual"],
            "total_annual": maintenance_costs["projected_annual"] + fuel_costs["projected_annual"]
        }
    }

    return jsonify(analysis)

def combine_monthly_costs(maintenance_monthly, fuel_monthly):
    """Combine maintenance and fuel costs by month"""
    combined = {}

    # Add maintenance costs
    for month_data in maintenance_monthly:
        month = month_data["month"]
        combined[month] = {
            "month": month,
            "maintenance_cost": month_data["total_cost"],
            "fuel_cost": 0,
            "total_cost": month_data["total_cost"]
        }

    # Add fuel costs
    for month_data in fuel_monthly:
        month = month_data["month"]
        if month in combined:
            combined[month]["fuel_cost"] = month_data["total_cost"]
            combined[month]["total_cost"] += month_data["total_cost"]
        else:
            combined[month] = {
                "month": month,
                "maintenance_cost": 0,
                "fuel_cost": month_data["total_cost"],
                "total_cost": month_data["total_cost"]
            }

    return sorted(combined.values(), key=lambda x: x["month"])
```

5. **CSV Export Functionality**
Create `src/utils/export.ts`:
```typescript
export function exportFillupsToCsv(fillups: Fillup[], vehicleInfo: Vehicle) {
  const headers = [
    'Date',
    'Odometer (km)',
    'Liters',
    'Price per Liter (₱)',
    'Total Cost (₱)',
    'Fuel Economy (km/L)',
    'Cost per KM (₱)',
    'Full Tank',
    'Notes'
  ];

  const rows = fillups.map(fillup => [
    fillup.date,
    fillup.odometer_km,
    fillup.liters,
    fillup.price_per_liter,
    fillup.total_cost,
    fillup.fuel_economy_kmpl || '',
    fillup.cost_per_km || '',
    fillup.full_tank ? 'Yes' : 'No',
    fillup.notes || ''
  ]);

  const csvContent = [
    [`Fuel Records - ${vehicleInfo.make} ${vehicleInfo.model} ${vehicleInfo.year}`],
    [`Generated: ${new Date().toLocaleDateString()}`],
    [],
    headers,
    ...rows
  ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

  downloadCsv(csvContent, `fuel-records-${vehicleInfo.make}-${vehicleInfo.model}.csv`);
}

export function exportCombinedCostAnalysis(analysis: CombinedCostAnalysis, vehicleInfo: Vehicle) {
  const headers = ['Month', 'Maintenance Cost (₱)', 'Fuel Cost (₱)', 'Total Cost (₱)'];

  const rows = analysis.monthly_breakdown.map(month => [
    month.month,
    month.maintenance_cost,
    month.fuel_cost,
    month.total_cost
  ]);

  const csvContent = [
    [`Combined Cost Analysis - ${vehicleInfo.make} ${vehicleInfo.model} ${vehicleInfo.year}`],
    [`Total Cost per KM: ₱${analysis.cost_per_km.total}`],
    [`Projected Annual Cost: ₱${analysis.projections.total_annual}`],
    [],
    headers,
    ...rows
  ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

  downloadCsv(csvContent, `cost-analysis-${vehicleInfo.make}-${vehicleInfo.model}.csv`);
}
```

6. **Final Dashboard Integration**
Update the main dashboard to show the complete picture:
```typescript
// Enhanced insights that consider both fuel and maintenance
function processEnhancedInsights(insights: Insight[], fuelPerformance: FuelPerformance, maintenance: MaintenanceStatus) {
  const enhancedInsights = [...insights];

  // Add maintenance-fuel correlations
  if (fuelPerformance && maintenance.due_now.length > 0) {
    const engineItems = maintenance.due_now.filter(item =>
      ['Engine', 'Fuel System'].includes(item.maintenance_item.category)
    );

    if (engineItems.length > 0 && fuelPerformance.current_economy < fuelPerformance.avg_economy_recent * 0.9) {
      enhancedInsights.unshift({
        type: 'performance_maintenance',
        severity: 'warning',
        title: 'Performance Impact',
        message: `Fuel economy is ${((fuelPerformance.avg_economy_recent - fuelPerformance.current_economy) / fuelPerformance.avg_economy_recent * 100).toFixed(0)}% below average. Consider servicing ${engineItems[0].maintenance_item.name}.`,
        action_items: engineItems.map(item => item.maintenance_item)
      });
    }
  }

  return enhancedInsights;
}
```

7. **Mobile Navigation Enhancement**
Update navigation to include fuel tracking:
```typescript
// Add to main navigation
const navigationItems = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Vehicles', href: '/vehicles', icon: Car },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Fuel History', href: '/fuel', icon: Fuel },
  { name: 'Analytics', href: '/analytics', icon: BarChart },
  { name: 'Settings', href: '/settings', icon: Settings }
];
```

FINAL INTEGRATION CHECKLIST:
- [ ] Fuel tracking fully integrated with maintenance data
- [ ] Dashboard shows combined insights
- [ ] Mobile-optimized fill-up entry workflow
- [ ] Charts and analytics working
- [ ] CSV export for fuel and combined data
- [ ] Performance correlations with maintenance
- [ ] Error handling and loading states
- [ ] Mobile navigation includes fuel features

SUCCESS CRITERIA:
The completed integration should provide:
1. **Complete vehicle management** - maintenance + fuel in one app
2. **Actionable insights** - correlate poor fuel economy with due maintenance
3. **Mobile-first experience** - quick fill-up logging on the go
4. **Comprehensive analytics** - understand total cost of ownership
5. **Export capabilities** - data for external analysis

This transforms your maintenance tracker into a comprehensive vehicle management system that provides unique insights by correlating fuel performance with maintenance schedules.
```

---

## Summary

This integration plan adds fuel tracking to your existing maintenance tracker, creating a **unique, comprehensive vehicle management system**:

### **Key Benefits of Integration:**

1. **Unique Value Proposition**: Only app that correlates fuel economy with maintenance schedules
2. **Complete Cost Picture**: Maintenance + fuel costs in one place
3. **Predictive Insights**: Poor fuel economy indicates maintenance needs
4. **Mobile-Optimized**: Quick fuel entry for gas station use
5. **Privacy-First**: Runs in your homelab with full data control

### **Implementation Order:**
1. **Prompt 1**: Backend fuel tracking and calculation engine
2. **Prompt 2**: Mobile-optimized frontend with fuel entry
3. **Prompt 3**: Advanced analytics and complete integration

### **Result:**
A production-ready vehicle management system that helps users:
- ✅ Track maintenance schedules (existing)
- ✅ Monitor fuel economy trends (new)
- ✅ Correlate performance with maintenance needs (unique)
- ✅ Understand total cost of ownership (comprehensive)
- ✅ Make data-driven maintenance decisions (valuable)

This integration leverages the best parts of the FuelPal design while building on your solid maintenance tracker foundation! 🚀
