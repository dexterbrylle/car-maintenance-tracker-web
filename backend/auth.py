from functools import wraps
from flask import request, jsonify
import jwt
import os
from datetime import datetime, timedelta
from bson.objectid import ObjectId
from models import User, RefreshToken

# JWT Configuration
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)  # 1 hour
JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)  # 7 days

def create_access_token(user_id, additional_claims=None):
    """Create JWT access token"""
    payload = {
        'user_id': str(user_id),
        'exp': datetime.utcnow() + JWT_ACCESS_TOKEN_EXPIRES,
        'iat': datetime.utcnow(),
        'type': 'access'
    }
    
    if additional_claims:
        payload.update(additional_claims)
    
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm='HS256')

def create_refresh_token(user_id):
    """Create JWT refresh token"""
    payload = {
        'user_id': str(user_id),
        'exp': datetime.utcnow() + JWT_REFRESH_TOKEN_EXPIRES,
        'iat': datetime.utcnow(),
        'type': 'refresh'
    }
    
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm='HS256')

def verify_jwt_token(token):
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    """JWT token required decorator"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        # Verify token
        payload = verify_jwt_token(token)
        if not payload:
            return jsonify({'error': 'Token is invalid or expired'}), 401
        
        # Check if it's an access token
        if payload.get('type') != 'access':
            return jsonify({'error': 'Invalid token type'}), 401
        
        # Get user
        user = User.get_user_by_id(payload['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 401
        
        # Check if user is active
        if not user.get('is_active', True):
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Add user to request context
        request.current_user = user
        request.current_user_id = str(user['_id'])
        
        return f(*args, **kwargs)
    return decorated

def optional_token(f):
    """Optional JWT token decorator"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        user = None
        
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if token:
            # Verify token
            payload = verify_jwt_token(token)
            if payload and payload.get('type') == 'access':
                user = User.get_user_by_id(payload['user_id'])
                if user and user.get('is_active', True):
                    request.current_user = user
                    request.current_user_id = str(user['_id'])
        
        # Add user to request context if available
        request.current_user = user
        request.current_user_id = str(user['_id']) if user else None
        
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    """Admin access required decorator"""
    @wraps(f)
    def decorated(*args, **kwargs):
        @token_required
        def wrapper(*args, **kwargs):
            if not request.current_user.get('is_admin', False):
                return jsonify({'error': 'Admin access required'}), 403
            return f(*args, **kwargs)
        return wrapper(*args, **kwargs)
    return decorated

def subscription_required(min_tier='free'):
    """Subscription tier required decorator"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            @token_required
            def wrapper(*args, **kwargs):
                user = request.current_user
                subscription_tier = user.get('subscription_tier', 'free')
                
                # Define tier hierarchy
                tier_hierarchy = {'free': 0, 'premium': 1, 'enterprise': 2}
                min_level = tier_hierarchy.get(min_tier, 0)
                user_level = tier_hierarchy.get(subscription_tier, 0)
                
                if user_level < min_level:
                    return jsonify({
                        'error': f'{min_tier.capitalize()} subscription required',
                        'current_tier': subscription_tier,
                        'required_tier': min_tier
                    }), 403
                
                # Check subscription expiration
                subscription_expires = user.get('subscription_expires')
                if subscription_expires and datetime.utcnow() > subscription_expires:
                    return jsonify({
                        'error': 'Subscription has expired',
                        'current_tier': subscription_tier
                    }), 403
                
                return f(*args, **kwargs)
            return wrapper(*args, **kwargs)
        return decorated
    return decorator

def check_subscription_limits(feature_type):
    """Check if user has reached subscription limits"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            @token_required
            def wrapper(*args, **kwargs):
                user = request.current_user
                limits = User.check_subscription_limits(user)
                
                if feature_type == 'vehicles':
                    # Count user's vehicles
                    from models import Vehicle
                    user_vehicles = Vehicle.get_all_vehicles(str(user['_id']))
                    
                    if limits['max_vehicles'] > 0 and len(user_vehicles) >= limits['max_vehicles']:
                        return jsonify({
                            'error': 'Vehicle limit reached',
                            'current_vehicles': len(user_vehicles),
                            'max_vehicles': limits['max_vehicles'],
                            'upgrade_required': 'premium' if user.get('subscription_tier') == 'free' else 'enterprise'
                        }), 403
                
                elif feature_type == 'records':
                    # Check if adding a record would exceed limits
                    vehicle_id = kwargs.get('vehicle_id')
                    if vehicle_id:
                        from models import ServiceRecord, FillUp
                        
                        # Count service records
                        service_records = ServiceRecord.get_service_records_by_vehicle(vehicle_id)
                        
                        # Count fill-up records
                        fillup_records = FillUp.get_fillups_by_vehicle(vehicle_id)
                        
                        total_records = len(service_records) + len(fillup_records)
                        
                        if limits['max_records_per_vehicle'] > 0 and total_records >= limits['max_records_per_vehicle']:
                            return jsonify({
                                'error': 'Record limit reached for this vehicle',
                                'current_records': total_records,
                                'max_records': limits['max_records_per_vehicle'],
                                'upgrade_required': 'premium' if user.get('subscription_tier') == 'free' else 'enterprise'
                            }), 403
                
                return f(*args, **kwargs)
            return wrapper(*args, **kwargs)
        return decorated
    return decorator

def get_current_user():
    """Get current user from request context"""
    return getattr(request, 'current_user', None)

def get_current_user_id():
    """Get current user ID from request context"""
    return getattr(request, 'current_user_id', None)

def validate_user_access(user_id):
    """Validate that the current user can access the specified user's data"""
    current_user = get_current_user()
    if not current_user:
        return False
    
    # Users can access their own data
    if str(current_user['_id']) == user_id:
        return True
    
    # Admins can access all data
    if current_user.get('is_admin', False):
        return True
    
    return False

def refresh_access_token(refresh_token):
    """Refresh access token using refresh token"""
    # Verify refresh token
    payload = verify_jwt_token(refresh_token)
    if not payload or payload.get('type') != 'refresh':
        return None, {'error': 'Invalid refresh token'}
    
    # Check if refresh token exists in database
    refresh_token_data = RefreshToken.get_refresh_token(refresh_token)
    if not refresh_token_data:
        return None, {'error': 'Refresh token not found or expired'}
    
    # Get user
    user = User.get_user_by_id(payload['user_id'])
    if not user or not user.get('is_active', True):
        return None, {'error': 'User not found or inactive'}
    
    # Create new access token
    new_access_token = create_access_token(str(user['_id']))
    
    return new_access_token, None