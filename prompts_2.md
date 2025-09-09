# Claude Code Prompts - Complete the Maintenance Tracker (Core Version)

## Prompt 1: Official Mazda Schedule Data Seeding & Dashboard Logic

Looking at this existing maintenance tracker project, I need to implement the core missing functionality with the official Mazda maintenance schedule.

CURRENT STATUS:
- Backend Flask API with MongoDB is working
- Frontend React with TypeScript is working
- All CRUD endpoints exist but dashboard logic is incomplete
- Need to populate official Mazda CX-5 2016 maintenance schedule automatically

TASKS TO IMPLEMENT:

1. **Official Mazda CX-5 2014-2017 Schedule 2 Data Seeding**
Create a data seeding system that automatically populates maintenance items when a Mazda CX-5 2016 vehicle is added.

Add this file: `backend/data/mazda_cx5_2016_philippines.py`
```python
# Official Mazda CX-5 2016 Schedule 2 (Severe Driving Conditions)
# Suitable for Philippines due to: traffic congestion, dusty conditions,
# hot/humid climate, extended idling, rough roads

MAZDA_CX5_2016_PHILIPPINES_SCHEDULE = [
    # ENGINE
    {
        "name": "Engine Oil & Filter",
        "category": "Engine",
        "interval_km": 8000,
        "description": "Replace engine oil and filter (severe driving conditions)",
        "action": "Replace"
    },
    {
        "name": "Drive Belts",
        "category": "Engine",
        "interval_km": 48000,
        "description": "Inspect drive belts for wear and tension",
        "action": "Inspect"
    },

    # COOLING SYSTEM
    {
        "name": "Engine Coolant",
        "category": "Cooling System",
        "interval_km": 192000,  # First replacement at 192,000km
        "description": "Replace coolant (first: 192,000km or 10 years, then every 96,000km or 5 years). Use FL-22 coolant only.",
        "action": "Replace"
    },
    {
        "name": "Engine Coolant Level",
        "category": "Cooling System",
        "interval_km": 8000,
        "description": "Inspect engine coolant level",
        "action": "Inspect"
    },

    # FUEL SYSTEM
    {
        "name": "Air Filter",
        "category": "Fuel System",
        "interval_km": 24000,  # Severe conditions: replace at 24,000km
        "description": "Replace air filter (severe driving conditions)",
        "action": "Replace"
    },
    {
        "name": "Fuel Lines and Hoses",
        "category": "Fuel System",
        "interval_km": 32000,
        "description": "Inspect fuel lines and hoses for leaks or damage",
        "action": "Inspect"
    },
    {
        "name": "Emission Hoses and Tubes",
        "category": "Fuel System",
        "interval_km": 48000,
        "description": "Inspect hoses and tubes for emission system",
        "action": "Inspect"
    },

    # IGNITION SYSTEM
    {
        "name": "Spark Plugs",
        "category": "Ignition System",
        "interval_km": 120000,
        "description": "Replace spark plugs",
        "action": "Replace"
    },

    # ELECTRICAL SYSTEM
    {
        "name": "Function of All Lights",
        "category": "Electrical System",
        "interval_km": 8000,
        "description": "Inspect operation of all lights (headlights, taillights, turn signals, etc.)",
        "action": "Inspect"
    },

    # CHASSIS and BODY
    {
        "name": "Brake Lines, Hoses and Connections",
        "category": "Chassis and Body",
        "interval_km": 32000,
        "description": "Inspect brake lines, hoses and connections for leaks or damage",
        "action": "Inspect"
    },
    {
        "name": "Brake and Clutch Fluid Level",
        "category": "Chassis and Body",
        "interval_km": 8000,
        "description": "Inspect brake and clutch fluid level",
        "action": "Inspect"
    },
    {
        "name": "Disc Brakes",
        "category": "Chassis and Body",
        "interval_km": 16000,
        "description": "Inspect disc brakes for wear and damage",
        "action": "Inspect"
    },
    {
        "name": "Tire Rotation",
        "category": "Chassis and Body",
        "interval_km": 8000,
        "description": "Rotate tires for even wear. Initialize TPMS after rotation.",
        "action": "Service"
    },
    {
        "name": "Tire Inflation Pressure and Tire Wear",
        "category": "Chassis and Body",
        "interval_km": 8000,
        "description": "Check tire pressure and inspect for wear patterns",
        "action": "Inspect"
    },
    {
        "name": "Steering Operation and Linkages",
        "category": "Chassis and Body",
        "interval_km": 32000,
        "description": "Inspect steering operation and linkages",
        "action": "Inspect"
    },
    {
        "name": "Front and Rear Suspension, Ball Joints and Wheel Bearing",
        "category": "Chassis and Body",
        "interval_km": 32000,
        "description": "Inspect suspension components, ball joints and wheel bearing axial play",
        "action": "Inspect"
    },
    {
        "name": "Driveshaft Dust Boots",
        "category": "Chassis and Body",
        "interval_km": 32000,
        "description": "Inspect driveshaft dust boots for damage",
        "action": "Inspect"
    },
    {
        "name": "Bolts and Nuts on Chassis and Body",
        "category": "Chassis and Body",
        "interval_km": 32000,
        "description": "Tighten bolts and nuts on chassis and body",
        "action": "Tighten"
    },
    {
        "name": "Exhaust System and Heat Shields",
        "category": "Chassis and Body",
        "interval_km": 72000,
        "description": "Inspect exhaust system and heat shields (every 72,000km or 5 years)",
        "action": "Inspect"
    },
    {
        "name": "All Locks and Hinges",
        "category": "Chassis and Body",
        "interval_km": 8000,
        "description": "Lubricate all locks and hinges",
        "action": "Lubricate"
    },
    {
        "name": "Washer Fluid Level",
        "category": "Chassis and Body",
        "interval_km": 8000,
        "description": "Check and top up washer fluid level",
        "action": "Inspect"
    },

    # AIR CONDITIONER SYSTEM
    {
        "name": "Cabin Air Filter",
        "category": "Air Conditioner System",
        "interval_km": 40000,
        "description": "Replace cabin air filter (every 40,000km or 2 years)",
        "action": "Replace"
    }
]

# For severe driving conditions (Philippines), also consider these additional items:
SEVERE_CONDITIONS_NOTES = {
    "rear_differential_oil": "If operated under severe conditions (towing, dusty/wet conditions, extended idling, short trips <16km), replace rear differential oil every 48,000km",
    "transfer_oil": "If submerged in water, replace immediately",
    "tpms_note": "TPMS initialization required after tire rotation if equipped"
}
```

