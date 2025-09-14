# StatsGridMobile Component

A mobile-optimized statistics grid component for displaying maintenance status in the Car Maintenance Tracker app.

## Features

- **2-Column Grid Layout**: Optimized for mobile viewing with responsive design
- **Color-Coded Status Cards**: Visual indicators for maintenance status
- **Touch-Friendly Design**: Large tap targets (minimum 44px)
- **Mobile-Optimized Typography**: Large, readable text sizes
- **Interactive Cards**: Clickable cards for navigation or filtering
- **Responsive Design**: Works on both mobile and desktop

## Props Interface

```typescript
interface StatsGridMobileProps {
  maintenanceStatus: {
    due_now: DashboardMaintenanceItem[];
    due_soon: DashboardMaintenanceItem[];
    ok: DashboardMaintenanceItem[];
  };
  serviceRecords?: ServiceRecord[];
  className?: string;
}
```

## Usage

### Basic Usage

```tsx
import { StatsGridMobile } from '@/components/mobile';

function Dashboard() {
  return (
    <StatsGridMobile
      maintenanceStatus={maintenanceData}
      serviceRecords={serviceRecords}
    />
  );
}
```

### With Custom Styling

```tsx
<StatsGridMobile
  maintenanceStatus={maintenanceData}
  serviceRecords={serviceRecords}
  className="mt-4 px-4"
/>
```

## Card Types

The component displays four status cards:

1. **Due Now** (Red)
   - Shows count of overdue maintenance items
   - Alert triangle icon
   - Requires immediate attention

2. **Due Soon** (Yellow)
   - Shows count of upcoming maintenance items
   - Clock icon
   - Plan within next service

3. **Up to Date** (Green)
   - Shows count of completed maintenance items
   - Check circle icon
   - Includes completion rate percentage

4. **Total Services** (Gray)
   - Shows total number of logged services
   - Wrench icon
   - Service history overview

## Styling

The component uses Tailwind CSS classes with:

- **Color Scheme**: Consistent with existing app colors
- **Mobile-First**: Responsive grid layout
- **Touch Targets**: Minimum 44px height for cards
- **Visual Feedback**: Hover and active states
- **Accessibility**: Proper contrast ratios

## Integration

The component integrates seamlessly with:

- Existing UI components (`Card`, `CardContent`)
- TypeScript interfaces (`DashboardMaintenanceItem`, `ServiceRecord`)
- Lucide React icons
- Tailwind CSS utility classes

## Example

See `StatsGridMobileExample.tsx` for a complete usage example with sample data.

## File Location

`/src/components/mobile/StatsGridMobile.tsx`