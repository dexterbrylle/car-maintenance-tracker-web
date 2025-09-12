from datetime import datetime, timedelta
from models import FillUp
import os
from pymongo import MongoClient

def validate_fillup_data(data, is_update=False):
    """Validate fill-up data"""
    errors = []
    
    # Check required fields for new fill-ups
    if not is_update:
        required_fields = ['vehicle_id', 'date', 'odometer_km', 'liters', 'price_per_liter']
        for field in required_fields:
            if field not in data or data[field] is None or data[field] == '':
                errors.append(f'{field} is required')
    
    # Validate odometer
    if 'odometer_km' in data:
        try:
            odometer = float(data['odometer_km'])
            if odometer <= 0:
                errors.append('Odometer must be greater than 0')
            
            # Check if odometer is greater than previous fill-ups
            if 'vehicle_id' in data and not is_update:
                previous_fillups = FillUp.get_fillups_by_vehicle(data['vehicle_id'], limit=1)
                if previous_fillups and odometer <= previous_fillups[0]['odometer_km']:
                    errors.append('Odometer must be greater than previous fill-up')
        except (ValueError, TypeError):
            errors.append('Odometer must be a valid number')
    
    # Validate liters
    if 'liters' in data:
        try:
            liters = float(data['liters'])
            if liters <= 0:
                errors.append('Liters must be greater than 0')
            if liters > 1000:  # Reasonable upper limit
                errors.append('Liters must be less than 1000')
        except (ValueError, TypeError):
            errors.append('Liters must be a valid number')
    
    # Validate price per liter
    if 'price_per_liter' in data:
        try:
            price = float(data['price_per_liter'])
            if price <= 0:
                errors.append('Price per liter must be greater than 0')
            if price > 1000:  # Reasonable upper limit
                errors.append('Price per liter must be less than 1000')
        except (ValueError, TypeError):
            errors.append('Price per liter must be a valid number')
    
    # Validate total cost
    if 'total_cost' in data:
        try:
            cost = float(data['total_cost'])
            if cost < 0:
                errors.append('Total cost must be greater than or equal to 0')
        except (ValueError, TypeError):
            errors.append('Total cost must be a valid number')
    
    # Validate date
    if 'date' in data:
        try:
            # Try different date formats
            date_formats = ['%Y-%m-%d', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%dT%H:%M:%S.%f', '%Y-%m-%dT%H:%M:%SZ']
            parsed_date = None
            
            for fmt in date_formats:
                try:
                    parsed_date = datetime.strptime(data['date'], fmt)
                    break
                except ValueError:
                    continue
            
            if parsed_date is None:
                errors.append('Date must be a valid date format (YYYY-MM-DD)')
            elif parsed_date > datetime.now():
                errors.append('Date cannot be in the future')
        except (ValueError, TypeError):
            errors.append('Date must be a valid date')
    
    return errors[0] if errors else None

def calculate_fuel_economy(current_fillup, previous_fillup):
    """Calculate fuel economy between two fill-ups"""
    if not previous_fillup or not current_fillup.get('full_tank'):
        return None
    
    try:
        distance = current_fillup['odometer_km'] - previous_fillup['odometer_km']
        liters = current_fillup['liters']
        
        if distance <= 0 or liters <= 0:
            return None
        
        return round(distance / liters, 2)
    except (KeyError, TypeError, ValueError):
        return None

def calculate_cost_per_km(distance, total_cost):
    """Calculate cost per kilometer"""
    if distance <= 0:
        return None
    try:
        return round(total_cost / distance, 2)
    except (ValueError, TypeError, ZeroDivisionError):
        return None

def calculate_monthly_fuel_cost(vehicle_id, months=12):
    """Calculate monthly fuel cost for the specified number of months"""
    try:
        fillups = FillUp.get_fillups_by_vehicle(vehicle_id)
        
        if not fillups:
            return {}
        
        # Group fill-ups by month
        monthly_costs = {}
        current_date = datetime.now()
        
        for i in range(months):
            month_date = current_date - timedelta(days=30 * i)
            month_key = month_date.strftime('%Y-%m')
            month_name = month_date.strftime('%b %Y')
            
            monthly_costs[month_key] = {
                'month': month_name,
                'total_cost': 0,
                'total_liters': 0,
                'fillup_count': 0,
                'avg_economy': []
            }
        
        # Calculate costs for each month
        for fillup in fillups:
            fillup_date = fillup['date']
            if isinstance(fillup_date, str):
                try:
                    fillup_date = datetime.fromisoformat(fillup_date.replace('Z', '+00:00'))
                except ValueError:
                    continue
            
            month_key = fillup_date.strftime('%Y-%m')
            if month_key in monthly_costs:
                monthly_costs[month_key]['total_cost'] += fillup.get('total_cost', 0)
                monthly_costs[month_key]['total_liters'] += fillup.get('liters', 0)
                monthly_costs[month_key]['fillup_count'] += 1
                
                if fillup.get('fuel_economy_kmpl'):
                    monthly_costs[month_key]['avg_economy'].append(fillup['fuel_economy_kmpl'])
        
        # Calculate average economy for each month
        for month_data in monthly_costs.values():
            if month_data['avg_economy']:
                month_data['avg_economy'] = round(sum(month_data['avg_economy']) / len(month_data['avg_economy']), 2)
            else:
                month_data['avg_economy'] = None
        
        # Convert to list and sort by month
        return sorted(monthly_costs.values(), key=lambda x: x['month'], reverse=True)
    
    except Exception as e:
        print(f"Error calculating monthly fuel cost: {e}")
        return {}

def get_fuel_performance_trends(vehicle_id, days=90):
    """Get fuel performance trends for the specified number of days"""
    try:
        fillups = FillUp.get_fillups_by_vehicle(vehicle_id)
        
        if not fillups:
            return None
        
        # Filter fill-ups within the specified date range
        cutoff_date = datetime.now() - timedelta(days=days)
        recent_fillups = []
        
        for fillup in fillups:
            fillup_date = fillup['date']
            if isinstance(fillup_date, str):
                try:
                    fillup_date = datetime.fromisoformat(fillup_date.replace('Z', '+00:00'))
                except ValueError:
                    continue
            
            if fillup_date >= cutoff_date:
                recent_fillups.append(fillup)
        
        if not recent_fillups:
            return None
        
        # Calculate trends
        economies = [f['fuel_economy_kmpl'] for f in recent_fillups if f.get('fuel_economy_kmpl')]
        costs_per_km = [f['cost_per_km'] for f in recent_fillups if f.get('cost_per_km')]
        
        if not economies:
            return None
        
        # Calculate trend (simple linear regression)
        if len(economies) >= 2:
            # Split into two halves
            mid_point = len(economies) // 2
            early_avg = sum(economies[:mid_point]) / mid_point
            late_avg = sum(economies[mid_point:]) / (len(economies) - mid_point)
            
            trend_percent = ((late_avg - early_avg) / early_avg * 100) if early_avg > 0 else 0
        else:
            trend_percent = 0
        
        return {
            'avg_economy': round(sum(economies) / len(economies), 2),
            'best_economy': max(economies),
            'worst_economy': min(economies),
            'avg_cost_per_km': round(sum(costs_per_km) / len(costs_per_km), 2) if costs_per_km else None,
            'trend_percent': round(trend_percent, 1),
            'total_fillups': len(recent_fillups),
            'period_days': days
        }
    
    except Exception as e:
        print(f"Error calculating fuel performance trends: {e}")
        return None

def update_vehicle_fuel_stats(vehicle_id):
    """Update vehicle's aggregate fuel statistics"""
    try:
        stats = FillUp.get_fuel_stats(vehicle_id)
        
        if not stats:
            return
        
        # Update vehicle document with fuel stats
        client = MongoClient(os.getenv('MONGODB_URI'))
        db = client.get_default_database()
        
        db.vehicles.update_one(
            {"_id": vehicle_id},
            {"$set": {"fuel_stats": stats}}
        )
        
    except Exception as e:
        print(f"Error updating vehicle fuel stats: {e}")

def get_fuel_efficiency_insights(vehicle_id):
    """Generate insights about fuel efficiency"""
    try:
        trends = get_fuel_performance_trends(vehicle_id)
        
        if not trends:
            return []
        
        insights = []
        
        # Check for declining fuel economy
        if trends['trend_percent'] < -5:  # 5% decline
            insights.append({
                'type': 'fuel_economy_decline',
                'severity': 'warning',
                'title': 'Fuel Economy Declining',
                'message': f'Your fuel economy has decreased by {abs(trends["trend_percent"])}% over the last {trends["period_days"]} days.',
                'trend_percent': trends['trend_percent']
            })
        
        # Check for improving fuel economy
        elif trends['trend_percent'] > 5:  # 5% improvement
            insights.append({
                'type': 'fuel_economy_improvement',
                'severity': 'info',
                'title': 'Fuel Economy Improving',
                'message': f'Great job! Your fuel economy has improved by {trends["trend_percent"]}% over the last {trends["period_days"]} days.',
                'trend_percent': trends['trend_percent']
            })
        
        # Check for high cost per km
        if trends['avg_cost_per_km'] and trends['avg_cost_per_km'] > 10:  # More than ₱10 per km
            insights.append({
                'type': 'high_cost_per_km',
                'severity': 'warning',
                'title': 'High Cost Per Kilometer',
                'message': f'Your average cost per kilometer is ₱{trends["avg_cost_per_km"]:.2f}, which is higher than average.',
                'cost_per_km': trends['avg_cost_per_km']
            })
        
        return insights
        
    except Exception as e:
        print(f"Error generating fuel efficiency insights: {e}")
        return []