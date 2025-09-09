# AI-Powered Vehicle Maintenance Insights Implementation Plan

## Overview
This document outlines the implementation of AI-powered insights for the Car Maintenance Tracker application, including dashboard overview enhancements and a dedicated insights page with premium features.

## Architecture

### 1. Dashboard Overview Enhancement
**Location**: `frontend/src/pages/Dashboard.tsx` (lines 181-250)

#### New Components:
- **Service Summary Card**: Shows "Last Service Done" and "Next Service Required" based on image #2
- **AI Insights Preview**: Condensed version of insights with upgrade prompt
- **Quick Actions**: Direct links to log services and view full insights

#### Features:
- **Last Service Display**: Shows most recent service with date, mileage, and cost
- **Next Service Prediction**: AI-generated recommendation for upcoming maintenance
- **Progress Indicators**: Visual status bars for maintenance completion
- **Quick Access Buttons**: Log service, view schedule, upgrade to insights

### 2. Dedicated Insights Page
**New File**: `frontend/src/pages/Insights.tsx`

#### Page Structure:
- **Header**: "AI Maintenance Insights" with vehicle selector
- **Paywall Overlay**: Premium features access prompt (for future implementation)
- **Insights Dashboard**: Comprehensive analytics and recommendations

#### Components:
- **Health Trend Analysis**: Historical health score tracking
- **Anomaly Detection**: Unusual service pattern identification
- **Seasonal Recommendations**: Weather-based maintenance tips
- **Cost Efficiency Analysis**: Most/least cost-effective services
- **Service History Timeline**: Visual representation of maintenance history
- **Predictive Maintenance**: AI-powered future service predictions

### 3. Backend Integration
**New Files**:
- `backend/routes/insights.py` - Insights API endpoints
- `backend/services/llm_service.py` - LLM integration service
- `backend/services/insights_analyzer.py` - Data analysis service

#### API Endpoints:
- `GET /api/insights/{vehicleId}/overview` - Dashboard summary insights
- `GET /api/insights/{vehicleId}/detailed` - Full insights (premium)
- `POST /api/insights/{vehicleId}/refresh` - Manual insight refresh
- `GET /api/insights/{vehicleId}/health-trends` - Historical health data

### 4. LLM Integration Strategy

#### Dual Provider Support:
- **Development**: LM Studio (local LLM)
- **Production**: OpenRouter/Hugging Face
- **Configuration**: Environment variable `LLM_PROVIDER`

#### Caching Strategy:
- **Cache Key**: Vehicle ID + data version hash
- **TTL**: 24 hours or until data changes
- **Storage**: MongoDB insights collection
- **Invalidation**: Automatic on service record changes

### 5. Data Models

#### New Collections (MongoDB):
```javascript
// insights collection
{
  vehicle_id: ObjectId,
  insights: {
    health_score: Number,
    last_service: {
      date: Date,
      mileage: Number,
      service_type: String,
      cost: Number
    },
    next_service: {
      recommended_service: String,
      urgency: 'low' | 'medium' | 'high',
      estimated_cost: Number,
      due_date: Date
    },
    anomalies: [{
      type: String,
      description: String,
      severity: 'low' | 'medium' | 'high'
    }],
    seasonal_recommendations: [{
      season: String,
      recommendations: String[]
    }],
    cost_analysis: {
      total_spent: Number,
      average_cost_per_service: Number,
      most_cost_effective: String,
      least_cost_effective: String
    }
  },
  created_at: Date,
  updated_at: Date,
  data_version: String
}
```

### 6. Frontend Components Structure

#### Dashboard Enhancement:
```typescript
// Enhanced Dashboard Overview
interface ServiceSummary {
  lastService: {
    date: string;
    mileage: number;
    serviceType: string;
    cost: number;
  };
  nextService: {
    recommendedService: string;
    urgency: 'low' | 'medium' | 'high';
    estimatedCost: number;
    dueDate: string;
  };
  healthScore: number;
}
```

#### Insights Page Components:
```typescript
// Main Insights Interface
interface DetailedInsights {
  healthTrends: {
    scores: number[];
    dates: string[];
    trend: 'improving' | 'stable' | 'declining';
  };
  anomalies: Anomaly[];
  seasonalRecommendations: SeasonalRecommendation[];
  costAnalysis: CostAnalysis;
  predictiveMaintenance: PredictiveMaintenance[];
}
```

### 7. Implementation Roadmap

#### Phase 1: Dashboard Overview (Free)
- [ ] Add service summary card to dashboard
- [ ] Implement basic AI insights preview
- [ ] Create backend endpoint for overview insights
- [ ] Add LLM service integration
- [ ] Implement caching mechanism

#### Phase 2: Insights Page Structure (Premium Framework)
- [ ] Create Insights page component
- [ ] Implement paywall overlay system
- [ ] Add navigation link to insights page
- [ ] Create backend endpoint for detailed insights
- [ ] Design premium features layout

