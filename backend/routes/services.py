from flask import Blueprint, request, jsonify
from models import ServiceRecord
from bson.objectid import ObjectId
from datetime import datetime

bp = Blueprint('services', __name__)

def serialize_service_record(record):
    """Convert MongoDB service record document to JSON-serializable format"""
    if record:
        record['_id'] = str(record['_id'])
        record['vehicle_id'] = str(record['vehicle_id'])
        record['maintenance_item_id'] = str(record['maintenance_item_id'])
        if 'created_at' in record and isinstance(record['created_at'], datetime):
            record['created_at'] = record['created_at'].isoformat()
    return record

@bp.route('/<vehicle_id>', methods=['GET'])
def get_service_history(vehicle_id):
    try:
        service_records = ServiceRecord.get_service_records_by_vehicle(vehicle_id)
        # Serialize each service record to handle ObjectId and datetime
        serialized_records = [serialize_service_record(record) for record in service_records]
        return jsonify(serialized_records), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('', methods=['POST'])
def add_service_record():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['vehicle_id', 'maintenance_item_id', 'date', 'mileage']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create service record
        service_id = ServiceRecord.create_service_record(data)
        
        return jsonify({'id': service_id, 'message': 'Service record created successfully'}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<service_id>', methods=['PUT'])
def update_service_record(service_id):
    try:
        data = request.get_json()
        
        if ServiceRecord.update_service_record(service_id, data):
            return jsonify({'message': 'Service record updated successfully'}), 200
        else:
            return jsonify({'error': 'Service record not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<service_id>', methods=['DELETE'])
def delete_service_record(service_id):
    try:
        if ServiceRecord.delete_service_record(service_id):
            return jsonify({'message': 'Service record deleted successfully'}), 200
        else:
            return jsonify({'error': 'Service record not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500