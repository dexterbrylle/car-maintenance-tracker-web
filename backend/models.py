from datetime import datetime
from bson.objectid import ObjectId
from pymongo import MongoClient
import os

# MongoDB connection (same as in app.py)
client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/maintenance_tracker'))
db = client.get_default_database()

class Vehicle:
    @staticmethod
    def create_vehicle(data):
        vehicle_data = {
            'make': data.get('make'),
            'model': data.get('model'),
            'year': data.get('year'),
            'current_mileage': data.get('current_mileage', 0),
            'purchase_mileage': data.get('purchase_mileage', 0),
            'created_at': datetime.utcnow()
        }
        result = db.vehicles.insert_one(vehicle_data)
        return str(result.inserted_id)
    
    @staticmethod
    def get_all_vehicles():
        return list(db.vehicles.find())
    
    @staticmethod
    def get_vehicle_by_id(vehicle_id):
        return db.vehicles.find_one({'_id': ObjectId(vehicle_id)})
    
    @staticmethod
    def update_vehicle(vehicle_id, data):
        update_data = {k: v for k, v in data.items() if k in ['make', 'model', 'year', 'current_mileage', 'purchase_mileage']}
        result = db.vehicles.update_one(
            {'_id': ObjectId(vehicle_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    @staticmethod
    def delete_vehicle(vehicle_id):
        result = db.vehicles.delete_one({'_id': ObjectId(vehicle_id)})
        return result.deleted_count > 0

class MaintenanceItem:
    @staticmethod
    def create_maintenance_item(data):
        item_data = {
            'name': data.get('name'),
            'category': data.get('category'),
            'interval_km': data.get('interval_km'),
            'description': data.get('description', ''),
            'action': data.get('action', 'Inspect'),
            'vehicle_id': ObjectId(data.get('vehicle_id'))
        }
        result = db.maintenance_items.insert_one(item_data)
        return str(result.inserted_id)
    
    @staticmethod
    def get_maintenance_items_by_vehicle(vehicle_id):
        return list(db.maintenance_items.find({'vehicle_id': ObjectId(vehicle_id)}))
    
    @staticmethod
    def get_maintenance_item_by_id(item_id):
        return db.maintenance_items.find_one({'_id': ObjectId(item_id)})
    
    @staticmethod
    def update_maintenance_item(item_id, data):
        update_data = {k: v for k, v in data.items() if k in ['name', 'category', 'interval_km', 'description', 'action']}
        result = db.maintenance_items.update_one(
            {'_id': ObjectId(item_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    @staticmethod
    def create_default_maintenance_items(vehicle_id):
        # Import the official Mazda CX-5 2016 schedule
        from data.mazda_cx5_2016_philippines import MAZDA_CX5_2016_PHILIPPINES_SCHEDULE
        
        default_items = []
        for item in MAZDA_CX5_2016_PHILIPPINES_SCHEDULE:
            default_items.append({
                'name': item['name'],
                'category': item['category'],
                'interval_km': item['interval_km'],
                'description': item['description'],
                'action': item['action'],
                'vehicle_id': ObjectId(vehicle_id)
            })
        
        result = db.maintenance_items.insert_many(default_items)
        return [str(id) for id in result.inserted_ids]
    
    @staticmethod
    def should_create_mazda_schedule(vehicle_data):
        # Check if vehicle is Mazda CX-5 2014-2017
        make = vehicle_data.get('make', '').lower()
        model = vehicle_data.get('model', '').lower()
        year = vehicle_data.get('year')
        
        return (make == 'mazda' and 
                'cx-5' in model and 
                year and 
                2014 <= year <= 2017)

class ServiceRecord:
    @staticmethod
    def create_service_record(data):
        service_data = {
            'vehicle_id': ObjectId(data.get('vehicle_id')),
            'maintenance_item_id': ObjectId(data.get('maintenance_item_id')),
            'date': data.get('date'),
            'mileage': data.get('mileage'),
            'cost': data.get('cost', 0),
            'notes': data.get('notes', ''),
            'created_at': datetime.utcnow()
        }
        result = db.service_records.insert_one(service_data)
        return str(result.inserted_id)
    
    @staticmethod
    def get_service_records_by_vehicle(vehicle_id):
        return list(db.service_records.find({'vehicle_id': ObjectId(vehicle_id)}))
    
    @staticmethod
    def get_service_record_by_id(service_id):
        return db.service_records.find_one({'_id': ObjectId(service_id)})
    
    @staticmethod
    def update_service_record(service_id, data):
        update_data = {k: v for k, v in data.items() if k in ['date', 'mileage', 'cost', 'notes', 'maintenance_item_id']}
        result = db.service_records.update_one(
            {'_id': ObjectId(service_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    @staticmethod
    def delete_service_record(service_id):
        result = db.service_records.delete_one({'_id': ObjectId(service_id)})
        return result.deleted_count > 0