#### Phase 3: Advanced Analytics (Premium Features)
- [ ] Implement health trend analysis
- [ ] Add anomaly detection algorithms
- [ ] Create seasonal recommendation system
- [ ] Build cost efficiency analysis
- [ ] Add predictive maintenance features

### 8. Premium Features Framework

#### Paywall Structure:
```typescript
interface PremiumFeatures {
  enabled: boolean;
  trialAvailable: boolean;
  subscriptionStatus: 'none' | 'trial' | 'active' | 'expired';
  features: {
    healthTrends: boolean;
    anomalyDetection: boolean;
    seasonalRecommendations: boolean;
    costAnalysis: boolean;
    predictiveMaintenance: boolean;
  };
}
```

#### Access Control:
- **Free Users**: Basic dashboard insights only
- **Trial Users**: Full access for limited time
- **Premium Users**: All features enabled
- **Expired Users**: Revert to free features

### 9. Performance Optimization

#### Caching Strategy:
- **Overview Insights**: Cache for 6 hours
- **Detailed Insights**: Cache for 24 hours
- **Historical Data**: Cache indefinitely, update on changes
- **LLM Responses**: Cache with version control

#### API Rate Limiting:
- **Free Users**: 2 insight refreshes per day
- **Premium Users**: Unlimited refreshes
- **Trial Users**: 5 refreshes during trial period

### 10. Security Considerations

#### Data Privacy:
- **Vehicle Data**: Anonymize for LLM processing
- **User Information**: Never send personal data to LLM
- **Service History**: Aggregate data for analysis

#### API Security:
- **Authentication**: Required for all insight endpoints
- **Authorization**: Vehicle access validation
- **Rate Limiting**: Prevent abuse of LLM APIs

## Implementation Details

### Dashboard Service Summary Card
**Location**: Dashboard.tsx (after line 180)

```typescript
// New Service Summary Component
const ServiceSummaryCard = ({ vehicleId, insights }: ServiceSummaryCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Summary</CardTitle>
        <CardDescription>AI-powered maintenance overview</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Last Service Done */}
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Last Service Done</h3>
            {insights.lastService ? (
              <div className="space-y-1">
                <div className="text-sm text-green-700">
                  {insights.lastService.serviceType}
                </div>
                <div className="text-xs text-green-600">
                  {new Date(insights.lastService.date).toLocaleDateString()}
                </div>
                <div className="text-xs text-green-600">
                  {insights.lastService.mileage.toLocaleString()} km
                </div>
                <div className="text-xs text-green-600">
                  ${insights.lastService.cost.toFixed(2)}
                </div>
              </div>
            ) : (
              <div className="text-sm text-green-700">No service records found</div>
            )}
          </div>
          
          {/* Next Service Required */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Next Service Required</h3>
            {insights.nextService ? (
              <div className="space-y-1">
                <div className="text-sm text-blue-700">
                  {insights.nextService.recommendedService}
                </div>
                <div className="text-xs text-blue-600">
                  Urgency: <span className={`font-medium ${
                    insights.nextService.urgency === 'high' ? 'text-red-600' :
                    insights.nextService.urgency === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {insights.nextService.urgency}
                  </span>
                </div>
                <div className="text-xs text-blue-600">
                  Est. Cost: ${insights.nextService.estimatedCost.toFixed(2)}
                </div>
                <div className="text-xs text-blue-600">
                  Due: {new Date(insights.nextService.dueDate).toLocaleDateString()}
                </div>
              </div>
            ) : (
              <div className="text-sm text-blue-700">All services up to date</div>
            )}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={() => setShowServiceForm(true)}>
            Log Service
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href="/insights">View Detailed Insights</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
```

### Insights Page Structure
**New File**: `frontend/src/pages/Insights.tsx`

```typescript
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VehicleSelector } from "@/components/VehicleSelector";
import { api } from "@/lib/api";
import { Brain, TrendingUp, AlertTriangle, Calendar, DollarSign, Star } from "lucide-react";

interface InsightsPageProps {}

