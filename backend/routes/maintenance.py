from flask import Blueprint, request, jsonify
from models import MaintenanceItem
from bson.objectid import ObjectId
from datetime import datetime

bp = Blueprint('maintenance', __name__)

def serialize_maintenance_item(item):
    """Convert MongoDB maintenance item document to JSON-serializable format"""
    if item:
        item['_id'] = str(item['_id'])
        item['vehicle_id'] = str(item['vehicle_id'])
        if 'created_at' in item and isinstance(item['created_at'], datetime):
            item['created_at'] = item['created_at'].isoformat()
    return item

@bp.route('/<vehicle_id>', methods=['GET'])
def get_maintenance_schedule(vehicle_id):
    try:
        maintenance_items = MaintenanceItem.get_maintenance_items_by_vehicle(vehicle_id)
        # Serialize each maintenance item to handle ObjectId and datetime
        serialized_items = [serialize_maintenance_item(item) for item in maintenance_items]
        return jsonify(serialized_items), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('', methods=['POST'])
def add_maintenance_item():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'category', 'interval_km', 'vehicle_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create maintenance item
        item_id = MaintenanceItem.create_maintenance_item(data)
        
        return jsonify({'id': item_id, 'message': 'Maintenance item created successfully'}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500