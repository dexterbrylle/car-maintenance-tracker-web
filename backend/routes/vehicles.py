from flask import Blueprint, request, jsonify
from models import Vehicle, MaintenanceItem
from bson.objectid import ObjectId
from datetime import datetime

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
        
        # If it's a Mazda CX-5 2016-2017, add default maintenance items
        if (data.get('make', '').lower() == 'mazda' and 
            data.get('model', '').lower() == 'cx-5' and 
            data.get('year') in [2016, 2017]):
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