import re
import html
import secrets
import bcrypt
from functools import wraps
from flask import request, jsonify
from email_validator import validate_email as email_validate, EmailNotValidError

# Input validation utilities
def validate_email(email):
    """Validate email address"""
    try:
        email_validate(email)
        return True
    except EmailNotValidError:
        return False

# Password validation utilities
def validate_password_strength(password):
    """Validate password strength with comprehensive requirements"""
    errors = []
    
    # Length validation
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    elif len(password) > 128:
        errors.append("Password must be less than 128 characters long")
    
    # Character complexity validation
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_number = any(c.isdigit() for c in password)
    has_special = any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in password)
    
    if not has_upper:
        errors.append("Password must contain at least one uppercase letter")
    if not has_lower:
        errors.append("Password must contain at least one lowercase letter")
    if not has_number:
        errors.append("Password must contain at least one number")
    if not has_special:
        errors.append("Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)")
    
    # Common password patterns to avoid
    common_patterns = [
        r'123456', r'password', r'qwerty', r'abc123',
        r'letmein', r'admin', r'welcome', r'football'
    ]
    
    for pattern in common_patterns:
        if pattern.lower() in password.lower():
            errors.append(f"Password contains a common pattern that is not secure")
            break
    
    # Sequential characters
    if re.search(r'(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)', password.lower()):
        errors.append("Password contains sequential characters")
    
    # Repeated characters
    if re.search(r'(.)\1{2,}', password):
        errors.append("Password contains repeated characters")
    
    return len(errors) == 0, errors

def check_password_breach(password):
    """Check if password has been in a known data breach (placeholder)"""
    # In a production environment, you would integrate with services like:
    # - Have I Been Pwned API
    # - Troy Hunt's Pwned Passwords API
    # For now, this is a placeholder that returns False
    return False

def generate_secure_password(length=12):
    """Generate a secure random password"""
    if length < 8:
        length = 8
    
    # Character sets
    lowercase = 'abcdefghijklmnopqrstuvwxyz'
    uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    numbers = '0123456789'
    special = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    
    # Ensure at least one character from each set
    password = [
        secrets.choice(lowercase),
        secrets.choice(uppercase),
        secrets.choice(numbers),
        secrets.choice(special)
    ]
    
    # Fill remaining length with random characters from all sets
    all_chars = lowercase + uppercase + numbers + special
    for _ in range(length - 4):
        password.append(secrets.choice(all_chars))
    
    # Shuffle the password characters
    secrets.SystemRandom().shuffle(password)
    
    return ''.join(password)

def validate_password(password):
    """Validate password strength and return standardized response"""
    is_valid, errors = validate_password_strength(password)
    
    # Check for common breaches
    if is_valid and check_password_breach(password):
        errors.append("This password has been found in known data breaches")
        is_valid = False
    
    return is_valid, errors

# Input validation for user data
def validate_user_data(data):
    """Validate user registration data"""
    errors = []
    
    # Validate required fields
    required_fields = ['email', 'password', 'first_name', 'last_name']
    for field in required_fields:
        if field not in data or not data[field]:
            errors.append(f'{field} is required')
    
    # Validate email
    if 'email' in data and data['email']:
        if not validate_email(data['email']):
            errors.append('Invalid email format')
    
    # Validate password
    if 'password' in data and data['password']:
        is_valid, password_errors = validate_password(data['password'])
        if not is_valid:
            errors.extend(password_errors)
    
    # Validate names
    if 'first_name' in data and data['first_name']:
        if len(data['first_name'].strip()) < 2:
            errors.append('First name must be at least 2 characters long')
        elif len(data['first_name'].strip()) > 50:
            errors.append('First name must be less than 50 characters long')
    
    if 'last_name' in data and data['last_name']:
        if len(data['last_name'].strip()) < 2:
            errors.append('Last name must be at least 2 characters long')
        elif len(data['last_name'].strip()) > 50:
            errors.append('Last name must be less than 50 characters long')
    
    # Validate phone
    if 'phone' in data and data['phone']:
        phone = data['phone'].strip()
        if phone and not re.match(r'^\+?[\d\s\-\(\)]{10,20}$', phone):
            errors.append('Invalid phone number format')
    
    return errors