2. **Update Vehicle Creation Route**
Modify the POST /api/vehicles endpoint to automatically create maintenance items for Mazda CX-5 2014-2017 vehicles.

3. **Implement Smart Dashboard Logic**
The GET /api/dashboard/{vehicleId} endpoint needs to calculate maintenance status:

**Logic Requirements:**
- **Due Now**: current_mileage >= (last_service_mileage + interval_km)
- **Due Soon**: current_mileage >= (last_service_mileage + interval_km - 1000)
- **OK**: Everything else
- **Never Serviced**: Use vehicle purchase_mileage as baseline (add this field to Vehicle model)

**Dashboard Response Format:**
```python
{
    "vehicle": {vehicle_info},
    "due_now": [
        {
            "maintenance_item": {item_info},
            "miles_overdue": 6771,  # Air filter overdue at 54,771km
            "last_service_date": None,
            "last_service_mileage": None,
            "due_at_mileage": 48000  # Air filter due at 48,000km
        }
    ],
    "due_soon": [
        {
            "maintenance_item": {item_info},
            "miles_until_due": 1229,
            "due_at_mileage": 56000  # Oil change at 56,000km
        }
    ],
    "ok": [
        {
            "maintenance_item": {item_info},
            "miles_until_due": 25229,
            "due_at_mileage": 80000  # Cabin air filter at 80,000km
        }
    ]
}
```

4. **Add Mileage Update Endpoint**
Create PATCH /api/vehicles/{id}/mileage for quick mileage updates:

```python
@vehicles_bp.route('/<vehicle_id>/mileage', methods=['PATCH'])
def update_mileage(vehicle_id):
    # Validate input
    # Update only the current_mileage field
    # Return success/error response
```

5. **Update Vehicle Model**
Add `purchase_mileage` field to Vehicle model to track baseline for never-serviced items.

IMPLEMENTATION NOTES:
- When creating maintenance items, link them to the vehicle_id
- Dashboard calculation should find the most recent service record for each maintenance item
- Handle cases where items have never been serviced (use vehicle purchase_mileage as baseline)
- Ensure proper error handling for invalid vehicle IDs
- Test with your existing data (Mazda CX-5 2016 at 54,771 km with Schedule 2 intervals)
- Air filter should show as overdue (due every 24,000km for severe conditions)
- Multiple 8,000km interval items (oil, tire rotation, coolant level, lights, etc.)

Focus on making the dashboard calculation accurate and reliable with the official Mazda maintenance schedule.
```

## Prompt 2: Enhanced Dashboard UI & Mobile Optimization

```
Now implement the frontend components to display the official maintenance schedule with proper UI components.

REQUIREMENTS:
Based on the existing React/TypeScript frontend with ShadcnUI components, create:

