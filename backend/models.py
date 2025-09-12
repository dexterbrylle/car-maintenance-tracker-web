from datetime import datetime, timedelta
from bson.objectid import ObjectId
from pymongo import MongoClient
import os
import secrets
import re
import bcrypt
from email_validator import validate_email as email_validate, EmailNotValidError

# MongoDB connection (same as in app.py)
MONGODB_URI = os.getenv('MONGODB_URI')
client = MongoClient(MONGODB_URI)

# Extract database name from URI or use default
from urllib.parse import urlparse
parsed_uri = urlparse(MONGODB_URI)
db_name = parsed_uri.path[1:] if parsed_uri.path else 'maintenance_tracker'
db = client[db_name]

class Vehicle:
    @staticmethod
    def _safe_object_id(id_str):
        """Safely convert string to ObjectId, return None if invalid"""
        try:
            return ObjectId(id_str) if id_str else None
        except Exception:
            return None
    
    @staticmethod
    def create_vehicle(data):
        user_id = Vehicle._safe_object_id(data.get('user_id'))
        if not user_id:
            raise ValueError('Invalid user ID')
            
        vehicle_data = {
            'make': data.get('make'),
            'model': data.get('model'),
            'year': data.get('year'),
            'current_mileage': data.get('current_mileage', 0),
            'purchase_mileage': data.get('purchase_mileage', 0),
            'user_id': user_id,
            'created_at': datetime.utcnow()
        }
        result = db.vehicles.insert_one(vehicle_data)
        return str(result.inserted_id)
    
    @staticmethod
    def get_all_vehicles(user_id=None):
        """Get all vehicles for a user or all vehicles (for admin)"""
        if user_id:
            user_object_id = Vehicle._safe_object_id(user_id)
            if user_object_id:
                return list(db.vehicles.find({'user_id': user_object_id}))
            else:
                # If user_id is not a valid ObjectId, return empty list
                return []
        return list(db.vehicles.find())
    
    @staticmethod
    def get_vehicle_by_id(vehicle_id, user_id=None):
        """Get vehicle by ID with optional user verification"""
        vehicle_object_id = Vehicle._safe_object_id(vehicle_id)
        if not vehicle_object_id:
            return None
            
        query = {'_id': vehicle_object_id}
        if user_id:
            user_object_id = Vehicle._safe_object_id(user_id)
            if user_object_id:
                query['user_id'] = user_object_id
            else:
                return None
        return db.vehicles.find_one(query)
    
    @staticmethod
    def update_vehicle(vehicle_id, data, user_id=None):
        """Update vehicle with optional user verification"""
        vehicle_object_id = Vehicle._safe_object_id(vehicle_id)
        if not vehicle_object_id:
            return False
            
        update_data = {k: v for k, v in data.items() if k in ['make', 'model', 'year', 'current_mileage', 'purchase_mileage']}
        query = {'_id': vehicle_object_id}
        if user_id:
            user_object_id = Vehicle._safe_object_id(user_id)
            if user_object_id:
                query['user_id'] = user_object_id
            else:
                return False
        
        result = db.vehicles.update_one(
            query,
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    @staticmethod
    def delete_vehicle(vehicle_id, user_id=None):
        """Delete vehicle with optional user verification"""
        vehicle_object_id = Vehicle._safe_object_id(vehicle_id)
        if not vehicle_object_id:
            return False
            
        query = {'_id': vehicle_object_id}
        if user_id:
            user_object_id = Vehicle._safe_object_id(user_id)
            if user_object_id:
                query['user_id'] = user_object_id
            else:
                return False
        
        result = db.vehicles.delete_one(query)
        return result.deleted_count > 0

class MaintenanceItem:
    @staticmethod
    def _safe_object_id(id_str):
        """Safely convert string to ObjectId, return None if invalid"""
        try:
            return ObjectId(id_str) if id_str else None
        except Exception:
            return None
    
    @staticmethod
    def create_maintenance_item(data):
        vehicle_id = MaintenanceItem._safe_object_id(data.get('vehicle_id'))
        if not vehicle_id:
            raise ValueError('Invalid vehicle ID')
            
        item_data = {
            'name': data.get('name'),
            'category': data.get('category'),
            'interval_km': data.get('interval_km'),
            'description': data.get('description', ''),
            'action': data.get('action', 'Inspect'),
            'vehicle_id': vehicle_id
        }
        result = db.maintenance_items.insert_one(item_data)
        return str(result.inserted_id)
    
    @staticmethod
    def get_maintenance_items_by_vehicle(vehicle_id):
        vehicle_object_id = MaintenanceItem._safe_object_id(vehicle_id)
        if not vehicle_object_id:
            return []
        return list(db.maintenance_items.find({'vehicle_id': vehicle_object_id}))
    
    @staticmethod
    def get_maintenance_item_by_id(item_id):
        item_object_id = MaintenanceItem._safe_object_id(item_id)
        if not item_object_id:
            return None
        return db.maintenance_items.find_one({'_id': item_object_id})
    
    @staticmethod
    def update_maintenance_item(item_id, data):
        item_object_id = MaintenanceItem._safe_object_id(item_id)
        if not item_object_id:
            return False
            
        update_data = {k: v for k, v in data.items() if k in ['name', 'category', 'interval_km', 'description', 'action']}
        result = db.maintenance_items.update_one(
            {'_id': item_object_id},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    @staticmethod
    def create_default_maintenance_items(vehicle_id):
        vehicle_object_id = MaintenanceItem._safe_object_id(vehicle_id)
        if not vehicle_object_id:
            raise ValueError('Invalid vehicle ID')
            
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
                'vehicle_id': vehicle_object_id
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
    def _safe_object_id(id_str):
        """Safely convert string to ObjectId, return None if invalid"""
        try:
            return ObjectId(id_str) if id_str else None
        except Exception:
            return None
    
    @staticmethod
    def create_service_record(data):
        vehicle_id = ServiceRecord._safe_object_id(data.get('vehicle_id'))
        maintenance_item_id = ServiceRecord._safe_object_id(data.get('maintenance_item_id'))
        
        if not vehicle_id:
            raise ValueError('Invalid vehicle ID')
        if not maintenance_item_id:
            raise ValueError('Invalid maintenance item ID')
            
        service_data = {
            'vehicle_id': vehicle_id,
            'maintenance_item_id': maintenance_item_id,
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
        vehicle_object_id = ServiceRecord._safe_object_id(vehicle_id)
        if not vehicle_object_id:
            return []
        return list(db.service_records.find({'vehicle_id': vehicle_object_id}))
    
    @staticmethod
    def get_service_record_by_id(service_id):
        service_object_id = ServiceRecord._safe_object_id(service_id)
        if not service_object_id:
            return None
        return db.service_records.find_one({'_id': service_object_id})
    
    @staticmethod
    def update_service_record(service_id, data):
        service_object_id = ServiceRecord._safe_object_id(service_id)
        if not service_object_id:
            return False
            
        update_data = {k: v for k, v in data.items() if k in ['date', 'mileage', 'cost', 'notes', 'maintenance_item_id']}
        result = db.service_records.update_one(
            {'_id': service_object_id},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    @staticmethod
    def delete_service_record(service_id):
        service_object_id = ServiceRecord._safe_object_id(service_id)
        if not service_object_id:
            return False
        result = db.service_records.delete_one({'_id': service_object_id})
        return result.deleted_count > 0

class FillUp:
    @staticmethod
    def create_fillup(data):
        fillup_data = {
            'vehicle_id': ObjectId(data.get('vehicle_id')),
            'date': data.get('date'),
            'odometer_km': data.get('odometer_km'),
            'liters': data.get('liters'),
            'price_per_liter': data.get('price_per_liter'),
            'total_cost': data.get('total_cost', 0),
            'full_tank': data.get('full_tank', True),
            'notes': data.get('notes', ''),
            'created_at': datetime.utcnow()
        }
        
        # Calculate fuel economy if this is a full tank fill-up
        if fillup_data['full_tank']:
            previous_fillup = FillUp.get_previous_full_tank_fillup(
                data.get('vehicle_id'), 
                data.get('odometer_km')
            )
            if previous_fillup:
                distance = fillup_data['odometer_km'] - previous_fillup['odometer_km']
                if distance > 0 and fillup_data['liters'] > 0:
                    fillup_data['fuel_economy_kmpl'] = round(distance / fillup_data['liters'], 2)
                    fillup_data['cost_per_km'] = round(fillup_data['total_cost'] / distance, 2)
        
        result = db.fill_ups.insert_one(fillup_data)
        return str(result.inserted_id)
    
    @staticmethod
    def get_fillups_by_vehicle(vehicle_id, limit=None, offset=0):
        query = {'vehicle_id': ObjectId(vehicle_id)}
        cursor = db.fill_ups.find(query).sort('date', -1)
        if limit:
            cursor = cursor.limit(limit)
        if offset:
            cursor = cursor.skip(offset)
        return list(cursor)
    
    @staticmethod
    def get_fillup_by_id(fillup_id):
        return db.fill_ups.find_one({'_id': ObjectId(fillup_id)})
    
    @staticmethod
    def update_fillup(fillup_id, data):
        update_data = {k: v for k, v in data.items() if k in [
            'date', 'odometer_km', 'liters', 'price_per_liter', 
            'total_cost', 'full_tank', 'notes'
        ]}
        
        # Get the fillup to check if we need to recalculate fuel economy
        fillup = FillUp.get_fillup_by_id(fillup_id)
        if not fillup:
            return False
        
        # Recalculate fuel economy if full_tank status or odometer changed
        if 'full_tank' in update_data or 'odometer_km' in update_data or 'liters' in update_data:
            if update_data.get('full_tank', fillup.get('full_tank', True)):
                previous_fillup = FillUp.get_previous_full_tank_fillup(
                    str(fillup['vehicle_id']), 
                    update_data.get('odometer_km', fillup['odometer_km'])
                )
                if previous_fillup:
                    distance = update_data.get('odometer_km', fillup['odometer_km']) - previous_fillup['odometer_km']
                    liters = update_data.get('liters', fillup['liters'])
                    if distance > 0 and liters > 0:
                        update_data['fuel_economy_kmpl'] = round(distance / liters, 2)
                        update_data['cost_per_km'] = round(update_data.get('total_cost', fillup['total_cost']) / distance, 2)
        
        result = db.fill_ups.update_one(
            {'_id': ObjectId(fillup_id)},
            {'$set': update_data}
        )
        
        # Recalculate subsequent fill-ups if this affects their fuel economy
        if result.modified_count > 0 and ('full_tank' in update_data or 'odometer_km' in update_data):
            FillUp.recalculate_subsequent_fillups(str(fillup['vehicle_id']), fillup['odometer_km'])
        
        return result.modified_count > 0
    
    @staticmethod
    def delete_fillup(fillup_id):
        fillup = FillUp.get_fillup_by_id(fillup_id)
        if not fillup:
            return False
        
        result = db.fill_ups.delete_one({'_id': ObjectId(fillup_id)})
        
        # Recalculate subsequent fill-ups if this was a full tank fill-up
        if result.deleted_count > 0 and fillup.get('full_tank'):
            FillUp.recalculate_subsequent_fillups(str(fillup['vehicle_id']), fillup['odometer_km'])
        
        return result.deleted_count > 0
    
    @staticmethod
    def get_previous_full_tank_fillup(vehicle_id, current_odometer):
        return db.fill_ups.find_one({
            'vehicle_id': ObjectId(vehicle_id),
            'full_tank': True,
            'odometer_km': {'$lt': current_odometer}
        }, sort=[('odometer_km', -1)])
    
    @staticmethod
    def recalculate_subsequent_fillups(vehicle_id, from_odometer):
        # Get all fill-ups after the specified odometer reading
        subsequent_fillups = list(db.fill_ups.find({
            'vehicle_id': ObjectId(vehicle_id),
            'odometer_km': {'$gt': from_odometer}
        }).sort('odometer_km', 1))
        
        for fillup in subsequent_fillups:
            if fillup.get('full_tank'):
                previous_fillup = FillUp.get_previous_full_tank_fillup(vehicle_id, fillup['odometer_km'])
                if previous_fillup:
                    distance = fillup['odometer_km'] - previous_fillup['odometer_km']
                    liters = fillup['liters']
                    if distance > 0 and liters > 0:
                        db.fill_ups.update_one(
                            {'_id': fillup['_id']},
                            {'$set': {
                                'fuel_economy_kmpl': round(distance / liters, 2),
                                'cost_per_km': round(fillup['total_cost'] / distance, 2)
                            }}
                        )
    
    @staticmethod
    def get_fuel_stats(vehicle_id):
        fillups = FillUp.get_fillups_by_vehicle(vehicle_id)
        
        if not fillups:
            return None
        
        # Calculate aggregate statistics
        economies = [f['fuel_economy_kmpl'] for f in fillups if f.get('fuel_economy_kmpl')]
        costs_per_km = [f['cost_per_km'] for f in fillups if f.get('cost_per_km')]
        
        current_year = datetime.now().year
        ytd_cost = sum(f['total_cost'] for f in fillups 
                      if f['date'] and isinstance(f['date'], (datetime, str)) and 
                      (datetime.fromisoformat(f['date'].replace('Z', '+00:00')) if isinstance(f['date'], str) else f['date']).year == current_year)
        
        return {
            'avg_fuel_economy': round(sum(economies) / len(economies), 2) if economies else None,
            'best_fuel_economy': max(economies) if economies else None,
            'worst_fuel_economy': min(economies) if economies else None,
            'avg_cost_per_km': round(sum(costs_per_km) / len(costs_per_km), 2) if costs_per_km else None,
            'total_fuel_cost_ytd': ytd_cost,
            'total_fillups': len(fillups),
            'last_fillup_date': max(f['date'] for f in fillups if f['date']) if fillups else None
        }

class User:
    @staticmethod
    def hash_password(password):
        """Hash password using bcrypt with rounds=12"""
        if not User.validate_password(password):
            raise ValueError('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character')
        
        salt = bcrypt.gensalt(rounds=12)
        return bcrypt.hashpw(password.encode('utf-8'), salt)
    
    @staticmethod
    def verify_password(password, password_hash):
        """Verify password against bcrypt hash"""
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
    
    @staticmethod
    def create_user(data):
        """Create a new user with bcrypt password hashing and proper schema"""
        # Validate email format
        if not User.validate_email(data.get('email', '')):
            raise ValueError('Invalid email format')
        
        # Check if user already exists
        existing_user = db.users.find_one({'email': data.get('email')})
        if existing_user:
            raise ValueError('User with this email already exists')
        
        user_data = {
            'email': data.get('email').lower().strip(),
            'password_hash': User.hash_password(data.get('password')).decode('utf-8'),
            'first_name': data.get('first_name', '').strip(),
            'last_name': data.get('last_name', '').strip(),
            'phone': data.get('phone', '').strip(),
            'subscription_tier': data.get('subscription_tier', 'free'),  # free, personal, family, business
            'is_verified': False,
            'is_active': True,
            'verification_token': secrets.token_urlsafe(32),
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
        return str(result.inserted_id)
    
    @staticmethod
    def authenticate_user(email, password):
        """Authenticate user with rate limiting and account lockout"""
        user = db.users.find_one({'email': email.lower().strip()})
        
        if not user:
            return None
        
        # Check if account is locked
        if user.get('locked_until') and user['locked_until'] > datetime.utcnow():
            return None
        
        # Check if account is active
        if not user.get('is_active', True):
            return None
        
        # Verify password using bcrypt
        if User.verify_password(password, user['password_hash']):
            # Reset login attempts on successful login
            db.users.update_one(
                {'_id': user['_id']},
                {'$set': {
                    'login_attempts': 0,
                    'locked_until': None,
                    'last_login': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }}
            )
            return user
        else:
            # Increment login attempts
            attempts = user.get('login_attempts', 0) + 1
            update_data = {
                'login_attempts': attempts,
                'updated_at': datetime.utcnow()
            }
            
            # Lock account after 5 failed attempts
            if attempts >= 5:
                update_data['locked_until'] = datetime.utcnow() + timedelta(minutes=30)
            
            db.users.update_one(
                {'_id': user['_id']},
                {'$set': update_data}
            )
            return None
    
    @staticmethod
    def get_user_by_id(user_id):
        """Get user by ID, excluding sensitive data"""
        user = db.users.find_one(
            {'_id': ObjectId(user_id)},
            projection={
                'password_hash': 0,
                'verification_token': 0,
                'password_reset_token': 0
            }
        )
        return user
    
    @staticmethod
    def get_user_by_email(email):
        """Get user by email, excluding sensitive data"""
        user = db.users.find_one(
            {'email': email.lower().strip()},
            projection={
                'password_hash': 0,
                'verification_token': 0,
                'password_reset_token': 0
            }
        )
        return user
    
    @staticmethod
    def update_user(user_id, data):
        """Update user profile"""
        allowed_fields = ['first_name', 'last_name', 'preferences']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        if update_data:
            update_data['updated_at'] = datetime.utcnow()
            result = db.users.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': update_data}
            )
            return result.modified_count > 0
        return False
    
    @staticmethod
    def update_subscription(user_id, tier, expires=None):
        """Update user subscription tier"""
        update_data = {
            'subscription_tier': tier,
            'updated_at': datetime.utcnow()
        }
        
        if expires:
            update_data['subscription_expires'] = expires
        
        result = db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    @staticmethod
    def set_password_reset_token(user_id):
        """Generate and store password reset token"""
        token = secrets.token_urlsafe(32)
        expires = datetime.utcnow() + timedelta(hours=1)  # 1 hour expiry
        
        result = db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {
                'password_reset_token': token,
                'password_reset_expires': expires,
                'updated_at': datetime.utcnow()
            }}
        )
        
        if result.modified_count > 0:
            return token
        return None
    
    @staticmethod
    def reset_password(user_id, new_password):
        """Reset user password"""
        if not User.validate_password(new_password):
            raise ValueError('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character')
        
        result = db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {
                'password_hash': User.hash_password(new_password).decode('utf-8'),
                'password_reset_token': None,
                'password_reset_expires': None,
                'login_attempts': 0,
                'locked_until': None,
                'updated_at': datetime.utcnow()
            }}
        )
        return result.modified_count > 0
    
    @staticmethod
    def verify_email(user_id, token):
        """Verify user email address"""
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user or user.get('verification_token') != token:
            return False
        
        result = db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {
                'is_verified': True,
                'verification_token': None,
                'updated_at': datetime.utcnow()
            }}
        )
        return result.modified_count > 0
    
    @staticmethod
    def validate_email(email):
        """Validate email format using email-validator"""
        try:
            email_validate(email, check_deliverability=False)
            return True
        except EmailNotValidError:
            return False
    
    @staticmethod
    def validate_password(password):
        """Validate password strength"""
        if len(password) < 8:
            return False
        
        # Check for uppercase, lowercase, number, and special character
        has_upper = any(c.isupper() for c in password)
        has_lower = any(c.islower() for c in password)
        has_number = any(c.isdigit() for c in password)
        has_special = any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in password)
        
        return has_upper and has_lower and has_number and has_special
    
    @staticmethod
    def check_subscription_limits(user):
        """Check if user has reached subscription limits"""
        tier = user.get('subscription_tier', 'free')
        
        limits = {
            'free': {'max_vehicles': 3, 'max_records_per_vehicle': 100},
            'premium': {'max_vehicles': 10, 'max_records_per_vehicle': 500},
            'enterprise': {'max_vehicles': -1, 'max_records_per_vehicle': -1}  # unlimited
        }
        
        return limits.get(tier, limits['free'])

