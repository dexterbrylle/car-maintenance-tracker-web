# Mobile-First Optimization for Maintenance Tracker

Optimize the existing maintenance tracker for mobile devices with mobile-first component design and interactions.

## REQUIREMENTS:
Transform the current desktop-focused interface into a mobile-first experience while maintaining desktop functionality.

## 1. Mobile-First Dashboard Layout

Update `src/pages/Dashboard.tsx` with mobile-first responsive design:

```typescript
export function Dashboard() {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [showQuickActions, setShowQuickActions] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
      {/* Mobile Header - Sticky */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4 md:relative md:bg-transparent md:border-0">
        <VehicleHeaderMobile vehicle={vehicle} onMileageUpdate={handleMileageUpdate} />
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6 max-w-7xl mx-auto">
        {/* Stats Grid - Mobile-optimized */}
        <StatsGridMobile maintenanceStatus={maintenanceStatus} />

        {/* Maintenance Status - Mobile Cards */}
        <MaintenanceStatusMobile
          maintenanceStatus={maintenanceStatus}
          onMarkComplete={handleMarkComplete}
        />

        {/* Maintenance Insights - Collapsible on Mobile */}
        <MaintenanceInsightsMobile
          vehicle={vehicle}
          completedServices={recentServices}
          upcomingMaintenance={maintenanceStatus?.due_soon || []}
        />
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation />

      {/* Floating Action Button - Mobile Only */}
      <FloatingActionButton
        onClick={() => setShowQuickActions(!showQuickActions)}
        isOpen={showQuickActions}
      />
    </div>
  );
}
```

## 2. Mobile-First Vehicle Header Component

Create `src/components/mobile/VehicleHeaderMobile.tsx`:

```typescript
interface VehicleHeaderMobileProps {
  vehicle: Vehicle;
  onMileageUpdate: (mileage: number) => void;
}

export function VehicleHeaderMobile({ vehicle, onMileageUpdate }: VehicleHeaderMobileProps) {
  const [isEditingMileage, setIsEditingMileage] = useState(false);
  const [tempMileage, setTempMileage] = useState(vehicle.current_mileage.toString());

  const handleMileageSubmit = () => {
    const newMileage = parseInt(tempMileage);
    if (newMileage >= vehicle.current_mileage) {
      onMileageUpdate(newMileage);
      setIsEditingMileage(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-gray-900 truncate">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h1>
        <div className="flex items-center gap-2 mt-1">
          {isEditingMileage ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={tempMileage}
                onChange={(e) => setTempMileage(e.target.value)}
                className="w-24 h-8 text-sm"
                onBlur={handleMileageSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleMileageSubmit()}
                autoFocus
              />
              <span className="text-sm text-gray-600">km</span>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingMileage(true)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <span>{vehicle.current_mileage.toLocaleString()} km</span>
              <Edit3 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <Button variant="ghost" size="sm" className="p-2">
        <MoreVertical className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

## 3. Mobile Stats Grid Component

Create `src/components/mobile/StatsGridMobile.tsx`:

```typescript
interface StatsGridMobileProps {
  maintenanceStatus: MaintenanceStatus;
}

export function StatsGridMobile({ maintenanceStatus }: StatsGridMobileProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatsCardMobile
        title="Due Now"
        value={maintenanceStatus.due_now.length}
        subtitle="items"
        color="red"
        icon={<AlertTriangle className="h-4 w-4" />}
      />
      <StatsCardMobile
        title="Due Soon"
        value={maintenanceStatus.due_soon.length}
        subtitle="items"
        color="yellow"
        icon={<Clock className="h-4 w-4" />}
      />
      <StatsCardMobile
        title="Up to Date"
        value={maintenanceStatus.ok.length}
        subtitle="items"
        color="green"
        icon={<CheckCircle className="h-4 w-4" />}
      />
      <StatsCardMobile
        title="Total"
        value={maintenanceStatus.due_now.length + maintenanceStatus.due_soon.length + maintenanceStatus.ok.length}
        subtitle="items"
        color="gray"
        icon={<Wrench className="h-4 w-4" />}
      />
    </div>
  );
}

