#!/usr/bin/env python3
"""
Populate Service Records Script

This script populates the database with service records for all vehicles.
For vehicles other than Mazda CX-5, it uses generic maintenance data with lower intervals.

Usage:
    python populate_service_records.py
"""

import os
import sys
from datetime import datetime, timedelta
from pymongo import MongoClient
from bson.objectid import ObjectId
import random
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def populate_service_records():
    """Populate database with service records for vehicles"""
    print("🔧 Populating database with service records...")
    
    try:
        # Initialize database connection
        mongodb_uri = os.getenv('MONGODB_URI')
        if not mongodb_uri:
            raise ValueError("MONGODB_URI environment variable is not set")
        
        client = MongoClient(mongodb_uri)
        db = client.get_default_database()
        
        print(f"Connected to MongoDB: {client.HOST}:{client.client.PORT}")
        print(f"Database: {db.name}")
        
        # Get all vehicles
        vehicles = list(db.vehicles.find())
        if not vehicles:
            print("❌ No vehicles found. Please add vehicles first.")
            return False
        
        total_services_created = 0
        
        for vehicle in vehicles:
            print(f"\n📋 Processing vehicle: {vehicle['make']} {vehicle['model']} ({vehicle['year']})")
            
            # Get or create maintenance items for this vehicle
            maintenance_items = get_or_create_maintenance_items(db, vehicle)
            
            # Create service records based on vehicle's current mileage
            services_created = create_service_records(db, vehicle, maintenance_items)
            total_services_created += services_created
            
            print(f"   ✅ Created {services_created} service records")
            
            # Update vehicle's current mileage to reflect services
            update_vehicle_mileage(db, vehicle, services_created)
        
        print(f"\n🎉 Successfully populated {total_services_created} service records across {len(vehicles)} vehicles")
        return True
        
    except Exception as e:
        print(f"❌ Error populating service records: {str(e)}")
        return False
    finally:
        if 'client' in locals():
            client.close()
            print("🔌 Database connection closed")

def get_or_create_maintenance_items(db, vehicle):
    """Get or create maintenance items for a vehicle"""
    existing_items = list(db.maintenance_items.find({'vehicle_id': vehicle['_id']}))
    
    if existing_items:
        return existing_items
    
    # Create maintenance items based on vehicle type
    items = create_maintenance_schedule(vehicle)
    
    # Add user_id for multi-tenant support
    for item in items:
        item['vehicle_id'] = vehicle['_id']
        if 'user_id' in vehicle:
            item['user_id'] = vehicle['user_id']
    
    result = db.maintenance_items.insert_many(items)
    print(f"   📝 Created {len(result.inserted_ids)} maintenance items")
    
    return list(db.maintenance_items.find({'vehicle_id': vehicle['_id']}))

def create_maintenance_schedule(vehicle):
    """Create maintenance schedule based on vehicle type"""
    make = vehicle.get('make', '').lower()
    model = vehicle.get('model', '').lower()
    year = vehicle.get('year')
    
    # Check if it's a Mazda CX-5 2014-2017
    if make == 'mazda' and 'cx-5' in model and year and 2014 <= year <= 2017:
        # Use the official Mazda schedule
        from data.mazda_cx5_2016_philippines import MAZDA_CX5_2016_PHILIPPINES_SCHEDULE
        return MAZDA_CX5_2016_PHILIPPINES_SCHEDULE.copy()
    
    # Generic maintenance schedule for other vehicles (lower intervals)
    return [
        # ENGINE
        {
            "name": "Engine Oil & Filter",
            "category": "Engine",
            "interval_km": 5000,
            "description": "Replace engine oil and filter",
            "action": "Replace"
        },
        {
            "name": "Drive Belts",
            "category": "Engine",
            "interval_km": 40000,
            "description": "Inspect drive belts for wear and tension",
            "action": "Inspect"
        },
        # COOLING SYSTEM
        {
            "name": "Engine Coolant",
            "category": "Cooling System",
            "interval_km": 160000,
            "description": "Replace engine coolant",
            "action": "Replace"
        },
        {
            "name": "Engine Coolant Level",
            "category": "Cooling System",
            "interval_km": 5000,
            "description": "Inspect engine coolant level",
            "action": "Inspect"
        },
        # FUEL SYSTEM
        {
            "name": "Air Filter",
            "category": "Fuel System",
            "interval_km": 20000,
            "description": "Replace air filter",
            "action": "Replace"
        },
        {
            "name": "Fuel Filter",
            "category": "Fuel System",
            "interval_km": 40000,
            "description": "Replace fuel filter",
            "action": "Replace"
        },
        # IGNITION SYSTEM
        {
            "name": "Spark Plugs",
            "category": "Ignition System",
            "interval_km": 80000,
            "description": "Replace spark plugs",
            "action": "Replace"
        },
        # BRAKES
        {
            "name": "Brake Pads",
            "category": "Brakes",
            "interval_km": 25000,
            "description": "Inspect/Replace brake pads",
            "action": "Replace"
        },
        {
            "name": "Brake Fluid",
            "category": "Brakes",
            "interval_km": 40000,
            "description": "Replace brake fluid",
            "action": "Replace"
        },
        # TIRES
        {
            "name": "Tire Rotation",
            "category": "Tires",
            "interval_km": 10000,
            "description": "Rotate tires",
            "action": "Service"
        },
        {
            "name": "Wheel Alignment",
            "category": "Tires",
            "interval_km": 20000,
            "description": "Check wheel alignment",
            "action": "Inspect"
        },
        # TRANSMISSION
        {
            "name": "Transmission Fluid",
            "category": "Transmission",
            "interval_km": 60000,
            "description": "Replace transmission fluid",
            "action": "Replace"
        },
        # AIR CONDITIONING
        {
            "name": "Cabin Air Filter",
            "category": "Air Conditioning",
            "interval_km": 30000,
            "description": "Replace cabin air filter",
            "action": "Replace"
        },
        # GENERAL
        {
            "name": "Battery",
            "category": "Electrical",
            "interval_km": 20000,
            "description": "Inspect battery and terminals",
            "action": "Inspect"
        },
        {
            "name": "Lights and Wipers",
            "category": "Electrical",
            "interval_km": 10000,
            "description": "Check all lights and wiper operation",
            "action": "Inspect"
        }
    ]

