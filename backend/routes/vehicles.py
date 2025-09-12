from flask import Blueprint, request, jsonify, make_response
from models import Vehicle, MaintenanceItem, ServiceRecord
from bson.objectid import ObjectId
from datetime import datetime
import csv
import io
from auth import token_required, get_current_user_id, check_subscription_limits
from security import validate_vehicle_data, validation_result, validate_json_request, sanitize_request_data
from rate_limiter import user_rate_limit

bp = Blueprint('vehicles', __name__)

def serialize_vehicle(vehicle):
    """Convert MongoDB vehicle document to JSON-serializable format"""
    if not vehicle:
        return vehicle
    
    # Create a copy to avoid modifying the original MongoDB document
    serialized = vehicle.copy()
    
    # Convert ObjectId fields to strings
    if '_id' in serialized:
        serialized['_id'] = str(serialized['_id'])
    if 'user_id' in serialized:
        serialized['user_id'] = str(serialized['user_id'])
    
    # Convert datetime fields to ISO format
    if 'created_at' in serialized and isinstance(serialized['created_at'], datetime):
        serialized['created_at'] = serialized['created_at'].isoformat()
    
    return serialized

@bp.route('', methods=['GET'])
@token_required
@user_rate_limit(limit=100, window_seconds=60)
def get_vehicles():
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'User ID not found'}), 401
            
        vehicles = Vehicle.get_all_vehicles(user_id)
        
        # Serialize each vehicle to handle ObjectId and datetime
        serialized_vehicles = [serialize_vehicle(vehicle) for vehicle in vehicles]
        return jsonify(serialized_vehicles), 200
    except Exception as e:
        # Handle ObjectId serialization in error messages
        error_msg = str(e)
        if 'ObjectId' in error_msg:
            error_msg = 'Database serialization error occurred'
        return jsonify({'error': error_msg}), 500

@bp.route('', methods=['POST'])
@token_required
@user_rate_limit(limit=10, window_seconds=60)
@check_subscription_limits('vehicles')
def add_vehicle():
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'User ID not found'}), 401
            
        data = request.get_json()
        
        # Add user_id to data
        data['user_id'] = user_id
        
        # Validate input
        validation = validation_result(validate_vehicle_data(data))
        if not validation['valid']:
            return jsonify({'error': 'Validation failed', 'details': validation['errors']}), 400
        
        # Create vehicle
        vehicle_id = Vehicle.create_vehicle(data)
        
        # If it's a Mazda CX-5 2014-2017, add default maintenance items
        if MaintenanceItem.should_create_mazda_schedule(data):
            MaintenanceItem.create_default_maintenance_items(vehicle_id)
        
        return jsonify({'id': vehicle_id, 'message': 'Vehicle created successfully'}), 201
        
    except Exception as e:
        # Handle ObjectId serialization in error messages
        error_msg = str(e)
        if 'ObjectId' in error_msg:
            error_msg = 'Database serialization error occurred'
        return jsonify({'error': error_msg}), 500

@bp.route('/<vehicle_id>', methods=['PUT'])
@token_required
@user_rate_limit(limit=30, window_seconds=60)
def update_vehicle(vehicle_id):
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'User ID not found'}), 401
            
        data = request.get_json()
        
        # Validate input
        validation = validation_result(validate_vehicle_data(data))
        if not validation['valid']:
            return jsonify({'error': 'Validation failed', 'details': validation['errors']}), 400
        
        if Vehicle.update_vehicle(vehicle_id, data, user_id):
            return jsonify({'message': 'Vehicle updated successfully'}), 200
        else:
            return jsonify({'error': 'Vehicle not found'}), 404
            
    except Exception as e:
        # Handle ObjectId serialization in error messages
        error_msg = str(e)
        if 'ObjectId' in error_msg:
            error_msg = 'Database serialization error occurred'
        return jsonify({'error': error_msg}), 500

@bp.route('/<vehicle_id>', methods=['DELETE'])
@token_required
@user_rate_limit(limit=10, window_seconds=60)
def delete_vehicle(vehicle_id):
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'User ID not found'}), 401
            
        if Vehicle.delete_vehicle(vehicle_id, user_id):
            return jsonify({'message': 'Vehicle deleted successfully'}), 200
        else:
            return jsonify({'error': 'Vehicle not found'}), 404
            
    except Exception as e:
        # Handle ObjectId serialization in error messages
        error_msg = str(e)
        if 'ObjectId' in error_msg:
            error_msg = 'Database serialization error occurred'
        return jsonify({'error': error_msg}), 500

@bp.route('/<vehicle_id>/create-maintenance-items', methods=['POST'])
@token_required
@user_rate_limit(limit=5, window_seconds=60)
def create_maintenance_items(vehicle_id):
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'User ID not found'}), 401
            
        # Verify vehicle belongs to user
        vehicle = Vehicle.get_vehicle_by_id(vehicle_id, user_id)
        if not vehicle:
            return jsonify({'error': 'Vehicle not found'}), 404
        
        MaintenanceItem.create_default_maintenance_items(vehicle_id)
        return jsonify({'message': 'Maintenance items created successfully'}), 201
    except Exception as e:
        # Handle ObjectId serialization in error messages
        error_msg = str(e)
        if 'ObjectId' in error_msg:
            error_msg = 'Database serialization error occurred'
        return jsonify({'error': error_msg}), 500