def validate_vehicle_data(data):
    """Validate vehicle data"""
    errors = []
    
    # Validate required fields
    required_fields = ['make', 'model', 'year', 'current_mileage']
    for field in required_fields:
        if field not in data or not data[field]:
            errors.append(f'{field} is required')
    
    # Validate make
    if 'make' in data and data['make']:
        if len(data['make'].strip()) < 2:
            errors.append('Make must be at least 2 characters long')
        elif len(data['make'].strip()) > 50:
            errors.append('Make must be less than 50 characters long')
    
    # Validate model
    if 'model' in data and data['model']:
        if len(data['model'].strip()) < 2:
            errors.append('Model must be at least 2 characters long')
        elif len(data['model'].strip()) > 50:
            errors.append('Model must be less than 50 characters long')
    
    # Validate year
    if 'year' in data and data['year']:
        try:
            year = int(data['year'])
            current_year = 2024  # Update this dynamically
            if year < 1900 or year > current_year + 1:
                errors.append('Year must be between 1900 and next year')
        except (ValueError, TypeError):
            errors.append('Year must be a valid number')
    
    # Validate current mileage
    if 'current_mileage' in data and data['current_mileage']:
        try:
            mileage = float(data['current_mileage'])
            if mileage < 0:
                errors.append('Current mileage cannot be negative')
            elif mileage > 10000000:  # 10 million km
                errors.append('Current mileage seems too high')
        except (ValueError, TypeError):
            errors.append('Current mileage must be a valid number')
    
    # Validate initial mileage
    if 'initial_mileage' in data and data['initial_mileage']:
        try:
            initial_mileage = float(data['initial_mileage'])
            if initial_mileage < 0:
                errors.append('Initial mileage cannot be negative')
            elif initial_mileage > 10000000:
                errors.append('Initial mileage seems too high')
            
            # Check if initial mileage is greater than current mileage
            current_mileage = float(data.get('current_mileage', 0))
            if initial_mileage > current_mileage:
                errors.append('Initial mileage cannot be greater than current mileage')
        except (ValueError, TypeError):
            errors.append('Initial mileage must be a valid number')
    
    return errors

def validate_maintenance_data(data):
    """Validate maintenance item data"""
    errors = []
    
    # Validate required fields
    required_fields = ['name', 'category', 'interval_km']
    for field in required_fields:
        if field not in data or not data[field]:
            errors.append(f'{field} is required')
    
    # Validate name
    if 'name' in data and data['name']:
        if len(data['name'].strip()) < 2:
            errors.append('Name must be at least 2 characters long')
        elif len(data['name'].strip()) > 100:
            errors.append('Name must be less than 100 characters long')
    
    # Validate category
    if 'category' in data and data['category']:
        valid_categories = ['Engine', 'Transmission', 'Brakes', 'Suspension', 'Electrical', 
                          'Tires', 'Fluids', 'Filters', 'Body', 'Interior', 'Other']
        if data['category'] not in valid_categories:
            errors.append(f'Category must be one of: {", ".join(valid_categories)}')
    
    # Validate interval_km
    if 'interval_km' in data and data['interval_km']:
        try:
            interval = float(data['interval_km'])
            if interval <= 0:
                errors.append('Interval must be greater than 0')
            elif interval > 1000000:  # 1 million km
                errors.append('Interval seems too large')
        except (ValueError, TypeError):
            errors.append('Interval must be a valid number')
    
    return errors

def validate_service_data(data):
    """Validate service record data"""
    errors = []
    
    # Validate required fields
    required_fields = ['vehicle_id', 'maintenance_item_id', 'date', 'mileage']
    for field in required_fields:
        if field not in data or not data[field]:
            errors.append(f'{field} is required')
    
    # Validate date
    if 'date' in data and data['date']:
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', data['date']):
            errors.append('Date must be in YYYY-MM-DD format')
    
    # Validate mileage
    if 'mileage' in data and data['mileage']:
        try:
            mileage = float(data['mileage'])
            if mileage < 0:
                errors.append('Mileage cannot be negative')
            elif mileage > 10000000:
                errors.append('Mileage seems too high')
        except (ValueError, TypeError):
            errors.append('Mileage must be a valid number')
    
    # Validate cost
    if 'cost' in data and data['cost']:
        try:
            cost = float(data['cost'])
            if cost < 0:
                errors.append('Cost cannot be negative')
            elif cost > 1000000:  # 1 million currency units
                errors.append('Cost seems too high')
        except (ValueError, TypeError):
            errors.append('Cost must be a valid number')
    
    return errors