interface StatsCardMobileProps {
  title: string;
  value: number;
  subtitle: string;
  color: 'red' | 'yellow' | 'green' | 'gray';
  icon: React.ReactNode;
}

function StatsCardMobile({ title, value, subtitle, color, icon }: StatsCardMobileProps) {
  const colorClasses = {
    red: 'bg-red-50 border-red-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    green: 'bg-green-50 border-green-200',
    gray: 'bg-gray-50 border-gray-200'
  };

  const textColorClasses = {
    red: 'text-red-700',
    yellow: 'text-yellow-700',
    green: 'text-green-700',
    gray: 'text-gray-700'
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">{title}</span>
        <div className={`${textColorClasses[color]}`}>{icon}</div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${textColorClasses[color]}`}>{value}</span>
        <span className="text-xs text-gray-500">{subtitle}</span>
      </div>
    </div>
  );
}
```

## 4. Mobile Maintenance Status Component

Create `src/components/mobile/MaintenanceStatusMobile.tsx`:

```typescript
interface MaintenanceStatusMobileProps {
  maintenanceStatus: MaintenanceStatus;
  onMarkComplete: (itemId: string) => void;
}

export function MaintenanceStatusMobile({ maintenanceStatus, onMarkComplete }: MaintenanceStatusMobileProps) {
  return (
    <div className="space-y-4">
      {/* Due Now Section */}
      {maintenanceStatus.due_now.length > 0 && (
        <MaintenanceSectionMobile
          title="Due Now"
          items={maintenanceStatus.due_now}
          status="due_now"
          onMarkComplete={onMarkComplete}
        />
      )}

      {/* Due Soon Section */}
      {maintenanceStatus.due_soon.length > 0 && (
        <MaintenanceSectionMobile
          title="Due Soon"
          items={maintenanceStatus.due_soon}
          status="due_soon"
          onMarkComplete={onMarkComplete}
        />
      )}

      {/* OK Section - Collapsible */}
      <CollapsibleMaintenanceSection
        title="Up to Date"
        items={maintenanceStatus.ok}
        status="ok"
      />
    </div>
  );
}

function MaintenanceSectionMobile({ title, items, status, onMarkComplete }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <StatusBadgeMobile status={status} />
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className="text-sm text-gray-500">({items.length})</span>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <MaintenanceItemMobile
            key={item.maintenance_item._id}
            item={item}
            status={status}
            onMarkComplete={onMarkComplete}
          />
        ))}
      </div>
    </Card>
  );
}

function MaintenanceItemMobile({ item, status, onMarkComplete }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{item.maintenance_item.name}</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div>{item.maintenance_item.category}</div>
          {status === 'due_now' && item.miles_overdue && (
            <div className="text-red-600 font-medium">
              {item.miles_overdue.toLocaleString()} km overdue
            </div>
          )}
          {status === 'due_soon' && item.miles_until_due && (
            <div className="text-yellow-600 font-medium">
              Due in {item.miles_until_due.toLocaleString()} km
            </div>
          )}
        </div>
      </div>

      {(status === 'due_now' || status === 'due_soon') && (
        <div className="flex flex-col gap-1 ml-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onMarkComplete(item.maintenance_item._id)}
            className="text-xs px-2 py-1 h-auto"
          >
            Complete
          </Button>
        </div>
      )}
    </div>
  );
}
```

## 5. Floating Action Button

Create `src/components/mobile/FloatingActionButton.tsx`:

```typescript
interface FloatingActionButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function FloatingActionButton({ onClick, isOpen }: FloatingActionButtonProps) {
  return (
    <div className="fixed bottom-20 right-4 z-50 md:hidden">
      {/* Quick Actions Menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg border border-gray-200 p-2 space-y-2 min-w-[200px]">
          <QuickActionButton
            icon={<Plus className="h-4 w-4" />}
            label="Log Service"
            onClick={() => {/* Handle log service */}}
          />
          <QuickActionButton
            icon={<RotateCcw className="h-4 w-4" />}
            label="Update Mileage"
            onClick={() => {/* Handle mileage update */}}
          />
          <QuickActionButton
            icon={<Calendar className="h-4 w-4" />}
            label="Schedule Service"
            onClick={() => {/* Handle schedule */}}
          />
        </div>
      )}

      {/* Main FAB */}
      <Button
        size="lg"
        onClick={onClick}
        className={`h-14 w-14 rounded-full shadow-lg transition-all duration-200 ${
          isOpen ? 'bg-gray-600 rotate-45' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}

function QuickActionButton({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
    >
      <div className="text-gray-600">{icon}</div>
      <span className="text-sm font-medium text-gray-900">{label}</span>
    </button>
  );
}
```

## 6. Bottom Navigation

Create `src/components/mobile/BottomNavigation.tsx`:

```typescript
export function BottomNavigation() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/vehicles', icon: Car, label: 'Vehicles' },
    { path: '/services', icon: Wrench, label: 'Services' },
    { path: '/schedule', icon: Calendar, label: 'Schedule' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
      <div className="flex">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex-1 flex flex-col items-center py-2 px-1 ${
              location.pathname === item.path
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs mt-1 truncate">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

## 7. Touch-Optimized Forms

Create `src/components/mobile/ServiceFormMobile.tsx`:

```typescript
export function ServiceFormMobile({ vehicleId, maintenanceItemId, onSubmit, onCancel }) {
  return (
    <div className="fixed inset-0 bg-white z-50 md:relative md:bg-transparent">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="font-semibold">Log Service</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Date Input - Mobile optimized */}
        <div>
          <Label htmlFor="date" className="text-base font-medium">Date</Label>
          <Input
            type="date"
            id="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            className="mt-2 h-12 text-base"
          />
        </div>

        {/* Mileage Input - Large and touch-friendly */}
        <div>
          <Label htmlFor="mileage" className="text-base font-medium">Mileage</Label>
          <Input
            type="number"
            id="mileage"
            placeholder="Current mileage"
            value={formData.mileage}
            onChange={(e) => setFormData({...formData, mileage: e.target.value})}
            className="mt-2 h-12 text-lg"
            inputMode="numeric"
          />
        </div>

        {/* Cost Input */}
        <div>
          <Label htmlFor="cost" className="text-base font-medium">Cost (₱)</Label>
          <Input
            type="number"
            step="0.01"
            id="cost"
            placeholder="0.00"
            value={formData.cost}
            onChange={(e) => setFormData({...formData, cost: e.target.value})}
            className="mt-2 h-12 text-lg"
            inputMode="decimal"
          />
        </div>

        {/* Notes - Expandable textarea */}
        <div>
          <Label htmlFor="notes" className="text-base font-medium">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Service details..."
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            className="mt-2 min-h-[100px] text-base resize-none"
            rows={4}
          />
        </div>

        {/* Submit Button - Full width and prominent */}
        <div className="pt-6">
          <Button
            type="submit"
            className="w-full h-12 text-base font-medium"
            disabled={!isFormValid()}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </div>
            ) : (
              'Log Service'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
```

## 8. Mobile Performance Optimizations

Add these optimizations to improve mobile performance:

```typescript
// Lazy load components
const MaintenanceInsights = React.lazy(() => import('./MaintenanceInsights'));

// Optimize images and icons
const iconProps = {
  className: "h-4 w-4",
  strokeWidth: 2.5 // Slightly thicker for mobile visibility
};

// Touch event handlers
const handleTouchStart = useCallback((e: TouchEvent) => {
  // Handle touch interactions
}, []);

// Intersection Observer for lazy loading
const useIntersectionObserver = (callback: () => void) => {
  // Implementation for lazy loading sections
};
```

## MOBILE-FIRST PRINCIPLES APPLIED:

1. **Touch Targets**: Minimum 44px (iOS) / 48px (Android) touch targets
2. **Typography**: Larger text sizes for mobile readability
3. **Spacing**: Generous padding and margins for finger navigation
4. **Navigation**: Bottom navigation for thumb reach
5. **Forms**: Large input fields with appropriate input modes
6. **Loading**: Progressive loading and skeleton screens
7. **Gestures**: Swipe actions and pull-to-refresh where appropriate
8. **Performance**: Lazy loading and optimized rendering

This mobile-first approach ensures the maintenance tracker works excellently on mobile devices while maintaining desktop functionality.
