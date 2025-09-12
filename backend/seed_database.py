#!/usr/bin/env python3
"""
Seed Database Script

This script seeds the database with initial test data including:
- Test user account with credentials: test1@gmail.com / pass123!
- Sample vehicles with different makes and models
- Maintenance items and service records
- Sample fill-up records for fuel tracking

Usage:
    python seed_database.py
"""

import os
import sys
from datetime import datetime, timedelta
from pymongo import MongoClient
from bson.objectid import ObjectId
import bcrypt
import random
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def seed_database():
    """Seed database with test data"""
    print("🌱 Seeding database with test data...")
    
    try:
        # Initialize database connection
        mongodb_uri = os.getenv('MONGODB_URI')
        if not mongodb_uri:
            raise ValueError("MONGODB_URI environment variable is not set")
        
        client = MongoClient(mongodb_uri)
        db = client.get_default_database()
        
        print(f"Connected to MongoDB: {client.HOST}:{client.client.PORT}")
        print(f"Database: {db.name}")
        
        # Clear existing data first
        clear_database_data(db)
        
        # Create test user
        test_user = create_test_user(db)
        if not test_user:
            return False
        
        # Create sample vehicles for the test user
        vehicles = create_sample_vehicles(db, test_user['_id'])
        
        # Create sample fill-ups for fuel tracking
        create_sample_fillups(db, vehicles)
        
        print("\n🎉 Database seeded successfully!")
        print(f"   👤 Test user: {test_user['email']} / pass123!")
        print(f"   🚗 Created {len(vehicles)} sample vehicles")
        
        return True
        
    except Exception as e:
        print(f"❌ Error seeding database: {str(e)}")
        return False
    finally:
        if 'client' in locals():
            client.close()
            print("🔌 Database connection closed")

def clear_database_data(db):
    """Clear all data from database"""
    print("   🧹 Clearing existing data...")
    
    collections_to_clear = [
        'users', 'vehicles', 'maintenance_items', 
        'service_records', 'fillups', 'refresh_tokens'
    ]
    
    for collection_name in collections_to_clear:
        if collection_name in db.list_collection_names():
            result = db[collection_name].delete_many({})
            print(f"     Cleared {result.deleted_count:,} documents from '{collection_name}'")

