#!/usr/bin/env python3
"""
Clear Database Script

This script deletes all current data but keeps the collections in place.
Use this to clear the database while preserving the collection structure.

Usage:
    python clear_database.py
"""

import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def clear_database():
    """Clear all documents from collections but keep the collections"""
    print("🧹 Clearing database (keeping collections)...")
    
    try:
        # Initialize database connection
        mongodb_uri = os.getenv('MONGODB_URI')
        if not mongodb_uri:
            raise ValueError("MONGODB_URI environment variable is not set")
        
        client = MongoClient(mongodb_uri)
        db = client.get_default_database()
        
        print(f"Connected to MongoDB: {client.HOST}:{client.client.PORT}")
        print(f"Database: {db.name}")
        
        collections_to_clear = [
            'users', 'vehicles', 'maintenance_items', 
            'service_records', 'fillups', 'refresh_tokens'
        ]
        
        total_documents_deleted = 0
        
        for collection_name in collections_to_clear:
            if collection_name in db.list_collection_names():
                result = db[collection_name].delete_many({})
                documents_deleted = result.deleted_count
                total_documents_deleted += documents_deleted
                print(f"   ✅ Cleared {documents_deleted:,} documents from '{collection_name}'")
            else:
                print(f"   ⚠️  Collection '{collection_name}' does not exist")
        
        print(f"\n🎉 Database cleared successfully! Total documents deleted: {total_documents_deleted:,}")
        return True
        
    except Exception as e:
        print(f"❌ Error clearing database: {str(e)}")
        return False
    finally:
        if 'client' in locals():
            client.close()
            print("🔌 Database connection closed")

if __name__ == '__main__':
    success = clear_database()
    if not success:
        sys.exit(1)