export function InsightsPage({}: InsightsPageProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [insights, setInsights] = useState<DetailedInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    if (selectedVehicleId) {
      loadInsights();
    }
  }, [selectedVehicleId]);

  const loadVehicles = async () => {
    try {
      const response = await api.getVehicles();
      setVehicles(response.data);
      if (response.data.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(response.data[0]._id);
      }
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async () => {
    try {
      const response = await api.getDetailedInsights(selectedVehicleId);
      setInsights(response.data);
    } catch (error) {
      console.error('Failed to load insights:', error);
    }
  };

  // Paywall Overlay Component
  const PaywallOverlay = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Star className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
          <CardTitle>Premium Insights</CardTitle>
          <CardDescription>
            Unlock detailed AI-powered maintenance analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm">Health trend analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm">Anomaly detection</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Seasonal recommendations</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-600" />
              <span className="text-sm">Cost efficiency analysis</span>
            </div>
          </div>
          <div className="space-y-2">
            <Button className="w-full">
              Start Free Trial
            </Button>
            <Button variant="outline" className="w-full">
              View Pricing Plans
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Brain className="w-8 h-8" />
            AI Maintenance Insights
          </h1>
          <p className="text-muted-foreground">
            Advanced analytics and recommendations for your vehicle
          </p>
        </div>

        {/* Vehicle Selector */}
        <div className="mb-8">
          <VehicleSelector
            vehicles={vehicles}
            selectedVehicleId={selectedVehicleId}
            onVehicleChange={setSelectedVehicleId}
          />
        </div>

        {/* Paywall Overlay */}
        {!isPremium && <PaywallOverlay />}

        {/* Insights Content */}
        <div className="grid gap-6">
          {/* Placeholder content for premium features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Health Trends
                </CardTitle>
                <CardDescription>
                  Track your vehicle's health over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground">
                  Premium Feature
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Anomaly Detection
                </CardTitle>
                <CardDescription>
                  Identify unusual service patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground">
                  Premium Feature
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Seasonal Tips
                </CardTitle>
                <CardDescription>
                  Weather-based maintenance recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground">
                  Premium Feature
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Backend API Integration
**New File**: `backend/routes/insights.py`

```python
from flask import Blueprint, request, jsonify
from services.llm_service import LLMService
from services.insights_analyzer import InsightsAnalyzer
from models import db
from bson.objectid import ObjectId
import datetime

insights_bp = Blueprint('insights', __name__)

@insights_bp.route('/insights/<vehicle_id>/overview', methods=['GET'])
def get_overview_insights(vehicle_id):
    """Get basic insights for dashboard overview"""
    try:
        # Check cache first
        cached_insights = get_cached_insights(vehicle_id, 'overview')
        if cached_insights:
            return jsonify(cached_insights)
        
        # Generate new insights
        analyzer = InsightsAnalyzer(vehicle_id)
        insights = analyzer.generate_overview_insights()
        
        # Cache the results
        cache_insights(vehicle_id, 'overview', insights)
        
        return jsonify(insights)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@insights_bp.route('/insights/<vehicle_id>/detailed', methods=['GET'])
def get_detailed_insights(vehicle_id):
    """Get detailed insights (premium feature)"""
    try:
        # Check user subscription status
        # TODO: Implement subscription check
        
        # Check cache first
        cached_insights = get_cached_insights(vehicle_id, 'detailed')
        if cached_insights:
            return jsonify(cached_insights)
        
        # Generate detailed insights
        analyzer = InsightsAnalyzer(vehicle_id)
        insights = analyzer.generate_detailed_insights()
        
        # Cache the results
        cache_insights(vehicle_id, 'detailed', insights)
        
        return jsonify(insights)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@insights_bp.route('/insights/<vehicle_id>/refresh', methods=['POST'])
def refresh_insights(vehicle_id):
    """Manually refresh insights"""
    try:
        # Clear cache
        clear_insights_cache(vehicle_id)
        
        # Generate new insights
        analyzer = InsightsAnalyzer(vehicle_id)
        overview_insights = analyzer.generate_overview_insights()
        detailed_insights = analyzer.generate_detailed_insights()
        
        # Cache both types
        cache_insights(vehicle_id, 'overview', overview_insights)
        cache_insights(vehicle_id, 'detailed', detailed_insights)
        
        return jsonify({'message': 'Insights refreshed successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_cached_insights(vehicle_id, insight_type):
    """Get cached insights if available"""
    # TODO: Implement cache retrieval
    pass

def cache_insights(vehicle_id, insight_type, insights):
    """Cache insights for future use"""
    # TODO: Implement cache storage
    pass

def clear_insights_cache(vehicle_id):
    """Clear cached insights for vehicle"""
    # TODO: Implement cache clearing
    pass
```

## Success Metrics

### User Engagement:
- Dashboard insights view rate
- Insights page conversion rate
- Feature usage patterns

### Technical Performance:
- API response times (< 2 seconds)
- Cache hit rates (> 80%)
- LLM API cost efficiency

### Business Metrics:
- Free trial conversion rate
- Premium subscription uptake
- User retention rates

## Future Enhancements

### Phase 2:
- Multi-vehicle insights comparison
- Fleet management features
- Mobile app integration
- Push notifications for urgent insights

### Phase 3:
- Integration with vehicle APIs (OBD-II)
- Real-time diagnostics
- Predictive failure modeling
- Maintenance cost forecasting

This implementation plan provides a comprehensive framework for adding AI-powered insights to the Car Maintenance Tracker, with a clear path from basic features to premium offerings.