def create_test_user(db):
    """Create test user account"""
    print("   👤 Creating test user...")
    
    # Check if user already exists
    existing = db.users.find_one({'email': 'test1@gmail.com'})
    if existing:
        print(f"   ⚠️  Test user already exists: {existing['email']}")
        return existing
    
    # Hash password using bcrypt (consistent with auth system)
    password_hash = bcrypt.hashpw('pass123!'.encode('utf-8'), bcrypt.gensalt(rounds=12))
    
    user_data = {
        'email': 'test1@gmail.com',
        'password_hash': password_hash.decode('utf-8'),
        'first_name': 'Test',
        'last_name': 'User',
        'phone': '+639123456789',
        'subscription_tier': 'premium',
        'is_verified': True,
        'is_active': True,
        'verification_token': None,
        'password_reset_token': None,
        'password_reset_expires': None,
        'login_attempts': 0,
        'locked_until': None,
        'last_login': None,
        'preferences': {
            'currency': 'PHP',
            'distance_unit': 'km',
            'fuel_unit': 'L',
            'timezone': 'Asia/Manila',
            'email_notifications': True,
            'dark_mode': False
        },
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    
    result = db.users.insert_one(user_data)
    user_data['_id'] = result.inserted_id
    
    print(f"   ✅ Created test user: {user_data['email']}")
    return user_data

def create_sample_vehicles(db, user_id):
    """Create sample vehicles for testing"""
    print("   🚗 Creating sample vehicles...")
    
    sample_vehicles = [
        {
            'make': 'Toyota',
            'model': 'Vios',
            'year': 2020,
            'current_mileage': 45000,
            'purchase_mileage': 0,
            'user_id': user_id,
            'created_at': datetime.utcnow()
        },
        {
            'make': 'Mazda',
            'model': 'CX-5',
            'year': 2016,
            'current_mileage': 78000,
            'purchase_mileage': 15000,
            'user_id': user_id,
            'created_at': datetime.utcnow()
        },
        {
            'make': 'Honda',
            'model': 'Civic',
            'year': 2019,
            'current_mileage': 32000,
            'purchase_mileage': 5000,
            'user_id': user_id,
            'created_at': datetime.utcnow()
        },
        {
            'make': 'Ford',
            'model': 'Ranger',
            'year': 2018,
            'current_mileage': 65000,
            'purchase_mileage': 8000,
            'user_id': user_id,
            'created_at': datetime.utcnow()
        },
        {
            'make': 'Nissan',
            'model': 'Navara',
            'year': 2021,
            'current_mileage': 28000,
            'purchase_mileage': 2000,
            'user_id': user_id,
            'created_at': datetime.utcnow()
        }
    ]
    
    vehicles = []
    for vehicle_data in sample_vehicles:
        result = db.vehicles.insert_one(vehicle_data)
        vehicle_data['_id'] = result.inserted_id
        vehicles.append(vehicle_data)
        print(f"   ✅ Created {vehicle_data['make']} {vehicle_data['model']} ({vehicle_data['year']})")
    
    return vehicles

def create_sample_fillups(db, vehicles):
    """Create sample fill-up records for fuel tracking"""
    print("   ⛽ Creating sample fill-up records...")
    
    total_fillups = 0
    
    for vehicle in vehicles:
        current_mileage = vehicle['current_mileage']
        purchase_mileage = vehicle['purchase_mileage']
        
        # Create fill-ups going backwards from current mileage
        mileage_step = 400  # Average km between fill-ups
        num_fillups = min(15, int((current_mileage - purchase_mileage) / mileage_step))
        
        for i in range(num_fillups):
            odometer = current_mileage - (i * mileage_step)
            if odometer <= purchase_mileage:
                break
            
            # Random fuel data with realistic variation
            base_liters = random.uniform(35, 45)
            base_price = random.uniform(55, 65)
            
            # Add variation based on vehicle type
            if vehicle['make'].lower() in ['ford', 'nissan']:  # Trucks consume more
                liters = round(base_liters * random.uniform(1.1, 1.3), 2)
            else:  # Sedans/Crossovers
                liters = round(base_liters * random.uniform(0.9, 1.1), 2)
            
            price_per_liter = round(base_price * random.uniform(0.95, 1.05), 2)
            total_cost = round(liters * price_per_liter, 2)
            
            fillup_data = {
                'vehicle_id': vehicle['_id'],
                'user_id': vehicle['user_id'],
                'date': datetime.utcnow() - timedelta(days=i * 7),  # Weekly fill-ups
                'odometer_km': odometer,
                'liters': liters,
                'price_per_liter': price_per_liter,
                'total_cost': total_cost,
                'full_tank': True,
                'notes': f"Regular fill-up #{i+1}",
                'created_at': datetime.utcnow() - timedelta(days=i * 7)
            }
            
            # Calculate fuel economy for full tank fill-ups (except the first one)
            if i > 0:
                prev_odometer = odometer + mileage_step
                distance = prev_odometer - odometer
                if distance > 0:
                    fillup_data['fuel_economy_kmpl'] = round(distance / liters, 2)
                    fillup_data['cost_per_km'] = round(total_cost / distance, 2)
            
            db.fill_ups.insert_one(fillup_data)
            total_fillups += 1
        
        print(f"     📊 {vehicle['make']} {vehicle['model']}: {num_fillups} fill-ups")
    
    print(f"   ✅ Created {total_fillups} total fill-up records")

if __name__ == '__main__':
    success = seed_database()
    if not success:
        sys.exit(1)