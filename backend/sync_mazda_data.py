#!/usr/bin/env python3
"""
Mazda Maintenance Data Sync Script

This script synchronizes the official Mazda CX-5 2016 maintenance schedule
with vehicles in the database. It can:

1. Add the official schedule to existing Mazda CX-5 2014-2017 vehicles
2. Update existing maintenance items with the latest schedule data
3. Provide a dry-run mode to preview changes
4. Generate a report of what was updated

Usage:
    python sync_mazda_data.py [--dry-run] [--force] [--vehicle-id ID]

Options:
    --dry-run    Show what would be changed without making changes
    --force      Force update even if items already exist
    --vehicle-id Update only a specific vehicle by ID
"""

import argparse
import sys
from datetime import datetime
from bson.objectid import ObjectId
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import Vehicle, MaintenanceItem
from data.mazda_cx5_2016_philippines import MAZDA_CX5_2016_PHILIPPINES_SCHEDULE

def is_mazda_cx5_eligible(vehicle_data):
    """Check if vehicle is eligible for Mazda CX-5 2014-2017 schedule"""
    make = vehicle_data.get('make', '').lower()
    model = vehicle_data.get('model', '').lower()
    year = vehicle_data.get('year')
    
    return (make == 'mazda' and 
            'cx-5' in model and 
            year and 
            2014 <= year <= 2017)

def get_vehicle_maintenance_items(vehicle_id):
    """Get current maintenance items for a vehicle"""
    return list(MaintenanceItem.get_maintenance_items_by_vehicle(vehicle_id))

def maintenance_item_exists(current_items, new_item):
    """Check if a maintenance item already exists"""
    for existing in current_items:
        if (existing.get('name', '').lower() == new_item['name'].lower() and
            existing.get('category', '').lower() == new_item['category'].lower()):
            return existing
    return None

def sync_vehicle_maintenance_data(vehicle_id, dry_run=False, force=False):
    """Sync maintenance data for a single vehicle"""
    vehicle = Vehicle.get_vehicle_by_id(vehicle_id)
    if not vehicle:
        return {'error': f'Vehicle {vehicle_id} not found'}
    
    vehicle_info = {
        'id': str(vehicle['_id']),
        'make': vehicle.get('make'),
        'model': vehicle.get('model'),
        'year': vehicle.get('year'),
        'current_mileage': vehicle.get('current_mileage', 0)
    }
    
    if not is_mazda_cx5_eligible(vehicle):
        return {
            'vehicle': vehicle_info,
            'status': 'skipped',
            'reason': 'Not a Mazda CX-5 2014-2017'
        }
    
    current_items = get_vehicle_maintenance_items(vehicle_id)
    results = {
        'vehicle': vehicle_info,
        'status': 'processed',
        'existing_items': len(current_items),
        'items_added': 0,
        'items_updated': 0,
        'items_skipped': 0,
        'changes': []
    }
    
    for schedule_item in MAZDA_CX5_2016_PHILIPPINES_SCHEDULE:
        existing_item = maintenance_item_exists(current_items, schedule_item)
        
        if existing_item:
            # Item exists, check if update is needed
            needs_update = False
            update_fields = {}
            
            if (existing_item.get('interval_km') != schedule_item['interval_km']):
                update_fields['interval_km'] = schedule_item['interval_km']
                needs_update = True
            
            if (existing_item.get('description', '') != schedule_item['description']):
                update_fields['description'] = schedule_item['description']
                needs_update = True
            
            if (existing_item.get('action', 'Inspect') != schedule_item['action']):
                update_fields['action'] = schedule_item['action']
                needs_update = True
            
            if needs_update and force:
                if not dry_run:
                    MaintenanceItem.update_maintenance_item(
                        str(existing_item['_id']), 
                        update_fields
                    )
                results['items_updated'] += 1
                results['changes'].append({
                    'action': 'updated',
                    'item_name': schedule_item['name'],
                    'fields': list(update_fields.keys())
                })
            else:
                results['items_skipped'] += 1
        else:
            # Item doesn't exist, add it
            if not dry_run:
                new_item_data = {
                    'name': schedule_item['name'],
                    'category': schedule_item['category'],
                    'interval_km': schedule_item['interval_km'],
                    'description': schedule_item['description'],
                    'action': schedule_item['action'],
                    'vehicle_id': vehicle_id
                }
                MaintenanceItem.create_maintenance_item(new_item_data)
            results['items_added'] += 1
            results['changes'].append({
                'action': 'added',
                'item_name': schedule_item['name'],
                'category': schedule_item['category'],
                'interval_km': schedule_item['interval_km']
            })
    
    return results