class RefreshToken:
    @staticmethod
    def create_refresh_token(user_id):
        """Create a new refresh token"""
        token = secrets.token_urlsafe(64)
        expires = datetime.utcnow() + timedelta(days=7)  # 7 days expiry
        
        # Delete existing tokens for this user
        db.refresh_tokens.delete_many({'user_id': ObjectId(user_id)})
        
        token_data = {
            'user_id': ObjectId(user_id),
            'token': token,
            'expires': expires,
            'created_at': datetime.utcnow(),
            'is_revoked': False
        }
        
        result = db.refresh_tokens.insert_one(token_data)
        return token if result.inserted_id else None
    
    @staticmethod
    def get_refresh_token(token):
        """Get refresh token by token string"""
        return db.refresh_tokens.find_one({
            'token': token,
            'is_revoked': False,
            'expires': {'$gt': datetime.utcnow()}
        })
    
    @staticmethod
    def revoke_refresh_token(token):
        """Revoke a refresh token"""
        result = db.refresh_tokens.update_one(
            {'token': token},
            {'$set': {
                'is_revoked': True,
                'updated_at': datetime.utcnow()
            }}
        )
        return result.modified_count > 0
    
    @staticmethod
    def revoke_all_user_tokens(user_id):
        """Revoke all refresh tokens for a user"""
        result = db.refresh_tokens.update_many(
            {'user_id': ObjectId(user_id)},
            {'$set': {
                'is_revoked': True,
                'updated_at': datetime.utcnow()
            }}
        )
        return result.modified_count
    
    @staticmethod
    def cleanup_expired_tokens():
        """Clean up expired refresh tokens"""
        result = db.refresh_tokens.delete_many({
            '$or': [
                {'expires': {'$lt': datetime.utcnow()}},
                {'is_revoked': True}
            ]
        })
        return result.deleted_count

