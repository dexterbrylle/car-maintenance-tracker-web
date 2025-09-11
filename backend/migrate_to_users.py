#!/usr/bin/env python3
"""
Migration script to add user_id to existing vehicles collection
This script should be run after the authentication system is implemented
"""

import os
import sys
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime

# Add the current directory to the path to import models
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def migrate_vehicles_to_user_system():
    """Migrate existing vehicles to user-based system"""
    
    # Connect to MongoDB
    client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/maintenance_tracker'))
    db = client.get_default_database()
    
    print("Starting migration of vehicles to user-based system...")
    
    # Check if vehicles collection exists
    vehicles_collection = db.vehicles
    if vehicles_collection.count_documents({}) == 0:
        print("No vehicles found in database. Migration not needed.")
        return
    
    # Check if vehicles already have user_id
    vehicles_without_user = list(vehicles_collection.find({"user_id": {"$exists": False}}))
    
    if not vehicles_without_user:
        print("All vehicles already have user_id. Migration not needed.")
        return
    
    print(f"Found {len(vehicles_without_user)} vehicles without user_id")
    
    # Create a default admin user for migration
    admin_email = "admin@cartracker.local"
    admin_password = "AdminPassword123!"  # Change this immediately
    
    # Check if admin user exists
    admin_user = db.users.find_one({"email": admin_email})
    
    if not admin_user:
        print("Creating admin user for migration...")
        from models import User
        try:
            admin_data = {
                "email": admin_email,
                "password": admin_password,
                "first_name": "System",
                "last_name": "Administrator",
                "is_admin": True,
                "is_verified": True
            }
            admin_id = User.create_user(admin_data)
            
            # Update admin status
            db.users.update_one(
                {"_id": ObjectId(admin_id)},
                {"$set": {"is_admin": True, "is_verified": True}}
            )
            
            admin_user = db.users.find_one({"_id": ObjectId(admin_id)})
            print(f"Created admin user with ID: {admin_id}")
            
        except Exception as e:
            print(f"Error creating admin user: {e}")
            return
    
    print(f"Using admin user: {admin_user['email']} (ID: {admin_user['_id']})")
    
    # Migrate vehicles to admin user
    admin_user_id = admin_user['_id']
    migrated_count = 0
    
    for vehicle in vehicles_without_user:
        try:
            # Add user_id to vehicle
            result = vehicles_collection.update_one(
                {"_id": vehicle["_id"]},
                {"$set": {
                    "user_id": admin_user_id,
                    "migrated_at": datetime.utcnow()
                }}
            )
            
            if result.modified_count > 0:
                migrated_count += 1
                print(f"Migrated vehicle: {vehicle.get('make', 'Unknown')} {vehicle.get('model', 'Unknown')} ({vehicle['_id']})")
                
        except Exception as e:
            print(f"Error migrating vehicle {vehicle['_id']}: {e}")
    
    print(f"Migration completed. Migrated {migrated_count} vehicles to admin user.")
    
    # Create migration log
    migration_log = {
        "migration_type": "vehicles_to_user_system",
        "admin_user_id": admin_user_id,
        "admin_email": admin_email,
        "migrated_vehicles": migrated_count,
        "migration_date": datetime.utcnow(),
        "notes": "Migrated existing vehicles to admin user account"
    }
    
    db.migration_logs.insert_one(migration_log)
    print("Migration log created.")
    
    print("\nIMPORTANT SECURITY NOTES:")
    print(f"1. Admin user created: {admin_email}")
    print("2. Change the admin password immediately!")
    print("3. All existing vehicles have been assigned to this admin user.")
    print("4. You should create proper user accounts and reassign vehicles as needed.")
    print("5. Remove the admin user or change its password after proper user setup.")

def migrate_other_collections():
    """Migrate other collections (maintenance_items, service_records, fillups) to include user_id"""
    
    client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/maintenance_tracker'))
    db = client.get_default_database()
    
    print("\nStarting migration of other collections...")
    
    # Get admin user
    admin_user = db.users.find_one({"email": "admin@cartracker.local"})
    if not admin_user:
        print("Admin user not found. Please run vehicles migration first.")
        return
    
    admin_user_id = admin_user['_id']
    
    collections_to_migrate = [
        ("maintenance_items", "vehicle_id"),
        ("service_records", "vehicle_id"),
        ("fill_ups", "vehicle_id")
    ]
    
    for collection_name, foreign_key in collections_to_migrate:
        collection = db[collection_name]
        print(f"\nMigrating {collection_name}...")
        
        # Find documents without user_id
        docs_without_user = list(collection.find({"user_id": {"$exists": False}}))
        
        if not docs_without_user:
            print(f"No {collection_name} found without user_id.")
            continue
        
        print(f"Found {len(docs_without_user)} {collection_name} without user_id")
        
        migrated_count = 0
        
        for doc in docs_without_user:
            try:
                # Get the vehicle to find the user_id
                vehicle_id = doc.get(foreign_key)
                if vehicle_id:
                    vehicle = db.vehicles.find_one({"_id": vehicle_id})
                    if vehicle and "user_id" in vehicle:
                        # Use vehicle's user_id
                        user_id = vehicle["user_id"]
                    else:
                        # Use admin user_id
                        user_id = admin_user_id
                    
                    # Add user_id to document
                    result = collection.update_one(
                        {"_id": doc["_id"]},
                        {"$set": {
                            "user_id": user_id,
                            "migrated_at": datetime.utcnow()
                        }}
                    )
                    
                    if result.modified_count > 0:
                        migrated_count += 1
                        
            except Exception as e:
                print(f"Error migrating {collection_name} {doc['_id']}: {e}")
        
        print(f"Migrated {migrated_count} {collection_name}")
    
    print("\nMigration of other collections completed.")

def validate_migration():
    """Validate that migration was successful"""
    
    client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/maintenance_tracker'))
    db = client.get_default_database()
    
    print("\nValidating migration...")
    
    collections_to_check = ["vehicles", "maintenance_items", "service_records", "fill_ups"]
    
    for collection_name in collections_to_check:
        collection = db[collection_name]
        total_docs = collection.count_documents({})
        docs_without_user = collection.count_documents({"user_id": {"$exists": False}})
        
        print(f"{collection_name}:")
        print(f"  Total documents: {total_docs}")
        print(f"  Documents without user_id: {docs_without_user}")
        
        if docs_without_user > 0:
            print(f"  WARNING: {docs_without_user} documents still need migration!")
        else:
            print(f"  ✓ All documents have user_id")
    
    print("\nMigration validation completed.")

def rollback_migration():
    """Rollback migration (remove user_id from all collections)"""
    
    client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/maintenance_tracker'))
    db = client.get_default_database()
    
    print("\nRolling back migration...")
    
    collections_to_rollback = ["vehicles", "maintenance_items", "service_records", "fill_ups"]
    
    for collection_name in collections_to_rollback:
        collection = db[collection_name]
        
        result = collection.update_many(
            {"user_id": {"$exists": True}},
            {"$unset": {"user_id": "", "migrated_at": ""}}
        )
        
        print(f"Rolled back {result.modified_count} documents in {collection_name}")
    
    print("\nMigration rollback completed.")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Migrate existing data to user-based system")
    parser.add_argument("--action", choices=["migrate", "validate", "rollback"], 
                       default="migrate", help="Action to perform")
    
    args = parser.parse_args()
    
    if args.action == "migrate":
        migrate_vehicles_to_user_system()
        migrate_other_collections()
    elif args.action == "validate":
        validate_migration()
    elif args.action == "rollback":
        rollback_migration()