from flask import Blueprint, request, jsonify, make_response
from models import Vehicle, MaintenanceItem, ServiceRecord
from bson.objectid import ObjectId
from datetime import datetime
import csv
import io

bp = Blueprint('vehicles', __name__)

def serialize_vehicle(vehicle):
    """Convert MongoDB vehicle document to JSON-serializable format"""
    if vehicle:
        vehicle['_id'] = str(vehicle['_id'])
        if 'created_at' in vehicle and isinstance(vehicle['created_at'], datetime):
            vehicle['created_at'] = vehicle['created_at'].isoformat()
    return vehicle

@bp.route('', methods=['GET'])
def get_vehicles():
    try:
        vehicles = Vehicle.get_all_vehicles()
        # Serialize each vehicle to handle ObjectId and datetime
        serialized_vehicles = [serialize_vehicle(vehicle) for vehicle in vehicles]
        return jsonify(serialized_vehicles), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('', methods=['POST'])
def add_vehicle():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['make', 'model', 'year', 'current_mileage']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create vehicle
        vehicle_id = Vehicle.create_vehicle(data)
        
        # If it's a Mazda CX-5 2014-2017, add default maintenance items
        if MaintenanceItem.should_create_mazda_schedule(data):
            MaintenanceItem.create_default_maintenance_items(vehicle_id)
        
        return jsonify({'id': vehicle_id, 'message': 'Vehicle created successfully'}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<vehicle_id>', methods=['PUT'])
def update_vehicle(vehicle_id):
    try:
        data = request.get_json()
        
        if Vehicle.update_vehicle(vehicle_id, data):
            return jsonify({'message': 'Vehicle updated successfully'}), 200
        else:
            return jsonify({'error': 'Vehicle not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<vehicle_id>', methods=['DELETE'])
def delete_vehicle(vehicle_id):
    try:
        if Vehicle.delete_vehicle(vehicle_id):
            return jsonify({'message': 'Vehicle deleted successfully'}), 200
        else:
            return jsonify({'error': 'Vehicle not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<vehicle_id>/create-maintenance-items', methods=['POST'])
def create_maintenance_items(vehicle_id):
    try:
        MaintenanceItem.create_default_maintenance_items(vehicle_id)
        return jsonify({'message': 'Maintenance items created successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<vehicle_id>/mileage', methods=['PATCH'])
def update_mileage(vehicle_id):
    try:
        data = request.get_json()
        
        if 'current_mileage' not in data:
            return jsonify({'error': 'Missing required field: current_mileage'}), 400
        
        # Validate mileage is a positive number
        new_mileage = data['current_mileage']
        if not isinstance(new_mileage, (int, float)) or new_mileage < 0:
            return jsonify({'error': 'Mileage must be a positive number'}), 400
        
        # Get current vehicle to validate mileage is not decreasing
        current_vehicle = Vehicle.get_vehicle_by_id(vehicle_id)
        if not current_vehicle:
            return jsonify({'error': 'Vehicle not found'}), 404
        
        current_mileage = current_vehicle.get('current_mileage', 0)
        if new_mileage < current_mileage:
            return jsonify({'error': 'New mileage cannot be less than current mileage'}), 400
        
        # Update mileage
        update_data = {'current_mileage': new_mileage}
        if Vehicle.update_vehicle(vehicle_id, update_data):
            return jsonify({'message': 'Mileage updated successfully', 'current_mileage': new_mileage}), 200
        else:
            return jsonify({'error': 'Vehicle not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/export/<vehicle_id>', methods=['GET'])
def export_vehicle_info(vehicle_id):
    """Export vehicle information to CSV format"""
    try:
        # Get vehicle info
        vehicle = Vehicle.get_vehicle_by_id(vehicle_id)
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
        return jsonify({'error': str(e)}), 500