def main():
    parser = argparse.ArgumentParser(description='Sync Mazda maintenance data')
    parser.add_argument('--dry-run', action='store_true', 
                       help='Show what would be changed without making changes')
    parser.add_argument('--force', action='store_true',
                       help='Force update existing items')
    parser.add_argument('--vehicle-id', type=str,
                       help='Update only a specific vehicle by ID')
    
    args = parser.parse_args()
    
    print("Mazda CX-5 Maintenance Data Sync Script")
    print("=" * 50)
    print(f"Schedule items: {len(MAZDA_CX5_2016_PHILIPPINES_SCHEDULE)}")
    print(f"Mode: {'DRY RUN' if args.dry_run else 'LIVE'}")
    print(f"Force updates: {args.force}")
    if args.vehicle_id:
        print(f"Target vehicle: {args.vehicle_id}")
    print()
    
    if args.vehicle_id:
        # Single vehicle mode
        result = sync_vehicle_maintenance_data(args.vehicle_id, args.dry_run, args.force)
        print_vehicle_result(result)
    else:
        # All vehicles mode
        vehicles = Vehicle.get_all_vehicles()
        mazda_vehicles = [v for v in vehicles if is_mazda_cx5_eligible(v)]
        
        print(f"Total vehicles: {len(vehicles)}")
        print(f"Mazda CX-5 2014-2017 vehicles: {len(mazda_vehicles)}")
        print()
        
        total_added = 0
        total_updated = 0
        total_skipped = 0
        vehicles_processed = 0
        
        for vehicle in mazda_vehicles:
            result = sync_vehicle_maintenance_data(
                str(vehicle['_id']), 
                args.dry_run, 
                args.force
            )
            
            if result.get('status') == 'processed':
                print_vehicle_result(result)
                total_added += result.get('items_added', 0)
                total_updated += result.get('items_updated', 0)
                total_skipped += result.get('items_skipped', 0)
                vehicles_processed += 1
            elif result.get('status') == 'skipped':
                print(f"Skipped {result['vehicle']['make']} {result['vehicle']['model']} ({result['vehicle']['year']}): {result['reason']}")
        
        print("\n" + "=" * 50)
        print("SUMMARY")
        print("=" * 50)
        print(f"Vehicles processed: {vehicles_processed}")
        print(f"Items added: {total_added}")
        print(f"Items updated: {total_updated}")
        print(f"Items skipped: {total_skipped}")
        print(f"Mode: {'DRY RUN' if args.dry_run else 'LIVE'}")

def print_vehicle_result(result):
    """Print result for a single vehicle"""
    vehicle = result['vehicle']
    print(f"{vehicle['make']} {vehicle['model']} ({vehicle['year']}) - {vehicle['current_mileage']:,} km")
    
    if result.get('status') == 'skipped':
        print(f"  → Skipped: {result.get('reason')}")
        return
    
    print(f"  → Added: {result.get('items_added', 0)} items")
    print(f"  → Updated: {result.get('items_updated', 0)} items")
    print(f"  → Skipped: {result.get('items_skipped', 0)} items")
    
    if result.get('changes'):
        print("  → Changes:")
        for change in result['changes']:
            if change['action'] == 'added':
                print(f"    + {change['item_name']} ({change['category']}) - Every {change['interval_km']:,} km")
            elif change['action'] == 'updated':
                print(f"    ~ {change['item_name']} - Updated: {', '.join(change['fields'])}")
    
    print()

if __name__ == '__main__':
    main()