def validate_fillup_data(data):
    """Validate fill-up data"""
    errors = []
    
    # Validate required fields
    required_fields = ['vehicle_id', 'date', 'odometer_km', 'liters', 'price_per_liter']
    for field in required_fields:
        if field not in data or not data[field]:
            errors.append(f'{field} is required')
    
    # Validate date
    if 'date' in data and data['date']:
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', data['date']):
            errors.append('Date must be in YYYY-MM-DD format')
    
    # Validate odometer
    if 'odometer_km' in data and data['odometer_km']:
        try:
            odometer = float(data['odometer_km'])
            if odometer <= 0:
                errors.append('Odometer reading must be greater than 0')
            elif odometer > 10000000:
                errors.append('Odometer reading seems too high')
        except (ValueError, TypeError):
            errors.append('Odometer reading must be a valid number')
    
    # Validate liters
    if 'liters' in data and data['liters']:
        try:
            liters = float(data['liters'])
            if liters <= 0:
                errors.append('Liters must be greater than 0')
            elif liters > 1000:  # 1000 liters
                errors.append('Liters amount seems too high')
        except (ValueError, TypeError):
            errors.append('Liters must be a valid number')
    
    # Validate price per liter
    if 'price_per_liter' in data and data['price_per_liter']:
        try:
            price = float(data['price_per_liter'])
            if price <= 0:
                errors.append('Price per liter must be greater than 0')
            elif price > 10000:  # 10,000 per liter
                errors.append('Price per liter seems too high')
        except (ValueError, TypeError):
            errors.append('Price per liter must be a valid number')
    
    # Validate total cost
    if 'total_cost' in data and data['total_cost']:
        try:
            total_cost = float(data['total_cost'])
            if total_cost < 0:
                errors.append('Total cost cannot be negative')
            elif total_cost > 1000000:  # 1 million currency units
                errors.append('Total cost seems too high')
        except (ValueError, TypeError):
            errors.append('Total cost must be a valid number')
    
    return errors

# Security decorators
def validate_json_request(f):
    """Validate JSON request"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
        
        try:
            data = request.get_json()
            if data is None:
                return jsonify({'error': 'Invalid JSON data'}), 400
        except Exception as e:
            return jsonify({'error': 'Invalid JSON data'}), 400
        
        return f(*args, **kwargs)
    return decorated

def sanitize_input(data):
    """Sanitize input data to prevent XSS attacks"""
    if isinstance(data, str):
        return html.escape(data.strip())
    elif isinstance(data, dict):
        return {key: sanitize_input(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [sanitize_input(item) for item in data]
    else:
        return data

def sanitize_request_data(f):
    """Sanitize request data"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.is_json:
            data = request.get_json()
            sanitized_data = sanitize_input(data)
            request._cached_json = (sanitized_data, request._cached_json[1])
        
        return f(*args, **kwargs)
    return decorated

