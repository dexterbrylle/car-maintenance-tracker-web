from flask import Blueprint, request, jsonify
from models import FillUp
from utils.fuel_calculations import validate_fillup_data, calculate_monthly_fuel_cost
import os
from datetime import datetime
import csv
import io

bp = Blueprint('fillups', __name__)

@bp.route('', methods=['POST'])
def add_fillup():
    """Add a new fill-up record"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['vehicle_id', 'date', 'odometer_km', 'liters', 'price_per_liter']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Additional validation
        validation_error = validate_fillup_data(data)
        if validation_error:
            return jsonify({'error': validation_error}), 400
        
        # Calculate total cost if not provided
        if 'total_cost' not in data:
            data['total_cost'] = round(data['liters'] * data['price_per_liter'], 2)
        
        # Create the fill-up record
        fillup_id = FillUp.create_fillup(data)
        
        # Get the created record with calculated fields
        created_fillup = FillUp.get_fillup_by_id(fillup_id)
        
        # Convert ObjectId to string for JSON serialization
        if created_fillup:
            created_fillup['_id'] = str(created_fillup['_id'])
            created_fillup['vehicle_id'] = str(created_fillup['vehicle_id'])
            if 'created_at' in created_fillup and created_fillup['created_at']:
                created_fillup['created_at'] = created_fillup['created_at'].isoformat()
        
        return jsonify({
            'message': 'Fill-up added successfully',
            'fillup': created_fillup
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<vehicle_id>', methods=['GET'])
def get_fillups(vehicle_id):
    """Get all fill-ups for a vehicle"""
    try:
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        offset = (page - 1) * limit
        
        # Get fill-ups
        fillups = FillUp.get_fillups_by_vehicle(vehicle_id, limit=limit, offset=offset)
        
        # Convert ObjectId to string and format dates
        for fillup in fillups:
            fillup['_id'] = str(fillup['_id'])
            fillup['vehicle_id'] = str(fillup['vehicle_id'])
            if 'created_at' in fillup and fillup['created_at']:
                fillup['created_at'] = fillup['created_at'].isoformat()
        
        # Get total count for pagination
        from pymongo import MongoClient
        client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/maintenance_tracker'))
        db = client.get_default_database()
        total_count = db.fill_ups.count_documents({'vehicle_id': vehicle_id})
        
        return jsonify({
            'fillups': fillups,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total_count,
                'pages': (total_count + limit - 1) // limit
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<fillup_id>', methods=['PUT'])
def update_fillup(fillup_id):
    """Update a fill-up record"""
    try:
        data = request.get_json()
        
        # Validate the data
        validation_error = validate_fillup_data(data, is_update=True)
        if validation_error:
            return jsonify({'error': validation_error}), 400
        
        # Calculate total cost if liters or price_per_liter changed
        if 'liters' in data and 'price_per_liter' in data and 'total_cost' not in data:
            data['total_cost'] = round(data['liters'] * data['price_per_liter'], 2)
        
        # Update the fill-up
        success = FillUp.update_fillup(fillup_id, data)
        
        if not success:
            return jsonify({'error': 'Fill-up not found'}), 404
        
        # Get the updated record
        updated_fillup = FillUp.get_fillup_by_id(fillup_id)
        
        # Convert ObjectId to string for JSON serialization
        if updated_fillup:
            updated_fillup['_id'] = str(updated_fillup['_id'])
            updated_fillup['vehicle_id'] = str(updated_fillup['vehicle_id'])
            if 'created_at' in updated_fillup and updated_fillup['created_at']:
                updated_fillup['created_at'] = updated_fillup['created_at'].isoformat()
        
        return jsonify({
            'message': 'Fill-up updated successfully',
            'fillup': updated_fillup
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<fillup_id>', methods=['DELETE'])
def delete_fillup(fillup_id):
    """Delete a fill-up record"""
    try:
        success = FillUp.delete_fillup(fillup_id)
        
        if not success:
            return jsonify({'error': 'Fill-up not found'}), 404
        
        return jsonify({'message': 'Fill-up deleted successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/stats/<vehicle_id>', methods=['GET'])
def get_fuel_stats(vehicle_id):
    """Get fuel statistics for a vehicle"""
    try:
        stats = FillUp.get_fuel_stats(vehicle_id)
        
        if not stats:
            return jsonify({'error': 'No fuel data found for this vehicle'}), 404
        
        # Calculate monthly fuel cost
        monthly_cost = calculate_monthly_fuel_cost(vehicle_id)
        stats['monthly_fuel_cost'] = monthly_cost
        
        return jsonify(stats)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/recent/<vehicle_id>', methods=['GET'])
def get_recent_fillups(vehicle_id):
    """Get recent fill-ups for dashboard display"""
    try:
        limit = int(request.args.get('limit', 5))
        fillups = FillUp.get_fillups_by_vehicle(vehicle_id, limit=limit)
        
        # Convert ObjectId to string and format dates
        for fillup in fillups:
            fillup['_id'] = str(fillup['_id'])
            fillup['vehicle_id'] = str(fillup['vehicle_id'])
            if 'created_at' in fillup and fillup['created_at']:
                fillup['created_at'] = fillup['created_at'].isoformat()
        
        return jsonify(fillups)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/export/<vehicle_id>', methods=['GET'])
def export_fuel_history(vehicle_id):
    """Export fuel history to CSV format"""
    try:
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        columns = request.args.getlist('columns')
        
        # Get vehicle info
        from models import Vehicle
        vehicle = Vehicle.get_vehicle_by_id(vehicle_id)
        if not vehicle:
            return jsonify({'error': 'Vehicle not found'}), 404
        
        # Get fuel records
        fuel_records = FillUp.get_fillups_by_vehicle(vehicle_id)
        
        # Filter by date range if provided
        if start_date:
            fuel_records = [r for r in fuel_records if r.get('date', '') >= start_date]
        if end_date:
            fuel_records = [r for r in fuel_records if r.get('date', '') <= end_date]
        
        # Define all available columns
        all_columns = [
            'Date', 'Odometer (km)', 'Liters', 'Price per Liter (₱)', 
            'Total Cost (₱)', 'Fuel Economy (km/L)', 'Cost per km (₱)', 'Notes'
        ]
        
        # Use provided columns or default to all
        selected_columns = columns if columns else all_columns
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(selected_columns)
        
        # Sort records by date
        fuel_records.sort(key=lambda x: x.get('date', ''), reverse=True)
        
        # Write data rows
        for record in fuel_records:
            # Calculate fuel economy if possible
            fuel_economy = record.get('fuel_economy', '')
            cost_per_km = record.get('cost_per_km', '')
            
            # Build row data based on selected columns
            row_data = []
            for column in selected_columns:
                if column == 'Date':
                    row_data.append(record.get('date', ''))
                elif column == 'Odometer (km)':
                    row_data.append(record.get('odometer_km', ''))
                elif column == 'Liters':
                    row_data.append(record.get('liters', ''))
                elif column == 'Price per Liter (₱)':
                    row_data.append(record.get('price_per_liter', ''))
                elif column == 'Total Cost (₱)':
                    row_data.append(record.get('total_cost', ''))
                elif column == 'Fuel Economy (km/L)':
                    row_data.append(fuel_economy if fuel_economy else '')
                elif column == 'Cost per km (₱)':
                    row_data.append(cost_per_km if cost_per_km else '')
                elif column == 'Notes':
                    row_data.append(record.get('notes', ''))
            
            writer.writerow(row_data)
        
        # Create response
        from flask import make_response
        output.seek(0)
        csv_data = output.getvalue()
        output.close()
        
        # Create filename with vehicle info and date
        from datetime import datetime
        current_date = datetime.now().strftime('%Y%m%d')
        date_suffix = ""
        if start_date or end_date:
            date_suffix = f"_{start_date or 'start'}-{end_date or 'end'}"
        filename = f"fuel_history_{vehicle['make']}_{vehicle['model']}{date_suffix}_{current_date}.csv"
        
        response = make_response(csv_data)
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500