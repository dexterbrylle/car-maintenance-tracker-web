from flask import Blueprint, request, jsonify, make_response
from models import MaintenanceItem, ServiceRecord, Vehicle
from bson.objectid import ObjectId
from datetime import datetime
import csv
import io
from auth import token_required, get_current_user_id, check_subscription_limits
from security import validate_json_request, sanitize_request_data
from rate_limiter import user_rate_limit

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
@token_required
@user_rate_limit(limit=100, window_seconds=60)
def get_maintenance_schedule(vehicle_id):
    try:
        user_id = get_current_user_id()
        
        # Get vehicle info and verify ownership
        vehicle = Vehicle.get_vehicle_by_id(vehicle_id, user_id)
        if not vehicle:
            return jsonify({'error': 'Vehicle not found'}), 404
        
        # Get maintenance items and service records
        maintenance_items = MaintenanceItem.get_maintenance_items_by_vehicle(vehicle_id)
        service_records = ServiceRecord.get_service_records_by_vehicle(vehicle_id)
        
        current_mileage = vehicle.get('current_mileage', 0)
        purchase_mileage = vehicle.get('purchase_mileage', 0)
        
        # Enhanced maintenance schedule with service status
        enhanced_schedule = []
        
        for item in maintenance_items:
            item_id_str = str(item['_id'])
            
            # Find the most recent service record for this maintenance item
            relevant_services = [
                s for s in service_records 
                if str(s.get('maintenance_item_id')) == item_id_str
            ]
            relevant_services.sort(key=lambda x: x.get('mileage', 0), reverse=True)
            
            # Calculate status
            if relevant_services:
                last_service = relevant_services[0]
                last_service_mileage = last_service.get('mileage', 0)
                last_service_date = last_service.get('date')
            else:
                last_service_mileage = purchase_mileage
                last_service_date = None
            
            interval_km = item.get('interval_km', 0)
            next_due_mileage = last_service_mileage + interval_km
            
            # Determine status
            if current_mileage >= next_due_mileage:
                status = 'due'
                miles_until_due = current_mileage - next_due_mileage  # overdue amount
            elif current_mileage >= (next_due_mileage - 1000):
                status = 'due_soon'
                miles_until_due = next_due_mileage - current_mileage
            else:
                status = 'ok'
                miles_until_due = next_due_mileage - current_mileage
            
            enhanced_item = serialize_maintenance_item(item.copy())
            enhanced_item.update({
                'status': status,
                'last_service_date': last_service_date,
                'last_service_mileage': last_service_mileage,
                'next_due_mileage': next_due_mileage,
                'miles_until_due': miles_until_due,
                'service_count': len(relevant_services)
            })
            
            enhanced_schedule.append(enhanced_item)
        
        # Group by category and sort
        categories = {}
        for item in enhanced_schedule:
            category = item.get('category', 'Other')
            if category not in categories:
                categories[category] = []
            categories[category].append(item)
        
        # Sort items within each category by status priority and due date
        status_priority = {'due': 0, 'due_soon': 1, 'ok': 2}
        for category in categories:
            categories[category].sort(key=lambda x: (
                status_priority.get(x['status'], 3),
                x.get('miles_until_due', 0)
            ))
        
        return jsonify({
            'vehicle': {
                'id': str(vehicle['_id']),
                'make': vehicle.get('make', ''),
                'model': vehicle.get('model', ''),
                'year': vehicle.get('year', ''),
                'current_mileage': current_mileage
            },
            'categories': categories,
            'summary': {
                'total_items': len(enhanced_schedule),
                'due_now': len([i for i in enhanced_schedule if i['status'] == 'due']),
                'due_soon': len([i for i in enhanced_schedule if i['status'] == 'due_soon']),
                'up_to_date': len([i for i in enhanced_schedule if i['status'] == 'ok'])
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('', methods=['POST'])
@token_required
@user_rate_limit(limit=10, window_seconds=60)
@check_subscription_limits('records')
def add_maintenance_item():
    try:
        user_id = get_current_user_id()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'category', 'interval_km', 'vehicle_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Verify vehicle ownership
        vehicle = Vehicle.get_vehicle_by_id(data['vehicle_id'], user_id)
        if not vehicle:
            return jsonify({'error': 'Vehicle not found'}), 404
        
        # Create maintenance item
        item_id = MaintenanceItem.create_maintenance_item(data)
        
        return jsonify({'id': item_id, 'message': 'Maintenance item created successfully'}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/simple/<vehicle_id>', methods=['GET'])
@token_required
@user_rate_limit(limit=100, window_seconds=60)
def get_simple_maintenance_items(vehicle_id):
    """Get maintenance items with status evaluation for frontend use"""
    try:
        user_id = get_current_user_id()
        
        # Verify vehicle ownership
        vehicle = Vehicle.get_vehicle_by_id(vehicle_id, user_id)
        if not vehicle:
            return jsonify({'error': 'Vehicle not found'}), 404
        
        # Get maintenance items and service records
        maintenance_items = MaintenanceItem.get_maintenance_items_by_vehicle(vehicle_id)
        service_records = ServiceRecord.get_service_records_by_vehicle(vehicle_id)
        
        current_mileage = vehicle.get('current_mileage', 0)
        purchase_mileage = vehicle.get('purchase_mileage', 0)
        
        print(f"=== DEBUG: Simple Maintenance API for Vehicle {vehicle_id} ===")
        print(f"Current mileage: {current_mileage}")
        print(f"Purchase mileage: {purchase_mileage}")
        print(f"Total maintenance items: {len(maintenance_items)}")
        
        enhanced_items = []
        
        for item in maintenance_items:
            item_id_str = str(item['_id'])
            item_name = item.get('name', 'Unknown')
            interval_km = item.get('interval_km', 0)
            
            print(f"--- Processing: {item_name} (interval: {interval_km}km) ---")
            
            # Find the most recent service record for this maintenance item
            relevant_services = [
                s for s in service_records 
                if str(s.get('maintenance_item_id')) == item_id_str
            ]
            relevant_services.sort(key=lambda x: x.get('mileage', 0), reverse=True)
            
            # Calculate status
            if relevant_services:
                last_service = relevant_services[0]
                last_service_mileage = last_service.get('mileage', 0)
                last_service_date = last_service.get('date')
                print(f"  Found {len(relevant_services)} service records, last at {last_service_mileage}km")
            else:
                last_service_mileage = purchase_mileage
                last_service_date = None
                print(f"  No service records, using purchase mileage: {last_service_mileage}km")
            
            # Calculate due mileage
            due_at_mileage = last_service_mileage + interval_km
            print(f"  Due at mileage: {due_at_mileage}km")
            
            # Determine status based on current mileage
            if current_mileage >= due_at_mileage:
                status = 'due_now'
                miles_overdue = current_mileage - due_at_mileage
                miles_until_due = 0  # Not applicable for overdue items
                print(f"  Status: DUE NOW ({miles_overdue}km overdue)")
            elif current_mileage >= (due_at_mileage - 1000):
                status = 'due_soon'
                miles_until_due = due_at_mileage - current_mileage
                miles_overdue = 0  # Not applicable for due soon items
                print(f"  Status: DUE SOON ({miles_until_due}km until due)")
            else:
                status = 'up_to_date'
                miles_until_due = due_at_mileage - current_mileage
                miles_overdue = 0  # Not applicable for up to date items
                print(f"  Status: UP TO DATE ({miles_until_due}km until due)")
            
            # Create enhanced item with status information
            enhanced_item = serialize_maintenance_item(item.copy())
            enhanced_item.update({
                'status': status,
                'last_service_date': last_service_date,
                'last_service_mileage': last_service_mileage,
                'due_at_mileage': due_at_mileage,
                'miles_until_due': miles_until_due,
                'miles_overdue': miles_overdue,
                'service_count': len(relevant_services)
            })
            
            enhanced_items.append(enhanced_item)
        
        print(f"=== Summary: {len([i for i in enhanced_items if i['status'] == 'due_now'])} due now, {len([i for i in enhanced_items if i['status'] == 'due_soon'])} due soon, {len([i for i in enhanced_items if i['status'] == 'up_to_date'])} up to date ===")
        
        return jsonify(enhanced_items), 200
    except Exception as e:
        print(f"Error in get_simple_maintenance_items: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/export/<vehicle_id>', methods=['GET'])
@token_required
@user_rate_limit(limit=10, window_seconds=60)
def export_maintenance_schedule(vehicle_id):
    """Export maintenance schedule to CSV format"""
    try:
        user_id = get_current_user_id()
        
        # Get vehicle info and verify ownership
        vehicle = Vehicle.get_vehicle_by_id(vehicle_id, user_id)
        if not vehicle:
            return jsonify({'error': 'Vehicle not found'}), 404
        
        # Get maintenance items and service records
        maintenance_items = MaintenanceItem.get_maintenance_items_by_vehicle(vehicle_id)
        service_records = ServiceRecord.get_service_records_by_vehicle(vehicle_id)
        
        current_mileage = vehicle.get('current_mileage', 0)
        purchase_mileage = vehicle.get('purchase_mileage', 0)
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Item', 'Category', 'Interval (km)', 'Action Type', 'Description',
            'Last Service Date', 'Last Service Mileage', 'Next Due Mileage',
            'Current Mileage', 'Status', 'Miles Until Due', 'Service Count', 'Priority'
        ])
        
        # Process each maintenance item
        for item in maintenance_items:
            item_id_str = str(item['_id'])
            
            # Find the most recent service record for this maintenance item
            relevant_services = [
                s for s in service_records 
                if str(s.get('maintenance_item_id')) == item_id_str
            ]
            relevant_services.sort(key=lambda x: x.get('mileage', 0), reverse=True)
            
            # Calculate status
            if relevant_services:
                last_service = relevant_services[0]
                last_service_mileage = last_service.get('mileage', 0)
                last_service_date = last_service.get('date')
            else:
                last_service_mileage = purchase_mileage
                last_service_date = None
            
            interval_km = item.get('interval_km', 0)
            next_due_mileage = last_service_mileage + interval_km
            
            # Determine status
            if current_mileage >= next_due_mileage:
                status = 'Overdue'
                miles_until_due = current_mileage - next_due_mileage
                priority = 'High'
            elif current_mileage >= (next_due_mileage - 1000):
                status = 'Due Soon'
                miles_until_due = next_due_mileage - current_mileage
                priority = 'Medium'
            else:
                status = 'OK'
                miles_until_due = next_due_mileage - current_mileage
                priority = 'Low'
            
            # Write row
            writer.writerow([
                item.get('name', ''),
                item.get('category', ''),
                item.get('interval_km', ''),
                item.get('action', 'Inspect'),
                item.get('description', ''),
                last_service_date or 'Never',
                last_service_mileage,
                next_due_mileage,
                current_mileage,
                status,
                miles_until_due,
                len(relevant_services),
                priority
            ])
        
        # Create response
        csv_content = output.getvalue()
        output.close()
        
        # Generate filename
        vehicle_name = f"{vehicle.get('year', '')}-{vehicle.get('make', '')}-{vehicle.get('model', '')}".strip('-')
        filename = f"maintenance-schedule-{vehicle_name}-{datetime.now().strftime('%Y%m%d')}.csv"
        
        response = make_response(csv_content)
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500