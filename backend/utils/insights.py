from datetime import datetime, timedelta
from models import FillUp, MaintenanceItem, ServiceRecord
from utils.fuel_calculations import get_fuel_performance_trends
import os
from pymongo import MongoClient
from bson.objectid import ObjectId

def serialize_maintenance_item(item):
    """Convert MongoDB maintenance item document to JSON-serializable format"""
    if item:
        item = item.copy()
        if '_id' in item:
            item['_id'] = str(item['_id'])
        if 'vehicle_id' in item:
            item['vehicle_id'] = str(item['vehicle_id'])
    return item

def serialize_service_record(record):
    """Convert MongoDB service record document to JSON-serializable format"""
    if record:
        record = record.copy()
        if '_id' in record:
            record['_id'] = str(record['_id'])
        if 'vehicle_id' in record:
            record['vehicle_id'] = str(record['vehicle_id'])
        if 'maintenance_item_id' in record:
            record['maintenance_item_id'] = str(record['maintenance_item_id'])
        if 'created_at' in record and record['created_at']:
            record['created_at'] = record['created_at'].isoformat()
        if 'date' in record and record['date']:
            record['date'] = record['date'].isoformat()
    return record

def serialize_vehicle(vehicle):
    """Convert MongoDB vehicle document to JSON-serializable format"""
    if vehicle:
        vehicle = vehicle.copy()
        if '_id' in vehicle:
            vehicle['_id'] = str(vehicle['_id'])
        if 'user_id' in vehicle:
            vehicle['user_id'] = str(vehicle['user_id'])
        if 'created_at' in vehicle and vehicle['created_at']:
            vehicle['created_at'] = vehicle['created_at'].isoformat()
    return vehicle

def generate_insights(vehicle_id):
    """Generate actionable insights correlating fuel and maintenance"""
    try:
        insights = []
        
        # Get fuel performance trends
        fuel_trends = get_fuel_performance_trends(vehicle_id)
        
        # Get maintenance data
        client = MongoClient(os.getenv('MONGODB_URI'))
        db = client.get_default_database()
        
        # Get due maintenance items
        maintenance_items = [serialize_maintenance_item(item) for item in db.maintenance_items.find({'vehicle_id': vehicle_id})]
        service_records = [serialize_service_record(record) for record in db.service_records.find({'vehicle_id': vehicle_id}).sort('date', -1)]
        
        # Calculate maintenance status
        current_mileage = None
        if maintenance_items:
            # Get current mileage from the vehicle
            vehicle = serialize_vehicle(db.vehicles.find_one({'_id': vehicle_id}))
            if vehicle:
                current_mileage = vehicle.get('current_mileage')
        
        due_maintenance = []
        if current_mileage:
            for item in maintenance_items:
                # Get last service for this item
                last_service = None
                for record in service_records:
                    if record.get('maintenance_item_id') == item['_id']:
                        last_service = record
                        break
                
                if last_service:
                    # Check if due based on mileage
                    miles_since_service = current_mileage - last_service['mileage']
                    if miles_since_service >= item['interval_km']:
                        due_maintenance.append({
                            'item': item,
                            'miles_overdue': miles_since_service - item['interval_km'],
                            'last_service': last_service
                        })
                else:
                    # No service record, check if overdue based on vehicle mileage
                    vehicle_age_miles = current_mileage
                    if vehicle_age_miles >= item['interval_km']:
                        due_maintenance.append({
                            'item': item,
                            'miles_overdue': vehicle_age_miles - item['interval_km'],
                            'last_service': None
                        })
        
        # Generate fuel-maintenance correlation insights
        if fuel_trends and due_maintenance:
            generate_fuel_maintenance_insights(insights, fuel_trends, due_maintenance)
        
        # Generate standalone fuel insights
        if fuel_trends:
            generate_fuel_insights(insights, fuel_trends)
        
        # Generate maintenance insights
        if due_maintenance:
            generate_maintenance_insights(insights, due_maintenance)
        
        return insights
        
    except Exception as e:
        print(f"Error generating insights: {e}")
        return []