def create_service_records(db, vehicle, maintenance_items):
    """Create service records for a vehicle based on its mileage"""
    current_mileage = vehicle.get('current_mileage', 0)
    purchase_mileage = vehicle.get('purchase_mileage', 0)
    
    if current_mileage <= purchase_mileage:
        print(f"   ⚠️  Vehicle has no mileage beyond purchase mileage: {current_mileage}km")
        return 0
    
    services_created = 0
    
    for item in maintenance_items:
        interval = item.get('interval_km', 10000)
        
        # Calculate how many services should have been performed
        services_due = int((current_mileage - purchase_mileage) / interval)
        
        if services_due <= 0:
            continue
        
        # Create service records
        for i in range(1, services_due + 1):
            service_mileage = purchase_mileage + (interval * i)
            
            # Only create services up to current mileage
            if service_mileage > current_mileage:
                break
            
            # Check if service already exists
            existing = db.service_records.find_one({
                'vehicle_id': vehicle['_id'],
                'maintenance_item_id': item['_id'],
                'mileage': service_mileage
            })
            
            if existing:
                continue
            
            # Calculate service date (estimated)
            days_since_purchase = int((service_mileage - purchase_mileage) / (current_mileage - purchase_mileage) * 365) if current_mileage > purchase_mileage else 0
            service_date = datetime.utcnow() - timedelta(days=365 - days_since_purchase)
            
            # Random cost based on service type
            base_costs = {
                'Replace': 1500,
                'Inspect': 500,
                'Service': 1000,
                'Lubricate': 300,
                'Tighten': 200
            }
            base_cost = base_costs.get(item.get('action', 'Inspect'), 500)
            
            # Add some variation
            cost_variation = random.uniform(0.8, 1.2)
            final_cost = round(base_cost * cost_variation, 2)
            
            service_record = {
                'vehicle_id': vehicle['_id'],
                'maintenance_item_id': item['_id'],
                'date': service_date,
                'mileage': service_mileage,
                'cost': final_cost,
                'notes': f"Regular {item.get('action', 'service').lower()} as per maintenance schedule",
                'created_at': datetime.utcnow()
            }
            
            # Add user_id for multi-tenant support
            if 'user_id' in vehicle:
                service_record['user_id'] = vehicle['user_id']
            
            db.service_records.insert_one(service_record)
            services_created += 1
    
    return services_created

def update_vehicle_mileage(db, vehicle, services_created):
    """Update vehicle mileage to reflect realistic usage"""
    if services_created > 0:
        # Add some mileage to account for recent usage
        additional_mileage = services_created * 100  # 100km per service
        new_mileage = vehicle.get('current_mileage', 0) + additional_mileage
        
        db.vehicles.update_one(
            {'_id': vehicle['_id']},
            {'$set': {'current_mileage': new_mileage}}
        )

if __name__ == '__main__':
    success = populate_service_records()
    if not success:
        sys.exit(1)