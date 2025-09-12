from flask import Blueprint, request, jsonify
from models import ServiceRecord, Vehicle, MaintenanceItem
from bson.objectid import ObjectId
from datetime import datetime
import csv
import io
from auth import token_required, get_current_user_id, check_subscription_limits
from security import validate_json_request, sanitize_request_data
from rate_limiter import user_rate_limit

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
@token_required
@user_rate_limit(limit=100, window_seconds=60)
def get_service_history(vehicle_id):
    try:
        user_id = get_current_user_id()
        
        # Verify vehicle ownership
        vehicle = Vehicle.get_vehicle_by_id(vehicle_id, user_id)
        if not vehicle:
            return jsonify({'error': 'Vehicle not found'}), 404
        
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
@token_required
@user_rate_limit(limit=10, window_seconds=60)
@check_subscription_limits('records')
def add_service_record():
    try:
        user_id = get_current_user_id()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['vehicle_id', 'maintenance_item_id', 'date', 'mileage']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate that vehicle exists and user owns it
        vehicle = Vehicle.get_vehicle_by_id(data['vehicle_id'], user_id)
        if not vehicle:
            return jsonify({'error': 'Vehicle not found'}), 404
        
        # Validate that maintenance item exists and belongs to the vehicle
        maintenance_item = MaintenanceItem.get_maintenance_item_by_id(data['maintenance_item_id'])
        if not maintenance_item:
            return jsonify({'error': 'Maintenance item not found'}), 404
        
        # Verify maintenance item belongs to the specified vehicle
        if str(maintenance_item['vehicle_id']) != data['vehicle_id']:
            return jsonify({'error': 'Maintenance item does not belong to this vehicle'}), 404
        
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
@token_required
@user_rate_limit(limit=30, window_seconds=60)
def update_service_record(service_id):
    try:
        user_id = get_current_user_id()
        data = request.get_json()
        
        # Get service record to verify ownership
        service_record = ServiceRecord.get_service_record_by_id(service_id)
        if not service_record:
            return jsonify({'error': 'Service record not found'}), 404
        
        # Verify vehicle ownership
        vehicle = Vehicle.get_vehicle_by_id(str(service_record['vehicle_id']), user_id)
        if not vehicle:
            return jsonify({'error': 'Vehicle not found'}), 404
        
        if ServiceRecord.update_service_record(service_id, data):
            return jsonify({'message': 'Service record updated successfully'}), 200
        else:
            return jsonify({'error': 'Service record not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<service_id>', methods=['DELETE'])
@token_required
@user_rate_limit(limit=10, window_seconds=60)
def delete_service_record(service_id):
    try:
        user_id = get_current_user_id()
        
        # Get service record to verify ownership
        service_record = ServiceRecord.get_service_record_by_id(service_id)
        if not service_record:
            return jsonify({'error': 'Service record not found'}), 404
        
        # Verify vehicle ownership
        vehicle = Vehicle.get_vehicle_by_id(str(service_record['vehicle_id']), user_id)
        if not vehicle:
            return jsonify({'error': 'Vehicle not found'}), 404
        
        if ServiceRecord.delete_service_record(service_id):
            return jsonify({'message': 'Service record deleted successfully'}), 200
        else:
            return jsonify({'error': 'Service record not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/export/<vehicle_id>', methods=['GET'])
@token_required
@user_rate_limit(limit=10, window_seconds=60)
def export_service_history(vehicle_id):
    try:
        user_id = get_current_user_id()
        
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        columns = request.args.getlist('columns')
        
        # Get vehicle info and verify ownership
        vehicle = Vehicle.get_vehicle_by_id(vehicle_id, user_id)
        if not vehicle:
            return jsonify({'error': 'Vehicle not found'}), 404
        
        # Get service records with maintenance item info
        service_records = ServiceRecord.get_service_records_by_vehicle(vehicle_id)
        maintenance_items = MaintenanceItem.get_maintenance_items_by_vehicle(vehicle_id)
        
        # Create maintenance item lookup
        maintenance_lookup = {str(item['_id']): item for item in maintenance_items}
        
        # Filter by date range if provided
        if start_date:
            service_records = [r for r in service_records if r.get('date', '') >= start_date]
        if end_date:
            service_records = [r for r in service_records if r.get('date', '') <= end_date]
        
        # Define all available columns
        all_columns = [
            'Date', 'Mileage', 'Maintenance Item', 'Category', 
            'Action Type', 'Cost', 'Notes'
        ]
        
        # Use provided columns or default to all
        selected_columns = columns if columns else all_columns
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(selected_columns)
        
        # Sort records by date
        service_records.sort(key=lambda x: x.get('date', ''), reverse=True)
        
        # Write data rows
        for record in service_records:
            maintenance_item_id = str(record.get('maintenance_item_id', ''))
            maintenance_item = maintenance_lookup.get(maintenance_item_id, {})
            
            # Build row data based on selected columns
            row_data = []
            for column in selected_columns:
                if column == 'Date':
                    row_data.append(record.get('date', ''))
                elif column == 'Mileage':
                    row_data.append(record.get('mileage', ''))
                elif column == 'Maintenance Item':
                    row_data.append(maintenance_item.get('name', 'Unknown'))
                elif column == 'Category':
                    row_data.append(maintenance_item.get('category', ''))
                elif column == 'Action Type':
                    row_data.append(maintenance_item.get('action', 'Service'))
                elif column == 'Cost':
                    row_data.append(record.get('cost', 0))
                elif column == 'Notes':
                    row_data.append(record.get('notes', ''))
            
            writer.writerow(row_data)
        
        # Prepare response
        csv_content = output.getvalue()
        output.close()
        
        # Generate filename with date range info
        vehicle_name = f"{vehicle.get('year', '')}-{vehicle.get('make', '')}-{vehicle.get('model', '')}".strip('-')
        date_suffix = ""
        if start_date or end_date:
            date_suffix = f"_{start_date or 'start'}-{end_date or 'end'}"
        filename = f"service-history-{vehicle_name}{date_suffix}-{datetime.now().strftime('%Y%m%d')}.csv"
        
        from flask import make_response
        response = make_response(csv_content)
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500