@bp.route('/<vehicle_id>/mileage', methods=['PATCH'])
@token_required
@user_rate_limit(limit=50, window_seconds=60)
def update_mileage(vehicle_id):
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'User ID not found'}), 401
            
        data = request.get_json()
        
        if 'current_mileage' not in data:
            return jsonify({'error': 'Missing required field: current_mileage'}), 400
        
        # Validate mileage is a positive number
        new_mileage = data['current_mileage']
        if not isinstance(new_mileage, (int, float)) or new_mileage < 0:
            return jsonify({'error': 'Mileage must be a positive number'}), 400
        
        # Get current vehicle to validate mileage is not decreasing
        current_vehicle = Vehicle.get_vehicle_by_id(vehicle_id, user_id)
        if not current_vehicle:
            return jsonify({'error': 'Vehicle not found'}), 404
        
        current_mileage = current_vehicle.get('current_mileage', 0)
        if new_mileage < current_mileage:
            return jsonify({'error': 'New mileage cannot be less than current mileage'}), 400
        
        # Update mileage
        update_data = {'current_mileage': new_mileage}
        if Vehicle.update_vehicle(vehicle_id, update_data, user_id):
            return jsonify({'message': 'Mileage updated successfully', 'current_mileage': new_mileage}), 200
        else:
            return jsonify({'error': 'Vehicle not found'}), 404
            
    except Exception as e:
        # Handle ObjectId serialization in error messages
        error_msg = str(e)
        if 'ObjectId' in error_msg:
            error_msg = 'Database serialization error occurred'
        return jsonify({'error': error_msg}), 500

@bp.route('/export/<vehicle_id>', methods=['GET'])
@token_required
@user_rate_limit(limit=10, window_seconds=60)
def export_vehicle_info(vehicle_id):
    """Export vehicle information to CSV format"""
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'User ID not found'}), 401
        
        # Get vehicle info
        vehicle = Vehicle.get_vehicle_by_id(vehicle_id, user_id)
        if not vehicle:
            return jsonify({'error': 'Vehicle not found'}), 404
        
        # Get related statistics
        maintenance_items = MaintenanceItem.get_maintenance_items_by_vehicle(vehicle_id)
        service_records = ServiceRecord.get_service_records_by_vehicle(vehicle_id)
        
        # Calculate statistics
        total_services = len(service_records)
        total_maintenance_items = len(maintenance_items)
        total_cost = sum(record.get('cost', 0) for record in service_records)
        
        # Get maintenance status summary
        current_mileage = vehicle.get('current_mileage', 0)
        purchase_mileage = vehicle.get('purchase_mileage', 0)
        overdue_items = 0
        due_soon_items = 0
        
        for item in maintenance_items:
            item_id_str = str(item['_id'])
            relevant_services = [
                s for s in service_records 
                if str(s.get('maintenance_item_id')) == item_id_str
            ]
            relevant_services.sort(key=lambda x: x.get('mileage', 0), reverse=True)
            
            if relevant_services:
                last_service_mileage = relevant_services[0].get('mileage', 0)
            else:
                last_service_mileage = purchase_mileage
            
            interval_km = item.get('interval_km', 0)
            next_due_mileage = last_service_mileage + interval_km
            
            if current_mileage >= next_due_mileage:
                overdue_items += 1
            elif current_mileage >= (next_due_mileage - 1000):
                due_soon_items += 1
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write vehicle information section
        writer.writerow(['Vehicle Information'])
        writer.writerow(['Make', vehicle.get('make', '')])
        writer.writerow(['Model', vehicle.get('model', '')])
        writer.writerow(['Year', vehicle.get('year', '')])
        writer.writerow(['Current Mileage', vehicle.get('current_mileage', '')])
        writer.writerow(['Purchase Mileage', vehicle.get('purchase_mileage', '')])
        writer.writerow(['Created Date', vehicle.get('created_at', '').replace('T', ' ').split('.')[0] if vehicle.get('created_at') else ''])
        writer.writerow([])
        
        # Write statistics section
        writer.writerow(['Statistics'])
        writer.writerow(['Total Services', total_services])
        writer.writerow(['Total Maintenance Items', total_maintenance_items])
        writer.writerow(['Total Service Cost', f"₱{total_cost:.2f}"])
        writer.writerow(['Overdue Maintenance Items', overdue_items])
        writer.writerow(['Due Soon Maintenance Items', due_soon_items])
        writer.writerow(['Up to Date Maintenance Items', total_maintenance_items - overdue_items - due_soon_items])
        writer.writerow([])
        
        # Write maintenance summary
        writer.writerow(['Maintenance Categories'])
        categories = {}
        for item in maintenance_items:
            category = item.get('category', 'Other')
            if category not in categories:
                categories[category] = 0
            categories[category] += 1
        
        for category, count in categories.items():
            writer.writerow([category, count])
        
        # Create response
        csv_content = output.getvalue()
        output.close()
        
        # Generate filename
        vehicle_name = f"{vehicle.get('year', '')}-{vehicle.get('make', '')}-{vehicle.get('model', '')}".strip('-')
        filename = f"vehicle-info-{vehicle_name}-{datetime.now().strftime('%Y%m%d')}.csv"
        
        response = make_response(csv_content)
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
        
    except Exception as e:
        # Handle ObjectId serialization in error messages
        error_msg = str(e)
        if 'ObjectId' in error_msg:
            error_msg = 'Database serialization error occurred'
        return jsonify({'error': error_msg}), 500