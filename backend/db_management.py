#!/usr/bin/env python3
"""
Database Management Scripts for Car Maintenance Tracker

This script provides utilities for managing the MongoDB database including:
- Population with service records
- Data clearing while preserving collections
- Seeding with test data
- Multi-tenant architecture support

Usage:
    python db_management.py populate      # Populate with service records
    python db_management.py clear         # Clear all data but keep collections
    python db_management.py seed          # Seed with test data
    python db_management.py <command>     # Show help
"""

import os
import sys
import argparse
from datetime import datetime, timedelta
from pymongo import MongoClient
from bson.objectid import ObjectId
import bcrypt
import secrets
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import from existing modules
try:
    from models import User, Vehicle, MaintenanceItem, ServiceRecord, FillUp
    from auth import hash_password  # Use the auth module's hash function
except ImportError as e:
    print(f"Warning: Could not import some modules: {e}")
    print("This script may not work properly without the full application context.")

class DatabaseManager:
    """Database management utilities for Car Maintenance Tracker"""
    
    def __init__(self):
        """Initialize database connection using same configuration as app.py"""
        self.mongodb_uri = os.getenv('MONGODB_URI')
        if not self.mongodb_uri:
            raise ValueError("MONGODB_URI environment variable is not set")
        
        self.client = MongoClient(self.mongodb_uri)
        self.db = self.client.get_default_database()
        
        print(f"Connected to MongoDB: {self.client.HOST}:{self.client.PORT}")
        print(f"Database: {self.db.name}")
    
    def populate_service_records(self):
        """Populate database with service records for vehicles"""
        print("🔧 Populating database with service records...")
        
        try:
            # Get all vehicles
            vehicles = list(self.db.vehicles.find())
            if not vehicles:
                print("❌ No vehicles found. Please add vehicles first.")
                return False
            
            total_services_created = 0
            
            for vehicle in vehicles:
                print(f"\n📋 Processing vehicle: {vehicle['make']} {vehicle['model']} ({vehicle['year']})")
                
                # Get or create maintenance items for this vehicle
                maintenance_items = self._get_or_create_maintenance_items(vehicle)
                
                # Create service records based on vehicle's current mileage
                services_created = self._create_service_records(vehicle, maintenance_items)
                total_services_created += services_created
                
                print(f"   ✅ Created {services_created} service records")
                
                # Update vehicle's current mileage to reflect services
                self._update_vehicle_mileage(vehicle, services_created)
            
            print(f"\n🎉 Successfully populated {total_services_created} service records across {len(vehicles)} vehicles")
            return True
            
        except Exception as e:
            print(f"❌ Error populating service records: {str(e)}")
            return False
    
    def _get_or_create_maintenance_items(self, vehicle):
        """Get or create maintenance items for a vehicle"""
        existing_items = list(self.db.maintenance_items.find({'vehicle_id': vehicle['_id']}))
        
        if existing_items:
            return existing_items
        
        # Create maintenance items based on vehicle type
        items = self._create_maintenance_schedule(vehicle)
        
        # Add user_id for multi-tenant support
        for item in items:
            item['vehicle_id'] = vehicle['_id']
            if 'user_id' in vehicle:
                item['user_id'] = vehicle['user_id']
        
        result = self.db.maintenance_items.insert_many(items)
        print(f"   📝 Created {len(result.inserted_ids)} maintenance items")
        
        return list(self.db.maintenance_items.find({'vehicle_id': vehicle['_id']}))
    
    def _create_maintenance_schedule(self, vehicle):
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
    
    def _create_service_records(self, vehicle, maintenance_items):
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
                existing = self.db.service_records.find_one({
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
                import random
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
                
                self.db.service_records.insert_one(service_record)
                services_created += 1
        
        return services_created
    
    def _update_vehicle_mileage(self, vehicle, services_created):
        """Update vehicle mileage to reflect realistic usage"""
        if services_created > 0:
            # Add some mileage to account for recent usage
            additional_mileage = services_created * 100  # 100km per service
            new_mileage = vehicle.get('current_mileage', 0) + additional_mileage
            
            self.db.vehicles.update_one(
                {'_id': vehicle['_id']},
                {'$set': {'current_mileage': new_mileage}}
            )
    
    def clear_database(self):
        """Clear all documents from collections but keep the collections"""
        print("🧹 Clearing database (keeping collections)...")
        
        try:
            collections_to_clear = [
                'users', 'vehicles', 'maintenance_items', 
                'service_records', 'fillups', 'refresh_tokens'
            ]
            
            for collection_name in collections_to_clear:
                if collection_name in self.db.list_collection_names():
                    result = self.db[collection_name].delete_many({})
                    print(f"   ✅ Cleared {result.deleted_count} documents from '{collection_name}'")
                else:
                    print(f"   ⚠️  Collection '{collection_name}' does not exist")
            
            print("\n🎉 Database cleared successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Error clearing database: {str(e)}")
            return False
    
    def seed_database(self):
        """Seed database with test data including test user and sample vehicles"""
        print("🌱 Seeding database with test data...")
        
        try:
            # Clear existing data first
            self.clear_database()
            
            # Create test user
            test_user = self._create_test_user()
            if not test_user:
                return False
            
            # Create sample vehicles for the test user
            vehicles = self._create_sample_vehicles(test_user['_id'])
            
            # Create sample fill-ups for fuel tracking
            self._create_sample_fillups(vehicles)
            
            print("\n🎉 Database seeded successfully!")
            print(f"   👤 Test user: {test_user['email']} / pass123!")
            print(f"   🚗 Created {len(vehicles)} sample vehicles")
            
            return True
            
        except Exception as e:
            print(f"❌ Error seeding database: {str(e)}")
            return False
    
    def _create_test_user(self):
        """Create test user account"""
        print("   👤 Creating test user...")
        
        # Check if user already exists
        existing = self.db.users.find_one({'email': 'test1@gmail.com'})
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
        
        result = self.db.users.insert_one(user_data)
        user_data['_id'] = result.inserted_id
        
        print(f"   ✅ Created test user: {user_data['email']}")
        return user_data
    
    def _create_sample_vehicles(self, user_id):
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
            }
        ]
        
        vehicles = []
        for vehicle_data in sample_vehicles:
            result = self.db.vehicles.insert_one(vehicle_data)
            vehicle_data['_id'] = result.inserted_id
            vehicles.append(vehicle_data)
            print(f"   ✅ Created {vehicle_data['make']} {vehicle_data['model']} ({vehicle_data['year']})")
        
        return vehicles
    
    def _create_sample_fillups(self, vehicles):
        """Create sample fill-up records for fuel tracking"""
        print("   ⛽ Creating sample fill-up records...")
        
        import random
        
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
                
                # Random fuel data
                liters = round(random.uniform(35, 45), 2)
                price_per_liter = round(random.uniform(55, 65), 2)
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
                
                self.db.fill_ups.insert_one(fillup_data)
                total_fillups += 1
        
        print(f"   ✅ Created {total_fillups} fill-up records")
    
    def show_stats(self):
        """Show database statistics"""
        print("📊 Database Statistics:")
        
        try:
            collections = ['users', 'vehicles', 'maintenance_items', 'service_records', 'fillups', 'refresh_tokens']
            
            for collection_name in collections:
                if collection_name in self.db.list_collection_names():
                    count = self.db[collection_name].count_documents({})
                    print(f"   {collection_name}: {count:,} documents")
                else:
                    print(f"   {collection_name}: 0 documents (collection doesn't exist)")
            
            # Show additional stats
            if self.db.vehicles.count_documents({}) > 0:
                makes = self.db.vehicles.distinct('make')
                print(f"   Vehicle makes: {', '.join(makes)}")
            
            if self.db.users.count_documents({}) > 0:
                verified_users = self.db.users.count_documents({'is_verified': True})
                print(f"   Verified users: {verified_users}")
                
        except Exception as e:
            print(f"   ❌ Error getting stats: {str(e)}")
    
    def close(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            print("🔌 Database connection closed")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Database Management Utilities for Car Maintenance Tracker',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python db_management.py seed          # Seed database with test data
  python db_management.py populate      # Populate with service records
  python db_management.py clear         # Clear all data but keep collections
  python db_management.py stats         # Show database statistics
        """
    )
    
    parser.add_argument(
        'command',
        choices=['populate', 'clear', 'seed', 'stats'],
        help='Command to execute'
    )
    
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Enable verbose output'
    )
    
    args = parser.parse_args()
    
    # Initialize database manager
    try:
        db_manager = DatabaseManager()
    except Exception as e:
        print(f"❌ Failed to connect to database: {str(e)}")
        sys.exit(1)
    
    # Execute command
    success = False
    
    try:
        if args.command == 'populate':
            success = db_manager.populate_service_records()
        elif args.command == 'clear':
            success = db_manager.clear_database()
        elif args.command == 'seed':
            success = db_manager.seed_database()
        elif args.command == 'stats':
            db_manager.show_stats()
            success = True
        
        if args.command != 'stats':
            if success:
                print(f"\n✅ Command '{args.command}' completed successfully!")
            else:
                print(f"\n❌ Command '{args.command}' failed!")
                sys.exit(1)
    
    except KeyboardInterrupt:
        print("\n\n⚠️  Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)
    
    finally:
        db_manager.close()


if __name__ == '__main__':
    main()