def generate_fuel_maintenance_insights(insights, fuel_trends, due_maintenance):
    """Generate insights correlating fuel performance with maintenance needs"""
    
    # Check for declining fuel economy with due maintenance
    if fuel_trends['trend_percent'] < -10:  # 10% decline
        # Filter for engine-related maintenance items
        engine_items = [
            dm for dm in due_maintenance
            if dm['item']['category'] in ['Engine', 'Fuel System', 'Air System', 'Ignition System']
        ]
        
        if engine_items:
            insights.append({
                'type': 'fuel_maintenance_correlation',
                'severity': 'warning',
                'title': 'Fuel Economy Declining - Maintenance Due',
                'message': f'Fuel economy down {abs(fuel_trends["trend_percent"])}%. Consider servicing {engine_items[0]["item"]["name"]}.',
                'trend_percent': fuel_trends['trend_percent'],
                'action_items': [item['item'] for item in engine_items[:3]]  # Top 3 items
            })
    
    # Check for high cost per km with due maintenance
    if fuel_trends.get('avg_cost_per_km') and fuel_trends['avg_cost_per_km'] > 8:
        # Filter for maintenance items that could affect fuel efficiency
        efficiency_items = [
            dm for dm in due_maintenance
            if dm['item']['category'] in ['Engine', 'Fuel System', 'Air System', 'Tires', 'Transmission']
        ]
        
        if efficiency_items:
            insights.append({
                'type': 'high_cost_maintenance_correlation',
                'severity': 'info',
                'title': 'High Fuel Costs - Maintenance Available',
                'message': f'High fuel cost (₱{fuel_trends["avg_cost_per_km"]:.2f}/km). Maintenance may help improve efficiency.',
                'cost_per_km': fuel_trends['avg_cost_per_km'],
                'action_items': [item['item'] for item in efficiency_items[:2]]  # Top 2 items
            })

def generate_fuel_insights(insights, fuel_trends):
    """Generate standalone fuel performance insights"""
    
    # Significant fuel economy improvement
    if fuel_trends['trend_percent'] > 15:
        insights.append({
            'type': 'fuel_economy_improvement',
            'severity': 'success',
            'title': 'Excellent Fuel Economy Trend',
            'message': f'Great job! Fuel economy improved by {fuel_trends["trend_percent"]}%.',
            'trend_percent': fuel_trends['trend_percent']
        })
    
    # Significant fuel economy decline
    elif fuel_trends['trend_percent'] < -15:
        insights.append({
            'type': 'fuel_economy_decline',
            'severity': 'warning',
            'title': 'Fuel Economy Declining',
            'message': f'Fuel economy decreased by {abs(fuel_trends["trend_percent"])}%. Check driving conditions or maintenance needs.',
            'trend_percent': fuel_trends['trend_percent']
        })
    
    # High cost per kilometer
    if fuel_trends.get('avg_cost_per_km') and fuel_trends['avg_cost_per_km'] > 12:
        insights.append({
            'type': 'high_cost_per_km',
            'severity': 'warning',
            'title': 'High Operating Costs',
            'message': f'Average cost is ₱{fuel_trends["avg_cost_per_km"]:.2f} per kilometer. Consider fuel-efficient driving habits.',
            'cost_per_km': fuel_trends['avg_cost_per_km']
        })

def generate_maintenance_insights(insights, due_maintenance):
    """Generate maintenance-related insights"""
    
    # Critical overdue maintenance
    critical_items = [dm for dm in due_maintenance if dm.get('miles_overdue', 0) > 5000]
    if critical_items:
        insights.append({
            'type': 'critical_maintenance_overdue',
            'severity': 'error',
            'title': 'Critical Maintenance Overdue',
            'message': f'{len(critical_items)} item(s) are over 5,000km overdue. Immediate attention required.',
            'overdue_items': critical_items[:3]  # Top 3 critical items
        })
    
    # Multiple maintenance items due
    if len(due_maintenance) > 5:
        insights.append({
            'type': 'multiple_maintenance_due',
            'severity': 'warning',
            'title': 'Multiple Maintenance Items Due',
            'message': f'{len(due_maintenance)} maintenance items require attention. Schedule service soon.',
            'item_count': len(due_maintenance)
        })

