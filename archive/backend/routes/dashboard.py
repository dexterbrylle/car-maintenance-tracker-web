from flask import Blueprint, request, jsonify
from models import Vehicle, MaintenanceItem, ServiceRecord, FillUp
from bson.objectid import ObjectId
from datetime import datetime
from utils.insights import generate_insights, predict_maintenance_needs, get_fuel_performance_summary
from utils.fuel_calculations import get_fuel_performance_trends, calculate_monthly_fuel_cost
from auth import token_required, get_current_user_id
from security import validate_json_request, sanitize_request_data
from rate_limiter import user_rate_limit

bp = Blueprint('dashboard', __name__)

def serialize_maintenance_item(item):
    """Convert MongoDB maintenance item document to JSON-serializable format"""
    if item:
        item['_id'] = str(item['_id'])
        item['vehicle_id'] = str(item['vehicle_id'])
    return item

def serialize_service_record(record):
    """Convert MongoDB service record document to JSON-serializable format"""
    if record:
        record['_id'] = str(record['_id'])
        record['vehicle_id'] = str(record['vehicle_id'])
        record['maintenance_item_id'] = str(record['maintenance_item_id'])
        if 'date' in record and isinstance(record['date'], datetime):
            record['date'] = record['date'].isoformat()
        if 'created_at' in record and isinstance(record['created_at'], datetime):
            record['created_at'] = record['created_at'].isoformat()
    return record

def serialize_vehicle(vehicle):
    """Convert MongoDB vehicle document to JSON-serializable format"""
    if vehicle:
        vehicle['_id'] = str(vehicle['_id'])
        if 'created_at' in vehicle and isinstance(vehicle['created_at'], datetime):
            vehicle['created_at'] = vehicle['created_at'].isoformat()
    return vehicle

def get_fuel_performance(vehicle_id):
    """Get current fuel performance metrics for dashboard"""
    try:
        # Get recent fill-ups for fuel performance calculation
        recent_fillups = FillUp.get_fillups_by_vehicle(vehicle_id, limit=5)

        if not recent_fillups:
            return None

        # Serialize fill-up documents to convert ObjectIds to strings
        def serialize_fillup(fillup):
            if fillup:
                fillup = fillup.copy()
                if '_id' in fillup:
                    fillup['_id'] = str(fillup['_id'])
                if 'vehicle_id' in fillup:
                    fillup['vehicle_id'] = str(fillup['vehicle_id'])
                if 'date' in fillup and isinstance(fillup['date'], datetime):
                    fillup['date'] = fillup['date'].isoformat()
                if 'created_at' in fillup and isinstance(fillup['created_at'], datetime):
                    fillup['created_at'] = fillup['created_at'].isoformat()
            return fillup

        recent_fillups = [serialize_fillup(fillup) for fillup in recent_fillups]

        # Get basic fuel stats
        fuel_stats = FillUp.get_fuel_stats(vehicle_id)
        if not fuel_stats:
            return None

        # Get performance trends
        trends = get_fuel_performance_trends(vehicle_id, days=90)

        # Calculate monthly fuel cost
        monthly_costs = calculate_monthly_fuel_cost(vehicle_id, months=1)
        monthly_fuel_cost = monthly_costs[0]['total_cost'] if monthly_costs else 0

        # Get the most recent fill-up for current metrics
        latest_fillup = recent_fillups[0]

        return {
            "current_economy": latest_fillup.get('fuel_economy_kmpl'),
            "avg_economy_recent": fuel_stats.get('avg_fuel_economy'),
            "cost_per_km": latest_fillup.get('cost_per_km'),
            "last_fillup_date": latest_fillup.get('date'),
            "monthly_fuel_cost": monthly_fuel_cost,
            "total_fillups": fuel_stats.get('total_fillups', 0),
            "best_fuel_economy": fuel_stats.get('best_fuel_economy'),
            "worst_fuel_economy": fuel_stats.get('worst_fuel_economy'),
            "trend_percent": trends.get('trend_percent') if trends else 0
        }

    except Exception as e:
        # Log error for fuel performance calculation
        return None