# Security headers middleware
def add_security_headers(response):
    """Add security headers to response"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
    
    # Remove server info
    response.headers['Server'] = 'Car Maintenance Tracker'
    
    return response

# Content Security Policy (CSP)
def get_csp_headers():
    """Get Content Security Policy headers"""
    csp = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self'; "
        "connect-src 'self'; "
        "frame-ancestors 'none'; "
        "form-action 'self'; "
        "base-uri 'self';"
    )
    
    return {
        'Content-Security-Policy': csp,
        'X-Content-Security-Policy': csp
    }

# Database query validation
def validate_object_id(id_string):
    """Validate MongoDB ObjectId"""
    from bson.objectid import ObjectId
    
    try:
        ObjectId(id_string)
        return True
    except:
        return False

def validate_user_id(user_id):
    """Validate user ID"""
    if not user_id or not validate_object_id(user_id):
        return False
    
    from models import User
    user = User.get_user_by_id(user_id)
    return user is not None

# Input validation result helper
def validation_result(errors):
    """Return standardized validation result"""
    if errors:
        return {
            'valid': False,
            'errors': errors
        }
    return {
        'valid': True,
        'errors': []
    }

# Security logging
def log_security_event(event_type, user_id=None, ip_address=None, details=None):
    """Log security events"""
    import logging
    
    logger = logging.getLogger(__name__)
    
    log_data = {
        'event_type': event_type,
        'timestamp': datetime.utcnow().isoformat(),
        'user_id': user_id,
        'ip_address': ip_address or request.remote_addr,
        'user_agent': request.headers.get('User-Agent', ''),
        'details': details or {}
    }
    
    logger.warning(f"Security Event: {log_data}")

# Rate limiting and security decorators
def rate_limit_by_ip(max_requests=100, time_window=60):
    """Simple IP-based rate limiting decorator"""
    from datetime import datetime, timedelta
    import time
    
    # Simple in-memory rate limiting (for production, use Redis)
    ip_requests = {}
    
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            ip = request.remote_addr
            current_time = time.time()
            
            # Clean old requests
            if ip in ip_requests:
                ip_requests[ip] = [req_time for req_time in ip_requests[ip] 
                                if current_time - req_time < time_window]
            else:
                ip_requests[ip] = []
            
            # Check rate limit
            if len(ip_requests[ip]) >= max_requests:
                return jsonify({
                    'error': 'Rate limit exceeded',
                    'message': f'Maximum {max_requests} requests per {time_window} seconds'
                }), 429
            
            # Add current request
            ip_requests[ip].append(current_time)
            
            return f(*args, **kwargs)
        return decorated
    return decorator

def validate_json_content_type(f):
    """Validate that request has JSON content type"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 400
        return f(*args, **kwargs)
    return decorated

def validate_content_length(max_length=1024*1024):  # 1MB default
    """Validate request content length"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            content_length = request.content_length
            if content_length and content_length > max_length:
                return jsonify({
                    'error': 'Request entity too large',
                    'max_length': max_length
                }), 413
            return f(*args, **kwargs)
        return decorated
    return decorator

# Token security utilities
def extract_token_from_request():
    """Extract JWT token from request"""
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header.split(' ')[1]
    return None

def validate_token_format(token):
    """Validate JWT token format"""
    if not token or not isinstance(token, str):
        return False
    
    # Basic JWT format validation (header.payload.signature)
    parts = token.split('.')
    if len(parts) != 3:
        return False
    
    # Check if parts are base64url encoded
    import base64
    try:
        for part in parts[:-1]:  # Skip signature
            # Add padding if needed
            padding = len(part) % 4
            if padding:
                part += '=' * (4 - padding)
            base64.urlsafe_b64decode(part)
    except:
        return False
    
    return True

# Input sanitization utilities
def sanitize_string_input(input_string, max_length=None):
    """Sanitize string input"""
    if not input_string:
        return ""
    
    # Convert to string if not already
    if not isinstance(input_string, str):
        input_string = str(input_string)
    
    # Strip whitespace
    sanitized = input_string.strip()
    
    # Limit length if specified
    if max_length and len(sanitized) > max_length:
        sanitized = sanitized[:max_length]
    
    # Basic HTML escaping
    sanitized = html.escape(sanitized)
    
    return sanitized

def sanitize_email(email):
    """Sanitize email address"""
    if not email:
        return ""
    
    email = str(email).lower().strip()
    
    # Basic email format validation
    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
        return ""
    
    return email

# Security configuration utilities
def get_security_headers():
    """Get comprehensive security headers"""
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Permitted-Cross-Domain-Policies': 'none',
        'Server': 'Car Maintenance Tracker'
    }

def get_csp_headers():
    """Get Content Security Policy headers"""
    csp = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self'; "
        "connect-src 'self'; "
        "frame-ancestors 'none'; "
        "form-action 'self'; "
        "base-uri 'self'; "
        "require-trusted-types-for 'script';"
    )
    
    return {
        'Content-Security-Policy': csp,
        'X-Content-Security-Policy': csp
    }