1. **Enhanced Dashboard Page**
Update `src/pages/Dashboard.tsx` to display maintenance status with proper UI components:

**Dashboard Layout:**
- Vehicle selector dropdown (if multiple vehicles)
- Current mileage display with quick update button
- Three status sections: Due Now (red), Due Soon (yellow), OK (green)
- Quick action buttons for common services
- Recent service activity

2. **Maintenance Status Components**
Create `src/components/MaintenanceStatusCard.tsx`:
```typescript
interface MaintenanceStatusCardProps {
  item: {
    maintenance_item: MaintenanceItem;
    miles_overdue?: number;
    miles_until_due?: number;
    last_service_date?: string;
    last_service_mileage?: number;
    due_at_mileage?: number;
  };
  status: 'due_now' | 'due_soon' | 'ok';
  onMarkComplete: (itemId: string) => void;
  onScheduleService?: (itemId: string) => void;
}
```

**Card Features:**
- Color-coded status badges (red/yellow/green)
- "Mark as Complete" button for due items
- Show miles overdue/until due
- Display last service info
- Action type badges (Replace, Inspect, Lubricate, Tighten, Service)
- Category grouping (Engine, Cooling System, etc.)

3. **Mileage Update Component**
Create `src/components/MileageUpdateForm.tsx`:
- Simple input field for current mileage
- Validation (must be >= current mileage)
- Auto-save on blur or enter
- Success/error feedback

4. **Quick Service Modal**
Create `src/components/QuickServiceModal.tsx`:
- Pre-fill maintenance item and current mileage
- Simple form: date, cost, notes
- "Log Service" button that creates service record
- Auto-refresh dashboard after logging

5. **Loading States & Error Handling**
Add proper loading states and error handling:
- Loading spinners for API calls
- Error boundaries for component failures
- Toast notifications for user actions
- Graceful fallbacks for missing data

6. **Update API Client**
Enhance `src/lib/api.ts` with new endpoints:
```typescript
export const api = {
  // ... existing methods

  // New methods needed
  updateMileage: (vehicleId: string, mileage: number) =>
    axios.patch(`${API_BASE}/vehicles/${vehicleId}/mileage`, { current_mileage: mileage }),

  getDashboard: (vehicleId: string) =>
    axios.get(`${API_BASE}/dashboard/${vehicleId}`),
};
```

7. **Dashboard State Management**
Implement proper state management for dashboard:
- Fetch dashboard data on component mount
- Refresh after mileage updates
- Refresh after service logging
- Handle loading and error states

**UI/UX Requirements:**
- Mobile-responsive design
- Clear visual hierarchy (due items prominent)
- Quick actions easily accessible
- Minimal clicks for common tasks
- Intuitive status indicators

**Sample Dashboard Layout:**
```
┌─────────────────────────────────────┐
│ 2016 Mazda CX-5 | 54,771 km [Edit] │
├─────────────────────────────────────┤
│ ⚠️  DUE NOW (1 item)                │
│ ┌─ Air Filter (Severe Conditions)   │
│ │  6,771 km overdue | Due: 48,000 km│
│ │  [Mark Complete] [Quick Log]      │
│ └─                                  │
├─────────────────────────────────────┤
│ 🟡 DUE SOON (4 items)               │
│ ┌─ Engine Oil & Filter              │
│ │  Due at 56,000 km (1,229 km away) │
│ ├─ Tire Rotation                    │
│ │  Due at 56,000 km (1,229 km away) │
│ ├─ Engine Coolant Level Check       │
│ │  Due at 56,000 km (1,229 km away) │
│ └─ Function of All Lights           │
│    Due at 56,000 km (1,229 km away) │
├─────────────────────────────────────┤
│ ✅ UP TO DATE (15+ items)           │
│ ┌─ Cabin Air Filter                 │
│ │  Due at 80,000 km (25,229 km away)│
│ └─ [View All] - Shows all Schedule 2│
│    maintenance items with intervals │
└─────────────────────────────────────┘
```

**Implementation Priority:**
1. Dashboard data fetching and display
2. Mileage update functionality
3. Quick service logging
4. Loading states and error handling
5. Mobile responsiveness

Focus on making the most common user workflows smooth and efficient. Users should quickly see what maintenance is due based on the official Mazda schedule and take action with minimal friction.
```

## Prompt 3: Service Logging Integration & Polish

```
Complete the maintenance tracker by integrating service logging with the official maintenance schedule and adding final polish.

REQUIREMENTS:

1. **Smart Service Logging Integration**
When a service is logged, automatically update the maintenance schedule status:

**Backend Enhancement:**
Update the POST /api/services endpoint to:
- Accept `maintenance_item_id` in the request
- After creating service record, recalculate dashboard status
- Return updated maintenance status in response
- Handle multiple maintenance items per service visit

**Frontend Integration:**
- After logging a service, refresh the dashboard automatically
- Remove item from "due now" list if completed
- Update "last service" information
- Show success feedback

2. **Service History Enhancements**
Improve the service history page:

**Display Features:**
- Group services by date or maintenance item
- Show which maintenance items were addressed
- Calculate total costs by month/category
- Filter by date range and maintenance category
- Search by maintenance item or notes

**Service List Format:**
```
Date: Sept 8, 2025 | Mileage: 54,771 km | Total: $125.00
├─ Air Filter Replacement - $45.00
│  Notes: Changed both engine and cabin air filter
└─ Tire Rotation - $80.00
   Notes: Rotated tires, checked pressure, initialized TPMS
```

3. **Maintenance Schedule View**
Add complete maintenance schedule page:

**Features:**
- Show all official Mazda Schedule 2 items
- Group by category (Engine, Cooling System, etc.)
- Sort by due date or interval
- Show action type (Replace, Inspect, Lubricate, etc.)
- Filter by status (Due, Upcoming, Completed)

**Schedule Display:**
```
Engine (2 items)
├─ Engine Oil & Filter - Every 8,000 km [REPLACE]
│  Last: Sept 8, 2025 at 54,771 km | Next: 62,771 km
└─ Drive Belts - Every 48,000 km [INSPECT]
   Never serviced | Next: 48,000 km

Cooling System (2 items)
├─ Engine Coolant - First at 192,000 km [REPLACE]
│  Never serviced | Next: 192,000 km
└─ Engine Coolant Level - Every 8,000 km [INSPECT]
   Never serviced | Next: 8,000 km
```

4. **Data Export Functionality**
Add basic export capabilities:

**Backend Route:**
```python
@services_bp.route('/export/<vehicle_id>')
def export_services(vehicle_id):
    # Export service history as CSV
    # Include: date, mileage, maintenance_item, cost, notes
    # Return CSV file download
```

**Export Options:**
- Service history CSV
- Maintenance schedule PDF
- Combined maintenance report

5. **User Experience Polish**

**Toast Notifications:**
Add toast notifications for:
- Successful service logging
- Mileage updates
- Data export completion
- Error scenarios

**Loading States:**
Add loading indicators for:
- Dashboard data fetching
- Service form submission
- Mileage updates
- CSV export generation

**Validation & Error Handling:**
- Validate mileage inputs (must be numeric, >= previous)
- Validate service dates (not in future)
- Validate costs (must be positive)
- Handle network errors gracefully
- Show specific error messages

6. **Mobile Optimization**
Ensure mobile-friendly experience:
- Touch-friendly buttons and forms
- Responsive layout for dashboard cards
- Easy mileage input on mobile
- Swipe actions for quick service logging

7. **Final Data Model Updates**
Ensure all data models are complete:

**Service Record Enhancements:**
- Link service records to specific maintenance items
- Calculate "days since service" for reporting
- Track service provider information (optional)

**Vehicle Model Completion:**
- Add `purchase_mileage` field
- Track `last_updated` timestamp
- Store vehicle notes/description (optional)

8. **Testing & Validation**
Create test scenarios:
- Add vehicle → official Mazda maintenance items created automatically
- Update mileage → dashboard recalculates correctly
- Log service → item marked as completed
- Export data → CSV downloads correctly

**Key User Workflows to Test:**
1. **New User**: Add Mazda CX-5 → See official maintenance schedule → Update mileage → See due items
2. **Existing User**: Check dashboard → See overdue air filter → Log service → Verify item cleared
3. **Power User**: View full schedule → Export to CSV → Review maintenance patterns

**Final Quality Checklist:**
- [ ] Dashboard shows accurate due/overdue calculations based on official Mazda schedule
- [ ] Service logging updates maintenance status correctly
- [ ] Mileage updates trigger recalculation
- [ ] All forms have proper validation
- [ ] Loading states prevent confusion
- [ ] Error messages are helpful
- [ ] Mobile interface is usable
- [ ] CSV export works correctly
- [ ] Data persists properly in MongoDB
- [ ] Official Schedule 2 items display correctly

**Success Criteria:**
The completed app should allow someone to:
1. Add their Mazda CX-5 and see official maintenance schedule
2. Update current mileage easily
3. See what official maintenance is due/overdue
4. Log completed services with one-click
5. View complete maintenance schedule by category
6. Export service history and maintenance data
7. Use effectively on mobile device

Focus on creating a reliable maintenance tracking experience that follows the official Mazda maintenance recommendations for Philippines driving conditions.
```
