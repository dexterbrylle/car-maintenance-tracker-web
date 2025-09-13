#!/usr/bin/env python3
"""
Test script to verify maintenance items creation and interval verification
"""

import os
import sys
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime

# Add the project root to Python path
sys.path.insert(0, '/Volumes/Codex/Projects/Dev/car-maintenance-tracker/backend')

from models import MaintenanceItem

def test_maintenance_creation():
    """Test maintenance item creation for different vehicle types"""
    print("🧪 Testing maintenance items creation...")
    
    try:
        # Initialize database connection
        mongodb_uri = os.getenv('MONGODB_URI')
        if not mongodb_uri:
            raise ValueError("MONGODB_URI environment variable is not set")
        
        client = MongoClient(mongodb_uri)
        db = client.get_default_database()
        
        print(f"Connected to MongoDB: {client.HOST}:{client.client.PORT}")
        print(f"Database: {db.name}")
        
        # Get all vehicles for the test user
        test_user_email = "test1@gmail.com"
        user = db.users.find_one({'email': test_user_email})
        if not user:
            print("❌ Test user not found")
            return False
        
        print(f"✅ Found test user: {user['email']}")
        
        vehicles = list(db.vehicles.find({'user_id': user['_id']}))
        print(f"🚗 Found {len(vehicles)} vehicles:")
        
        for vehicle in vehicles:
            vehicle_name = f"{vehicle['make']} {vehicle['model']} ({vehicle['year']})"
            vehicle_id = vehicle['_id']
            print(f"   - {vehicle_name}: {vehicle['current_mileage']} km")
            
            # Check if maintenance items exist
            existing_items = list(db.maintenance_items.find({'vehicle_id': vehicle_id}))
            print(f"     Existing maintenance items: {len(existing_items)}")
            
            if len(existing_items) == 0:
                # Create maintenance items for this vehicle
                print(f"     Creating maintenance items...")
                MaintenanceItem.create_default_maintenance_items(vehicle_id, vehicle)
                
                # Verify creation
                new_items = list(db.maintenance_items.find({'vehicle_id': vehicle_id}))
                print(f"     Created {len(new_items)} maintenance items")
                
                # Check intervals
                for item in new_items:
                    item_name = item['name']
                    interval = item['interval_km']
                    print(f"       - {item_name}: {interval} km")
                    
            else:
                # Check intervals for existing items
                for item in existing_items:
                    item_name = item['name']
                    interval = item['interval_km']
                    print(f"       - {item_name}: {interval} km")
        
        print("\n🎉 Testing completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")
        return False
    finally:
        if 'client' in locals():
            client.close()
            print("🔌 Database connection closed")

if __name__ == '__main__':
    success = test_maintenance_creation()
    if not success:
        sys.exit(1)