def get_fuel_performance_summary(vehicle_id):
    """Get comprehensive fuel performance summary"""
    try:
        # Get basic fuel stats
        stats = FillUp.get_fuel_stats(vehicle_id)
        if not stats:
            return None
        
        # Get performance trends
        trends = get_fuel_performance_trends(vehicle_id)
        
        # Calculate efficiency rating
        efficiency_rating = calculate_efficiency_rating(stats, trends)
        
        # Get monthly breakdown
        from utils.fuel_calculations import calculate_monthly_fuel_cost
        monthly_breakdown = calculate_monthly_fuel_cost(vehicle_id, months=6)
        
        return {
            'current_stats': stats,
            'performance_trends': trends,
            'efficiency_rating': efficiency_rating,
            'monthly_breakdown': monthly_breakdown[:6]  # Last 6 months
        }
        
    except Exception as e:
        print(f"Error getting fuel performance summary: {e}")
        return None

def calculate_efficiency_rating(stats, trends):
    """Calculate overall fuel efficiency rating"""
    try:
        rating = 0
        factors = 0
        
        # Rate based on average fuel economy (assuming petrol vehicle)
        if stats.get('avg_fuel_economy'):
            if stats['avg_fuel_economy'] >= 15:  # Excellent
                rating += 5
            elif stats['avg_fuel_economy'] >= 12:  # Good
                rating += 4
            elif stats['avg_fuel_economy'] >= 10:  # Average
                rating += 3
            elif stats['avg_fuel_economy'] >= 8:   # Poor
                rating += 2
            else:  # Very poor
                rating += 1
            factors += 1
        
        # Rate based on cost per km
        if stats.get('avg_cost_per_km'):
            if stats['avg_cost_per_km'] <= 5:   # Excellent
                rating += 5
            elif stats['avg_cost_per_km'] <= 7:   # Good
                rating += 4
            elif stats['avg_cost_per_km'] <= 10:  # Average
                rating += 3
            elif stats['avg_cost_per_km'] <= 12:  # Poor
                rating += 2
            else:  # Very poor
                rating += 1
            factors += 1
        
        # Rate based on trend
        if trends and trends.get('trend_percent'):
            if trends['trend_percent'] > 5:    # Improving
                rating += 5
            elif trends['trend_percent'] > -5:  # Stable
                rating += 4
            elif trends['trend_percent'] > -10: # Slightly declining
                rating += 3
            elif trends['trend_percent'] > -15: # Declining
                rating += 2
            else:  # Rapidly declining
                rating += 1
            factors += 1
        
        # Calculate overall rating
        if factors > 0:
            overall_rating = round(rating / factors)
        else:
            overall_rating = 3  # Default to average
        
        # Convert to descriptive rating
        rating_descriptions = {
            5: 'Excellent',
            4: 'Good', 
            3: 'Average',
            2: 'Poor',
            1: 'Very Poor'
        }
        
        return {
            'score': overall_rating,
            'description': rating_descriptions.get(overall_rating, 'Unknown'),
            'max_score': 5
        }
        
    except Exception as e:
        print(f"Error calculating efficiency rating: {e}")
        return {
            'score': 3,
            'description': 'Average',
            'max_score': 5
        }

def predict_maintenance_needs(vehicle_id):
    """Predict potential maintenance needs based on fuel performance"""
    try:
        predictions = []
        
        # Get fuel performance data
        trends = get_fuel_performance_trends(vehicle_id)
        if not trends:
            return predictions
        
        # Predict based on declining fuel economy
        if trends['trend_percent'] < -8:  # 8% decline
            predictions.append({
                'type': 'fuel_system_check',
                'confidence': min(abs(trends['trend_percent']) / 20, 0.9),  # Max 90% confidence
                'description': 'Declining fuel economy may indicate fuel system issues',
                'recommended_actions': [
                    'Check air filter',
                    'Inspect fuel injectors',
                    'Check tire pressure',
                    'Consider fuel system cleaning'
                ]
            })
        
        # Predict based on high cost per km
        if trends.get('avg_cost_per_km') and trends['avg_cost_per_km'] > 10:
            predictions.append({
                'type': 'efficiency_optimization',
                'confidence': min((trends['avg_cost_per_km'] - 10) / 10, 0.8),  # Max 80% confidence
                'description': 'High operating costs suggest efficiency optimization opportunities',
                'recommended_actions': [
                    'Review driving habits',
                    'Check tire pressure and alignment',
                    'Consider engine tune-up',
                    'Evaluate route efficiency'
                ]
            })
        
        return predictions
        
    except Exception as e:
        print(f"Error predicting maintenance needs: {e}")
        return []