@bp.route('/<vehicle_id>', methods=['GET'])
@token_required
@user_rate_limit(limit=100, window_seconds=60)
def get_dashboard(vehicle_id):
    try:
        user_id = get_current_user_id()

        # Get vehicle information and verify ownership
        vehicle = Vehicle.get_vehicle_by_id(vehicle_id, user_id)
        if not vehicle:
            return jsonify({'error': 'Vehicle not found'}), 404

        # Get all maintenance items for the vehicle
        maintenance_items = [serialize_maintenance_item(item) for item in MaintenanceItem.get_maintenance_items_by_vehicle(vehicle_id)]

        # Get all service records for the vehicle
        service_records = [serialize_service_record(record) for record in ServiceRecord.get_service_records_by_vehicle(vehicle_id)]

        # Calculate maintenance status for each item
        current_mileage = vehicle.get('current_mileage', 0)

        due_now = []
        due_soon = []
        ok = []

        for item in maintenance_items:
            item_id_str = str(item['_id'])
            item_name = item.get('name', 'Unknown')
            interval_km = item.get('interval_km', 0)
            
            # Find the most recent service record for this maintenance item
            relevant_services = [
                s for s in service_records
                if str(s.get('maintenance_item_id')) == item_id_str
            ]

            # Sort by mileage (descending) to get the most recent service
            relevant_services.sort(key=lambda x: x.get('mileage', 0), reverse=True)

            if relevant_services:
                last_service = relevant_services[0]
                last_service_mileage = last_service.get('mileage', 0)
                last_service_date = last_service.get('date')
            else:
                # Never serviced - determine status based on manufacturer's schedule
                last_service_mileage = 0
                last_service_date = None
            
            # Calculate next due mileage based on manufacturer's schedule
            if interval_km > 0:
                # Calculate which service interval we should be at
                next_interval = ((current_mileage // interval_km) + 1) * interval_km
                last_expected_service = (current_mileage // interval_km) * interval_km
                
                # If we have service records, use the actual last service
                if relevant_services:
                    due_at_mileage = last_service_mileage + interval_km
                else:
                    # No service records - determine if current maintenance is overdue
                    if current_mileage >= interval_km:
                        due_at_mileage = last_expected_service
                    else:
                        due_at_mileage = interval_km
            else:
                due_at_mileage = current_mileage

            # Determine status based on current mileage vs due mileage
            if current_mileage >= due_at_mileage:
                # Due now (overdue)
                miles_overdue = current_mileage - due_at_mileage
                due_now.append({
                    'maintenance_item': serialize_maintenance_item(item.copy()),
                    'miles_overdue': miles_overdue,
                    'last_service_date': last_service_date,
                    'last_service_mileage': last_service_mileage,
                    'due_at_mileage': due_at_mileage
                })
            elif current_mileage >= (due_at_mileage - 1000):
                # Due soon (within 1000 km)
                miles_until_due = due_at_mileage - current_mileage
                due_soon.append({
                    'maintenance_item': serialize_maintenance_item(item.copy()),
                    'miles_until_due': miles_until_due,
                    'last_service_date': last_service_date,
                    'last_service_mileage': last_service_mileage,
                    'due_at_mileage': due_at_mileage
                })
            else:
                # OK (up to date)
                miles_until_due = due_at_mileage - current_mileage
                ok.append({
                    'maintenance_item': serialize_maintenance_item(item.copy()),
                    'miles_until_due': miles_until_due,
                    'last_service_date': last_service_date,
                    'last_service_mileage': last_service_mileage,
                    'due_at_mileage': due_at_mileage
                })

        # Sort each category by priority (overdue items first, then soonest due)
        due_now.sort(key=lambda x: x['miles_overdue'], reverse=True)
        due_soon.sort(key=lambda x: x['miles_until_due'])
        ok.sort(key=lambda x: x['miles_until_due'])

        # Get fuel performance data
        fuel_performance = get_fuel_performance(vehicle_id)

        # Generate smart insights
        insights = generate_insights(vehicle_id)

        # Ensure all data is properly serialized before JSON response
        def deep_serialize(obj):
            """Recursively serialize all ObjectIds and datetime objects"""
            if isinstance(obj, dict):
                return {k: deep_serialize(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [deep_serialize(item) for item in obj]
            elif isinstance(obj, ObjectId):
                return str(obj)
            elif isinstance(obj, datetime):
                return obj.isoformat()
            elif hasattr(obj, '__dict__') and hasattr(obj, 'binary'):  # ObjectId
                return str(obj)
            else:
                return obj

        # Debug: Check each component for ObjectIds before serialization
        components = {
            'vehicle': vehicle,
            'due_now': due_now,
            'due_soon': due_soon,
            'ok': ok,
            'fuel_performance': fuel_performance,
            'insights': insights
        }

        def find_objectids(obj, path=""):
            """Recursively find all ObjectIds in an object"""
            objectids = []
            if isinstance(obj, dict):
                for k, v in obj.items():
                    objectids.extend(find_objectids(v, f"{path}.{k}" if path else k))
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    objectids.extend(find_objectids(item, f"{path}[{i}]"))
            elif isinstance(obj, ObjectId):
                objectids.append((path, str(obj)))
            elif hasattr(obj, '__dict__') and hasattr(obj, 'binary'):
                objectids.append((path, str(obj)))
            return objectids

        # Apply deep serialization to all components
        serialized_response = deep_serialize({
            'vehicle': vehicle,
            'maintenance': {
                'due_now': due_now,
                'due_soon': due_soon,
                'ok': ok
            },
            'fuel_performance': fuel_performance,
            'insights': insights
        })

        return jsonify(serialized_response), 200

    except Exception as e:
        import traceback
        # Log error for dashboard endpoint
        return jsonify({'error': str(e)}), 500

@bp.route('/<vehicle_id>/insights', methods=['GET'])
@token_required
@user_rate_limit(limit=100, window_seconds=60)
def get_insights(vehicle_id):
    """Get fuel-maintenance correlation insights for a vehicle"""
    try:
        user_id = get_current_user_id()

        # Get vehicle information and verify ownership
        vehicle = Vehicle.get_vehicle_by_id(vehicle_id, user_id)
        if not vehicle:
            return jsonify({'error': 'Vehicle not found'}), 404

        # Generate fuel-maintenance insights
        insights = generate_insights(vehicle_id)

        # Get maintenance predictions
        predictions = predict_maintenance_needs(vehicle_id)

        # Get fuel performance summary
        fuel_summary = get_fuel_performance_summary(vehicle_id)

        return jsonify({
            'insights': insights,
            'predictions': predictions,
            'fuel_summary': fuel_summary
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