def setup_mongodb_indexes():
    """Create MongoDB indexes for performance optimization with user isolation support"""
    # Users collection indexes
    db.users.create_index([('email', 1)], unique=True, sparse=True)
    db.users.create_index([('subscription_tier', 1)])
    db.users.create_index([('is_active', 1), ('subscription_tier', 1)])
    db.users.create_index([('created_at', -1)])
    db.users.create_index([('last_login', -1)])
    
    # Vehicles collection indexes - user isolation support
    db.vehicles.create_index([('user_id', 1), ('created_at', -1)])
    db.vehicles.create_index([('user_id', 1), ('make', 1), ('model', 1), ('year', 1)])
    db.vehicles.create_index([('make', 1), ('model', 1), ('year', 1)])
    
    # Maintenance items collection indexes - user isolation support
    db.maintenance_items.create_index([('vehicle_id', 1), ('category', 1)])
    db.maintenance_items.create_index([('interval_km', 1)])
    # Compound index for user isolation via vehicle ownership
    db.maintenance_items.create_index([
        ('vehicle_id', 1), 
        ('interval_km', 1), 
        ('category', 1)
    ])
    
    # Service records collection indexes - user isolation support
    db.service_records.create_index([('vehicle_id', 1), ('date', -1)])
    db.service_records.create_index([('maintenance_item_id', 1)])
    # Compound index for user isolation via vehicle ownership
    db.service_records.create_index([
        ('vehicle_id', 1), 
        ('date', -1), 
        ('maintenance_item_id', 1)
    ])
    # Index for date-based queries
    db.service_records.create_index([('date', -1)])
    
    # Fill-ups collection indexes - user isolation support
    db.fill_ups.create_index([('vehicle_id', 1), ('date', -1)])
    db.fill_ups.create_index([('full_tank', 1), ('vehicle_id', 1)])
    # Compound index for fuel calculations
    db.fill_ups.create_index([
        ('vehicle_id', 1), 
        ('full_tank', 1), 
        ('odometer_km', -1)
    ])
    # Index for odometer progression validation
    db.fill_ups.create_index([('vehicle_id', 1), ('odometer_km', 1)])
    # Index for date-based queries
    db.fill_ups.create_index([('date', -1)])
    
    # Refresh tokens collection indexes
    db.refresh_tokens.create_index([('token', 1)], unique=True)
    db.refresh_tokens.create_index([('user_id', 1), ('expires', 1)])
    db.refresh_tokens.create_index([('expires', 1)], expireAfterSeconds=0)  # TTL index
    db.refresh_tokens.create_index([('user_id', 1), ('is_revoked', 1)])
    
    print("MongoDB indexes created successfully")

# Run index setup only when explicitly called after app initialization
def ensure_mongodb_indexes():
    """Ensure MongoDB indexes are created (call this after app initialization)"""
    try:
        setup_mongodb_indexes()
    except Exception as e:
        print(f"Error creating MongoDB indexes: {e}")

# Don't run automatically on import - this prevents issues during development