from flask import Blueprint, request, jsonify, make_response
from models import Vehicle, MaintenanceItem, ServiceRecord
from bson.objectid import ObjectId
from datetime import datetime
import csv
import io

bp = Blueprint('export', __name__)

@bp.route('/combined/<vehicle_id>', methods=['GET'])
def export_combined_report(vehicle_id):
    """Export combined vehicle report with all data to CSV format"""
    try:
        # Get vehicle info
        vehicle = Vehicle.get_vehicle_by_id(vehicle_id)
        if not vehicle:
            return jsonify({'error': 'Vehicle not found'}), 404
        
        # Get all related data
        maintenance_items = MaintenanceItem.get_maintenance_items_by_vehicle(vehicle_id)
        service_records = ServiceRecord.get_service_records_by_vehicle(vehicle_id)
        
        current_mileage = vehicle.get('current_mileage', 0)
        purchase_mileage = vehicle.get('purchase_mileage', 0)
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write report header
        writer.writerow(['Combined Vehicle Report'])
        writer.writerow([f"{vehicle.get('year', '')} {vehicle.get('make', '')} {vehicle.get('model', '')}"])
        writer.writerow([f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"])
        writer.writerow([])
        
        # Vehicle Information Section
        writer.writerow(['Vehicle Information'])
        writer.writerow(['Make', vehicle.get('make', '')])
        writer.writerow(['Model', vehicle.get('model', '')])
        writer.writerow(['Year', vehicle.get('year', '')])
        writer.writerow(['Current Mileage', f"{vehicle.get('current_mileage', 0):,} km"])
        writer.writerow(['Purchase Mileage', f"{vehicle.get('purchase_mileage', 0):,} km"])
        writer.writerow(['Total Distance Driven', f"{current_mileage - purchase_mileage:,} km"])
        writer.writerow(['Created Date', vehicle.get('created_at', '').replace('T', ' ').split('.')[0] if vehicle.get('created_at') else ''])
        writer.writerow([])
        
        # Summary Statistics
        total_services = len(service_records)
        total_maintenance_items = len(maintenance_items)
        total_cost = sum(record.get('cost', 0) for record in service_records)
        avg_cost_per_service = total_cost / total_services if total_services > 0 else 0
        
        writer.writerow(['Summary Statistics'])
        writer.writerow(['Total Services', total_services])
        writer.writerow(['Total Maintenance Items', total_maintenance_items])
        writer.writerow(['Total Service Cost', f"₱{total_cost:.2f}"])
        writer.writerow(['Average Cost per Service', f"₱{avg_cost_per_service:.2f}"])
        writer.writerow([])
        
        # Maintenance Status Summary
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
        
        writer.writerow(['Maintenance Status'])
        writer.writerow(['Overdue Items', overdue_items])
        writer.writerow(['Due Soon Items', due_soon_items])
        writer.writerow(['Up to Date Items', total_maintenance_items - overdue_items - due_soon_items])
        writer.writerow([])
        
        # Service History
        writer.writerow(['Service History'])
        writer.writerow(['Date', 'Service', 'Category', 'Action Type', 'Mileage (km)', 'Cost (₱)', 'Notes'])
        
        # Sort service records by date (most recent first)
        service_records_sorted = sorted(service_records, key=lambda x: x.get('date', ''), reverse=True)
        
        for record in service_records_sorted:
            # Find maintenance item details
            maintenance_item = None
            for item in maintenance_items:
                if str(item['_id']) == str(record.get('maintenance_item_id')):
                    maintenance_item = item
                    break
            
            writer.writerow([
                record.get('date', ''),
                maintenance_item.get('name', 'Unknown') if maintenance_item else 'Unknown',
                maintenance_item.get('category', '') if maintenance_item else '',
                maintenance_item.get('action', 'Service') if maintenance_item else 'Service',
                f"{record.get('mileage', 0):,}",
                f"{record.get('cost', 0):.2f}",
                record.get('notes', '')
            ])
        
        writer.writerow([])
        
        # Maintenance Schedule
        writer.writerow(['Maintenance Schedule'])
        writer.writerow(['Item', 'Category', 'Interval (km)', 'Action Type', 'Last Service', 'Next Due', 'Status', 'Priority'])
        
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
                last_service_date = last_service.get('date', '')
            else:
                last_service_mileage = purchase_mileage
                last_service_date = 'Never'
            
            interval_km = item.get('interval_km', 0)
            next_due_mileage = last_service_mileage + interval_km
            
            # Determine status
            if current_mileage >= next_due_mileage:
                status = 'Overdue'
                priority = 'High'
            elif current_mileage >= (next_due_mileage - 1000):
                status = 'Due Soon'
                priority = 'Medium'
            else:
                status = 'OK'
                priority = 'Low'
            
            writer.writerow([
                item.get('name', ''),
                item.get('category', ''),
                f"{item.get('interval_km', 0):,}",
                item.get('action', 'Inspect'),
                last_service_date,
                f"{next_due_mileage:,}",
                status,
                priority
            ])
        
        writer.writerow([])
        
        # Cost Analysis by Category
        writer.writerow(['Cost Analysis by Category'])
        writer.writerow(['Category', 'Services', 'Total Cost (₱)', 'Average Cost (₱)'])
        
        category_costs = {}
        category_counts = {}
        
        for record in service_records:
            # Find maintenance item for category
            maintenance_item = None
            for item in maintenance_items:
                if str(item['_id']) == str(record.get('maintenance_item_id')):
                    maintenance_item = item
                    break
            
            if maintenance_item:
                category = maintenance_item.get('category', 'Other')
                cost = record.get('cost', 0)
                
                if category not in category_costs:
                    category_costs[category] = 0
                    category_counts[category] = 0
                
                category_costs[category] += cost
                category_counts[category] += 1
        
        for category, total_cost in category_costs.items():
            count = category_counts[category]
            avg_cost = total_cost / count if count > 0 else 0
            writer.writerow([category, count, f"{total_cost:.2f}", f"{avg_cost:.2f}"])
        
        writer.writerow([])
        
        # Annual Summary
        writer.writerow(['Annual Summary'])
        writer.writerow(['Year', 'Services', 'Total Cost (₱)', 'Average Cost (₱)'])
        
        annual_costs = {}
        annual_counts = {}
        
        for record in service_records:
            date = record.get('date', '')
            if date:
                year = date.split('-')[0]
                cost = record.get('cost', 0)
                
                if year not in annual_costs:
                    annual_costs[year] = 0
                    annual_counts[year] = 0
                
                annual_costs[year] += cost
                annual_counts[year] += 1
        
        for year in sorted(annual_costs.keys(), reverse=True):
            total_cost = annual_costs[year]
            count = annual_counts[year]
            avg_cost = total_cost / count if count > 0 else 0
            writer.writerow([year, count, f"{total_cost:.2f}", f"{avg_cost:.2f}"])
        
        # Create response
        csv_content = output.getvalue()
        output.close()
        
        # Generate filename
        vehicle_name = f"{vehicle.get('year', '')}-{vehicle.get('make', '')}-{vehicle.get('model', '')}".strip('-')
        filename = f"combined-report-{vehicle_name}-{datetime.now().strftime('%Y%m%d')}.csv"
        
        response = make_response(csv_content)
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500