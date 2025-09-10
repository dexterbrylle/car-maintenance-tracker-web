# Fuel-Maintenance Insights Component

This component provides comprehensive AI-powered insights about fuel efficiency and maintenance correlation for vehicles.

## Features

### Desktop Component (`FuelMaintenanceInsights.tsx`)
- **Comprehensive Insights Display**: Shows insights with severity levels (error, warning, success, info)
- **Predictive Maintenance**: Displays AI-generated maintenance predictions with confidence levels
- **Fuel Performance Summary**: Shows current fuel efficiency, trends, and ratings
- **Actionable Recommendations**: Provides specific recommendations for improving fuel efficiency
- **Visual Indicators**: Color-coded severity levels and performance trends
- **Loading States**: Skeleton loaders during data fetching
- **Error Handling**: Retry functionality with error messages
- **Empty States**: Helpful guidance when no data is available

### Mobile Component (`FuelMaintenanceInsightsMobile.tsx`)
- **Touch-Optimized Interface**: Designed for mobile devices with larger touch targets
- **Collapsible Sections**: Expandable insights and predictions sections
- **Compact Layout**: Optimized for smaller screens
- **Quick Actions**: Easy access to refresh and view details

## API Integration

The component uses the `/api/dashboard/{vehicleId}/insights` endpoint which returns:

```typescript
{
  insights: FuelMaintenanceInsight[];
  predictions: MaintenancePrediction[];
  fuel_summary: FuelSummary;
}
```

## Data Types

### FuelMaintenanceInsight
- `id`: Unique identifier
- `type`: Insight type (efficiency_decline, maintenance_correlation, performance_improvement, cost_anomaly)
- `severity`: Severity level (error, warning, success, info)
- `title`: Insight title
- `message`: Detailed message
- `recommendation`: Actionable recommendation
- `confidence`: Confidence percentage (0-100)
- `related_maintenance`: Related maintenance items
- `fuel_economy_impact`: Potential fuel economy impact
- `cost_impact`: Cost impact

### MaintenancePrediction
- `id`: Unique identifier
- `type`: Prediction type (air_filter, oil_change, spark_plugs, tire_pressure, fuel_injector, general)
- `confidence`: Confidence percentage (0-100)
- `description`: Prediction description
- `recommended_action`: Recommended action
- `urgency`: Urgency level (low, medium, high)
- `estimated_cost_impact`: Estimated cost impact
- `fuel_economy_improvement`: Potential fuel economy improvement
- `timeframe`: Timeframe for action

### FuelSummary
- `current_efficiency`: Current fuel efficiency in km/L
- `efficiency_trend`: Trend direction (improving, declining, stable)
- `trend_percentage`: Trend percentage
- `avg_cost_per_km`: Average cost per kilometer
- `total_cost_ytd`: Year-to-date fuel cost
- `last_record_date`: Last fuel record date
- `efficiency_rating`: Efficiency rating (excellent, good, fair, poor)
- `recommendations`: General recommendations

## Usage

```tsx
import { FuelMaintenanceInsights } from "@/components/FuelMaintenanceInsights"
import { FuelMaintenanceInsightsMobile } from "@/components/mobile/FuelMaintenanceInsightsMobile"

// Desktop usage
<FuelMaintenanceInsights vehicleId={vehicleId} />

// Mobile usage
<FuelMaintenanceInsightsMobile vehicleId={vehicleId} />
```

## Design System Integration

The component follows the established design patterns:
- Uses Tailwind CSS for styling
- Integrates with the existing UI component library
- Follows the established color scheme and typography
- Responsive design that works on all screen sizes
- Consistent with the existing mobile-first approach

## Error Handling

The component handles various error states:
- Network errors during API calls
- Empty data scenarios
- Loading states with skeleton loaders
- Retry functionality with user feedback

## Accessibility

- Semantic HTML structure
- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly
- High contrast colors for better visibility

## Performance

- Efficient data fetching with proper loading states
- Optimized re-renders with React hooks
- Minimal API calls with retry logic
- Responsive design that adapts to different screen sizes