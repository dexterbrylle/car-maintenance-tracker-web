from flask import Blueprint, request, jsonify
from models import ServiceRecord, Vehicle, MaintenanceItem
from bson.objectid import ObjectId
from datetime import datetime
import csv
import io

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
        maintenance_items = MaintenanceItem.get_maintenance_items_by_vehicle(vehicle_id)
        
        # Create a lookup dict for maintenance items
        maintenance_lookup = {str(item['_id']): item for item in maintenance_items}
        
        # Enhance service records with maintenance item info
        enhanced_records = []
        for record in service_records:
            serialized_record = serialize_service_record(record.copy())
            maintenance_item_id = serialized_record.get('maintenance_item_id')
            
            if maintenance_item_id in maintenance_lookup:
                maintenance_item = maintenance_lookup[maintenance_item_id]
                serialized_record['maintenance_item'] = {
                    'id': str(maintenance_item['_id']),
                    'name': maintenance_item['name'],
                    'category': maintenance_item['category'],
                    'action': maintenance_item.get('action', 'Service')
                }
            
            enhanced_records.append(serialized_record)
        
        # Sort by date (most recent first)
        enhanced_records.sort(key=lambda x: x.get('date', ''), reverse=True)
        
        return jsonify(enhanced_records), 200
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
        
        # Validate that vehicle exists
        vehicle = Vehicle.get_vehicle_by_id(data['vehicle_id'])
        if not vehicle:
            return jsonify({'error': 'Vehicle not found'}), 404
        
        # Validate that maintenance item exists
        maintenance_item = MaintenanceItem.get_maintenance_item_by_id(data['maintenance_item_id'])
        if not maintenance_item:
            return jsonify({'error': 'Maintenance item not found'}), 404
        
        # Validate mileage (must be >= current vehicle mileage)
        service_mileage = int(data['mileage'])
        current_mileage = vehicle.get('current_mileage', 0)
        
        # Validate date (cannot be in future)
        service_date = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
        if service_date > datetime.now(service_date.tzinfo):
            return jsonify({'error': 'Service date cannot be in the future'}), 400
        
        # Validate cost (must be positive if provided)
        if 'cost' in data and data['cost'] < 0:
            return jsonify({'error': 'Cost must be positive'}), 400
        
        # Create service record
        service_id = ServiceRecord.create_service_record(data)
        
        # Update vehicle mileage if service mileage is higher
        if service_mileage > current_mileage:
            Vehicle.update_vehicle(data['vehicle_id'], {'current_mileage': service_mileage})
        
        return jsonify({
            'id': service_id, 
            'message': 'Service record created successfully',
            'maintenance_item': {
                'id': str(maintenance_item['_id']),
                'name': maintenance_item['name']
            }
        }), 201
        
    except ValueError as e:
        return jsonify({'error': 'Invalid date format'}), 400
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

@bp.route('/export/<vehicle_id>', methods=['GET'])
def export_service_history(vehicle_id):
    try:
        # Get vehicle info
        vehicle = Vehicle.get_vehicle_by_id(vehicle_id)
        if not vehicle:
            return jsonify({'error': 'Vehicle not found'}), 404
        
        # Get service records with maintenance item info
        service_records = ServiceRecord.get_service_records_by_vehicle(vehicle_id)
        maintenance_items = MaintenanceItem.get_maintenance_items_by_vehicle(vehicle_id)
        
        # Create maintenance item lookup
        maintenance_lookup = {str(item['_id']): item for item in maintenance_items}
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Date', 'Mileage', 'Maintenance Item', 'Category', 
            'Action Type', 'Cost', 'Notes'
        ])
        
        # Sort records by date
        service_records.sort(key=lambda x: x.get('date', ''), reverse=True)
        
        # Write data rows
        for record in service_records:
            maintenance_item_id = str(record.get('maintenance_item_id', ''))
            maintenance_item = maintenance_lookup.get(maintenance_item_id, {})
            
            writer.writerow([
                record.get('date', ''),
                record.get('mileage', ''),
                maintenance_item.get('name', 'Unknown'),
                maintenance_item.get('category', ''),
                maintenance_item.get('action', 'Service'),
                record.get('cost', 0),
                record.get('notes', '')
            ])
        
        # Prepare response
        csv_content = output.getvalue()
        output.close()
        
        # Generate filename
        vehicle_name = f"{vehicle.get('year', '')}-{vehicle.get('make', '')}-{vehicle.get('model', '')}".strip('-')
        filename = f"service-history-{vehicle_name}-{datetime.now().strftime('%Y%m%d')}.csv"
        
        from flask import make_response
        response = make_response(csv_content)
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500