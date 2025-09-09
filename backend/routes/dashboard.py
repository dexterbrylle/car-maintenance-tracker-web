from flask import Blueprint, request, jsonify
from models import Vehicle, MaintenanceItem, ServiceRecord
from bson.objectid import ObjectId
from datetime import datetime

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

@bp.route('/<vehicle_id>', methods=['GET'])
def get_dashboard(vehicle_id):
    try:
        # Get vehicle information
        vehicle = Vehicle.get_vehicle_by_id(vehicle_id)
        if not vehicle:
            return jsonify({'error': 'Vehicle not found'}), 404
        
        # Get all maintenance items for the vehicle
        maintenance_items = MaintenanceItem.get_maintenance_items_by_vehicle(vehicle_id)
        
        # Get all service records for the vehicle
        service_records = ServiceRecord.get_service_records_by_vehicle(vehicle_id)
        
        # Calculate maintenance status for each item
        current_mileage = vehicle.get('current_mileage', 0)
        purchase_mileage = vehicle.get('purchase_mileage', 0)
        
        due_now = []
        due_soon = []
        ok = []
        
        for item in maintenance_items:
            # Find the most recent service record for this maintenance item
            item_id_str = str(item['_id'])
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
                # Never serviced - use purchase mileage as baseline
                last_service_mileage = purchase_mileage
                last_service_date = None
            
            # Calculate when this item is due
            interval_km = item.get('interval_km', 0)
            due_at_mileage = last_service_mileage + interval_km
            
            # Determine status
            if current_mileage >= due_at_mileage:
                # Due now
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
                # OK
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
        
        return jsonify({
            'vehicle': serialize_vehicle(vehicle),
            'due_now': due_now,
            'due_soon': due_soon,
            'ok': ok
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500